import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, X } from 'lucide-react';
import { 
  collection, 
  addDoc, 
  updateDoc,
  doc,
  getDocs, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const MembersManagement = () => {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditMember, setShowEditMember] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    phone: '',
    membershipId: ''
  });

  // Real-time listener for members
  useEffect(() => {
    const membersUnsubscribe = onSnapshot(
      collection(db, 'members'),
      (snapshot) => {
        const membersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMembers(membersData);
      },
      (error) => {
        console.error('Error listening to members:', error);
      }
    );

    return () => membersUnsubscribe();
  }, []);

  // Function to generate unique member ID from name
  const generateMemberId = (name) => {
    if (!name || name.trim().length === 0) {
      return '';
    }
    
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, '');
    if (cleanName.length < 2) {
      const paddedName = cleanName.padEnd(2, 'x');
      const twoLetters = paddedName.substring(0, 2);
      const randomNum = Math.floor(Math.random() * 90) + 10;
      return twoLetters + randomNum;
    }
    
    const twoLetters = cleanName.substring(0, 2);
    const randomNum = Math.floor(Math.random() * 90) + 10;
    return twoLetters + randomNum;
  };

  // Check if member ID is unique
  const isMemberIdUnique = async (memberId) => {
    if (!memberId) return false;
    
    try {
      const existingMemberQuery = query(
        collection(db, 'members'),
        where('membershipId', '==', memberId)
      );
      const existingMemberSnapshot = await getDocs(existingMemberQuery);
      return existingMemberSnapshot.empty;
    } catch (error) {
      console.error('Error checking member ID uniqueness:', error);
      return false;
    }
  };

  // Generate unique member ID (retry if not unique)
  const generateUniqueMemberId = async (name) => {
    let memberId = generateMemberId(name);
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!(await isMemberIdUnique(memberId)) && attempts < maxAttempts) {
      memberId = generateMemberId(name);
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      const baseId = generateMemberId(name);
      const timestamp = Date.now().toString().slice(-2);
      return baseId.substring(0, 2) + timestamp;
    }
    
    return memberId;
  };

  const handleAddMember = async () => {
    if (!memberForm.name || !memberForm.email) {
      alert('Please fill in all required fields (Name and Email)');
      return;
    }
    
    try {
      let finalMemberId = memberForm.membershipId;
      if (!finalMemberId || finalMemberId.trim() === '') {
        finalMemberId = await generateUniqueMemberId(memberForm.name);
      }
      
      const existingMemberQuery = query(
        collection(db, 'members'),
        where('membershipId', '==', finalMemberId)
      );
      const existingMemberSnapshot = await getDocs(existingMemberQuery);
      
      if (!existingMemberSnapshot.empty) {
        finalMemberId = await generateUniqueMemberId(memberForm.name);
      }
      
      const newMember = {
        name: memberForm.name,
        email: memberForm.email,
        phone: memberForm.phone || '',
        membershipId: finalMemberId,
        borrowedBooks: 0,
        joinedAt: serverTimestamp()
      };
      await addDoc(collection(db, 'members'), newMember);
      setMemberForm({ name: '', email: '', phone: '', membershipId: '' });
      setShowAddMember(false);
      alert(`Member added successfully! Member ID: ${finalMemberId}`);
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member. Please try again.');
    }
  };

  const handleEditMember = async () => {
    if (!memberForm.name || !memberForm.email) {
      alert('Please fill in all required fields (Name and Email)');
      return;
    }
    
    try {
      await updateDoc(doc(db, 'members', editingMember.id), {
        name: memberForm.name,
        email: memberForm.email,
        phone: memberForm.phone || ''
      });
      
      setMemberForm({ name: '', email: '', phone: '', membershipId: '' });
      setShowEditMember(false);
      setEditingMember(null);
      alert('Member updated successfully!');
    } catch (error) {
      console.error('Error updating member:', error);
      alert('Failed to update member. Please try again.');
    }
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      membershipId: member.membershipId || ''
    });
    setShowEditMember(true);
  };

  const filteredMembers = members.filter(member =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.membershipId?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Members Management</h2>
          <p className="text-sm text-neutral-500">Manage library members and their accounts</p>
        </div>
        <button
          onClick={() => setShowAddMember(true)}
          className="px-4 py-2.5 bg-[#4995ED] text-white rounded-lg hover:bg-[#3a7bc8] flex items-center gap-2 font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Member
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search members by name, email, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED] transition-colors"
        />
      </div>

      {/* Members List */}
      <div className="space-y-3">
        {filteredMembers.map(member => (
          <div key={member.id} className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#4995ED]/10 flex items-center justify-center text-[#4995ED] font-semibold text-lg">
                  {member.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">{member.name}</h3>
                  <p className="text-sm text-neutral-500">{member.email}</p>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">ID: {member.membershipId}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#4995ED]">{member.borrowedBooks || 0}</div>
                  <div className="text-xs text-neutral-500">Books Borrowed</div>
                </div>
                <button
                  onClick={() => openEditModal(member)}
                  className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-[#4995ED] transition-colors"
                  title="Edit member"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No members found</p>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">Add New Member</h2>
              <button
                onClick={() => {
                  setShowAddMember(false);
                  setMemberForm({ name: '', email: '', phone: '', membershipId: '' });
                }}
                className="p-1 rounded hover:bg-neutral-100 text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={memberForm.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  if (newName.trim().length >= 2) {
                    const generatedId = generateMemberId(newName);
                    setMemberForm(prev => ({ ...prev, name: newName, membershipId: generatedId }));
                  } else {
                    setMemberForm(prev => ({ ...prev, name: newName, membershipId: '' }));
                  }
                }}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
              />
              <input
                type="email"
                placeholder="Email"
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
              />
              <input
                type="tel"
                placeholder="Phone Number (Optional)"
                value={memberForm.phone}
                onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
              />
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Membership ID (Auto-generated)
                </label>
                <input
                  type="text"
                  placeholder="Membership ID"
                  value={memberForm.membershipId}
                  readOnly
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-600 cursor-not-allowed"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  ID is auto-generated from name (2 letters + 2 random digits)
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddMember}
                  className="flex-1 px-4 py-2.5 bg-[#4995ED] text-white rounded-lg hover:bg-[#3a7bc8] font-medium transition-colors"
                >
                  Add Member
                </button>
                <button
                  onClick={() => {
                    setShowAddMember(false);
                    setMemberForm({ name: '', email: '', phone: '', membershipId: '' });
                  }}
                  className="flex-1 px-4 py-2.5 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditMember && editingMember && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">Edit Member</h2>
              <button
                onClick={() => {
                  setShowEditMember(false);
                  setEditingMember(null);
                  setMemberForm({ name: '', email: '', phone: '', membershipId: '' });
                }}
                className="p-1 rounded hover:bg-neutral-100 text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={memberForm.name}
                onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
              />
              <input
                type="email"
                placeholder="Email"
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
              />
              <input
                type="tel"
                placeholder="Phone Number (Optional)"
                value={memberForm.phone}
                onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
              />
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Membership ID
                </label>
                <input
                  type="text"
                  value={memberForm.membershipId}
                  readOnly
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-600 cursor-not-allowed"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Membership ID cannot be changed
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleEditMember}
                  className="flex-1 px-4 py-2.5 bg-[#4995ED] text-white rounded-lg hover:bg-[#3a7bc8] font-medium transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setShowEditMember(false);
                    setEditingMember(null);
                    setMemberForm({ name: '', email: '', phone: '', membershipId: '' });
                  }}
                  className="flex-1 px-4 py-2.5 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersManagement;
