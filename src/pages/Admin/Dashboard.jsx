import React, { useEffect, useState } from "react"
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom"
import { 
  Users, 
  BookOpen, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, // For overdue/time
  CheckCircle2, // For returned/available
  AlertCircle, // For out of stock/overdue
  Settings2,
  Plus,
  MoreVertical,
  Calendar,
  AlertTriangle,
  RotateCcw,
  BadgeAlert,
  Search,
  Monitor,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  Library,
  BarChart3,
  HelpCircle,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  Receipt
} from "lucide-react"
import { 
  Area, 
  AreaChart, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts"
import { collection, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { calculateFine } from "@/utils/calculatefine";

const sidebarBottomItems = [
  // { name: 'Settings', icon: Settings2, href: '#', isLogout: false },
  { name: 'Logout', icon: LogOut, href: '#', isLogout: true },
];

const chartData = [
  { p1: 10, p2: 5, name: 'Jun 2' },
  { p1: 40, p2: 15, name: 'Jun 4' },
  { p1: 20, p2: 10, name: 'Jun 6' },
  { p1: 50, p2: 40, name: 'Jun 8' },
  { p1: 30, p2: 25, name: 'Jun 10' },
  { p1: 60, p2: 35, name: 'Jun 12' },
  { p1: 45, p2: 30, name: 'Jun 14' },
  { p1: 80, p2: 60, name: 'Jun 16' },
  { p1: 55, p2: 45, name: 'Jun 18' },
  { p1: 75, p2: 55, name: 'Jun 20' },
  { p1: 50, p2: 40, name: 'Jun 22' },
  { p1: 85, p2: 70, name: 'Jun 24' },
  { p1: 65, p2: 50, name: 'Jun 26' },
  { p1: 90, p2: 75, name: 'Jun 28' },
  { p1: 60, p2: 50, name: 'Jun 30' },
]

export default function Dashboard() {
  const [stats, setStats] = useState({
    users: { total: 0, new: 0, active: 0 },
    books: { total: 0, available: 0, outOfStock: 0 },
    borrows: { thisWeek: 0, returnedThisWeek: 0, overdueThisWeek: 0 }
  });
  const [transactions, setTransactions] = useState([]);
  const [overdueItems, setOverdueItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Action State
  const [actionMenuOpen, setActionMenuOpen] = useState(null); // borrowId
  const [extendMenuOpen, setExtendMenuOpen] = useState(null); // borrowId
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Navigation
  const navigate = useNavigate();

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  // Get current path for active sidebar highlighting
  const location = useLocation();
  const currentPath = location.pathname;

  // Sidebar navigation items with route paths
  const sidebarNavItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Books', icon: BookOpen, path: '/admin/books' },
    { name: 'Users', icon: Users, path: '/admin/members' },
    { name: 'Transactions', icon: Receipt, path: '/admin/transactions' },
  ];
  
  // Get current page title from path
  const getPageTitle = () => {
    const pathSegments = currentPath.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (lastSegment === 'dashboard' || lastSegment === '') return 'Dashboard';
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  };

  const refreshData = async () => {
      setLoading(true);
      try {
        const [usersSnap, booksSnap, borrowsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'books')),
          getDocs(collection(db, 'borrows'))
        ]);

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Create Maps for Join
        const usersMap = {};
        usersSnap.forEach(doc => {
            usersMap[doc.id] = { ...doc.data(), id: doc.id };
        });

        const booksMap = {};
        booksSnap.forEach(doc => {
            booksMap[doc.id] = { ...doc.data(), id: doc.id };
        });

        // Process Users
        const totalUsers = usersSnap.size;
        let newUsers = 0;
        const activeUserIds = new Set();
        
        Object.values(usersMap).forEach(data => {
          const joined = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null);
          if (joined && joined > oneWeekAgo) newUsers++;
        });

        // Process Books
        const totalBooks = booksSnap.size;
        let availableBooks = 0;
        let outOfStockBooks = 0;
        Object.values(booksMap).forEach(data => {
          const available = typeof data.available === 'number' ? data.available : 0;
          if (available > 0) availableBooks++;
          else outOfStockBooks++;
        });

        // Process Borrows & Transcations
        let borrowsThisWeek = 0;
        let returnedThisWeek = 0;
        let overdueThisWeek = 0;
        
        const allTransactions = [];
        const overdueList = [];

        borrowsSnap.forEach(doc => {
          const data = doc.data();
          const borrowDate = data.borrowDate?.toDate ? data.borrowDate.toDate() : (data.borrowDate ? new Date(data.borrowDate) : null);
          const returnDate = data.returnDate?.toDate ? data.returnDate.toDate() : (data.returnDate ? new Date(data.returnDate) : null);
          const dueDate = data.dueDate?.toDate ? data.dueDate.toDate() : (data.dueDate ? new Date(data.dueDate) : null);

          // Stats
          if (borrowDate && borrowDate > oneWeekAgo) borrowsThisWeek++;
          if (data.status === 'returned' && returnDate && returnDate > oneWeekAgo) returnedThisWeek++;
          if (data.status === 'borrowed' && dueDate && dueDate > oneWeekAgo && dueDate < now) overdueThisWeek++;
          if (data.status === 'borrowed' && data.userId) activeUserIds.add(data.userId);

          // Join Data
          const user = usersMap[data.userId] || { name: 'Unknown', email: '', idNumber: 'N/A' };
          const book = booksMap[data.bookId] || { title: 'Unknown Book' };
            // console.log(user)

          const {penalty,daysOverdue} = calculateFine (data,dueDate,now);

          const transaction = {
              id: doc.id,
              ...data,
              borrowDate,
              returnDate,
              dueDate,
              user,
              book,
              penalty,
              daysOverdue,
              userName: user.name || 'Unknown',
              userEmail: user.email || user.phoneNumber || '',
              userIdNumber: user.idNumber || 'N/A'
          };

          allTransactions.push(transaction);

          if (data.status === 'borrowed' && daysOverdue > 0) {
              overdueList.push(transaction);
          }
        });
        
        // Sort transactions by date (newest first)
        allTransactions.sort((a, b) => (b.borrowDate || 0) - (a.borrowDate || 0));

        const activeUsers = activeUserIds.size;

        setStats({
          users: { total: totalUsers, new: newUsers, active: activeUsers },
          books: { total: totalBooks, available: availableBooks, outOfStock: outOfStockBooks },
          borrows: { thisWeek: borrowsThisWeek, returnedThisWeek: returnedThisWeek, overdueThisWeek: overdueThisWeek }
        });
        setTransactions(allTransactions);
        setOverdueItems(overdueList);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleReturn = async (borrowId, bookId) => {
      if (!window.confirm("Mark this book as returned?")) return;
      try {
          await updateDoc(doc(db, 'borrows', borrowId), {
              status: 'returned',
              returnDate: Timestamp.now()
          });
          // Optimistic update or refresh
          refreshData();
      } catch (err) {
          alert("Error updating return status");
      }
  };

  const handleExtend = async (borrowId, currentDueDate, days) => {
      try {
          const newDate = new Date(currentDueDate);
          newDate.setDate(newDate.getDate() + days);
          
          await updateDoc(doc(db, 'borrows', borrowId), {
              dueDate: Timestamp.fromDate(newDate)
          });
          setExtendMenuOpen(null);
          setActionMenuOpen(null);
          refreshData();
      } catch (err) {
          alert("Error extending due date");
      }
  };



  return (
    <div className="flex min-h-screen bg-white">
      {/* Mobile Overlay - Blocks access on mobile devices */}
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm px-4 py-6 lg:hidden">
        <div className="w-full max-w-sm rounded-xl bg-white p-5 sm:p-6 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary/10">
            <Monitor className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          </div>
          <h2 className="mb-2 text-lg sm:text-xl font-bold text-slate-900">Desktop Access Required</h2>
          <p className="mb-4 text-sm sm:text-base text-slate-600 leading-relaxed">
            The admin dashboard is optimized for desktop devices. Please access from a computer for the best experience.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500">
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary"></div>
              <span>Minimum screen width: 1024px</span>
            </div>
            <a 
              href="/" 
              className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 sm:px-6 sm:py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 active:bg-primary/80"
            >
              Return to Home
            </a>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-100 transition-all duration-300 ${sidebarOpen ? 'w-56' : 'w-16'}`}>
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-slate-700/50 px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && <span className="text-lg font-semibold">Puswaka</span>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {sidebarNavItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path))
                  ? 'bg-[#4995ED]/20 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title={!sidebarOpen ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && item.name}
            </Link>
          ))}
        </nav>

        {/* Bottom Items */}
        <div className="border-t border-slate-700/50 px-3 py-4 space-y-1">
          {sidebarBottomItems.map((item) => (
            item.isLogout ? (
              <button
                key={item.name}
                onClick={handleLogout}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                title={!sidebarOpen ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && item.name}
              </button>
            ) : (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                title={!sidebarOpen ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && item.name}
              </Link>
            )
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 p-8 text-neutral-900 font-sans transition-all duration-300 ${sidebarOpen ? 'ml-56' : 'ml-16'}`}>
      {/* Header */}
      <header className="mb-8 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          </button>
          <h1 className="text-3xl font-bold tracking-tight">{getPageTitle()}</h1>
        </div>
      </header>

      {/* Render nested routes via Outlet, or dashboard content if at /admin */}
      {currentPath === '/admin' ? (
      <>
      {/* Stats Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Card 1: Users */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-500">Total Users</h3>
            <span className="inline-flex items-center justify-center rounded-full bg-blue-100 p-2 text-blue-700">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="text-3xl font-bold">{loading ? "..." : stats.users.total}</div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="flex items-center"><ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" /> New (this week)</span>
              <span className="font-medium text-neutral-900">{loading ? "..." : stats.users.new}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="flex items-center"><BookOpen className="mr-1 h-3 w-3 text-blue-500" /> Active (borrowing)</span>
              <span className="font-medium text-neutral-900">{loading ? "..." : stats.users.active}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Books */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-500">Total Books</h3>
             <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 p-2 text-emerald-700">
              <BookOpen className="h-4 w-4" />
            </span>
          </div>
          <div className="text-3xl font-bold">{loading ? "..." : stats.books.total}</div>
           <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="flex items-center"><CheckCircle2 className="mr-1 h-3 w-3 text-emerald-500" /> Available</span>
              <span className="font-medium text-neutral-900">{loading ? "..." : stats.books.available}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="flex items-center"><AlertCircle className="mr-1 h-3 w-3 text-red-500" /> Out of Stock</span>
              <span className="font-medium text-neutral-900">{loading ? "..." : stats.books.outOfStock}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Borrows */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-500">Activity (This Week)</h3>
             <span className="inline-flex items-center justify-center rounded-full bg-purple-100 p-2 text-purple-700">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="text-3xl font-bold">{loading ? "..." : stats.borrows.thisWeek}</div>
           <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="flex items-center"><CheckCircle2 className="mr-1 h-3 w-3 text-emerald-500" /> Returned</span>
              <span className="font-medium text-neutral-900">{loading ? "..." : stats.borrows.returnedThisWeek}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="flex items-center"><AlertCircle className="mr-1 h-3 w-3 text-red-500" /> Overdue</span>
              <span className="font-medium text-neutral-900">{loading ? "..." : stats.borrows.overdueThisWeek}</span>
            </div>
          </div>
        </div>
      </div>

      

      {/* Chart Section */}
      <div className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col justify-between sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold">Total Visitors</h2>
            <p className="text-sm text-neutral-500">Total for the last 3 months</p>
          </div>
          <div className="mt-4 flex gap-2 sm:mt-0">
             <button className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-neutral-50 transition-colors">Last 3 months</button>
             <button className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-neutral-50 transition-colors">Last 30 days</button>
             <button className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-neutral-50 transition-colors">Last 7 days</button>
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorP1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorP2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#737373' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#737373' }} 
              />
              <Tooltip 
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="p1" 
                stroke="#64748b" 
                strokeWidth={0}
                fillOpacity={1} 
                fill="url(#colorP1)" 
              />
               <Area 
                type="monotone" 
                dataKey="p2" 
                stroke="#94a3b8" 
                strokeWidth={0}
                fillOpacity={1} 
                fill="url(#colorP2)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Overdue Section (Highlight) */}
      {overdueItems.length > 0 && (
         <div className="mb-8 rounded-xl border border-red-100 bg-red-50/50 p-6">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2 text-red-700">
                   <AlertTriangle className="h-5 w-5" />
                   <h2 className="text-lg font-semibold">Overdue Alerts</h2>
               </div>
               <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-1 rounded-full">{overdueItems.length} Overdue</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
               {overdueItems.slice(0, 3).map(item => (
                   <div key={item.id} className="bg-white p-4 rounded-lg border border-red-100 shadow-sm flex flex-col justify-between">
                       <div>
                           <div className="flex justify-between items-start mb-2">
                               <h4 className="font-medium text-neutral-900 truncate pr-2" title={item.book.title}>{item.book.title}</h4>
                               <span className="shrink-0 inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                                   {item.daysOverdue}d late
                               </span>
                           </div>
                           <p className="text-sm text-neutral-500 mb-0.5">{item.userName}</p>
                           <p className="text-xs text-neutral-400 mb-1">{item.userEmail}</p>
                           <p className="text-xs text-neutral-400 font-mono">NIS: {item.userIdNumber}</p>
                       </div>
                       <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between">
                           <span className="text-xs text-neutral-500">Proposed Fine:</span>
                           <span className="text-sm font-bold text-red-600">Rp {item.penalty.toLocaleString()}</span>
                       </div>
                   </div>
               ))}
               {overdueItems.length > 3 && (
                   <div className="flex items-center justify-center p-4">
                       <p className="text-sm text-neutral-500">+ {overdueItems.length - 3} more overdue items</p>
                   </div>
               )}
            </div>
         </div>
      )}

       {/* Transactions Table */}
       <div className="rounded-xl bg-white border shadow-sm">
          <div className="p-6 border-b flex justify-between items-center">
             <div>
                <h2 className="text-lg font-semibold">Transactions Log</h2>
                <p className="text-sm text-neutral-500">Recent borrowings and returns.</p>
             </div>
             <div className="flex gap-2">
                 <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                    <input 
                        type="text" 
                        placeholder="Search books or users..." 
                        className="h-9 w-64 rounded-md border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-sm outline-none focus:border-neutral-400"
                    />
                 </div>
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-500 border-b">
                <tr>
                   <th className="px-6 py-3 font-medium">User Name</th>
                   <th className="px-6 py-3 font-medium">User Contact</th>
                   <th className="px-6 py-3 font-medium">Book</th>
                   <th className="px-6 py-3 font-medium">Borrowed</th>
                   <th className="px-6 py-3 font-medium">Due</th>
                   <th className="px-6 py-3 font-medium">Status</th>
                   <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                 {loading ? (
                    <tr><td colSpan="7" className="p-6 text-center text-neutral-500">Loading transactions...</td></tr>
                 ) : transactions.length === 0 ? (
                     <tr><td colSpan="7" className="p-6 text-center text-neutral-500">No transactions found.</td></tr>
                  ) : (
                     transactions
                       .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                       .map((t) => (
                         <tr key={t.id} className="group hover:bg-neutral-50/50 transition-colors">
                             <td className="px-6 py-4">
                                 <div className="font-medium text-neutral-900">{t.userName}</div>
                             </td>
                             <td className="px-6 py-4 text-neutral-500">
                                 {t.user.email || t.user.phoneNumber || '-'}
                             </td>
                             <td className="px-6 py-4">
                                 <div className="font-medium text-neutral-900 line-clamp-1 max-w-[200px]" title={t.book.title}>{t.book.title}</div>
                                 <div className="text-xs text-neutral-500">ISBN: {t.book.isbn}</div>
                             </td>
                             <td className="px-6 py-4 text-neutral-600">
                                 {t.borrowDate ? t.borrowDate.toLocaleDateString() : '-'}
                             </td>
                             <td className="px-6 py-4">
                                 <span className={`${
                                     t.status === 'borrowed' && t.dueDate && t.dueDate < new Date() 
                                     ? 'text-red-600 font-medium' 
                                     : 'text-neutral-600'
                                 }`}>
                                     {t.dueDate ? t.dueDate.toLocaleDateString() : '-'}
                                 </span>
                             </td>
                             <td className="px-6 py-4">
                                 {t.status === 'borrowed' ? (
                                     t.dueDate && t.dueDate < new Date() ? (
                                         <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-200">
                                            <AlertCircle className="mr-1 h-3 w-3" /> Overdue
                                         </span>
                                     ) : (
                                         <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                                            <Clock className="mr-1 h-3 w-3" /> Active
                                         </span>
                                     )
                                 ) : (
                                     <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                                        <CheckCircle2 className="mr-1 h-3 w-3" /> Returned
                                     </span>
                                 )}
                             </td>
                             <td className="px-6 py-4 text-right relative">
                                 <button 
                                     onClick={() => setActionMenuOpen(actionMenuOpen === t.id ? null : t.id)}
                                     className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                                 >
                                     <MoreVertical className="h-4 w-4" />
                                 </button>
                                 
                                 {actionMenuOpen === t.id && (
                                     <div className="absolute right-0 top-12 z-10 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-100">
                                         {t.status === 'borrowed' && (
                                             <>
                                                 <button 
                                                     onClick={() => { handleReturn(t.id, t.book.id); setActionMenuOpen(null); }}
                                                     className="flex w-full items-center px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50"
                                                 >
                                                     <RotateCcw className="mr-2 h-4 w-4" />
                                                     Mark as Returned
                                                 </button>
                                                 <button 
                                                     onClick={() => setExtendMenuOpen(extendMenuOpen === t.id ? null : t.id)}
                                                     className="flex w-full items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                                                 >
                                                     <Calendar className="mr-2 h-4 w-4" />
                                                     Extend Due Date
                                                 </button>
                                                 {extendMenuOpen === t.id && (
                                                     <div className="bg-neutral-50 px-2 py-2 grid grid-cols-3 gap-1 border-t border-neutral-100">
                                                         {[1, 3, 7].map(days => (
                                                             <button 
                                                                 key={days}
                                                                 onClick={() => handleExtend(t.id, t.dueDate, days)}
                                                                 className="rounded border bg-white px-2 py-1 text-xs font-medium hover:bg-neutral-100 hover:text-blue-600"
                                                             >
                                                                 +{days}d
                                                             </button>
                                                         ))}
                                                     </div>
                                                 )}
                                             </>
                                         )}
                                         {t.status === 'returned' && (
                                             <div className="px-4 py-2 text-xs text-neutral-400 italic text-center">
                                                 No actions available
                                             </div>
                                         )}
                                     </div>
                                 )}
                             </td>
                         </tr>
                     ))
                  )}
               </tbody>
             </table>
           </div>

           {/* Pagination */}
           <div className="flex items-center justify-between px-6 py-4 border-t bg-neutral-900 text-neutral-100 rounded-b-xl">
              <div className="text-sm text-neutral-400">
                 0 of {transactions.length} row(s) selected.
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-300">Rows per page</span>
                    <select
                       value={rowsPerPage}
                       onChange={(e) => {
                          setRowsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                       }}
                       className="h-8 w-16 rounded-md border border-neutral-700 bg-neutral-800 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
                    >
                       <option value={5}>5</option>
                       <option value={10}>10</option>
                       <option value={20}>20</option>
                       <option value={50}>50</option>
                    </select>
                 </div>
                 <div className="text-sm text-neutral-300">
                    Page {currentPage} of {Math.ceil(transactions.length / rowsPerPage) || 1}
                 </div>
                 <div className="flex items-center gap-1">
                    <button
                       onClick={() => setCurrentPage(1)}
                       disabled={currentPage === 1}
                       className="h-8 w-8 rounded-md border border-neutral-700 bg-neutral-800 flex items-center justify-center text-neutral-300 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                       <ChevronsLeft className="h-4 w-4" />
                    </button>
                    <button
                       onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                       disabled={currentPage === 1}
                       className="h-8 w-8 rounded-md border border-neutral-700 bg-neutral-800 flex items-center justify-center text-neutral-300 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                       <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                       onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(transactions.length / rowsPerPage)))}
                       disabled={currentPage >= Math.ceil(transactions.length / rowsPerPage)}
                       className="h-8 w-8 rounded-md border border-neutral-700 bg-neutral-800 flex items-center justify-center text-neutral-300 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                       <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                       onClick={() => setCurrentPage(Math.ceil(transactions.length / rowsPerPage))}
                       disabled={currentPage >= Math.ceil(transactions.length / rowsPerPage)}
                       className="h-8 w-8 rounded-md border border-neutral-700 bg-neutral-800 flex items-center justify-center text-neutral-300 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                       <ChevronsRight className="h-4 w-4" />
                    </button>
                 </div>
              </div>
           </div>
         </div>
      </>
      ) : (
        <Outlet />
      )}
      </div>
    </div>
  )
}
