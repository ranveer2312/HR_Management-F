'use client';

import { useState, useEffect } from 'react';
import { Plus, Download, Search,  Eye, Edit, Trash2 } from 'lucide-react';
import DataForm, { FormField } from '../components/DataForm';
import DataView, { ViewField } from '../components/DataView';
import { APIURL } from '@/constants/api';
import toast, { Toaster } from 'react-hot-toast';

interface BillingItem {
  id: number;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
}

// Type-safe wrapper for DataView
function BillingDataView({ isOpen, onClose, data, fields, title }: {
  isOpen: boolean;
  onClose: () => void;
  data: BillingItem;
  fields: ViewField[];
  title: string;
}) {
  const viewData = {
    ...data,
    id: data.id.toString(),
    amount: data.amount.toString(),
    status: data.status
  };

  return (
    <DataView
      isOpen={isOpen}
      onClose={onClose}
      data={viewData}
      fields={fields}
      title={title}
    />
  );
}

const formFields: FormField[] = [
  { name: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true },
  { name: 'clientName', label: 'Client', type: 'text', required: true },
  { name: 'amount', label: 'Amount', type: 'number', required: true },
  { name: 'date', label: 'Due Date', type: 'date', required: true },
  { name: 'status', label: 'Status', type: 'select', options: ['paid', 'pending', 'overdue'], required: true },
  { name: 'description', label: 'Type', type: 'text', required: true }
];

const viewFields: ViewField[] = [
  { name: 'invoiceNumber', label: 'Invoice Number', type: 'text' },
  { name: 'clientName', label: 'Client', type: 'text' },
  { name: 'amount', label: 'Amount', type: 'currency' },
  { name: 'date', label: 'Due Date', type: 'date' },
  { name: 'status', label: 'Status', type: 'status' },
  { name: 'description', label: 'Type', type: 'text' }
];

const API_BASE_URL = APIURL + '/api/billings';

export default function BillingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BillingItem | null>(null);
  const [data, setData] = useState<BillingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- API Functions ---

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const fetchedRawData: Record<string, unknown>[] = await response.json();
  
      const processedData: BillingItem[] = fetchedRawData.map(rawItem => ({
        id: Number(rawItem.id) || 0,
        invoiceNumber: String(rawItem.invoiceNumber || ''),
        clientName: String(rawItem.client || ''),
        amount: Number(rawItem.amount) || 0,
        date: Array.isArray(rawItem.dueDate)
          ? `${rawItem.dueDate[0]}-${String(rawItem.dueDate[1]).padStart(2, '0')}-${String(rawItem.dueDate[2]).padStart(2, '0')}`
          : String(rawItem.dueDate || ''),
        status: (rawItem.status as BillingItem['status']) || 'pending',
        description: String(rawItem.type || '')
      }));
  
      setData(processedData);
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const createItem = async (formData: Omit<BillingItem, 'id'>) => {
    setError(null);
    try {
      const payloadToSend = {
        invoiceNumber: formData.invoiceNumber,
        client: formData.clientName,
        amount: formData.amount,
        dueDate: formData.date,
        type: formData.description,
        status: formData.status
      };
  
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadToSend),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchData(); // Refresh the data after creating
      toast.success('Billing item created successfully');
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const updateItem = async (id: number, formData: Omit<BillingItem, 'id'>) => {
    setError(null);
    try {
      const payloadToSend = {
        invoiceNumber: formData.invoiceNumber,
        client: formData.clientName,
        amount: formData.amount,
        dueDate: formData.date,
        type: formData.description,
        status: formData.status
      };

      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadToSend),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchData(); // Refresh the data after updating
      toast.success('Billing item updated successfully');
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const deleteItem = async (id: number) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchData(); // Refresh the data after deleting
      toast.success('Billing item deleted successfully');
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // --- useEffect to fetch data on component mount ---
  useEffect(() => {
    fetchData();
  }, []);

  const handleAddNew = () => {
    setSelectedItem(null);
    setIsFormOpen(true);
  };

  const handleView = (item: BillingItem) => {
    setSelectedItem(item);
    setIsViewOpen(true);
  };

  const handleEdit = (item: BillingItem) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await deleteItem(id);
    }
  };

  const handleFormSubmit = async (formData: Omit<BillingItem, 'id'>) => {
    if (selectedItem) {
      await updateItem(selectedItem.id, formData);
    } else {
      await createItem(formData);
    }
    setIsFormOpen(false);
    setSelectedItem(null);
  };

  const filteredData = data.filter(item => {
    const matchesSearch =
      item.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Invoice Number,Client,Amount,Due Date,Type,Status\n"
      + data.map(item => [
        item.invoiceNumber,
        item.clientName,
        item.amount,
        item.date,
        item.description,
        item.status
      ].join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "billing_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: BillingItem['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <Toaster position="top-right" />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Billing Management</h2>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={handleAddNew}
            className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="text-sm sm:text-base">Add New</span>
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex-1 sm:flex-none"
          >
            <Download className="h-4 w-4 mr-2" />
            <span className="text-sm sm:text-base">Export</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by invoice number, client, or type..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="relative">
         
          {showFilter && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1">
                <button
                  onClick={() => {
                    setSelectedStatus('all');
                    setShowFilter(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    selectedStatus === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => {
                    setSelectedStatus('paid');
                    setShowFilter(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    selectedStatus === 'paid' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  }`}
                >
                  Paid
                </button>
                <button
                  onClick={() => {
                    setSelectedStatus('pending');
                    setShowFilter(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    selectedStatus === 'pending' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => {
                    setSelectedStatus('overdue');
                    setShowFilter(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    selectedStatus === 'overdue' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  }`}
                >
                  Overdue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-600">Loading billing data...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">Error: {error}</div>
      ) : (
        <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Invoice Number
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Client
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Amount
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Due Date
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Type
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {item.invoiceNumber}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {item.clientName}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {typeof item.amount === 'number' 
                        ? `$${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '$0.00'}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {item.description}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-1 sm:space-x-2">
                        <button onClick={() => handleView(item)} className="text-blue-600 hover:text-blue-900 p-1">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleEdit(item)} className="text-yellow-600 hover:text-yellow-900 p-1">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900 p-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredData.length === 0 && !isLoading && !error && (
            <p className="text-center py-8 text-gray-500">No billing items found.</p>
          )}
        </div>
      )}

      <DataForm<BillingItem>
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedItem(null);
        }}
        onSubmit={handleFormSubmit}
        title={selectedItem ? 'Edit Billing Item' : 'Add Billing Item'}
        fields={formFields}
        initialData={selectedItem ? {
          ...selectedItem,
          // Ensure initialData matches form field names if different from BillingItem
          clientName: selectedItem.clientName,
          date: selectedItem.date,
          description: selectedItem.description
        } : undefined}
      />

      {isViewOpen && selectedItem && (
        <BillingDataView
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          data={selectedItem}
          fields={viewFields}
          title="Billing Details"
        />
      )}
    </div>
  );
}