'use client';

import { useState, useEffect } from 'react';
import { PlusCircleIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import BackButton from '@/components/BackButton';
import { APIURL } from '@/constants/api';
import toast, { Toaster } from 'react-hot-toast';
import DocumentUpload from '@/components/DocumentUpload';

interface CommissionExpense {
  id: number;
  fixedTarget: number;
  recipient: string;
  achieved: number;
  pending: number;
  payment: number;
  paymentMode: 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CARD' | 'CHEQUE';
  remarks: string;
  date: string;
  documentPath?: string;
}

export default function CommissionsPage() {
  const [expenses, setExpenses] = useState<CommissionExpense[]>([]);
  const [newExpense, setNewExpense] = useState({
    fixedTarget: '',
    recipient: '',
    achieved: '',
    pending: '',
    payment: '',
    payment_mode: 'CASH' as 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CARD' | 'CHEQUE',
    remarks: '',
    date: ''
  });
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState<string>('');

  const BASE_URL = APIURL + '/api/commissions';

  useEffect(() => {
    fetch(BASE_URL)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => setExpenses(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Fetch error:', err);
        setExpenses([]);
        toast.error('Failed to load expenses: ' + (err instanceof Error ? err.message : 'Unknown error'));
      });
  }, [BASE_URL]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewExpense({ ...newExpense, [name]: value });
  };

  const handleAddExpense = async () => {
    if (!newExpense.fixedTarget || !newExpense.recipient || !newExpense.achieved || !newExpense.pending || !newExpense.payment || !newExpense.payment_mode || !newExpense.date) {
      toast.error('Please fill all required fields');
      return;
    }
    
    try {
      const expenseToAdd = {
        fixedTarget: parseFloat(newExpense.fixedTarget),
        recipient: newExpense.recipient,
        achieved: parseFloat(newExpense.achieved),
        pending: parseFloat(newExpense.pending),
        payment: parseFloat(newExpense.payment),
        paymentMode: newExpense.payment_mode,
        remarks: newExpense.remarks,
        date: newExpense.date
      };
      
      let url = BASE_URL;
      let body: FormData | string;
      let headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('commissionData', JSON.stringify(expenseToAdd));
        body = formData;
        headers = {};
        url = BASE_URL + '/upload';
      } else {
        body = JSON.stringify(expenseToAdd);
      }
      
      console.log('Sending request to:', url);
      console.log('Request body:', body);
      console.log('Request headers:', headers);
      
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });
      
      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);
      
      if (res.ok) {
        const saved = await res.json();
        setExpenses([...expenses, saved]);
        setNewExpense({ fixedTarget: '', recipient: '', achieved: '', pending: '', payment: '', payment_mode: 'CASH', remarks: '', date: '' });
        setSelectedFile(null);
        toast.success('Expense added successfully');
      } else {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        toast.error(`Error ${res.status}: ${errorText || 'Failed to add expense'}`);
      }
    } catch (error) {
      console.error('Add error:', error);
      toast.error('Failed to add expense');
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
      setExpenses(expenses.filter(e => e.id !== id));
      toast.success('Expense deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete expense');
    }
  };

  const handleEditClick = (expense: CommissionExpense) => {
    setEditingIdx(expense.id);
    
    // Format date for input field (YYYY-MM-DD)
    const formatDateForInput = (dateStr: string) => {
      if (!dateStr) return '';
      try {
        // If already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return dateStr;
        }
        // Handle other date formats
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch {
        return '';
      }
    };
    
    setNewExpense({
      fixedTarget: expense.fixedTarget.toString(),
      recipient: expense.recipient,
      achieved: expense.achieved.toString(),
      pending: expense.pending.toString(),
      payment: expense.payment.toString(),
      payment_mode: expense.paymentMode,
      remarks: expense.remarks,
      date: formatDateForInput(expense.date)
    });
    setSelectedFile(null);
    
    // Extract and decode filename from document path
    const getFileNameFromPath = (path: string) => {
      if (!path) return '';
      const parts = path.split('/');
      const filename = parts[parts.length - 1] || '';
      return decodeURIComponent(filename);
    };
    
    setExistingFileName(getFileNameFromPath(expense.documentPath || ''));
  };

  const handleUpdateExpense = async () => {
    if (editingIdx === null) return;
    
    try {
      // Get the current expense to preserve existing document path
      const currentExpense = expenses.find(e => e.id === editingIdx);
      
      const updatedExpense = {
        fixedTarget: parseFloat(newExpense.fixedTarget),
        recipient: newExpense.recipient,
        achieved: parseFloat(newExpense.achieved),
        pending: parseFloat(newExpense.pending),
        payment: parseFloat(newExpense.payment),
        paymentMode: newExpense.payment_mode,
        remarks: newExpense.remarks,
        date: newExpense.date,
        // Preserve existing document path if no new file is uploaded
        documentPath: selectedFile ? undefined : (currentExpense?.documentPath || '')
      };
      
      let url = `${BASE_URL}/${editingIdx}`;
      let body: FormData | string;
      let headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('commissionData', JSON.stringify(updatedExpense));
        body = formData;
        headers = {};
        url = `${BASE_URL}/upload/${editingIdx}`;
      } else {
        body = JSON.stringify(updatedExpense);
      }
      
      const res = await fetch(url, {
        method: selectedFile ? 'POST' : 'PUT',
        headers,
        body,
      });
      
      if (res.ok) {
        const updated = await res.json();
        setExpenses(expenses.map(e => (e.id === editingIdx ? updated : e)));
        setEditingIdx(null);
        setNewExpense({ fixedTarget: '', recipient: '', achieved: '', pending: '', payment: '', payment_mode: 'CASH', remarks: '', date: '' });
        setSelectedFile(null);
        setExistingFileName('');
        toast.success('Expense updated successfully');
      } else {
        const errorText = await res.text();
        toast.error(errorText || 'Failed to update expense');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update expense');
    }
  };

  const handleCancelEdit = () => {
    setEditingIdx(null);
    setNewExpense({ fixedTarget: '', recipient: '', achieved: '', pending: '', payment: '', payment_mode: 'CASH', remarks: '', date: '' });
    setSelectedFile(null);
    setExistingFileName('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toaster position="top-right" />
      <BackButton href="/finance-manager/variable-expenses" label="Back to Dashboard" />
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Commissions Expenses</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">{editingIdx !== null ? 'Edit Commission Entry' : 'Add New Commission Entry'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input type="number" name="fixedTarget" placeholder="Fixed Target" value={newExpense.fixedTarget} onChange={handleInputChange} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
          <input type="text" name="recipient" placeholder="Recipient" value={newExpense.recipient} onChange={handleInputChange} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
          <input type="number" name="achieved" placeholder="Achieved" value={newExpense.achieved} onChange={handleInputChange} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
          <input type="number" name="pending" placeholder="Pending" value={newExpense.pending} onChange={handleInputChange} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
          <input type="number" name="payment" placeholder="Payment" value={newExpense.payment} onChange={handleInputChange} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
          <input type="date" name="date" placeholder="Date" value={newExpense.date} onChange={handleInputChange} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
          <select name="payment_mode" value={newExpense.payment_mode} onChange={handleInputChange} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
            <option value="CASH">CASH</option>
            <option value="UPI">UPI</option>
            <option value="BANK_TRANSFER">BANK_TRANSFER</option>
            <option value="CHEQUE">CHEQUE</option>
            <option value="CARD">CARD</option>
          </select>
          <input type="text" name="remarks" placeholder="Remarks" value={newExpense.remarks} onChange={handleInputChange} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
        </div>
        <div className="mb-4">
          <DocumentUpload
            selectedFile={selectedFile}
            onFileChange={setSelectedFile}
            label="Upload Supporting Document"
            required={false}
          />
          {editingIdx && existingFileName && !selectedFile && (
            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Current file: <span className="font-medium">{existingFileName}</span>
              </span>
            </div>
          )}
        </div>
        <div className="flex space-x-4">
          {editingIdx !== null ? (
            <>
              <button onClick={handleUpdateExpense} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <PencilSquareIcon className="h-5 w-5 mr-2" /> Update Entry
              </button>
              <button onClick={handleCancelEdit} className="flex items-center px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500">
                Cancel
              </button>
            </>
          ) : (
            <button onClick={handleAddExpense} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              <PlusCircleIcon className="h-5 w-5 mr-2" /> Add Entry
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Commission List</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fixed Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Recipient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Achieved</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pending</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Remarks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Document</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No commission expenses found. Add your first expense above.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {expense.fixedTarget}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {expense.recipient}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {expense.achieved}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {expense.pending}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {expense.payment}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {expense.paymentMode.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {expense.remarks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {(() => {
                        console.log('Document path for expense', expense.id, ':', expense.documentPath);
                        return expense.documentPath && expense.documentPath.trim() !== '' ? (
                          <button
                            onClick={() => {
                              try {
                                if (!expense.documentPath) {
                                  toast.error('No document available');
                                  return;
                                }
                                let url;
                                if (expense.documentPath.startsWith('http')) {
                                  // Full URL from backend
                                  url = expense.documentPath;
                                } else if (expense.documentPath.startsWith('/uploads/')) {
                                  // Replace /uploads/ with /files/
                                  const filename = expense.documentPath.split('/').pop();
                                  if (!filename) {
                                    toast.error('Invalid document path');
                                    return;
                                  }
                                  url = `${APIURL}/files/${encodeURIComponent(filename)}`;
                                } else {
                                  // Just filename
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
                        );
                      })()}
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