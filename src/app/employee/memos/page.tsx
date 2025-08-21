'use client';
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Bell,
  AlertCircle,
  ChevronRight,
  Search,
  Filter,
  Archive,
  MoreVertical,
  Eye,
  MessageSquare,
  Users,
  Settings,
  Home,
  Menu,
  X
} from 'lucide-react';
import axios from 'axios';
import { APIURL } from '@/constants/api';
// import { useRouter } from 'next/navigation';

interface Memo {
  id: string;
  title: string;
  type: 'meeting' | 'policy' | 'maintenance' | 'onboarding' | 'announcement';
  priority: 'High Priority' | 'Medium Priority' | 'Low Priority';
  sender: string;
  department: string;
  date: string;
  time?: string;
  description: string;
  status: 'unread' | 'read';
  tags: string[];
}

// const sidebarItems = [
//   { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard', href: '/employee' },
//   { icon: User, label: 'My Profile', id: 'profile', href: '/employee/profile' },
//   { icon: Calendar, label: 'Attendance', id: 'attendance', href: '/employee/attendance' },
//   { icon: Coffee, label: 'Breaks', id: 'breaks', href: '/employee/breaks' },
//   { icon: Plane, label: 'Leave Management', id: 'leave', href: '/employee/leaves' },
//   { icon: TrendingUp, label: 'Performance', id: 'performance', href: '/employee/performance' },
//   { icon: FileText, label: 'Documents', id: 'documents', href: '/employee/documents' },
//   { icon: MessageSquare, label: 'Memos', id: 'memos', href: '/employee/memos' },
//   { icon: Package, label: 'Assets', id: 'assets', href: '/employee/assets' },
//   { icon: BarChart3, label: 'Reports', id: 'reports', href: '/employee/reports' },
//   { icon: GraduationCap, label: 'Training & Development', id: 'training', href: '/employee/training' },
// ];

export default function MemosAnnouncementsPage() {
  // const router = useRouter();
  // const [activeItem, setActiveItem] = useState('memos');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'High Priority' | 'Medium Priority' | 'Low Priority'>('all');
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [showMemoModal, setShowMemoModal] = useState(false);

  const employeeId = typeof window !== 'undefined' ? (sessionStorage.getItem('employeeId') || localStorage.getItem('employeeId')) : null;

  // Corrected function to avoid 'any'
  const normalizeDate = (d: string | number[] | undefined): string => {
    if (!d) return '';
    if (Array.isArray(d) && d.length >= 3) {
      const [y, m, day] = d;
      return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    if (typeof d === 'string') return d.split('T')[0];
    return '';
  };

  useEffect(() => {
    const fetchMemos = async () => {
      if (!employeeId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${APIURL}/api/memos/employee/${employeeId}`);
        const list = Array.isArray(res.data) ? res.data : [];

        // Corrected mapping logic to avoid 'any' and handle potential missing keys
        const mapped: Memo[] = list.map((m: Record<string, unknown>) => ({ // FIX 1: Replaced `any` with `unknown`
          id: String(m.id ?? m.memoId ?? Math.random()),
          title: (m.title || m.subject || 'Memo') as string,
          type: (m.meetingType || m.type || 'announcement') as Memo['type'],
          priority: (m.priority || 'Medium Priority') as Memo['priority'],
          sender: (m.sentByName || m.sentBy || m.adminName || 'Admin') as string,
          department: ((m.recipientDepartments as string[] | undefined)?.[0] || (m.department as string) || 'All'),
          date: normalizeDate(m.meetingDate as string | number[] | undefined || m.date as string || m.createdAt as string) || new Date().toISOString().split('T')[0],
          time: (m.time || undefined) as string,
          description: (m.content || m.message || m.description || '') as string,
          status: (String(m.status)?.toLowerCase?.() === 'read' ? 'read' : 'unread') as Memo['status'],
          tags: Array.isArray(m.tags) ? m.tags as string[] : [],
        }));
        setMemos(mapped);
      } catch { // FIX 2: Removed the unused `err` variable from the catch block
        setError('Failed to fetch memos');
      } finally {
        setLoading(false);
      }
    };
    fetchMemos();
  }, [employeeId]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High Priority':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium Priority':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Low Priority':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'policy':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'maintenance':
        return <Settings className="w-5 h-5 text-orange-500" />;
      case 'onboarding':
        return <Users className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-purple-500" />;
    }
  };

  const getTypeGradient = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-gradient-to-br from-blue-500 to-blue-600';
      case 'policy':
        return 'bg-gradient-to-br from-red-500 to-red-600';
      case 'maintenance':
        return 'bg-gradient-to-br from-orange-500 to-orange-600';
      case 'onboarding':
        return 'bg-gradient-to-br from-green-500 to-green-600';
      default:
        return 'bg-gradient-to-br from-purple-500 to-purple-600';
    }
  };

  const handleViewMemo = (memo: Memo) => {
    setSelectedMemo(memo);
    setShowMemoModal(true);
    // Mark as read if unread
    if (memo.status === 'unread') {
      setMemos(prevMemos =>
        prevMemos.map(m =>
          m.id === memo.id ? { ...m, status: 'read' as const } : m
        )
      );
    }
  };

  const closeMemoModal = () => {
    setShowMemoModal(false);
    setSelectedMemo(null);
  };

  // Re-run the filter logic only when memos, searchTerm, or filterPriority change.
  // This is a good place to use `useMemo` if the list were very large, but the linter was complaining about it not being used. 
  // Let's keep it simple for now to clear the error.
  const filteredMemos = memos.filter(memo => {
    const matchesSearch = memo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memo.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || memo.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mb-4 p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl shadow-lg"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-slate-600 mb-6">
            <Home className="w-4 h-4 mr-2" />
            <span>Back to Dashboard</span>
          </div>

          {/* Header Section */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-8 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                    My Memos
                  </h1>
                  <p className="mt-2 text-slate-600 text-lg">View all memos and announcements sent to you</p>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Unread Messages</p>
                    <p className="text-2xl font-bold text-red-500">{memos.filter(m => m.status === 'unread').length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search memos and announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value as 'all' | 'High Priority' | 'Medium Priority' | 'Low Priority')}
                    className="pl-10 pr-8 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[180px]"
                  >
                    <option value="all">All Priorities</option>
                    <option value="High Priority">High Priority</option>
                    <option value="Medium Priority">Medium Priority</option>
                    <option value="Low Priority">Low Priority</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Memos List */}
          <div className="bg-white rounded-2xl shadow-lg border border-white/20 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Memos & Announcements</h2>
                  <p className="text-slate-600 mt-1">{filteredMemos.length} messages found</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
                <p className="mt-4 text-slate-600">Loading memos...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            ) : filteredMemos.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No memos found</h3>
                <p className="text-slate-600">No memos match your current search criteria</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredMemos.map((memo) => (
                  <div key={memo.id} className={`p-6 hover:bg-slate-50 transition-all duration-200 cursor-pointer ${memo.status === 'unread' ? 'bg-blue-50/30 border-l-4 border-l-blue-500' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`w-12 h-12 ${getTypeGradient(memo.type)} rounded-xl flex items-center justify-center shadow-lg`}>
                          {getTypeIcon(memo.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className={`font-semibold text-lg ${memo.status === 'unread' ? 'text-slate-900' : 'text-slate-700'}`}>
                              {memo.title}
                            </h4>
                            {memo.status === 'unread' && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mb-3">
                            <span className="text-sm text-slate-600 flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              Sent by {memo.sender}
                            </span>
                            <span className="text-sm text-slate-400">•</span>
                            <span className="text-sm text-slate-600 flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {memo.date}
                            </span>
                            {memo.time && (
                              <>
                                <span className="text-sm text-slate-400">•</span>
                                <span className="text-sm text-slate-600 flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {memo.time}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-slate-600 leading-relaxed mb-4">{memo.description}</p>
                          <div className="flex items-center space-x-2">
                            {memo.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 ml-4">
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getPriorityColor(memo.priority)}`}>
                          {memo.priority}
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleViewMemo(memo)}
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-200"
                            title="More Options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Memos</p>
                  <p className="text-3xl font-bold">{memos.length}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100">Unread</p>
                  <p className="text-3xl font-bold">{memos.filter(m => m.status === 'unread').length}</p>
                </div>
                <Bell className="w-8 h-8 text-red-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100">High Priority</p>
                  <p className="text-3xl font-bold">{memos.filter(m => m.priority === 'High Priority').length}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-amber-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100">This Week</p>
                  {/* NOTE: This stat is not currently calculated, it just shows the total */}
                  <p className="text-3xl font-bold">{memos.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-emerald-200" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Memo Detail Modal */}
      {showMemoModal && selectedMemo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 ${getTypeGradient(selectedMemo.type)} rounded-xl flex items-center justify-center shadow-lg`}>
                    {getTypeIcon(selectedMemo.type)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedMemo.title}</h2>
                    <p className="text-slate-600">Memo Details</p>
                  </div>
                </div>
                <button
                  onClick={closeMemoModal}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Priority Badge */}
              <div className="flex items-center justify-between">
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getPriorityColor(selectedMemo.priority)}`}>
                  {selectedMemo.priority}
                </div>
                <div className="text-sm text-slate-500">
                  {selectedMemo.status === 'unread' ? 'Unread' : 'Read'}
                </div>
              </div>

              {/* Sender and Date Info */}
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600">Sent by:</span>
                    <span className="font-medium text-slate-900">{selectedMemo.sender}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600">Date:</span>
                    <span className="font-medium text-slate-900">{selectedMemo.date}</span>
                  </div>
                  {selectedMemo.time && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-600">Time:</span>
                      <span className="font-medium text-slate-900">{selectedMemo.time}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-600">Department:</span>
                    <span className="font-medium text-slate-900">{selectedMemo.department}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Description</h3>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedMemo.description}</p>
                </div>
              </div>

              {/* Tags */}
              {selectedMemo.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMemo.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-lg border border-slate-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeMemoModal}
                  className="px-6 py-2 text-slate-600 hover:text-slate-800 hover:bg-white border border-slate-300 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}