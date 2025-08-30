'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus,  Download, Search, Eye, Edit, Trash2 } from 'lucide-react';
import DataForm, { FormField } from '../components/DataForm';
import DataView, { ViewField } from '../components/DataView';
import { APIURL } from '@/constants/api';
import toast, { Toaster } from 'react-hot-toast';

interface Sale {
  id: number;
  customer: string;
  amount: number;
  date: string;
  status: 'Pending' | 'Completed' | 'Cancelled' | 'In Progress';
  paymentStatus: 'Paid' | 'Pending' | 'Overdue' | 'Partially Paid';
  paymentMethod: 'Bank Transfer' | 'Credit Card' | 'Cash' | 'Check' | 'Wire Transfer';
}

const formFields: FormField[] = [
  { name: 'customer', label: 'Customer', type: 'text', required: true },
  { name: 'amount', label: 'Amount', type: 'number', required: true },
  { name: 'date', label: 'Sale Date', type: 'date', required: true },
  { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Completed', 'Cancelled', 'In Progress'], required: true },
  { name: 'paymentStatus', label: 'Payment Status', type: 'select', options: ['Paid', 'Pending', 'Overdue', 'Partially Paid'], required: true },
  { name: 'paymentMethod', label: 'Payment Method', type: 'select', options: ['Bank Transfer', 'Credit Card', 'Cash', 'Check', 'Wire Transfer'], required: true }
];

const viewFields: ViewField[] = [
  { name: 'customer', label: 'Customer', type: 'text' },
  { name: 'amount', label: 'Amount', type: 'currency' },
  { name: 'date', label: 'Sale Date', type: 'date' },
  { name: 'status', label: 'Status', type: 'status' },
  { name: 'paymentStatus', label: 'Payment Status', type: 'status' },
  { name: 'paymentMethod', label: 'Payment Method', type: 'text' }
];

export default function SalesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [data, setData] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = APIURL +'/api/sales';

  // --- Data Fetching (GET) ---
  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      const mapped = result.map((item: Sale) => ({
        ...item,
        date: Array.isArray(item.date)
          ? `${item.date[0]}-${String(item.date[1]).padStart(2, '0')}-${String(item.date[2]).padStart(2, '0')}`
          : item.date
      }));
      setData(mapped);
    } catch (e: unknown) {
      setError(`Failed to fetch sales: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleAddNew = () => {
    setSelectedSale(null);
    setIsFormOpen(true);
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Customer,Amount,Date,Status,Payment Status,Payment Method\n"
      + data.map(item => [
        item.customer,
        item.amount,
        item.date,
        item.status,
        item.paymentStatus,
        item.paymentMethod
      ].join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sales.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (item: Sale) => {
    setSelectedSale(item);
    setIsViewOpen(true);
  };

  const handleEdit = (item: Sale) => {
    setSelectedSale(item);
    setIsFormOpen(true);
  };

  // --- Data Deletion (DELETE) ---
  const handleDelete = async (item: Sale) => {
    if (confirm(`Are you sure you want to delete sale for ${item.customer}?`)) {
      try {
        const response = await fetch(`${API_URL}/${item.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        setData(prev => prev.filter(i => i.id !== item.id));
        toast.success('Sale deleted successfully!');
      } catch (e: unknown) {
        toast.error(`Failed to delete sale: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }
  };

  // --- Form Submission (POST/PUT) ---
  const handleFormSubmit = async (formData: Omit<Sale, 'id'>) => {
    try {
      if (selectedSale) {
        // Edit existing item (PUT)
        const response = await fetch(`${API_URL}/${selectedSale.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const updatedSale = await response.json();
        setData(prev => prev.map(item =>
          item.id === selectedSale.id ? updatedSale : item
        ));
        toast.success('Sale updated successfully!');
      } else {
        // Add new item (POST)
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const newSale = await response.json();
        setData(prev => [...prev, newSale]);
        toast.success('Sale added successfully!');
      }
      setIsFormOpen(false);
      setSelectedSale(null);
    } catch (e: unknown) {
      toast.error(`Failed to save sale: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const filteredData = data.filter(item =>
    (item.customer?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item.paymentMethod?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item.status?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item.paymentStatus?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <Toaster position="top-right" />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Sales</h2>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={handleAddNew}
            className="flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="text-sm sm:text-base">Add New</span>
          </button>
         
          <button
            onClick={handleExport}
            className="flex items-center justify-center px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex-1 sm:flex-none"
          >
            <Download className="w-4 h-4 mr-2" />
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
            placeholder="Search by customer, payment method, status, or payment status..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
       
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading sales...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">{error}</div>
      ) : (
        <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Customer</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Amount</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Payment Status</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Payment Method</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 sm:px-4 lg:px-6 py-4 text-center text-gray-500">No sales found.</td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{item.customer}</td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">${item.amount.toFixed(2)}</td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          item.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                          item.paymentStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          item.paymentStatus === 'Overdue' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {item.paymentStatus}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{item.paymentMethod}</td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1 sm:space-x-2">
                          <button onClick={() => handleView(item)} className="text-blue-600 hover:text-blue-900 p-1">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(item)} className="text-green-600 hover:text-green-900 p-1">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item)} className="text-red-600 hover:text-red-900 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DataForm<Sale>
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedSale(null);
        }}
        onSubmit={handleFormSubmit}
        title={selectedSale ? 'Edit Sale' : 'Add Sale'}
        fields={formFields}
        initialData={selectedSale}
      />

      {isViewOpen && selectedSale && (
        <DataView
          isOpen={isViewOpen}
          onClose={() => {
            setIsViewOpen(false);
            setSelectedSale(null);
          }}
          data={selectedSale}
          fields={viewFields}
          title="Sale Details"
        />
      )}
    </div>
  );
} 