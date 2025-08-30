'use client';

import { useEffect, useState } from 'react';
import { PlusCircleIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import BackButton from '@/components/BackButton';
import DocumentUpload from '@/components/DocumentUpload';
import { APIURL } from '@/constants/api';
import toast, { Toaster } from 'react-hot-toast';

interface TravelExpense {
  id: number;
  vendor: string;
  fromDate: number[] | string; // Backend returns LocalDate as array [year, month, day]
  toDate: number[] | string; // Backend returns LocalDate as array [year, month, day]
  noOfDays: number;
  advancePay: number;
  paymentMode: 'UPI' | 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'CARD';
  paymentDate: number[] | string; // Backend returns LocalDate as array [year, month, day]
  remarks: string;
  documentPath?: string; // Add document path field
}

const API_URL = APIURL +'/api/travel';

const travelAPI = {
  getAll: async (): Promise<TravelExpense[]> => {
    console.log('Fetching from:', API_URL);
    const res = await fetch(API_URL);
    if (!res.ok) {
      console.error('GET request failed:', res.status, res.statusText);
      throw new Error('Failed to fetch travel expenses');
    }
    return res.json();
  },
  create: async (expense: Omit<TravelExpense, 'id'>, file?: File): Promise<TravelExpense> => {
    console.log('Sending data to backend:', expense);
    console.log('API URL:', API_URL);
    
    try {
      let url = API_URL;
      let body: FormData | string;
      let headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('travelData', JSON.stringify(expense));
        body = formData;
        headers = {}; // Let browser set Content-Type for FormData
        url = API_URL + '/upload';
      } else {
        body = JSON.stringify({
          vendor: expense.vendor,
          fromDate: expense.fromDate,
          toDate: expense.toDate,
          noOfDays: expense.noOfDays,
          advancePay: expense.advancePay,
          paymentMode: expense.paymentMode,
          paymentDate: expense.paymentDate,
          remarks: expense.remarks || ''
        });
      }
      
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });
      
      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Backend error response:', errorText);
        throw new Error(`Failed to create travel expense: ${res.status} ${res.statusText} - ${errorText}`);
      }
      
      const result = await res.json();
      console.log('Backend response:', result);
      return result;
    } catch (error) {
      console.error('Network error:', error);
      throw error;
    }
  },
  update: async (id: number, expense: Omit<TravelExpense, 'id'>, file?: File): Promise<TravelExpense> => {
    let url = `${API_URL}/${id}`;
    let body: FormData | string;
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('travelData', JSON.stringify(expense));
      body = formData;
      headers = {};
      url = `${API_URL}/upload/${id}`;
    } else {
      body = JSON.stringify({
        vendor: expense.vendor,
        fromDate: expense.fromDate,
        toDate: expense.toDate,
        noOfDays: expense.noOfDays,
        advancePay: expense.advancePay,
        paymentMode: expense.paymentMode,
        paymentDate: expense.paymentDate,
        remarks: expense.remarks || ''
      });
    }

    const res = await fetch(url, {
      method: file ? 'POST' : 'PUT',
      headers,
      body,
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Backend error response:', errorText);
      throw new Error(`Failed to update travel expense: ${res.status} ${res.statusText}`);
    }
    return res.json();
  },
  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete travel expense');
  },
};

export default function TravelPage() {
  const [expenses, setExpenses] = useState<TravelExpense[]>([]);
  const [newExpense, setNewExpense] = useState({ 
    vendor: '', 
    fromDate: '', 
    toDate: '', 
    noOfDays: '', 
    advancePay: '', 
    paymentMode: 'CASH' as 'UPI' | 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'CARD', 
    paymentDate: '', 
    remarks: '' 
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        console.log('Fetching travel expenses...');
        
        const data = await travelAPI.getAll();
        console.log('Fetched expenses:', data);
        setExpenses(data || []);
      } catch (err) {
        console.error('Error fetching expenses:', err);
        toast.error('Failed to fetch travel expenses');
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewExpense({ ...newExpense, [name]: value });
  };

  const handleAddExpense = async () => {
    if (!newExpense.vendor || !newExpense.fromDate || !newExpense.toDate || !newExpense.noOfDays || !newExpense.advancePay || !newExpense.paymentDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const expenseData = {
        vendor: newExpense.vendor,
        fromDate: newExpense.fromDate,
        toDate: newExpense.toDate,
        noOfDays: parseInt(newExpense.noOfDays),
        advancePay: parseFloat(newExpense.advancePay),
        paymentMode: newExpense.paymentMode,
        paymentDate: newExpense.paymentDate,
        remarks: newExpense.remarks,
      };
      
      let url = APIURL + '/api/travel';
      let body: FormData | string;
      let headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('travelData', JSON.stringify(expenseData));
        body = formData;
        headers = {};
        url = APIURL + '/api/travel/upload';
      } else {
        body = JSON.stringify(expenseData);
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });
      if (!res.ok) throw new Error('Failed to add travel expense');
      const added = await res.json();
      setExpenses([...expenses, added]);
      setNewExpense({ 
        vendor: '', 
        fromDate: '', 
        toDate: '', 
        noOfDays: '', 
        advancePay: '', 
        paymentMode: 'CASH', 
        paymentDate: '', 
        remarks: '' 
      });
      setSelectedFile(null);
      setExistingFileName('');
      toast.success('Travel expense added successfully');
    } catch (err) {
      console.error('Add failed:', err);
      toast.error(`Failed to add travel expense: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await travelAPI.delete(id);
      setExpenses(expenses.filter(expense => expense.id !== id));
      toast.success('Travel expense deleted successfully');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete travel expense');
    }
  };

  const handleEditClick = (expense: TravelExpense) => {
    setEditingId(expense.id);
    
    // Format dates for input fields (YYYY-MM-DD)
    const formatDateForInput = (dateValue: number[] | string) => {
      if (!dateValue) return '';
      try {
        // Handle array format [year, month, day]
        if (Array.isArray(dateValue) && dateValue.length === 3) {
          const [year, month, day] = dateValue;
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        // Handle string format
        if (typeof dateValue === 'string') {
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            return dateValue;
          }
          const date = new Date(dateValue);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      } catch {
        return '';
      }
      return '';
    };
    
    setNewExpense({
      vendor: expense.vendor,
      fromDate: formatDateForInput(expense.fromDate),
      toDate: formatDateForInput(expense.toDate),
      noOfDays: expense.noOfDays.toString(),
      advancePay: expense.advancePay.toString(),
      paymentMode: expense.paymentMode,
      paymentDate: formatDateForInput(expense.paymentDate),
      remarks: expense.remarks,
    });
    
    // Extract filename from document path and decode URL encoding
    const getFileNameFromPath = (path: string) => {
      if (!path) return '';
      const parts = path.split('/');
      const filename = parts[parts.length - 1] || '';
      return decodeURIComponent(filename);
    };
    
    setExistingFileName(getFileNameFromPath(expense.documentPath || ''));
    setSelectedFile(null); // Reset file selection when editing
  };

  const handleUpdateExpense = async () => {
    if (!newExpense.vendor || !newExpense.fromDate || !newExpense.toDate || !newExpense.noOfDays || !newExpense.advancePay || !newExpense.paymentDate || editingId === null) return;
    try {
      // Get current expense to preserve document path
      const currentExpense = expenses.find(e => e.id === editingId);
      
      const expenseData = {
        vendor: newExpense.vendor,
        fromDate: newExpense.fromDate,
        toDate: newExpense.toDate,
        noOfDays: parseInt(newExpense.noOfDays),
        advancePay: parseFloat(newExpense.advancePay),
        paymentMode: newExpense.paymentMode,
        paymentDate: newExpense.paymentDate,
        remarks: newExpense.remarks,
        // Preserve existing document path if no new file
        documentPath: selectedFile ? undefined : (currentExpense?.documentPath || '')
      };
      let url = APIURL + `/api/travel/${editingId}`;
      let body: FormData | string;
      let headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('travelData', JSON.stringify(expenseData));
        body = formData;
        headers = {};
        url = APIURL + `/api/travel/upload/${editingId}`;
      } else {
        body = JSON.stringify(expenseData);
      }
      const res = await fetch(url, {
        method: selectedFile ? 'POST' : 'PUT',
        headers,
        body,
      });
      if (!res.ok) throw new Error('Failed to update travel expense');
      const updated = await res.json();
      setExpenses(expenses.map(exp => (exp.id === editingId ? updated : exp)));
      setNewExpense({ 
        vendor: '', 
        fromDate: '', 
        toDate: '', 
        noOfDays: '', 
        advancePay: '', 
        paymentMode: 'CASH', 
        paymentDate: '', 
        remarks: '' 
      });
      setSelectedFile(null);
      setExistingFileName('');
      setEditingId(null);
      toast.success('Travel expense updated successfully');
    } catch (err) {
      console.error('Update failed:', err);
      toast.error('Failed to update travel expense');
    }
  };

  const handleCancelEdit = () => {
    setNewExpense({ 
      vendor: '', 
      fromDate: '', 
      toDate: '', 
      noOfDays: '', 
      advancePay: '', 
      paymentMode: 'CASH', 
      paymentDate: '', 
      remarks: '' 
    });
    setSelectedFile(null);
    setExistingFileName('');
    setEditingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toaster position="top-right" />
      <BackButton href="/finance-manager/variable-expenses" label="Back to Dashboard" />

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Travel Expenses</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          {editingId ? 'Edit Travel Expense' : 'Add New Travel Expense'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            name="vendor"
            placeholder="Vendor"
            value={newExpense.vendor}
            onChange={handleInputChange}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          />
          <input
            type="date"
            name="fromDate"
            placeholder="From Date"
            value={newExpense.fromDate}
            onChange={handleInputChange}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          />
          <input
            type="date"
            name="toDate"
            placeholder="To Date"
            value={newExpense.toDate}
            onChange={handleInputChange}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          />
          <input
            type="number"
            name="noOfDays"
            placeholder="No. of Days"
            value={newExpense.noOfDays}
            onChange={handleInputChange}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          />
          <input
            type="number"
            name="advancePay"
            placeholder="Advance Payment"
            value={newExpense.advancePay}
            onChange={handleInputChange}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          />
          <select
            name="paymentMode"
            value={newExpense.paymentMode}
            onChange={handleInputChange}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          >
            <option value="CASH">CASH</option>
            <option value="UPI">UPI</option>
            <option value="BANK_TRANSFER">BANK TRANSFER</option>
            <option value="CHEQUE">CHEQUE</option>
            <option value="CARD">CARD</option>
          </select>
          <input
            type="date"
            name="paymentDate"
            placeholder="Payment Date"
            value={newExpense.paymentDate}
            onChange={handleInputChange}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          />
          <input
            type="text"
            name="remarks"
            placeholder="Remarks"
            value={newExpense.remarks}
            onChange={handleInputChange}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        {/* Document Upload */}
        <div className="mb-4">
          <DocumentUpload
            selectedFile={selectedFile}
            onFileChange={setSelectedFile}
            label="Upload Supporting Document"
            required={false}
          />
          {editingId && existingFileName && !selectedFile && (
            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Current file: <span className="font-medium">{existingFileName}</span>
              </span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-4">
          {editingId ? (
            <>
              <button
                onClick={handleUpdateExpense}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <PencilSquareIcon className="h-5 w-5 mr-2" /> Update Expense
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleAddExpense}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" /> Add Expense
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Travel Expense List</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">From Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">To Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Advance Pay</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Remarks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Document</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Loading travel expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No travel expenses found. Add your first expense above.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {expense.vendor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {(() => {
                      if (!expense.fromDate) return 'N/A';
                      if (Array.isArray(expense.fromDate) && expense.fromDate.length === 3) {
                        const [year, month, day] = expense.fromDate;
                        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      }
                      return String(expense.fromDate);
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {(() => {
                      if (!expense.toDate) return 'N/A';
                      if (Array.isArray(expense.toDate) && expense.toDate.length === 3) {
                        const [year, month, day] = expense.toDate;
                        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      }
                      return String(expense.toDate);
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {expense.noOfDays}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {expense.advancePay.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {expense.paymentMode.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {(() => {
                      if (!expense.paymentDate) return 'N/A';
                      if (Array.isArray(expense.paymentDate) && expense.paymentDate.length === 3) {
                        const [year, month, day] = expense.paymentDate;
                        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      }
                      return String(expense.paymentDate);
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {expense.remarks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {expense.documentPath ? (
                      <button
                        onClick={() => {
                          try {
                            if (!expense.documentPath) {
                              toast.error('No document path found');
                              return;
                            }
                            
                            // Handle different path formats
                            let url;
                            if (expense.documentPath.startsWith('http')) {
                              url = expense.documentPath;
                            } else if (expense.documentPath.startsWith('/uploads/')) {
                              url = `${APIURL}${expense.documentPath}`;
                            } else {
                              const filename = expense.documentPath.includes('/') ? expense.documentPath.split('/').pop() : expense.documentPath;
                              if (!filename) {
                                toast.error('Invalid document path');
                                return;
                              }
                              url = `${APIURL}/files/${encodeURIComponent(filename)}`;
                            }
                            
                            window.open(url, '_blank');
                          } catch (error) {
                            console.error('Error opening document:', error);
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    <button onClick={() => handleEditClick(expense)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-600 mr-4">
                      <PencilSquareIcon className="h-5 w-5 inline" /> Edit
                    </button>
                    <button onClick={() => handleDeleteExpense(expense.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600">
                      <TrashIcon className="h-5 w-5 inline" /> Delete
                    </button>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
