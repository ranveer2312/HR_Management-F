'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus,  Download, Search,  Eye, Edit, Trash2 } from 'lucide-react';
import DataForm, { FormField } from '../components/DataForm';
import DataView, { ViewField } from '../components/DataView';
import { APIURL } from '@/constants/api';
import toast, { Toaster } from 'react-hot-toast';

interface CompanyRegistration {
  id: number;
  companyName: string;
  registrationNumber: string;
  type: string;
  date: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Suspended';
}

const formFields: FormField[] = [
  { name: 'companyName', label: 'Company Name', type: 'text', required: true },
  { name: 'registrationNumber', label: 'Registration Number', type: 'text', required: true },
  { name: 'type', label: 'Company Type', type: 'select', options: ['Private Limited', 'Public Limited', 'LLP', 'Partnership', 'Sole Proprietorship'], required: true },
  { name: 'date', label: 'Registration Date', type: 'date', required: true },
  { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'Pending', 'Suspended'], required: true }
];

const viewFields: ViewField[] = [
  { name: 'companyName', label: 'Company Name', type: 'text' },
  { name: 'registrationNumber', label: 'Registration Number', type: 'text' },
  { name: 'type', label: 'Company Type', type: 'text' },
  { name: 'date', label: 'Registration Date', type: 'date' },
  { name: 'status', label: 'Status', type: 'status' }
];

export default function CompanyRegistrationPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<CompanyRegistration | null>(null);
  const [data, setData] = useState<CompanyRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = APIURL + '/api/companyregistrations';

  // --- Data Fetching (GET) ---
  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      const mapped = result.map((item: CompanyRegistration) => ({
        ...item,
        date: Array.isArray(item.date)
          ? `${item.date[0]}-${String(item.date[1]).padStart(2, '0')}-${String(item.date[2]).padStart(2, '0')}`
          : item.date
      }));
      setData(mapped);
    } catch (e: Error | unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      setError(`Failed to fetch registrations: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleAddNew = () => {
    setSelectedRegistration(null);
    setIsFormOpen(true);
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Company Name,Registration Number,Type,Date,Status\n"
      + data.map(item => [
        item.companyName,
        item.registrationNumber,
        item.type,
        item.date,
        item.status
      ].join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "company_registrations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (item: CompanyRegistration) => {
    setSelectedRegistration(item);
    setIsViewOpen(true);
  };

  const handleEdit = (item: CompanyRegistration) => {
    setSelectedRegistration(item);
    setIsFormOpen(true);
  };

  // --- Data Deletion (DELETE) ---
  const handleDelete = async (item: CompanyRegistration) => {
    if (confirm(`Are you sure you want to delete registration for ${item.companyName}?`)) {
      try {
        const response = await fetch(`${API_URL}/${item.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        setData(prev => prev.filter(i => i.id !== item.id));
        toast.success('Registration deleted successfully!');
      } catch (e: Error | unknown) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        toast.error(`Failed to delete registration: ${errorMessage}`);
      }
    }
  };

  // --- Form Submission (POST/PUT) ---
  const handleFormSubmit = async (formData: Omit<CompanyRegistration, 'id'>) => {
    try {
      if (selectedRegistration) {
        // Edit existing item (PUT)
        const response = await fetch(`${API_URL}/${selectedRegistration.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const updatedRegistration = await response.json();
        setData(prev => prev.map(item =>
          item.id === selectedRegistration.id ? updatedRegistration : item
        ));
        toast.success('Registration updated successfully!');
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
        const newRegistration = await response.json();
        setData(prev => [...prev, newRegistration]);
        toast.success('Registration added successfully!');
      }
      setIsFormOpen(false);
      setSelectedRegistration(null);
    } catch (e: Error | unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      toast.error(`Failed to save registration: ${errorMessage}`);
    }
  };

  const filteredData = data.filter(item =>
    (item.companyName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item.registrationNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item.type?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <Toaster position="top-right" />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Company Registrations</h2>
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
            placeholder="Search by company name, registration number, or type..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
       
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading company registrations...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">{error}</div>
      ) : (
        <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Company Name</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Registration Number</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Type</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 sm:px-4 lg:px-6 py-4 text-center text-gray-500">No company registrations found.</td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{item.companyName}</td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{item.registrationNumber}</td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{item.type}</td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'Active' ? 'bg-green-100 text-green-800' :
                          item.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                          item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
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

      <DataForm<CompanyRegistration>
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedRegistration(null);
        }}
        onSubmit={handleFormSubmit}
        title={selectedRegistration ? 'Edit Company Registration' : 'Add Company Registration'}
        fields={formFields}
        initialData={selectedRegistration}
      />

      {isViewOpen && selectedRegistration && (
        <DataView
          isOpen={isViewOpen}
          onClose={() => {
            setIsViewOpen(false);
            setSelectedRegistration(null);
          }}
          data={selectedRegistration}
          fields={viewFields}
          title="Company Registration Details"
        />
      )}
    </div>
  );
} 