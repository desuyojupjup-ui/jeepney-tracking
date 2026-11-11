import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CommuterUser, CommuterType } from '../types';
import { 
  Users, 
  GraduationCap, 
  Briefcase, 
  Building2, 
  Search, 
  Filter, 
  ShieldCheck, 
  Percent, 
  UserPlus, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  X, 
  Eye, 
  Sparkles,
  Download,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckSquare,
  Square
} from 'lucide-react';

export const RegisteredUsersView: React.FC = () => {
  const { 
    commuters, 
    deleteCommuter, 
    toggleCommuterDiscount, 
    registerCommuter 
  } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'student' | 'faculty' | 'employee'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<CommuterUser | null>(null);

  // Pagination & Multi-Selection States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // New User Registration Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    email: '',
    password: 'password123',
    commuterType: 'student' as CommuterType,
    collegeOrDepartment: 'College of Information Technology (CIT)',
    courseOrProgram: 'BS Information Technology',
    yearLevel: '1st Year',
    contactNumber: '',
  });

  // Filtered Commuters
  const filteredCommuters = useMemo(() => {
    return commuters.filter((user) => {
      // Role filter
      if (activeTab !== 'all' && user.commuterType !== activeTab) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = user.fullName.toLowerCase().includes(query);
        const matchesId = user.idNumber.toLowerCase().includes(query);
        const matchesEmail = user.email.toLowerCase().includes(query);
        const matchesDept = user.collegeOrDepartment?.toLowerCase().includes(query) || false;
        const matchesCourse = user.courseOrProgram?.toLowerCase().includes(query) || false;

        return matchesName || matchesId || matchesEmail || matchesDept || matchesCourse;
      }

      return true;
    });
  }, [commuters, activeTab, searchQuery]);

  // Reset pagination on filter / search changes
  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [activeTab, searchQuery]);

  // Total Pages
  const totalPages = Math.max(1, Math.ceil(filteredCommuters.length / rowsPerPage));
  
  // Paginated Commuters slice
  const paginatedCommuters = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredCommuters.slice(start, start + rowsPerPage);
  }, [filteredCommuters, currentPage, rowsPerPage]);

  // Multi-select helpers
  const isAllSelected = paginatedCommuters.length > 0 && paginatedCommuters.every(u => selectedIds.includes(u.id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !paginatedCommuters.some(u => u.id === id)));
    } else {
      const pageIds = paginatedCommuters.map(u => u.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Export to CSV helper
  const handleExportCSV = () => {
    const headers = ['Full Name', 'Role', 'ID Number', 'College/Department', 'Course/Program', 'Email', 'Contact Number', '20% Discount Eligible'];
    const rows = filteredCommuters.map(u => [
      `"${u.fullName}"`,
      `"${u.commuterType}"`,
      `"${u.idNumber}"`,
      `"${u.collegeOrDepartment}"`,
      `"${u.courseOrProgram || ''}"`,
      `"${u.email}"`,
      `"${u.contactNumber || ''}"`,
      `"${u.transitDiscountEligible ? 'Yes' : 'No'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `registered_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({
      type: 'success',
      title: 'Export Successful',
      message: `Exported ${filteredCommuters.length} commuter records to CSV.`,
      duration: 3500,
    });
  };

  // Statistics for KPI Cards
  const stats = useMemo(() => {
    const total = commuters.length;
    const students = commuters.filter((c) => c.commuterType === 'student').length;
    const faculty = commuters.filter((c) => c.commuterType === 'faculty').length;
    const employees = commuters.filter((c) => c.commuterType === 'employee').length;
    const discounted = commuters.filter((c) => c.transitDiscountEligible).length;

    return { total, students, faculty, employees, discounted };
  }, [commuters]);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the account for ${name}?`)) {
      deleteCommuter(id);
      showToast({
        type: 'info',
        title: 'Account Deleted',
        message: `The commuter account for ${name} has been successfully deleted.`,
        duration: 3500,
      });
      if (selectedUser?.id === id) setSelectedUser(null);
    }
  };

  const handleToggleDiscount = (id: string, name: string, currentStatus: boolean) => {
    toggleCommuterDiscount(id);
    showToast({
      type: 'success',
      title: 'Discount Status Updated',
      message: `20% transit fare discount for ${name} is now ${!currentStatus ? 'ACTIVATED' : 'DEACTIVATED'}.`,
      duration: 3000,
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const result = registerCommuter(formData);
    if (result.success) {
      showToast({
        type: 'success',
        title: 'Registration Successful!',
        message: `Successfully registered ${formData.fullName} as ${formData.commuterType.toUpperCase()}.`,
        duration: 4000,
      });
      setShowAddModal(false);
      setFormData({
        fullName: '',
        idNumber: '',
        email: '',
        password: 'password123',
        commuterType: 'student',
        collegeOrDepartment: 'College of Information Technology (CIT)',
        courseOrProgram: 'BS Information Technology',
        yearLevel: '1st Year',
        contactNumber: '',
      });
    } else {
      showToast({
        type: 'error',
        title: 'Registration Error',
        message: result.error || 'Unable to complete commuter registration.',
        duration: 4000,
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1720px] mx-auto space-y-4">
      
      {/* =========================================================================
          1. KPI CARDS (Matching Reference Layout Style)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Total Commuters */}
        <div 
          onClick={() => setActiveTab('all')}
          className={`bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-xs flex items-center justify-between transition-all cursor-pointer hover:border-blue-400 ${
            activeTab === 'all'
              ? 'border-blue-500 ring-2 ring-blue-500/20'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Total Users</span>
              <span className="text-[11px] text-slate-400">All Registered Accounts</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {stats.total.toLocaleString()}
          </div>
        </div>

        {/* Card 2: Students */}
        <div 
          onClick={() => setActiveTab('student')}
          className={`bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-xs flex items-center justify-between transition-all cursor-pointer hover:border-emerald-400 ${
            activeTab === 'student'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Students</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">20% Fare Discount</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {stats.students.toLocaleString()}
          </div>
        </div>

        {/* Card 3: Faculty */}
        <div 
          onClick={() => setActiveTab('faculty')}
          className={`bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-xs flex items-center justify-between transition-all cursor-pointer hover:border-amber-400 ${
            activeTab === 'faculty'
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Faculty</span>
              <span className="text-[11px] text-slate-400">Professors & Instructors</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {stats.faculty.toLocaleString()}
          </div>
        </div>

        {/* Card 4: Staff */}
        <div 
          onClick={() => setActiveTab('employee')}
          className={`bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-xs flex items-center justify-between transition-all cursor-pointer hover:border-indigo-400 ${
            activeTab === 'employee'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Staff</span>
              <span className="text-[11px] text-slate-400">Campus Administration</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {stats.employees.toLocaleString()}
          </div>
        </div>

      </div>

      {/* =========================================================================
          2. COMMUTER USERS DATA TABLE (With Integrated Action Buttons, Searchbar & Filters Inside Datatable)
          ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        
        {/* Integrated Action Toolbar & Search / Filter Bar Inside Datatable */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900">
          
          {/* Left Side: Outlined Tool Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Export to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>

            <button
              onClick={() => {
                showToast({
                  type: 'info',
                  title: 'Columns Config',
                  message: 'All 7 standard commuter directory columns are displayed.',
                  duration: 2500,
                });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Columns</span>
            </button>

            <button
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
                setCurrentPage(1);
                setSelectedIds([]);
                showToast({
                  type: 'info',
                  title: 'Refreshed',
                  message: 'Commuter directory refreshed.',
                  duration: 2000,
                });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh list"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </button>

            {selectedIds.length > 0 && (
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                {selectedIds.length} selected
              </span>
            )}

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ml-auto sm:ml-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add Commuter</span>
            </button>
          </div>

          {/* Right Side: Search & Filter Dropdown Inside Datatable */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search user, ID, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-7 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Role Filter Select Button */}
            <div className="flex items-center shrink-0">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as any)}
                className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg px-3 py-1 shadow-xs cursor-pointer focus:outline-none border-none transition-colors"
              >
                <option value="all" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">All Roles ({stats.total})</option>
                <option value="student" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Students ({stats.students})</option>
                <option value="faculty" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Faculty ({stats.faculty})</option>
                <option value="employee" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Staff ({stats.employees})</option>
              </select>
            </div>
          </div>

        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 text-[11px]">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded accent-blue-600 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">ID Number</th>
                <th className="py-3 px-4">College / Department</th>
                <th className="py-3 px-4">Contact & Email</th>
                <th className="py-3 px-4 text-center">20% Fare Discount</th>
                <th className="py-3 px-4 text-center">User Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedCommuters.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-bold text-sm">No commuters found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting the filter or search query.</p>
                  </td>
                </tr>
              ) : (
                paginatedCommuters.map((user) => {
                  const isSelected = selectedIds.includes(user.id);
                  const isStudent = user.commuterType === 'student';
                  const isFaculty = user.commuterType === 'faculty';
                  const isEmployee = user.commuterType === 'employee';

                  return (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(user.id)}
                          className="w-3.5 h-3.5 rounded accent-blue-600 cursor-pointer"
                        />
                      </td>

                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shrink-0 ${
                            isStudent
                              ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                              : isFaculty
                              ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
                              : 'bg-gradient-to-br from-purple-600 to-pink-700'
                          }`}>
                            {user.fullName.charAt(0)}
                          </div>
                          <div>
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left flex items-center gap-1 cursor-pointer"
                            >
                              <span>{user.fullName}</span>
                              {user.isVerifiedPlmun && (
                                <span title="Verified PLMun ID">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                </span>
                              )}
                            </button>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Active: {user.lastLoginAt || 'Recent'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* ID Number with clickable blue link style matching reference */}
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer" onClick={() => setSelectedUser(user)}>
                        {user.idNumber}
                      </td>

                      {/* College & Department */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                          {user.collegeOrDepartment}
                        </div>
                        {user.courseOrProgram && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[220px]">
                            {user.courseOrProgram} {user.yearLevel ? `• ${user.yearLevel}` : ''}
                          </div>
                        )}
                      </td>

                      {/* Contact & Email */}
                      <td className="py-3 px-4">
                        <div className="text-slate-600 dark:text-slate-300 truncate max-w-[170px]">
                          {user.email}
                        </div>
                        {user.contactNumber && (
                          <div className="text-[10px] font-mono text-slate-400">
                            {user.contactNumber}
                          </div>
                        )}
                      </td>

                      {/* 20% Discount Status */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleDiscount(user.id, user.fullName, user.transitDiscountEligible)}
                          title="Click to toggle 20% fare discount"
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer transition-transform active:scale-95 ${
                            user.transitDiscountEligible
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <Percent className="w-2.5 h-2.5" />
                          <span>{user.transitDiscountEligible ? '20% Active' : 'Regular'}</span>
                        </button>
                      </td>

                      {/* User Role Status Badge with Dot (Matching Reference Status Pill) */}
                      <td className="py-3 px-4 text-center">
                        {isStudent && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Student</span>
                          </span>
                        )}
                        {isFaculty && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span>Faculty</span>
                          </span>
                        )}
                        {isEmployee && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                            <span>Staff</span>
                          </span>
                        )}
                      </td>

                      {/* Action Column matching Reference: Eye & More icons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 text-slate-400">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-1 rounded-lg hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="View User Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, user.fullName)}
                            className="p-1 rounded-lg hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* =========================================================================
            4. PAGINATION FOOTER BAR (Matching Reference Style)
            ========================================================================= */}
        <div className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          
          {/* Left: Rows Per Page Selector */}
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
            </select>
            <span>out of <strong className="text-slate-900 dark:text-white font-mono">{filteredCommuters.length}</strong> records</span>
          </div>

          {/* Right: Page Navigation Buttons matching reference */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {/* Page number pills */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first, last, and window around current page
                if (
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  const isActive = page === currentPage;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="text-slate-400 px-0.5 font-bold">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* =========================================================================
          MODAL: USER DETAILS VIEW
          ========================================================================= */}
      {selectedUser && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-black/60 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                PLMun Digital Transit Pass
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-2xl font-black text-white bg-gradient-to-br from-[#006837] to-[#00B14F] shadow-md">
                {selectedUser.fullName.charAt(0)}
              </div>
              <div>
                <h4 className="font-black text-lg text-slate-900 dark:text-white">
                  {selectedUser.fullName}
                </h4>
                <span className="font-mono text-xs font-bold text-slate-400">
                  ID: {selectedUser.idNumber}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 font-bold uppercase">Role:</span>
                <span className="font-extrabold text-slate-900 dark:text-white capitalize">
                  {selectedUser.commuterType}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 font-bold uppercase">College:</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-right">
                  {selectedUser.collegeOrDepartment}
                </span>
              </div>
              {selectedUser.courseOrProgram && (
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-bold uppercase">Course / Department:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-right">
                    {selectedUser.courseOrProgram}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 font-bold uppercase">Email:</span>
                <span className="font-mono text-slate-900 dark:text-white">
                  {selectedUser.email}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-bold uppercase">Fare Discount:</span>
                <span className={`font-black ${selectedUser.transitDiscountEligible ? 'text-emerald-600' : 'text-slate-600'}`}>
                  {selectedUser.transitDiscountEligible ? '20% Student Discount Active' : 'Regular Fare'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW COMMUTER USER (Student / Faculty / Staff)
          ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-black/60 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Register New Commuter
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              
              {/* Role Type Selector */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Category (User Role):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, commuterType: 'student' })}
                    className={`py-2 px-2 rounded-xl border text-center font-bold transition-all ${
                      formData.commuterType === 'student'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, commuterType: 'faculty' })}
                    className={`py-2 px-2 rounded-xl border text-center font-bold transition-all ${
                      formData.commuterType === 'faculty'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, commuterType: 'employee' })}
                    className={`py-2 px-2 rounded-xl border text-center font-bold transition-all ${
                      formData.commuterType === 'employee'
                        ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Staff
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Full Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Juan Dela Cruz"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* ID Number */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  PLMun Student / Employee ID Number:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2023-01928 or FAC-2021-088"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Email & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    PLMun / Active Email:
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@plmun.edu.ph"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Contact Number:
                  </label>
                  <input
                    type="text"
                    placeholder="0917-000-0000"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* College / Department */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  College or Department:
                </label>
                <select
                  value={formData.collegeOrDepartment}
                  onChange={(e) => setFormData({ ...formData, collegeOrDepartment: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="College of Information Technology (CIT)">College of Information Technology (CIT)</option>
                  <option value="College of Business Administration (CBA)">College of Business Administration (CBA)</option>
                  <option value="College of Arts and Sciences (CAS)">College of Arts and Sciences (CAS)</option>
                  <option value="College of Criminal Justice (CCJ)">College of Criminal Justice (CCJ)</option>
                  <option value="College of Teacher Education (CTE)">College of Teacher Education (CTE)</option>
                  <option value="General Administration / Staff Services">General Administration / Staff Services</option>
                  <option value="Campus Facilities & Logistics Office">Campus Facilities & Logistics Office</option>
                </select>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Initial Password:
                </label>
                <input
                  type="text"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-sm"
                >
                  Register Commuter Account
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
