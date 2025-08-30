'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusCircleIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import BackButton from '@/components/BackButton';
import DocumentUpload from '@/components/DocumentUpload';
import { APIURL } from '@/constants/api';
import toast, { Toaster } from 'react-hot-toast';

interface PettyCashEntry {
  id: number;
  item_name: string;
  paid_to: string;
  bill_no: string;
  amount: number;
  paymentMode: 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CARD' | 'CHEQUE';
  documentpath?: string;
  payment_date: string;
  remarks: string;
}

export default function PettyCashPage() {
  const [entries, setEntries] = useState<PettyCashEntry[]>([]);
  const [newEntry, setNewEntry] = useState({
    item_name: '',
    paid_to: '',
    bill_no: '',
    amount: '',
    paymentMode: 'CASH' as 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CARD' | 'CHEQUE',
    payment_date: '',
    remarks: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingDocumentPath, setExistingDocumentPath] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const BASE_URL = APIURL + '/api/petty-cash';

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(BASE_URL);
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      } else {
        toast.error('Failed to fetch entries');
      }
    } catch (error) {
      toast.error('Error fetching entries');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [BASE_URL]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEntry({ ...newEntry, [name]: value });
  };

  const handleAddEntry = async () => {
    if (!newEntry.item_name || !newEntry.paid_to || !newEntry.bill_no || !newEntry.amount || !newEntry.payment_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const entryToAdd = {
        item_name: newEntry.item_name,
        paid_to: newEntry.paid_to,
        bill_no: newEntry.bill_no,
        amount: parseFloat(newEntry.amount),
        paymentMode: newEntry.paymentMode,
        payment_date: newEntry.payment_date,
        remarks: newEntry.remarks
      };

      let url = BASE_URL;
      let body: FormData | string;
      let headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('pettyCashData', JSON.stringify(entryToAdd));
        body = formData;
        headers = {};
        url = BASE_URL + '/upload';
      } else {
        body = JSON.stringify(entryToAdd);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });

      if (response.ok) {
        const savedEntry = await response.json();
        setEntries([...entries, savedEntry]);
        resetForm();
        toast.success('Entry added successfully');
      } else {
        const errorText = await response.text();
        toast.error(errorText || 'Failed to add entry');
      }
    } catch (error) {
      toast.error('Error adding entry');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
      
      if (response.ok) {
        setEntries(entries.filter(e => e.id !== id));
        toast.success('Entry deleted successfully');
      } else {
        toast.error('Failed to delete entry');
      }
    } catch (error) {
      toast.error('Error deleting entry');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (entry: PettyCashEntry) => {
    setEditingId(entry.id);
    
    // Format date for input field (YYYY-MM-DD)
    const formatDateForInput = (dateValue: unknown) => {
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
    
    setNewEntry({
      item_name: entry.item_name,
      paid_to: entry.paid_to,
      bill_no: entry.bill_no,
      amount: entry.amount.toString(),
      paymentMode: entry.paymentMode,
      payment_date: formatDateForInput(entry.payment_date),
      remarks: entry.remarks
    });
    setSelectedFile(null);
    setExistingDocumentPath(entry.documentpath || '');
  };

  const handleUpdateEntry = async () => {
    if (editingId === null) return;

    if (!newEntry.item_name || !newEntry.paid_to || !newEntry.bill_no || !newEntry.amount || !newEntry.payment_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      // Get current entry to preserve document path
      const currentEntry = entries.find(e => e.id === editingId);
      
      const updatedEntry = {
        item_name: newEntry.item_name,
        paid_to: newEntry.paid_to,
        bill_no: newEntry.bill_no,
        amount: parseFloat(newEntry.amount),
        paymentMode: newEntry.paymentMode,
        payment_date: newEntry.payment_date,
        remarks: newEntry.remarks,
        // Preserve existing document path if no new file
        documentpath: selectedFile ? undefined : (currentEntry?.documentpath || '')
      };

      let url = `${BASE_URL}/${editingId}`;
      let body: FormData | string;
      let headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('pettyCashData', JSON.stringify(updatedEntry));
        body = formData;
        headers = {};
        url = `${BASE_URL}/upload/${editingId}`;
      } else {
        body = JSON.stringify(updatedEntry);
      }

      const response = await fetch(url, {
        method: selectedFile ? 'POST' : 'PUT',
        headers,
        body,
      });

      if (response.ok) {
        const updated = await response.json();
        setEntries(entries.map(e => (e.id === editingId ? updated : e)));
        resetForm();
        setEditingId(null);
        toast.success('Entry updated successfully');
      } else {
        const errorText = await response.text();
        toast.error(errorText || 'Failed to update entry');
      }
    } catch (error) {
      toast.error('Error updating entry');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setNewEntry({
      item_name: '',
      paid_to: '',
      bill_no: '',
      amount: '',
      paymentMode: 'CASH',
      payment_date: '',
      remarks: ''
    });
    setSelectedFile(null);
    setExistingDocumentPath('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };



  const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toaster position="top-right" />
      <BackButton href="/finance-manager/variable-expenses" label="Back to Dashboard" />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Petty Cash Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Track and manage petty cash expenses</p>
      </div>

      {/* Summary Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Entries</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{entries.length}</p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Average Amount</h3>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {entries.length > 0 ? formatCurrency(totalAmount / entries.length) : formatCurrency(0)}
            </p>
          </div>
        </div>
      </div>

      {/* Entry Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          {editingId !== null ? 'Edit Petty Cash Entry' : 'Add New Petty Cash Entry'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="item_name"
              placeholder="Item Name"
              value={newEntry.item_name}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Paid To <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="paid_to"
              placeholder="Paid To"
              value={newEntry.paid_to}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bill Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="bill_no"
              placeholder="Bill Number"
              value={newEntry.bill_no}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              placeholder="Amount"
              value={newEntry.amount}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payment Mode <span className="text-red-500">*</span>
            </label>
            <select
              name="paymentMode"
              value={newEntry.paymentMode}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="CASH">CASH</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">BANK TRANSFER</option>
              <option value="CARD">CARD</option>
              <option value="CHEQUE">CHEQUE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="payment_date"
              value={newEntry.payment_date}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Remarks
          </label>
          <textarea
            name="remarks"
            placeholder="Additional remarks (optional)"
            value={newEntry.remarks}
            onChange={handleInputChange}
            rows={3}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="mb-4">
          <DocumentUpload
            selectedFile={selectedFile}
            onFileChange={setSelectedFile}
            label="Upload Supporting Document (Optional)"
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
          {editingId !== null ? (
            <>
              <button
                onClick={handleUpdateEntry}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PencilSquareIcon className="h-5 w-5 mr-2" />
                {loading ? 'Updating...' : 'Update Entry'}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleAddEntry}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              {loading ? 'Adding...' : 'Add Entry'}
            </button>
          )}
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Petty Cash Entries</h2>
        
        {loading && entries.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading entries...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No petty cash entries found. Add your first entry above!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Paid To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Bill No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Payment Mode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Remarks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-300">
                        {entry.item_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {entry.paid_to}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {entry.bill_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-300">
                        {formatCurrency(entry.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        entry.paymentMode === 'CASH' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        entry.paymentMode === 'UPI' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        entry.paymentMode === 'CARD' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                        entry.paymentMode === 'BANK_TRANSFER' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {entry.paymentMode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {(() => {
                        if (!entry.payment_date) return 'N/A';
                        // Handle array format [year, month, day]
                        if (Array.isArray(entry.payment_date) && entry.payment_date.length === 3) {
                          const [year, month, day] = entry.payment_date;
                          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        }
                        // Handle string format - if already YYYY-MM-DD, return as is
                        if (typeof entry.payment_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entry.payment_date)) {
                          return entry.payment_date;
                        }
                        // Handle other formats
                        try {
                          const date = new Date(entry.payment_date);
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          return `${year}-${month}-${day}`;
                        } catch {
                          return String(entry.payment_date);
                        }
                      })()
                    }</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-300 max-w-xs truncate">
                        {entry.remarks || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {entry.documentpath ? (
                        <a
                          href={entry.documentpath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                        >
                          📄 View
                        </a>
                      ) : (
                        <span className="text-gray-400">No document</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditClick(entry)}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-600 mr-4 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PencilSquareIcon className="h-5 w-5 inline" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <TrashIcon className="h-5 w-5 inline" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}