'use client';

import { useEffect, useState, useCallback } from 'react';
import { PlusCircleIcon, TrashIcon, PencilSquareIcon, DocumentTextIcon, WifiIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import BackButton from '@/components/BackButton';
import { APIURL } from '@/constants/api';
import toast, { Toaster } from 'react-hot-toast';

interface InternetBillExpense {
  id: number;
  accountNo: string;
  paymentDate: string;
  paymentMode: string;
  month: string;
  payment: number;
  remarks: string;
  documentPath?: string;
  date: string;
}

export default function InternetBillsPage() {
  const [expenses, setExpenses] = useState<InternetBillExpense[]>([]);
  const [newExpense, setNewExpense] = useState({
    accountNo: '',
    paymentDate: '',
    date: '',
    paymentMode: '',
    month: '',
    payment: '',
    remarks: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingDocumentPath, setExistingDocumentPath] = useState<string | null>(null);

  const API_URL = APIURL + '/api/internet-bills';

  const fetchExpenses = useCallback(async () => {
    try {
      console.log('Fetching from:', API_URL);
      const res = await fetch(API_URL);
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      console.log('Fetched data:', data);
      setExpenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error(`Failed to fetch internet bills: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setExpenses([]);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewExpense({ ...newExpense, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Accept all file types - no restrictions
      setSelectedFile(file);
      toast.success(`File "${file.name}" selected successfully!`);
    }
  };

  // Add new expense (POST)
  const handleAddExpense = async () => {
    if (!newExpense.accountNo || !newExpense.paymentDate || !newExpense.paymentMode || 
        !newExpense.month || !newExpense.payment) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      const requestBody = {
        accountNo: newExpense.accountNo,
        paymentDate: newExpense.paymentDate,
        date: newExpense.date || newExpense.paymentDate,
        paymentMode: newExpense.paymentMode,
        month: newExpense.month,
        payment: parseFloat(newExpense.payment),
        remarks: newExpense.remarks || '',
        documentPath: selectedFile ? selectedFile.name : ''
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        fetchExpenses();
        setNewExpense({
          accountNo: '',
          paymentDate: '',
          date: '',
          paymentMode: '',
          month: '',
          payment: '',
          remarks: '',
        });
        setSelectedFile(null);
        toast.success('Internet bill added successfully!');
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Failed to add internet bill');
      }
    } catch (err) {
      console.error('Add error:', err);
      toast.error('Failed to add internet bill');
    }
  };

  // Delete (DELETE)
  const handleDeleteExpense = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      fetchExpenses();
      toast.success('Internet bill deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete internet bill');
    }
  };

  const handleEditClick = (expense: InternetBillExpense) => {
    setEditingId(expense.id);
    
    // Format dates for input fields (YYYY-MM-DD)
    const formatDateForInput = (dateStr: unknown) => {
      if (!dateStr) return '';
      
      const dateString = String(dateStr).trim();
      if (!dateString || dateString === 'null' || dateString === 'undefined') return '';
      
      // If already in YYYY-MM-DD format, return as is
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
      }
      
      try {
        // Handle different date formats
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return '';
        }
        // Format to YYYY-MM-DD for input field
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch {
        return '';
      }
    };
    
    setNewExpense({
      accountNo: expense.accountNo,
      paymentDate: formatDateForInput(expense.paymentDate),
      date: formatDateForInput(expense.date),
      paymentMode: expense.paymentMode,
      month: expense.month,
      payment: expense.payment.toString(),
      remarks: expense.remarks || '',
    });
    setSelectedFile(null);
    setExistingDocumentPath(expense.documentPath || null);
  };

  // Update (PUT)
  const handleUpdateExpense = async () => {
    if (!newExpense.accountNo || !newExpense.paymentDate || !newExpense.paymentMode || 
        !newExpense.month || !newExpense.payment || editingId === null) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      const currentExpense = expenses.find(exp => exp.id === editingId);
      const requestBody = {
        accountNo: newExpense.accountNo,
        paymentDate: newExpense.paymentDate,
        date: newExpense.date || newExpense.paymentDate,
        paymentMode: newExpense.paymentMode,
        month: newExpense.month,
        payment: parseFloat(newExpense.payment),
        remarks: newExpense.remarks || '',
        documentPath: selectedFile ? selectedFile.name : (currentExpense?.documentPath || '')
      };

      const res = await fetch(`${API_URL}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        fetchExpenses();
        setNewExpense({
          accountNo: '',
          paymentDate: '',
          date: '',
          paymentMode: '',
          month: '',
          payment: '',
          remarks: '',
        });
        setSelectedFile(null);
        setExistingDocumentPath(null);
        setEditingId(null);
        toast.success('Internet bill updated successfully!');
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Failed to update internet bill');
      }
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Failed to update internet bill');
    }
  };

  const handleCancelEdit = () => {
    setNewExpense({
      accountNo: '',
      paymentDate: '',
      date: '',
      paymentMode: '',
      month: '',
      payment: '',
      remarks: '',
    });
    setSelectedFile(null);
    setExistingDocumentPath(null);
    setEditingId(null);
    // Clear the file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const formatDate = (dateString: unknown) => {
    if (!dateString) return 'N/A';
    
    // Convert to string if it's not already
    const dateStr = String(dateString).trim();
    if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return 'N/A';
    
    // Handle YYYY-MM-DD format directly
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-');
      return `${month}/${day}/${year}`;
    }
    
    // For other formats, try to parse and format
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      <Toaster position="top-right" />
      
      {/* Header Section */}
      <div className="bg-gradient-to-r from-white via-blue-50 to-indigo-50 dark:from-gray-800 dark:via-slate-800 dark:to-indigo-900 shadow-xl border-b border-blue-200 dark:border-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton href="/finance-manager/fixed-expenses" label="Back to Dashboard" />
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200">
                <WifiIcon className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Internet Bills Management</h1>
                <p className="text-base text-gray-600 dark:text-gray-300 mt-1">Manage and track internet expenses</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{expenses.length}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Bills</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Add/Edit Form */}
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-800 dark:via-slate-800/50 dark:to-indigo-900/30 rounded-2xl shadow-2xl border border-blue-200/50 dark:border-indigo-700/50 mb-8 backdrop-blur-sm">
          <div className="px-8 py-6 border-b border-blue-200/50 dark:border-indigo-700/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-800/50 dark:to-indigo-900/50 rounded-t-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              {editingId ? (
                <>
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                    <PencilSquareIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Edit Internet Bill</span>
                </>
              ) : (
                <>
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg">
                    <PlusCircleIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Add New Internet Bill</span>
                </>
              )}
            </h2>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Account Number *</label>
                <input
                  type="text"
                  name="accountNo"
                  placeholder="Enter account number"
                  value={newExpense.accountNo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-blue-300 placeholder-gray-400"
                  required
                />
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Payment Date *</label>
                <input
                  type="date"
                  name="paymentDate"
                  value={newExpense.paymentDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-blue-300"
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={newExpense.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-blue-300"
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Payment Mode *</label>
                <select
                  name="paymentMode"
                  value={newExpense.paymentMode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-blue-300 appearance-none bg-white dark:bg-gray-700/50"
                  required
                >
                  <option value="">Select payment mode</option>
                  <option value="UPI">📱 UPI</option>
                  <option value="CASH">💵 CASH</option>
                  <option value="CARD">💳 CARD</option>
                  <option value="BANK TRANSFER">🏦 BANK TRANSFER</option>
                  <option value="CHEQUE">📝 CHEQUE</option>
                </select>
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Month *</label>
                <input
                  type="month"
                  name="month"
                  value={newExpense.month}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-blue-300"
                  required
                />
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Payment Amount *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <input
                    type="number"
                    name="payment"
                    placeholder="0.00"
                    value={newExpense.payment}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-blue-300 placeholder-gray-400"
                    required
                  />
                </div>
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Remarks</label>
                <input
                  type="text"
                  name="remarks"
                  placeholder="Additional notes"
                  value={newExpense.remarks}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-blue-300 placeholder-gray-400"
                />
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Upload Document</label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-blue-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    accept="*/*"
                  />
                  <DocumentArrowUpIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All file formats accepted</p>
                  {selectedFile && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-300 flex items-center">
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        Selected: {selectedFile.name}
                      </p>
                    </div>
                  )}
                  
                  {/* Show existing document when editing */}
                  {editingId && existingDocumentPath && !selectedFile && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">📄 Current Document:</span>
                          <button
                            onClick={() => {
                              try {
                                const filename = existingDocumentPath.includes('/') ? existingDocumentPath.split('/').pop() : existingDocumentPath;
                                if (!filename) {
                                  toast.error('Invalid document path');
                                  return;
                                }
                                // Try multiple endpoints for compatibility
                                const encodedFilename = encodeURIComponent(filename);
                                const urls = [
                                  `${APIURL}/api/files/${encodedFilename}`,
                                  `${APIURL}/files/${encodedFilename}`,
                                  `${APIURL}/api/internet-bills/files/${encodedFilename}`
                                ];
                                
                                // Try first URL, if it fails, try others
                                const tryUrl = async (urlIndex = 0) => {
                                  if (urlIndex >= urls.length) {
                                    toast.error('File not found on server');
                                    return;
                                  }
                                  
                                  try {
                                    const response = await fetch(urls[urlIndex], { method: 'HEAD' });
                                    if (response.ok) {
                                      window.open(urls[urlIndex], '_blank');
                                    } else {
                                      tryUrl(urlIndex + 1);
                                    }
                                  } catch {
                                    tryUrl(urlIndex + 1);
                                  }
                                };
                                
                                tryUrl();
                              } catch {
                                toast.error('Error opening document');
                              }
                            }}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline text-sm"
                          >
                            View Document
                          </button>
                        </div>
                        <span className="text-xs text-blue-600 dark:text-blue-400">Upload new file to replace</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 pt-6 border-t border-blue-200/50 dark:border-indigo-700/50">
              {editingId ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-500/20 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 transition-all duration-200 transform hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateExpense}
                    className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 border border-transparent rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <PencilSquareIcon className="h-4 w-4 mr-2 inline" />
                    Update Bill
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAddExpense}
                  className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 border border-transparent rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-500/20 shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <PlusCircleIcon className="h-4 w-4 mr-2 inline" />
                  Add Bill
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bills List */}
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-800 dark:via-slate-800/50 dark:to-indigo-900/30 rounded-2xl shadow-2xl border border-blue-200/50 dark:border-indigo-700/50 backdrop-blur-sm">
          <div className="px-8 py-6 border-b border-blue-200/50 dark:border-indigo-700/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-800/50 dark:to-indigo-900/50 rounded-t-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                <DocumentTextIcon className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Internet Bills</span>
              <span className="ml-2 px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full">
                {expenses.length}
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-blue-200/50 dark:divide-indigo-700/50">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-indigo-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Document</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/50 dark:bg-gray-800/50 divide-y divide-blue-200/30 dark:divide-indigo-700/30">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-slate-700/50 dark:hover:to-indigo-900/30 transition-all duration-200 transform hover:scale-[1.01]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">{expense.accountNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {formatDate(expense.paymentDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {expense.paymentMode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{expense.month}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">₹{expense.payment.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {expense.documentPath ? (
                        <button
                          onClick={() => {
                            try {
                              if (!expense.documentPath) {
                                toast.error('No document path found');
                                return;
                              }
                              const filename = expense.documentPath.includes('/') ? expense.documentPath.split('/').pop() : expense.documentPath;
                              if (!filename) {
                                toast.error('Invalid document path');
                                return;
                              }
                              // Try multiple endpoints for compatibility
                              const encodedFilename = encodeURIComponent(filename);
                              const urls = [
                                `${APIURL}/api/files/${encodedFilename}`,
                                `${APIURL}/files/${encodedFilename}`,
                                `${APIURL}/api/internet-bills/files/${encodedFilename}`
                              ];
                              
                              // Try first URL, if it fails, try others
                              const tryUrl = async (urlIndex = 0) => {
                                if (urlIndex >= urls.length) {
                                  toast.error('File not found on server');
                                  return;
                                }
                                
                                try {
                                  const response = await fetch(urls[urlIndex], { method: 'HEAD' });
                                  if (response.ok) {
                                    window.open(urls[urlIndex], '_blank');
                                  } else {
                                    tryUrl(urlIndex + 1);
                                  }
                                } catch {
                                  tryUrl(urlIndex + 1);
                                }
                              };
                              
                              tryUrl();
                            } catch {
                              toast.error('Error opening document');
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                        >
                          📄 View
                        </button>
                      ) : (
                        <span className="text-gray-400">No document</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditClick(expense)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          title="Edit bill"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          title="Delete bill"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        <WifiIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium">No internet bills found</p>
                        <p className="text-sm">Add your first internet bill to get started.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
