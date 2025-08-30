'use client';

import { useEffect, useState } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, DocumentTextIcon, BoltIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import BackButton from '@/components/BackButton';
import { APIURL } from '@/constants/api';
import toast, { Toaster } from 'react-hot-toast';

interface ElectricBillExpense {
  id: number;
  accountNo: string;
  paymentDate: string;
  paymentMode: string;
  billType: string;
  month: string;
  payment: number;
  remarks: string;
  documentPath?: string;
  date: string;
}

export default function ElectricBillsPage() {
  const [expenses, setExpenses] = useState<ElectricBillExpense[]>([]);
  const [newExpense, setNewExpense] = useState({
    accountNo: '',
    paymentDate: '',
    date: '',
    paymentMode: '',
    billType: '',
    month: '',
    payment: '',
    remarks: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingDocumentPath, setExistingDocumentPath] = useState<string | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch(APIURL + '/api/electric-bills');
      if (!res.ok) {
        throw new Error('Failed to fetch electric bills');
      }
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch expenses', err);
      toast.error('Failed to fetch electric bills');
      setExpenses([]);
    }
  };

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
        !newExpense.billType || !newExpense.month || !newExpense.payment) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('accountNo', newExpense.accountNo);
      formData.append('paymentDate', newExpense.paymentDate);
      formData.append('paymentMode', newExpense.paymentMode);
      formData.append('billType', newExpense.billType);
      formData.append('month', newExpense.month);
      formData.append('payment', newExpense.payment);
      formData.append('remarks', newExpense.remarks || '');
      if (newExpense.date) {
        formData.append('date', newExpense.date);
      }
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const res = await fetch(APIURL + '/api/electric-bills', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        fetchExpenses();
        setNewExpense({
          accountNo: '',
          paymentDate: '',
          date: '',
          paymentMode: '',
          billType: '',
          month: '',
          payment: '',
          remarks: '',
        });
        setSelectedFile(null);
        toast.success('Electric bill added successfully!');
      } else {
        const errorText = await res.text();
        toast.error(errorText || 'Failed to add electric bill');
      }
    } catch (err) {
      console.error('Failed to add expense', err);
      toast.error('Failed to add electric bill');
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      const res = await fetch(APIURL + `/api/electric-bills/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchExpenses();
        toast.success('Electric bill deleted successfully!');
      } else {
        toast.error('Failed to delete electric bill');
      }
    } catch (err) {
      console.error('Failed to delete expense', err);
      toast.error('Failed to delete electric bill');
    }
  };

  const handleEditClick = (expense: ElectricBillExpense) => {
    setEditingId(expense.id);
    
    // Format dates for input fields (YYYY-MM-DD)
    const formatDateForInput = (dateStr: string | number[]) => {
      if (!dateStr) return '';
      try {
        if (Array.isArray(dateStr) && dateStr.length >= 3) {
          // Handle array format [year, month, day] - format directly to avoid timezone issues
          const year = dateStr[0];
          const month = String(dateStr[1]).padStart(2, '0');
          const day = String(dateStr[2]).padStart(2, '0');
          return `${year}-${month}-${day}`;
        } else {
          // Handle string format
          const date = new Date(dateStr as string);
          if (isNaN(date.getTime())) {
            return '';
          }
          return date.toISOString().split('T')[0];
        }
      } catch {
        return '';
      }
    };
    
    setNewExpense({
      accountNo: expense.accountNo || '',
      paymentDate: formatDateForInput(expense.paymentDate),
      date: formatDateForInput(expense.date),
      paymentMode: expense.paymentMode || '',
      billType: expense.billType || '',
      month: expense.month || '',
      payment: expense.payment ? expense.payment.toString() : '',
      remarks: expense.remarks || '',
    });
    setSelectedFile(null);
    setExistingDocumentPath(expense.documentPath || null);
  };

  const handleUpdateExpense = async () => {
    if (!newExpense.accountNo || !newExpense.paymentDate || !newExpense.paymentMode || 
        !newExpense.billType || !newExpense.month || !newExpense.payment || editingId === null) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('accountNo', newExpense.accountNo);
      formData.append('paymentDate', newExpense.paymentDate);
      formData.append('paymentMode', newExpense.paymentMode);
      formData.append('billType', newExpense.billType);
      formData.append('month', newExpense.month);
      formData.append('payment', newExpense.payment);
      formData.append('remarks', newExpense.remarks || '');
      if (newExpense.date) {
        formData.append('date', newExpense.date);
      }
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const res = await fetch(APIURL + `/api/electric-bills/${editingId}`, {
        method: 'PUT',
        body: formData,
      });

      if (res.ok) {
        fetchExpenses();
        setNewExpense({
          accountNo: '',
          paymentDate: '',
          date: '',
          paymentMode: '',
          billType: '',
          month: '',
          payment: '',
          remarks: '',
        });
        setSelectedFile(null);
        setExistingDocumentPath(null);
        setEditingId(null);
        toast.success('Electric bill updated successfully!');
      } else {
        const errorText = await res.text();
        toast.error(errorText || 'Failed to update electric bill');
      }
    } catch (err) {
      console.error('Failed to update expense', err);
      toast.error('Failed to update electric bill');
    }
  };

  const handleCancelEdit = () => {
    setNewExpense({
      accountNo: '',
      paymentDate: '',
      date: '',
      paymentMode: '',
      billType: '',
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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-slate-900 dark:to-orange-950">
      <Toaster position="top-right" />
      
      {/* Header Section */}
      <div className="bg-gradient-to-r from-white via-yellow-50 to-orange-50 dark:from-gray-800 dark:via-slate-800 dark:to-orange-900 shadow-xl border-b border-yellow-200 dark:border-orange-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton href="/finance-manager/fixed-expenses" label="Back to Dashboard" />
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200">
                <BoltIcon className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">Electric Bills Management</h1>
                <p className="text-base text-gray-600 dark:text-gray-300 mt-1">Manage and track electricity expenses</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{expenses.length}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Bills</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Add/Edit Form */}
        <div className="bg-gradient-to-br from-white via-yellow-50/30 to-orange-50/30 dark:from-gray-800 dark:via-slate-800/50 dark:to-orange-900/30 rounded-2xl shadow-2xl border border-yellow-200/50 dark:border-orange-700/50 mb-8 backdrop-blur-sm">
          <div className="px-8 py-6 border-b border-yellow-200/50 dark:border-orange-700/50 bg-gradient-to-r from-yellow-50/50 to-orange-50/50 dark:from-slate-800/50 dark:to-orange-900/50 rounded-t-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              {editingId ? (
                <>
                  <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg shadow-lg">
                    <PencilIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">Edit Electric Bill</span>
                </>
              ) : (
                <>
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg">
                    <PlusIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Add New Electric Bill</span>
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
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-yellow-300 placeholder-gray-400"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-yellow-300"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-yellow-300"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-yellow-300 appearance-none bg-white dark:bg-gray-700/50"
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Bill Type *</label>
                <select
                  name="billType"
                  value={newExpense.billType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-yellow-300 appearance-none bg-white dark:bg-gray-700/50"
                  required
                >
                  <option value="">Select bill type</option>
                  <option value="BOREWELL">🕳️ BOREWELL</option>
                  <option value="MOTOR">⚙️ MOTOR</option>
                  <option value="ELECTRICITY">⚡ ELECTRICITY</option>
                </select>
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Month *</label>
                <input
                  type="month"
                  name="month"
                  value={newExpense.month}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-yellow-300"
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
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-yellow-300 placeholder-gray-400"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-yellow-300 placeholder-gray-400"
                />
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Upload Document</label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-yellow-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <DocumentArrowUpIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Accepted formats: PDF, DOC, DOCX, TXT</p>
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
                                window.open(`${APIURL}${existingDocumentPath}`, '_blank');
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
            
            <div className="flex justify-end space-x-4 pt-6 border-t border-yellow-200/50 dark:border-orange-700/50">
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
                    className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-yellow-600 to-orange-600 border border-transparent rounded-xl hover:from-yellow-700 hover:to-orange-700 focus:outline-none focus:ring-4 focus:ring-yellow-500/20 shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <PencilIcon className="h-4 w-4 mr-2 inline" />
                    Update Bill
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAddExpense}
                  className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 border border-transparent rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-500/20 shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <PlusIcon className="h-4 w-4 mr-2 inline" />
                  Add Bill
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bills List */}
        <div className="bg-gradient-to-br from-white via-yellow-50/30 to-orange-50/30 dark:from-gray-800 dark:via-slate-800/50 dark:to-orange-900/30 rounded-2xl shadow-2xl border border-yellow-200/50 dark:border-orange-700/50 backdrop-blur-sm">
          <div className="px-8 py-6 border-b border-yellow-200/50 dark:border-orange-700/50 bg-gradient-to-r from-yellow-50/50 to-orange-50/50 dark:from-slate-800/50 dark:to-orange-900/50 rounded-t-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg shadow-lg">
                <DocumentTextIcon className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">Electric Bills</span>
              <span className="ml-2 px-3 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/50 dark:to-orange-900/50 text-yellow-700 dark:text-yellow-300 text-sm font-semibold rounded-full">
                {expenses.length}
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-yellow-200/50 dark:divide-orange-700/50">
              <thead className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-slate-700 dark:to-orange-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bill Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Document</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/50 dark:bg-gray-800/50 divide-y divide-yellow-200/30 dark:divide-orange-700/30">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gradient-to-r hover:from-yellow-50/50 hover:to-orange-50/50 dark:hover:from-slate-700/50 dark:hover:to-orange-900/30 transition-all duration-200 transform hover:scale-[1.01]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">{expense.accountNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {expense.date ? formatDate(expense.date) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {formatDate(expense.paymentDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        {expense.paymentMode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        {expense.billType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{expense.month}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">₹{expense.payment.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {expense.documentPath ? (
                        <button
                          onClick={() => {
                            try {
                              const url = expense.documentPath?.startsWith('/') 
                                ? `${APIURL}${expense.documentPath}` 
                                : `${APIURL}/uploads/${expense.documentPath}`;
                              window.open(url, '_blank');
                            } catch {
                              toast.error('Error opening document');
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
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
                          className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors"
                          title="Edit bill"
                        >
                          <PencilIcon className="h-4 w-4" />
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
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        <BoltIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium">No electric bills found</p>
                        <p className="text-sm">Add your first electric bill to get started.</p>
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