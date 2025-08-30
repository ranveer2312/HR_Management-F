'use client';
import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Search, 
  XCircle,
  AlertCircle,
  Clock,
  Calendar,
  Trash2,
  Edit
} from 'lucide-react';
import axios from 'axios';
import { APIURL } from '@/constants/api';
import toast, { Toaster } from 'react-hot-toast';

interface Employee {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  email: string;
}

interface Memo {
  id?: string;
  title: string;
  meetingType: string;
  meetingDate?: string;
  priority: 'High' | 'Medium' | 'Low';
  content: string;
  sentBy: string;
  sentByName: string;
  recipientEmployeeIds: string[];
  recipientDepartments: string[];
  sentToAll: boolean;
  createdAt?: string;
  status?: 'sent' | 'draft';
}

interface SentMemoRecipient {
  employeeId: string;
  employeeName: string;
  department: string;
  email: string;
}

interface SentMemo {
  id: number;
  title: string;
  meetingType: string;
  meetingDate?: [number, number, number];
  priority: 'High' | 'Medium' | 'Low';
  content: string;
  sentBy: string;
  sentByName: string;
  recipientEmployeeIds: string[];
  recipientDepartments: string[];
  sentAt: string;
  sentToAll: boolean;
  recipients: SentMemoRecipient[];
  totalRecipients: number;
}

const API_BASE_URL = APIURL +'/api';

const formatDateArray = (dateArray: [number, number, number] | undefined) => {
    if (!dateArray || dateArray.length !== 3) return 'N/A';
    const date = new Date(dateArray[0], dateArray[1] - 1, dateArray[2]);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

export default function AdminMemosPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [memoTitle, setMemoTitle] = useState('');
  const [memoContent, setMemoContent] = useState('');
  const [memoType, setMemoType] = useState<string>('Team Meeting');
  const [memoDate, setMemoDate] = useState<string>('');
  const [memoPriority, setMemoPriority] = useState<Memo['priority']>('Medium');
  const [sentMemos, setSentMemos] = useState<SentMemo[]>([]);
  const [draftMemos, setDraftMemos] = useState<Memo[]>([]);
  const [activeTab, setActiveTab] = useState<'compose' | 'sent' | 'drafts'>('compose');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [editingMemoId, setEditingMemoId] = useState<number | null>(null);

  // Add a helper to count words
  const getWordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
  const maxWords = 300;
  const warnWords = 250;
  const wordCount = getWordCount(memoContent);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_BASE_URL}/employees`);
        const fetchedEmployees = response.data.map((emp: Employee) => ({
          id: emp.id,
          employeeId: emp.employeeId,
          employeeName:emp.employeeName,
          department: emp.department,
          email: emp.email
        }));
        setEmployees(fetchedEmployees);
      } catch (err: unknown) {
        console.error('Failed to fetch employees:', err);
        setError('Failed to load employees. Please check your connection and try again.');
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    const fetchSentMemos = async () => {
      if (activeTab !== 'sent') return;

      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<SentMemo[]>(`${API_BASE_URL}/memos`);
        setSentMemos(response.data);
      } catch (err: unknown) {
        console.error('Failed to fetch sent memos:', err);
        setError('Failed to load sent memos. Please try again.');
        setSentMemos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSentMemos();
  }, [activeTab]);

  const departments = [...new Set(employees.map(emp => emp.department || '').filter(dept => dept !== ''))];

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = (emp.employeeName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (emp.department?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || emp.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  

  const handleSendMemo = async () => {
    if (!memoTitle || !memoContent || (selectedEmployees.length === 0 && selectedDepartments.length === 0)) {
      setError('Please fill in all required fields and select at least one recipient or department');
      toast.error('Please fill in all required fields and select at least one recipient or department');
      return;
    }

    try {
      setSending(true);
      setError(null);

      const memoData = {
        title: memoTitle,
        meetingType: memoType,
        meetingDate: memoDate || undefined,
        priority: memoPriority,
        content: memoContent,
        sentBy: 'ADMIN001', // This should come from the logged-in admin user
        sentByName: 'Admin User', // This should come from the logged-in admin user
        recipientEmployeeIds: selectedEmployees,
        recipientDepartments: selectedDepartments,
        sentToAll: false
      };

      if (editingMemoId) {
        // Update existing memo
        await axios.put(`${API_BASE_URL}/memos/${editingMemoId}`, memoData);
        setSentMemos(prevMemos => 
          prevMemos.map(memo => 
            memo.id === editingMemoId 
              ? {
                  ...memo,
                  title: memoData.title,
                  meetingType: memoData.meetingType,
                  meetingDate: memoData.meetingDate ? (() => {
                    const date = new Date(memoData.meetingDate!);
                    return [date.getFullYear(), date.getMonth() + 1, date.getDate()] as [number, number, number];
                  })() : undefined,
                  priority: memoData.priority,
                  content: memoData.content,
                  recipientEmployeeIds: memoData.recipientEmployeeIds,
                  recipientDepartments: memoData.recipientDepartments
                }
              : memo
          )
        );
        toast.success('Memo updated successfully!');
      } else {
        await axios.post(`${API_BASE_URL}/memos`, memoData);
        toast.success('Memo sent successfully!');
      }
      
      // Reset form
      setMemoTitle('');
      setMemoContent('');
      setMemoDate('');
      setSelectedEmployees([]);
      setSelectedDepartments([]);
      setMemoType('Team Meeting');
      setMemoPriority('Medium');
      setEditingMemoId(null); // Clear editing mode
      
      // Switch to the sent tab to see the updated list
      setActiveTab('sent');

    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const errorMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to send memo. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      } else {
        setError('Failed to send memo. Please try again.');
        toast.error('Failed to send memo. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleEditSentMemo = (memo: SentMemo) => {
    setEditingMemoId(memo.id); // Set editing mode
    setMemoTitle(memo.title);
    setMemoContent(memo.content);
    setMemoType(memo.meetingType);
    setMemoPriority(memo.priority);
    if (memo.meetingDate) {
        // API date is [year, month, day], month is 1-based. Date constructor month is 0-based.
        const date = new Date(memo.meetingDate[0], memo.meetingDate[1] - 1, memo.meetingDate[2]);
        setMemoDate(date.toISOString().split('T')[0]);
    } else {
        setMemoDate('');
    }
    setSelectedEmployees(memo.recipientEmployeeIds);
    setSelectedDepartments(memo.recipientDepartments);
    setActiveTab('compose');
  };

  const handleDeleteMemo = async (memoId: number) => {
    if (!window.confirm('Are you sure you want to delete this memo? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/memos/${memoId}`);
      setSentMemos(prevMemos => prevMemos.filter(memo => memo.id !== memoId));
    } catch (err: unknown) {
      console.error('Failed to delete memo:', err);
      setError('Failed to delete memo. Please try again.');
    }
  };

 

  const getPriorityColor = (priority: Memo['priority']) => {
    switch (priority) {
      case 'High':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch ((type || '').toLowerCase()) {
      case 'announcement':
        return <AlertCircle className="w-4 h-4" />;
      case 'warning':
        return <XCircle className="w-4 h-4" />;
      case 'notice':
        return <Clock className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">Send memos and notices to employees</p>
        </div>

        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['compose', 'sent',].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as 'compose' | 'sent' | 'drafts')}
                  className={`${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {activeTab === 'compose' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingMemoId ? 'Edit Memo' : 'Select Recipients'}
                </h3>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>


                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Select Employees</h4>
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {filteredEmployees.map(emp => (
                        <div
                          key={emp.id}
                          className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedEmployees.includes(emp.employeeId)
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleEmployeeSelect(emp.employeeId)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedEmployees.includes(emp.employeeId)}
                            onChange={() => {}}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{emp.employeeName}</p>
                            <p className="text-xs text-gray-500">{emp.department} • {emp.employeeId}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingMemoId ? 'Edit Memo' : 'Compose Memo'}
                  </h3>
                  {editingMemoId && (
                    <button
                      onClick={() => {
                        setEditingMemoId(null);
                        setMemoTitle('');
                        setMemoContent('');
                        setMemoDate('');
                        setSelectedEmployees([]);
                        setSelectedDepartments([]);
                        setMemoType('Team Meeting');
                        setMemoPriority('Medium');
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Memo Title"
                    value={memoTitle}
                    onChange={(e) => setMemoTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />

                  <input
                    type="date"
                    placeholder="Meeting Date"
                    value={memoDate}
                    onChange={(e) => setMemoDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={memoType}
                      onChange={(e) => setMemoType(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Team Meeting">Team Meeting</option>
                      <option value="Announcement">Announcement</option>
                      <option value="Warning">Warning</option>
                      <option value="Notice">Notice</option>
                    </select>

                    <select
                      value={memoPriority}
                      onChange={(e) => setMemoPriority(e.target.value as Memo['priority'])}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>
                  </div>

                  <textarea
                    placeholder="Write your memo here..."
                    value={memoContent}
                    onChange={(e) => {
                      const words = e.target.value.trim().split(/\s+/).filter(Boolean);
                      if (words.length <= maxWords) {
                        setMemoContent(e.target.value);
                      } else {
                        setMemoContent(words.slice(0, maxWords).join(' '));
                      }
                    }}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs ${wordCount > warnWords ? (wordCount > maxWords ? 'text-red-600' : 'text-yellow-600') : 'text-gray-500'}`}>Word count: {wordCount} / {maxWords}</span>
                    {wordCount > maxWords && <span className="text-xs text-red-600 ml-2">Maximum 300 words allowed</span>}
                  </div>

                  <div className="flex space-x-4">
                   
                    <button
                      onClick={handleSendMemo}
                      disabled={sending || wordCount > maxWords}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>{editingMemoId ? 'Update Memo' : 'Send Memo'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sent' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">Loading sent memos...</div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">{error}</div>
            ) : sentMemos.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No sent memos</h3>
                <p className="text-gray-500 mt-1">Your sent memos will appear here.</p>
              </div>
            ) : (
              sentMemos.map(memo => (
                <div key={memo.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{memo.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Sent by {memo.sentByName} to {memo.totalRecipients} recipients • {new Date(memo.sentAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(memo.priority)}`}>
                        {memo.priority} Priority
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200">
                        {getTypeIcon(memo.meetingType)}
                        <span className="ml-1 capitalize">{memo.meetingType}</span>
                      </span>
                    </div>
                  </div>

                  {memo.meetingDate && (
                      <div className="mt-4 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">Meeting Date:</span>
                              <span className="text-sm text-blue-700">
                                  {formatDateArray(memo.meetingDate)}
                              </span>
                          </div>
                      </div>
                  )}

                  <p className="mt-4 text-gray-700">{memo.content}</p>

                  <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-800">Recipients:</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                          {memo.recipients.map(r => (
                              <div key={r.employeeId} className="bg-gray-100 text-xs text-gray-700 px-2 py-1 rounded-full">
                                  {r.employeeName} ({r.department})
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-2">
                      <button
                          onClick={() => handleEditSentMemo(memo)}
                          className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                          title="Edit and Resend"
                      >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                      </button>
                      <button
                          onClick={() => handleDeleteMemo(memo.id)}
                          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                          title="Delete Memo"
                      >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                      </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'drafts' && (
          <div className="space-y-4">
            {draftMemos.map(memo => (
              <div key={memo.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{memo.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Last edited {memo.createdAt ? new Date(memo.createdAt).toLocaleString() : 'Unknown date'}
                      {typeof memo.meetingDate === 'string' && memo.meetingDate && ` • Meeting: ${new Date(memo.meetingDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(memo.priority)}`}>
                      {memo.priority} Priority
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200">
                      {getTypeIcon(memo.meetingType)}
                      <span className="ml-1 capitalize">{memo.meetingType}</span>
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-gray-700">{memo.content}</p>
                <div className="mt-4 flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setMemoTitle(memo.title);
                      setMemoContent(memo.content);
                      setMemoType(memo.meetingType);
                      setMemoDate(typeof memo.meetingDate === 'string' ? memo.meetingDate : '');
                      setMemoPriority(memo.priority);
                      setSelectedEmployees(memo.recipientEmployeeIds);
                      setSelectedDepartments(memo.recipientDepartments);
                      setActiveTab('compose');
                      // Remove the draft from the list as it's being edited now
                      setDraftMemos(prev => prev.filter(d => d.id !== memo.id));
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Edit Draft
                  </button>
                  <button
                    onClick={() => {
                      setDraftMemos(prev => prev.filter(m => m.id !== memo.id));
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Draft
                  </button>
                </div>
              </div>
            ))}
            {draftMemos.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No draft memos</h3>
                <p className="text-gray-500 mt-1">Your draft memos will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
