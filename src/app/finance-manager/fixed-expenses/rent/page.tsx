'use client';

import { useEffect, useState } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, DocumentTextIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import BackButton from '@/components/BackButton';
import DocumentUpload from '@/components/DocumentUpload';
import { APIURL } from '@/constants/api';
import toast, { Toaster } from 'react-hot-toast';

// Updated interface to include all new fields
interface RentExpense {
  id: number;
  date: string | number[];
  invoiceNo: string;
  ownerName: string;
  amount: number;
  paymentDate: string | number[];
  paymentMode: string;
  tds: number;
  gstAmount: number;
  taxableAmount: number;
  finalPayment: number;
  remarks: string;
  description: string;
  documentPath?: string;
}

export default function RentPage() {
  const [expenses, setExpenses] = useState<RentExpense[]>([]);
  // Initialize newExpense state with all the new fields
  const [newExpense, setNewExpense] = useState({
    date: '',
    invoiceNo: '',
    ownerName: '',
    amount: '',
    paymentDate: '',
    paymentMode: '',
    tds: '',
    gstAmount: '',
    taxableAmount: '',
    finalPayment: '',
    remarks: '',
    description: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingDocumentPath, setExistingDocumentPath] = useState<string | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch(APIURL + '/api/rent');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.error('Failed to fetch expenses', err);
      const error = err as Error;
      if (error.message?.includes('Failed to fetch')) {
        toast.error('Backend server is not running. Please start the server on port 8080.');
      } else {
        toast.error(`Failed to fetch rent expenses: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewExpense({ ...newExpense, [name]: value });
  };

  const handleAddExpense = async () => {
    // Basic validation for required fields
    if (
      !newExpense.date ||
      !newExpense.invoiceNo ||
      !newExpense.ownerName ||
      !newExpense.amount ||
      !newExpense.paymentDate ||
      !newExpense.paymentMode ||
      !newExpense.finalPayment ||
      !newExpense.description
    ) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      const requestBody = {
        date: newExpense.date,
        invoiceNo: newExpense.invoiceNo,
        ownerName: newExpense.ownerName,
        amount: parseFloat(newExpense.amount) || 0,
        paymentDate: newExpense.paymentDate,
        paymentMode: newExpense.paymentMode,
        tds: parseFloat(newExpense.tds || '0'),
        gstAmount: parseFloat(newExpense.gstAmount || '0'),
        taxableAmount: parseFloat(newExpense.taxableAmount || '0'),
        finalPayment: parseFloat(newExpense.finalPayment) || 0,
        remarks: newExpense.remarks || '',
        description: newExpense.description || ''
      };

      let headers: Record<string, string> = { 'Content-Type': 'application/json' };
      let url = APIURL + '/api/rent';

      // If file is selected, use FormData
      let formData: FormData | null = null;
      if (selectedFile) {
        formData = new FormData();
        formData.append('file', selectedFile);
        
        // Append all other fields as JSON string
        formData.append('rentData', JSON.stringify(requestBody));
        
        headers = {}; // Let browser set Content-Type for FormData
        url = APIURL + '/api/rent/upload';
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: selectedFile && formData ? formData : JSON.stringify(requestBody),
      });

      if (res.ok) {
        fetchExpenses();
        // Reset all fields after successful add
        setNewExpense({
          date: '',
          invoiceNo: '',
          ownerName: '',
          amount: '',
          paymentDate: '',
          paymentMode: '',
          tds: '',
          gstAmount: '',
          taxableAmount: '',
          finalPayment: '',
          remarks: '',
          description: '',
        });
        setSelectedFile(null);
        // Reset file input element
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        toast.success('Rent expense added successfully!');
      } else {
        const errorText = await res.text();
        console.error('Server error:', errorText);
        if (res.status === 400 && errorText.includes('Duplicate')) {
          toast.error('Invoice number already exists. Please use a different invoice number.');
        } else {
          toast.error(`Failed to add rent expense: ${res.status}`);
        }
      }
    } catch (err) {
      console.error('Failed to add expense', err);
      const error = err as Error;
      if (error.message?.includes('Failed to fetch')) {
        toast.error('Backend server is not running. Please start the server on port 8080.');
      } else {
        toast.error(`Failed to add rent expense: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      const res = await fetch(APIURL + `/api/rent/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchExpenses();
        toast.success('Rent expense deleted successfully!');
      } else {
        const errorText = await res.text();
        console.error('Delete error:', errorText);
        toast.error(`Failed to delete rent expense: ${res.status}`);
      }
    } catch (err) {
      console.error('Failed to delete expense', err);
      const error = err as Error;
      if (error.message?.includes('Failed to fetch')) {
        toast.error('Backend server is not running. Please start the server on port 8080.');
      } else {
        toast.error(`Failed to delete rent expense: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleEditClick = (expense: RentExpense) => {
    setEditingId(expense.id);
    // Convert the date arrays to YYYY-MM-DD format for the input fields
    const dateStr = Array.isArray(expense.date) && expense.date.length >= 3
      ? `${expense.date[0]}-${String(expense.date[1]).padStart(2, '0')}-${String(expense.date[2]).padStart(2, '0')}`
      : expense.date || '';
    const payDateStr = Array.isArray(expense.paymentDate) && expense.paymentDate.length >= 3
      ? `${expense.paymentDate[0]}-${String(expense.paymentDate[1]).padStart(2, '0')}-${String(expense.paymentDate[2]).padStart(2, '0')}`
      : expense.paymentDate || '';

    setNewExpense({
      date: String(dateStr),
      invoiceNo: String(expense.invoiceNo || ''),
      ownerName: String(expense.ownerName || ''),
      amount: String(expense.amount || 0),
      paymentDate: String(payDateStr),
      paymentMode: String(expense.paymentMode || ''),
      tds: String(expense.tds || 0),
      gstAmount: String(expense.gstAmount || 0),
      taxableAmount: String(expense.taxableAmount || 0),
      finalPayment: String(expense.finalPayment || 0),
      remarks: String(expense.remarks || ''),
      description: String(expense.description || ''),
    });
    setSelectedFile(null); // Reset file selection when editing
    setExistingDocumentPath(expense.documentPath || null); // Set existing document path
  };

  const handleUpdateExpense = async () => {
    // Basic validation for required fields
    if (
      !newExpense.date ||
      !newExpense.invoiceNo ||
      !newExpense.ownerName ||
      !newExpense.amount ||
      !newExpense.paymentDate ||
      !newExpense.paymentMode ||
      !newExpense.finalPayment ||
      !newExpense.description ||
      editingId === null
    ) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      const currentExpense = expenses.find(exp => exp.id === editingId);
      const requestBody = {
        date: newExpense.date,
        invoiceNo: newExpense.invoiceNo,
        ownerName: newExpense.ownerName,
        amount: parseFloat(newExpense.amount) || 0,
        paymentDate: newExpense.paymentDate,
        paymentMode: newExpense.paymentMode,
        tds: parseFloat(newExpense.tds || '0'),
        gstAmount: parseFloat(newExpense.gstAmount || '0'),
        taxableAmount: parseFloat(newExpense.taxableAmount || '0'),
        finalPayment: parseFloat(newExpense.finalPayment) || 0,
        remarks: newExpense.remarks || '',
        description: newExpense.description || '',
        documentPath: currentExpense?.documentPath || ''
      };

      let headers: Record<string, string> = { 'Content-Type': 'application/json' };
      let url = APIURL + `/api/rent/${editingId}`;

      // If file is selected, use FormData
      let formData: FormData | null = null;
      if (selectedFile) {
        formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('rentData', JSON.stringify(requestBody));
        
        headers = {};
        url = APIURL + `/api/rent/upload/${editingId}`;
      }

      const res = await fetch(url, {
        method: selectedFile ? 'POST' : 'PUT',
        headers,
        body: selectedFile && formData ? formData : JSON.stringify(requestBody),
      });

      if (res.ok) {
        fetchExpenses();
        // Reset all fields and exit editing mode
        setNewExpense({
          date: '',
          invoiceNo: '',
          ownerName: '',
          amount: '',
          paymentDate: '',
          paymentMode: '',
          tds: '',
          gstAmount: '',
          taxableAmount: '',
          finalPayment: '',
          remarks: '',
          description: '',
        });
        setSelectedFile(null);
        setExistingDocumentPath(null);
        setEditingId(null);
        // Reset file input element
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        toast.success('Rent expense updated successfully!');
      } else {
        const errorText = await res.text();
        console.error('Update error:', errorText);
        toast.error(`Failed to update rent expense: ${res.status}`);
      }
    } catch (err) {
      console.error('Failed to update expense', err);
      const error = err as Error;
      if (error.message?.includes('Failed to fetch')) {
        toast.error('Backend server is not running. Please start the server on port 8080.');
      } else {
        toast.error(`Failed to update rent expense: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleCancelEdit = () => {
    setNewExpense({
      date: '',
      invoiceNo: '',
      ownerName: '',
      amount: '',
      paymentDate: '',
      paymentMode: '',
      tds: '',
      gstAmount: '',
      taxableAmount: '',
      finalPayment: '',
      remarks: '',
      description: '',
    });
    setSelectedFile(null);
    setExistingDocumentPath(null);
    setEditingId(null);
    // Reset file input element
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Add a helper to count words for description
  const getDescWordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
  const maxDescWords = 6;
  const warnDescWords = 5;
  const descWordCount = getDescWordCount(newExpense.description);

  // Helper function to format dates safely
  const formatDate = (date: string | number[]) => {
    try {
      if (Array.isArray(date) && date.length >= 3) {
        return new Date(date[0], date[1] - 1, date[2]).toLocaleDateString();
      } else if (date) {
        return new Date(date as string).toLocaleDateString();
      }
      return 'N/A';
    } catch {
      return 'Invalid Date';
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
                <CurrencyDollarIcon className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Rent Management</h1>
                <p className="text-base text-gray-600 dark:text-gray-300 mt-1">Manage and track rental expenses with ease</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{expenses.length}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Records</div>
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
                    <PencilIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Edit Rent Expense</span>
                </>
              ) : (
                <>
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg">
                    <PlusIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Add New Rent Expense</span>
                </>
              )}
            </h2>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Invoice Date *</label>
                <input
                  type="date"
                  name="date"
                  value={newExpense.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-blue-300"
                  required
                />
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Invoice Number *</label>
                <input
                  type="text"
                  name="invoiceNo"
                  placeholder="Enter invoice number"
                  value={newExpense.invoiceNo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-blue-300 placeholder-gray-400"
                  required
                />
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Property Owner *</label>
                <input
                  type="text"
                  name="ownerName"
                  placeholder="Enter owner name"
                  value={newExpense.ownerName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-blue-300 placeholder-gray-400"
                  required
                />
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Rent Amount *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <input
                    type="number"
                    name="amount"
                    placeholder="0.00"
                    value={newExpense.amount}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-blue-300 placeholder-gray-400"
                    required
                  />
                </div>
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
                />
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Payment Method *</label>
                <select
                  name="paymentMode"
                  value={newExpense.paymentMode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-blue-300 appearance-none bg-white dark:bg-gray-700/50"
                  required
                >
                  <option value="">Select payment method</option>
                  <option value="Cash">💵 Cash</option>
                  <option value="Bank Transfer">🏦 Bank Transfer</option>
                  <option value="Cheque">📝 Cheque</option>
                  <option value="UPI">📱 UPI</option>
                </select>
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">TDS Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <input
                    type="number"
                    name="tds"
                    placeholder="0.00"
                    value={newExpense.tds}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-blue-300 placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">GST Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <input
                    type="number"
                    name="gstAmount"
                    placeholder="0.00"
                    value={newExpense.gstAmount}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-blue-300 placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Taxable Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <input
                    type="number"
                    name="taxableAmount"
                    placeholder="0.00"
                    value={newExpense.taxableAmount}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-blue-300 placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Final Payment *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <input
                    type="number"
                    name="finalPayment"
                    placeholder="0.00"
                    value={newExpense.finalPayment}
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                <input
                  type="text"
                  name="description"
                  placeholder="Brief description (max 6 words)"
                  value={newExpense.description}
                  onChange={e => {
                    const words = e.target.value.trim().split(/\s+/).filter(Boolean);
                    if (words.length <= maxDescWords) {
                      setNewExpense({ ...newExpense, description: e.target.value });
                    } else {
                      setNewExpense({ ...newExpense, description: words.slice(0, maxDescWords).join(' ') });
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 group-hover:border-blue-300 placeholder-gray-400"
                  required
                />
                <p className={`text-xs mt-2 font-medium ${
                  descWordCount > warnDescWords
                    ? descWordCount > maxDescWords
                      ? 'text-red-500'
                      : 'text-yellow-500'
                    : 'text-gray-500'
                }`}>
                  {descWordCount}/{maxDescWords} words
                </p>
              </div>
              
              {/* Document Upload */}
              <div className="lg:col-span-3">
                <DocumentUpload
                  selectedFile={selectedFile}
                  onFileChange={setSelectedFile}
                  label="Upload Supporting Document"
                  required={false}
                />
                
                {/* Show existing document when editing */}
                {editingId && existingDocumentPath && !selectedFile && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">📄 Current Document:</span>
                        <button
                          onClick={() => {
                            try {
                              const filename = existingDocumentPath?.includes('/') ? existingDocumentPath.split('/').pop() : existingDocumentPath;
                              const url = `${APIURL}/uploads/${filename}`;
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
                      <span className="text-xs text-green-600 dark:text-green-400">Upload a new file to replace</span>
                    </div>
                  </div>
                )}
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
                    disabled={descWordCount > maxDescWords}
                    className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 border border-transparent rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <PencilIcon className="h-4 w-4 mr-2 inline" />
                    Update Expense
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAddExpense}
                  disabled={descWordCount > maxDescWords}
                  className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 border border-transparent rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <PlusIcon className="h-4 w-4 mr-2 inline" />
                  Add Expense
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-800 dark:via-slate-800/50 dark:to-indigo-900/30 rounded-2xl shadow-2xl border border-blue-200/50 dark:border-indigo-700/50 backdrop-blur-sm">
          <div className="px-8 py-6 border-b border-blue-200/50 dark:border-indigo-700/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-800/50 dark:to-indigo-900/50 rounded-t-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                <DocumentTextIcon className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Rent Expenses</span>
              <span className="ml-2 px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full">
                {expenses.length}
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-blue-200/50 dark:divide-indigo-700/50">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-indigo-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Final Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Document
                  </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 dark:bg-gray-800/50 divide-y divide-blue-200/30 dark:divide-indigo-700/30">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-slate-700/50 dark:hover:to-indigo-900/30 transition-all duration-200 transform hover:scale-[1.01]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">
                      {expense.invoiceNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {expense.ownerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      ₹{(expense.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {formatDate(expense.paymentDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {expense.paymentMode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                      ₹{(expense.finalPayment || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {expense.documentPath ? (
                        <button
                          onClick={() => {
                            try {
                              const filename = expense.documentPath?.includes('/') ? expense.documentPath.split('/').pop() : expense.documentPath;
                              const url = `${APIURL}/uploads/${filename}`;
                              window.open(url, '_blank');
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
                          title="Edit expense"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          title="Delete expense"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium">No rent expenses found</p>
                        <p className="text-sm">Add your first rent expense to get started.</p>
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