'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus,  Download, Search,  Eye, Edit, Trash2 } from 'lucide-react';
import DataForm, { FormField } from '../components/DataForm';
import DataView, { ViewField } from '../components/DataView';
import { APIURL } from '@/constants/api';
import toast, { Toaster } from 'react-hot-toast';

interface Purchase {
  id: number;
  vendor: string;
  amount: number;
  date: string;
  status: 'Pending' | 'Completed' | 'Cancelled' | 'In Progress';
  paymentStatus: 'Paid' | 'Pending' | 'Overdue' | 'Partially Paid';
  paymentMethod: 'Bank Transfer' | 'Credit Card' | 'Cash' | 'Check' | 'Wire Transfer';
}

const formFields: FormField[] = [
  { name: 'vendor', label: 'Vendor', type: 'text', required: true },
  { name: 'amount', label: 'Amount', type: 'number', required: true },
  { name: 'date', label: 'Purchase Date', type: 'date', required: true },
  { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Completed', 'Cancelled', 'In Progress'], required: true },
  { name: 'paymentStatus', label: 'Payment Status', type: 'select', options: ['Paid', 'Pending', 'Overdue', 'Partially Paid'], required: true },
  { name: 'paymentMethod', label: 'Payment Method', type: 'select', options: ['Bank Transfer', 'Credit Card', 'Cash', 'Check', 'Wire Transfer'], required: true }
];

const viewFields: ViewField[] = [
  { name: 'vendor', label: 'Vendor', type: 'text' },
  { name: 'amount', label: 'Amount', type: 'currency' },
  { name: 'date', label: 'Purchase Date', type: 'date' },
  { name: 'status', label: 'Status', type: 'status' },
  { name: 'paymentStatus', label: 'Payment Status', type: 'status' },
  { name: 'paymentMethod', label: 'Payment Method', type: 'text' }
];

export default function PurchasePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [data, setData] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = APIURL +'/api/purchases';

  // --- Data Fetching (GET) ---
  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      const mapped = result.map((item: Purchase) => ({
        ...item,
        date: Array.isArray(item.date)
          ? `${item.date[0]}-${String(item.date[1]).padStart(2, '0')}-${String(item.date[2]).padStart(2, '0')}`
          : item.date
      }));
      setData(mapped);
    } catch (e: Error | unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      setError(`Failed to fetch purchases: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handleAddNew = () => {
    setSelectedPurchase(null);
    setIsFormOpen(true);
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Vendor,Amount,Date,Status,Payment Status,Payment Method\n"
      + data.map(item => [
        item.vendor,
        item.amount,
        item.date,
        item.status,
        item.paymentStatus,
        item.paymentMethod
      ].join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "purchases.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (item: Purchase) => {
    setSelectedPurchase(item);
    setIsViewOpen(true);
  };

  const handleEdit = (item: Purchase) => {
    setSelectedPurchase(item);
    setIsFormOpen(true);
  };

  // --- Data Deletion (DELETE) ---
  const handleDelete = async (item: Purchase) => {
    if (confirm(`Are you sure you want to delete purchase from ${item.vendor}?`)) {
      try {
        const response = await fetch(`${API_URL}/${item.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        setData(prev => prev.filter(i => i.id !== item.id));
        toast.success('Purchase deleted successfully!');
      } catch (e: Error | unknown) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        toast.error(`Failed to delete purchase: ${errorMessage}`);
      }
    }
  };

  // --- Form Submission (POST/PUT) ---
  const handleFormSubmit = async (formData: Omit<Purchase, 'id'>) => {
    try {
      if (selectedPurchase) {
        // Edit existing item (PUT)
        const response = await fetch(`${API_URL}/${selectedPurchase.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const updatedPurchase = await response.json();
        setData(prev => prev.map(item =>
          item.id === selectedPurchase.id ? updatedPurchase : item
        ));
        toast.success('Purchase updated successfully!');
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
        const newPurchase = await response.json();
        setData(prev => [...prev, newPurchase]);
        toast.success('Purchase added successfully!');
      }
      setIsFormOpen(false);
      setSelectedPurchase(null);
    } catch (e: Error | unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      toast.error(`Failed to save purchase: ${errorMessage}`);
    }
  };

  const filteredData = data.filter(item =>
    (item.vendor?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item.paymentMethod?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item.status?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item.paymentStatus?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <Toaster position="top-right" />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Purchases</h2>
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
            placeholder="Search by vendor, payment method, status, or payment status..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
       
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading purchases...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">{error}</div>
      ) : (
        <>
        {/* Desktop Table */}
        <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Vendor</th>
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
                  <td colSpan={7} className="px-3 sm:px-4 lg:px-6 py-4 text-center text-gray-500">No purchases found.</td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{item.vendor}</td>
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


        </>
      )}

      <DataForm<Purchase>
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedPurchase(null);
        }}
        onSubmit={handleFormSubmit}
        title={selectedPurchase ? 'Edit Purchase' : 'Add Purchase'}
        fields={formFields}
        initialData={selectedPurchase}
      />

      {isViewOpen && selectedPurchase && (
        <DataView
          isOpen={isViewOpen}
          onClose={() => {
            setIsViewOpen(false);
            setSelectedPurchase(null);
          }}
          data={selectedPurchase}
          fields={viewFields}
          title="Purchase Details"
        />
      )}
    </div>
  );
} 