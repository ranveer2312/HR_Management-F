'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusCircleIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import BackButton from '@/components/BackButton';
import DocumentUpload from '@/components/DocumentUpload';
import { APIURL } from '@/constants/api';
import toast, { Toaster } from 'react-hot-toast';

interface IncentiveExpense {
  id?: number;
  fixedTarget: number;
  achieved: number;
  recipient: string;
  date: string;
  pending: number;
  payment: number;
  payment_mode: 'UPI' | 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE';
  remarks: string;
  documentPath?: string;
}

export default function IncentivesPage() {
  const [expenses, setExpenses] = useState<IncentiveExpense[]>([]);
  const [newExpense, setNewExpense] = useState({
    fixedTarget: '',
    achieved: '',
    recipient: '',
    date: '',
    pending: '',
    payment: '',
    payment_mode: 'CASH' as 'UPI' | 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE',
    remarks: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingDocumentPath, setExistingDocumentPath] = useState<string | null>(null);

  const BASE_URL = APIURL + '/api/incentives/incentive';

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch(BASE_URL);
      const data = await res.json();
      if (Array.isArray(data.items)) {
        setExpenses(data.items);
      } else {
        setExpenses([]);
      }
    } catch {
      setExpenses([]);
    }
  }, [BASE_URL]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewExpense({ ...newExpense, [name]: value });
  };

  const handleAddExpense = async () => {
    if (!newExpense.fixedTarget || !newExpense.achieved || !newExpense.recipient || !newExpense.date || !newExpense.pending || !newExpense.payment || !newExpense.payment_mode) {
      toast.error('Please fill out all fields before submitting.');
      return;
    }
    const expenseToAdd = {
      fixedTarget: parseFloat(newExpense.fixedTarget),
      achieved: parseFloat(newExpense.achieved),
      recipient: newExpense.recipient,
      date: newExpense.date,
      pending: parseFloat(newExpense.pending),
      payment: parseFloat(newExpense.payment),
      payment_mode: newExpense.payment_mode,
      remarks: newExpense.remarks,
    };
    try {
      let url = BASE_URL;
      let body: FormData | string;
      let headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('incentiveData', JSON.stringify(expenseToAdd));
        body = formData;
        headers = {};
        url = BASE_URL + '/upload';
      } else {
        body = JSON.stringify(expenseToAdd);
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });
      if (res.ok) {
        fetchExpenses();
        setNewExpense({ fixedTarget: '', achieved: '', recipient: '', date: '', pending: '', payment: '', payment_mode: 'CASH', remarks: '' });
        setSelectedFile(null);
        toast.success('Incentive added successfully!');
      } else {
        await res.json().catch(() => ({}));
        toast.error('Failed to add incentive. Status: ' + res.status);
      }
    } catch {
      toast.error('Network or server error.');
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) fetchExpenses();
      toast.success('Incentive deleted successfully!');
    } catch {
      console.error('Error deleting expense');
    }
  };

  const handleEditClick = (expense: IncentiveExpense) => {
    setEditingId(expense.id || 0);
    
    const formatDateForInput = (dateStr: string) => {
      if (!dateStr) return '';
      try {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return dateStr;
        }
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
      achieved: expense.achieved.toString(),
      recipient: expense.recipient,
      date: formatDateForInput(expense.date),
      pending: expense.pending.toString(),
      payment: expense.payment.toString(),
      payment_mode: expense.payment_mode,
      remarks: expense.remarks,
    });
    setSelectedFile(null);
    setExistingDocumentPath(expense.documentPath || null);
  };

  const handleUpdateExpense = async () => {
    if (!newExpense.fixedTarget || !newExpense.achieved || !newExpense.recipient || !newExpense.date || !newExpense.pending || !newExpense.payment || !newExpense.payment_mode || editingId === null) return;
    
    // Get current expense to preserve document path
    const currentExpense = expenses.find(e => e.id === editingId);
    
    const updatedExpense = {
      fixedTarget: parseFloat(newExpense.fixedTarget),
      achieved: parseFloat(newExpense.achieved),
      recipient: newExpense.recipient,
      date: newExpense.date,
      pending: parseFloat(newExpense.pending),
      payment: parseFloat(newExpense.payment),
      payment_mode: newExpense.payment_mode,
      remarks: newExpense.remarks,
      // Preserve existing document path if no new file
      documentPath: selectedFile ? undefined : (currentExpense?.documentPath || '')
    };
    try {
      let url = `${BASE_URL}/${editingId}`;
      let body: FormData | string;
      let headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('incentiveData', JSON.stringify(updatedExpense));
        body = formData;
        headers = {};
        url = `${BASE_URL}/upload/${editingId}`;
      } else {
        body = JSON.stringify(updatedExpense);
      }
      
      const res = await fetch(url, {
        method: selectedFile ? 'POST' : 'PUT',
        headers,
        body,
      });
      
      if (res.ok) {
        fetchExpenses();
        setNewExpense({ fixedTarget: '', achieved: '', recipient: '', date: '', pending: '', payment: '', payment_mode: 'CASH', remarks: '' });
        setSelectedFile(null);
        setExistingDocumentPath(null);
        setEditingId(null);
        toast.success('Incentive updated successfully!');
      } else {
        await res.text();
        toast.error(`Failed to update incentive: ${res.status}`);
      }
    } catch {
      toast.error('Error updating expense');
    }
  };

  const handleCancelEdit = () => {
    setNewExpense({ fixedTarget: '', achieved: '', recipient: '', date: '', pending: '', payment: '', payment_mode: 'CASH', remarks: '' });
    setSelectedFile(null);
    setExistingDocumentPath(null);
    setEditingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toaster position="top-right" />
      <BackButton href="/finance-manager/variable-expenses" label="Back to Dashboard" />
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Incentives Expenses</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          {editingId ? 'Edit Incentive Entry' : 'Add New Incentive Entry'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input type="number" name="fixedTarget" value={newExpense.fixedTarget} placeholder="Fixed Target" onChange={handleInputChange} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
          <input type="number" name="achieved" value={newExpense.achieved} placeholder="Achieved" onChange={handleInputChange} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
          <input type="text" name="recipient" value={newExpense.recipient} placeholder="Recipient" onChange={handleInputChange} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
          <input type="date" name="date" value={newExpense.date} onChange={handleInputChange} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
          <input type="number" name="pending" value={newExpense.pending} placeholder="Pending" onChange={handleInputChange} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
          <input type="number" name="payment" value={newExpense.payment} placeholder="Payment" onChange={handleInputChange} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
          <select name="payment_mode" value={newExpense.payment_mode} onChange={handleInputChange} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
            <option value="CASH">CASH</option>
            <option value="UPI">UPI</option>
            <option value="BANK_TRANSFER">BANK_TRANSFER</option>
            <option value="CHEQUE">CHEQUE</option>
            <option value="CARD">CARD</option>
          </select>
          <input type="text" name="remarks" value={newExpense.remarks} placeholder="Remarks" onChange={handleInputChange} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
        </div>
        
        <div className="mb-4">
          <DocumentUpload
            selectedFile={selectedFile}
            onFileChange={setSelectedFile}
            label="Upload Supporting Document"
            required={false}
          />
          {editingId && existingDocumentPath && !selectedFile && (
            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Current document: <span className="font-medium">{existingDocumentPath.split('/').pop()}</span>
                </span>
                <button
                  onClick={() => {
                    try {
                      let url;
                      if (existingDocumentPath.startsWith('http')) {
                        url = existingDocumentPath;
                      } else {
                        const filename = existingDocumentPath.includes('/') ? existingDocumentPath.split('/').pop() : existingDocumentPath;
                        if (!filename) {
                          toast.error('Invalid document path');
                          return;
                        }
                        url = `${APIURL}/files/${encodeURIComponent(filename)}`;
                      }
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
            </div>
          )}
        </div>
        
        <div className="flex space-x-4">
          {editingId ? (
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
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Incentive List</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fixed Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Achieved</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Recipient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pending</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Remarks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Document</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No incentive expenses found. Add your first expense above.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{expense.fixedTarget}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{expense.achieved}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{expense.recipient}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {(() => {
                        if (!expense.date) return 'N/A';
                        // If already in YYYY-MM-DD format, return as is
                        if (typeof expense.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(expense.date)) {
                          return expense.date;
                        }
                        // Handle other formats
                        try {
                          const date = new Date(expense.date);
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          return `${year}-${month}-${day}`;
                        } catch {
                          return String(expense.date);
                        }
                      })()
                    }</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{expense.pending}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{expense.payment}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{expense.payment_mode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{expense.remarks}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {expense.documentPath ? (
                        <button
                          onClick={() => {
                            try {
                              let url;
                              if (!expense.documentPath) {
                                toast.error('No document path found');
                                return;
                              }
                              if (expense.documentPath.startsWith('http')) {
                                url = expense.documentPath;
                              } else {
                                const filename = expense.documentPath.includes('/') ? expense.documentPath.split('/').pop() : expense.documentPath;
                                if (!filename) {
                                  toast.error('Invalid document path');
                                  return;
                                }
                                url = `${APIURL}/files/${encodeURIComponent(filename)}`;
                              }
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      <button onClick={() => handleEditClick(expense)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-600 mr-4">
                        <PencilSquareIcon className="h-5 w-5 inline" /> Edit
                      </button>
                      <button onClick={() => handleDeleteExpense(expense.id!)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600">
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