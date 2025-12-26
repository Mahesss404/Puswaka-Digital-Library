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
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    idNumber: ''
  });

  // Real-time listener for users
  useEffect(() => {
    const usersUnsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
      },
      (error) => {
        console.error('Error listening to users:', error);
      }
    );

    return () => usersUnsubscribe();
  }, []);

  // Function to generate unique user ID from name
  const generateUserId = (name) => {
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

  // Check if user ID is unique
  const isUserIdUnique = async (userId) => {
    if (!userId) return false;
    
    try {
      const existingUserQuery = query(
        collection(db, 'users'),
        where('idNumber', '==', userId)
      );
      const existingUserSnapshot = await getDocs(existingUserQuery);
      return existingUserSnapshot.empty;
    } catch (error) {
      console.error('Error checking user ID uniqueness:', error);
      return false;
    }
  };

  // Generate unique user ID (retry if not unique)
  const generateUniqueUserId = async (name) => {
    let userId = generateUserId(name);
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!(await isUserIdUnique(userId)) && attempts < maxAttempts) {
      userId = generateUserId(name);
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      const baseId = generateUserId(name);
      const timestamp = Date.now().toString().slice(-2);
      return baseId.substring(0, 2) + timestamp;
    }
    
    return userId;
  };

  const handleAddUser = async () => {
    if (!userForm.name || !userForm.phoneNumber) {
      alert('Please fill in all required fields (Name and Phone Number)');
      return;
    }
    
    try {
      let finalIdNumber = userForm.idNumber;
      if (!finalIdNumber || finalIdNumber.trim() === '') {
        finalIdNumber = await generateUniqueUserId(userForm.name);
      }
      
      const existingUserQuery = query(
        collection(db, 'users'),
        where('idNumber', '==', finalIdNumber)
      );
      const existingUserSnapshot = await getDocs(existingUserQuery);
      
      if (!existingUserSnapshot.empty) {
        finalIdNumber = await generateUniqueUserId(userForm.name);
      }
      
      const newUser = {
        name: userForm.name,
        email: userForm.email || '',
        phoneNumber: userForm.phoneNumber,
        address: userForm.address || '',
        idNumber: finalIdNumber,
        borrowedCount: 0,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'users'), newUser);
      setUserForm({ name: '', email: '', phoneNumber: '', address: '', idNumber: '' });
      setShowAddUser(false);
      alert(`User added successfully! NIS: ${finalIdNumber}`);
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to add user. Please try again.');
    }
  };

  const handleEditUser = async () => {
    if (!userForm.name || !userForm.phoneNumber) {
      alert('Please fill in all required fields (Name and Phone Number)');
      return;
    }
    
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        name: userForm.name,
        email: userForm.email || '',
        phoneNumber: userForm.phoneNumber,
        address: userForm.address || ''
      });
      
      setUserForm({ name: '', email: '', phoneNumber: '', address: '', idNumber: '' });
      setShowEditUser(false);
      setEditingUser(null);
      alert('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      idNumber: user.idNumber || ''
    });
    setShowEditUser(true);
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phoneNumber?.includes(searchTerm) ||
    user.idNumber?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Users Management</h2>
          <p className="text-sm text-neutral-500">Manage library users and their accounts</p>
        </div>
        <button
          onClick={() => setShowAddUser(true)}
          className="px-4 py-2.5 bg-[#4995ED] text-white rounded-lg hover:bg-[#3a7bc8] flex items-center gap-2 font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search users by name, email, phone, or NIS..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED] transition-colors"
        />
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.map(user => (
          <div key={user.id} className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#4995ED]/10 flex items-center justify-center text-[#4995ED] font-semibold text-lg">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">{user.name}</h3>
                  <p className="text-sm text-neutral-500">{user.phoneNumber || user.email || '-'}</p>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">NIS: {user.idNumber || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#4995ED]">{user.borrowedCount || 0}</div>
                  <div className="text-xs text-neutral-500">Books Borrowed</div>
                </div>
                <button
                  onClick={() => openEditModal(user)}
                  className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-[#4995ED] transition-colors"
                  title="Edit user"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No users found</p>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">Add New User</h2>
              <button
                onClick={() => {
                  setShowAddUser(false);
                  setUserForm({ name: '', email: '', phoneNumber: '', address: '', idNumber: '' });
                }}
                className="p-1 rounded hover:bg-neutral-100 text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Full Name *"
                value={userForm.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  if (newName.trim().length >= 2) {
                    const generatedId = generateUserId(newName);
                    setUserForm(prev => ({ ...prev, name: newName, idNumber: generatedId }));
                  } else {
                    setUserForm(prev => ({ ...prev, name: newName, idNumber: '' }));
                  }
                }}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
              />
              <input
                type="tel"
                placeholder="Phone Number *"
                value={userForm.phoneNumber}
                onChange={(e) => setUserForm({ ...userForm, phoneNumber: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
              />
              <input
                type="email"
                placeholder="Email (Optional)"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
              />
              <input
                type="text"
                placeholder="Address (Optional)"
                value={userForm.address}
                onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
              />
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  NIS / ID Number (Auto-generated)
                </label>
                <input
                  type="text"
                  placeholder="NIS"
                  value={userForm.idNumber}
                  readOnly
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-600 cursor-not-allowed"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  ID is auto-generated from name (2 letters + 2 random digits)
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddUser}
                  className="flex-1 px-4 py-2.5 bg-[#4995ED] text-white rounded-lg hover:bg-[#3a7bc8] font-medium transition-colors"
                >
                  Add User
                </button>
                <button
                  onClick={() => {
                    setShowAddUser(false);
                    setUserForm({ name: '', email: '', phoneNumber: '', address: '', idNumber: '' });
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

      {/* Edit User Modal */}
      {showEditUser && editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">Edit User</h2>
              <button
                onClick={() => {
                  setShowEditUser(false);
                  setEditingUser(null);
                  setUserForm({ name: '', email: '', phoneNumber: '', address: '', idNumber: '' });
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
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={userForm.phoneNumber}
                onChange={(e) => setUserForm({ ...userForm, phoneNumber: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
              />
              <input
                type="email"
                placeholder="Email (Optional)"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
              />
              <input
                type="text"
                placeholder="Address (Optional)"
                value={userForm.address}
                onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
              />
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  NIS / ID Number
                </label>
                <input
                  type="text"
                  value={userForm.idNumber}
                  readOnly
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-600 cursor-not-allowed"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  NIS cannot be changed
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleEditUser}
                  className="flex-1 px-4 py-2.5 bg-[#4995ED] text-white rounded-lg hover:bg-[#3a7bc8] font-medium transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setShowEditUser(false);
                    setEditingUser(null);
                    setUserForm({ name: '', email: '', phoneNumber: '', address: '', idNumber: '' });
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
