'use client';

import { useEffect, useState, useCallback } from 'react';
import { PlusCircleIcon, TrashIcon, PencilSquareIcon, DocumentTextIcon, DevicePhoneMobileIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import BackButton from '@/components/BackButton';
import { APIURL } from '@/constants/api';
import toast, { Toaster } from 'react-hot-toast';

interface SimBillExpense {
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

export default function SimBillsPage() {
  const [expenses, setExpenses] = useState<SimBillExpense[]>([]);
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

  const API_URL = APIURL + '/api/sim-bills';

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to fetch SIM bills');
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
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
      
      // Check file type and extension
      const isValidType = allowedTypes.includes(file.type);
      const isValidExtension = allowedExtensions.some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );
      
      if (isValidType || isValidExtension) {
        setSelectedFile(file);
        toast.success(`File "${file.name}" selected successfully!`);
      } else {
        toast.error('Please select a valid file type (PDF, DOC, DOCX, or TXT)');
        e.target.value = ''; // Clear the input
        setSelectedFile(null);
      }
    }
  };

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
        toast.success('SIM bill added successfully!');
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Failed to add SIM bill');
      }
    } catch (err) {
      console.error('Add error:', err);
      toast.error('Failed to add SIM bill');
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      fetchExpenses();
      toast.success('SIM bill deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete SIM bill');
    }
  };

  const handleEditClick = (expense: SimBillExpense) => {
    setEditingId(expense.id);
    
    // Format dates for input fields (YYYY-MM-DD)
    const formatDateForInput = (dateStr: string) => {
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
  };

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
        setEditingId(null);
        toast.success('SIM bill updated successfully!');
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Failed to update SIM bill');
      }
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Failed to update SIM bill');
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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-700">
      <Toaster position="top-right" />
      
      {/* Header Section */}
      <div className="bg-slate-50 dark:bg-slate-800 shadow-xl border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton href="/finance-manager/fixed-expenses" label="Back to Dashboard" />
          <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-500 rounded-2xl shadow-xl">
              <DevicePhoneMobileIcon className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-300">SIM Bills Management</h1>
              <p className="text-base text-slate-600 dark:text-slate-300 mt-1">Manage and track SIM card expenses</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-300">{expenses.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Total Bills</div>
            </div>
          </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Add/Edit Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 mb-8">
          <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-700 rounded-t-2xl">
            <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-3">
              {editingId ? (
                <>
                  <div className="p-2 bg-indigo-500 rounded-lg shadow-lg">
                    <PencilSquareIcon className="h-5 w-5 text-white" />
                  </div>
                  <span>Edit SIM Bill</span>
                </>
              ) : (
                <>
                  <div className="p-2 bg-indigo-500 rounded-lg shadow-lg">
                    <PlusCircleIcon className="h-5 w-5 text-white" />
                  </div>
                  <span>Add New SIM Bill</span>
                </>
              )}
            </h2>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Account Number *</label>
                <input
                  type="text"
                  name="accountNo"
                  placeholder="Enter account number"
                  value={newExpense.accountNo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-slate-700/50 dark:text-white transition-all duration-200 group-hover:border-indigo-300 placeholder-slate-400"
                  required
                />
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Payment Date *</label>
                <input
                  type="date"
                  name="paymentDate"
                  value={newExpense.paymentDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-slate-700/50 dark:text-white transition-all duration-200 group-hover:border-indigo-300"
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={newExpense.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-slate-700/50 dark:text-white transition-all duration-200 group-hover:border-indigo-300"
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Payment Mode *</label>
                <select
                  name="paymentMode"
                  value={newExpense.paymentMode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-slate-700/50 dark:text-white transition-all duration-200 group-hover:border-indigo-300 appearance-none bg-white dark:bg-slate-700/50"
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
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Month *</label>
                <input
                  type="month"
                  name="month"
                  value={newExpense.month}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-slate-700/50 dark:text-white transition-all duration-200 group-hover:border-indigo-300"
                  required
                />
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Payment Amount *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium">₹</span>
                  <input
                    type="number"
                    name="payment"
                    placeholder="0.00"
                    value={newExpense.payment}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-slate-700/50 dark:text-white transition-all duration-200 group-hover:border-indigo-300 placeholder-slate-400"
                    required
                  />
                </div>
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Remarks</label>
                <input
                  type="text"
                  name="remarks"
                  placeholder="Additional notes"
                  value={newExpense.remarks}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-slate-700/50 dark:text-white transition-all duration-200 group-hover:border-indigo-300 placeholder-slate-400"
                />
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Upload Document</label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-slate-700/50 dark:text-white transition-all duration-200 group-hover:border-indigo-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <DocumentArrowUpIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Accepted formats: PDF, DOC, DOCX, TXT</p>
                  {selectedFile && (
                    <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg">
                      <p className="text-sm text-indigo-700 dark:text-indigo-300 flex items-center">
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        Selected: {selectedFile.name}
                      </p>
                    </div>
                  )}
                  
                  {/* Show existing document when editing */}
                  {editingId && !selectedFile && (() => {
                    const currentExpense = expenses.find(exp => exp.id === editingId);
                    return currentExpense?.documentPath ? (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">📄 Current Document:</span>
                            <button
                              onClick={() => {
                                try {
                                  if (!currentExpense.documentPath) {
                                    toast.error('No document path found');
                                    return;
                                  }
                                  const url = currentExpense.documentPath.startsWith('/') 
                                    ? `${APIURL}${currentExpense.documentPath}` 
                                    : `${APIURL}/uploads/${currentExpense.documentPath}`;
                                  window.open(url, '_blank');
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
                    ) : null;
                  })()}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
              {editingId ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="px-6 py-3 text-sm font-semibold text-slate-700 bg-white border-2 border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-500/20 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600 transition-all duration-200 transform hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateExpense}
                    className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 border-0 rounded-xl shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 transform hover:scale-110"
                  >
                    <PencilSquareIcon className="h-4 w-4 mr-2 inline" />
                    Update Bill
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAddExpense}
                  className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 border-0 rounded-xl shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 transform hover:scale-110"
                >
                  <PlusCircleIcon className="h-4 w-4 mr-2 inline" />
                  Add Bill
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bills List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
          <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-700 rounded-t-2xl">
            <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-3">
              <div className="p-2 bg-indigo-500 rounded-lg shadow-lg">
                <DocumentTextIcon className="h-5 w-5 text-white" />
              </div>
              <span>SIM Bills</span>
              <span className="ml-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-semibold rounded-full">
                {expenses.length}
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Payment Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Mode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Document</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {expenses.map((expense, idx) => (
                  <tr
                    key={expense.id}
                    className={`transition-all duration-300 transform hover:scale-[1.01] ${idx === 0 ? 'border-l-4 border-indigo-500 bg-indigo-50 dark:bg-slate-900' : idx % 2 === 0 ? 'bg-slate-50 dark:bg-slate-900' : 'bg-white dark:bg-slate-800'}`}
                    style={{ animation: 'fadeInUp 0.7s cubic-bezier(0.23, 1, 0.32, 1)' }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-300">{expense.accountNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                      {formatDate(expense.paymentDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                        {expense.paymentMode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">{expense.month}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-700 dark:text-indigo-300">₹{expense.payment.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                      {expense.documentPath ? (
                        <button
                          onClick={() => {
                            try {
                              if (!expense.documentPath) {
                                toast.error('No document path found');
                                return;
                              }
                              
                              console.log('Document path:', expense.documentPath);
                              
                              // Handle different path formats
                              let url;
                              if (expense.documentPath.startsWith('http')) {
                                url = expense.documentPath;
                              } else if (expense.documentPath.startsWith('/uploads/')) {
                                url = `${APIURL}${expense.documentPath}`;
                              } else {
                                const filename = expense.documentPath.includes('/') ? expense.documentPath.split('/').pop() : expense.documentPath;
                                url = `${APIURL}/uploads/${filename}`;
                              }
                              
                              console.log('Opening URL:', url);
                              window.open(url, '_blank');
                            } catch {
                              toast.error('Error opening document');
                            }
                          }}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          📄 View
                        </button>
                      ) : (
                        <span className="text-slate-400">No document</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditClick(expense)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
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
                      <div className="text-slate-500 dark:text-slate-400">
                        <DevicePhoneMobileIcon className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                        <p className="text-lg font-medium">No SIM bills found</p>
                        <p className="text-sm">Add your first SIM bill to get started.</p>
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
