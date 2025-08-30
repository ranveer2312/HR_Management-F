'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus,  Download, Search, Eye, Edit, Trash2 } from 'lucide-react';
import DataForm, { FormField } from '../components/DataForm';
import DataView, { ViewField } from '../components/DataView';
import { APIURL } from '@/constants/api';
import toast, { Toaster } from 'react-hot-toast';

interface FinanceReport {
  id: number;
  reportType: string;
  period: string;
  date: string;
  status: 'Draft' | 'Final' | 'Under Review' | 'Approved';
  amount: number;
  department: string;
  preparedBy: string;
}

// Add RawFinanceReport type for API mapping
type RawFinanceReport = Omit<FinanceReport, 'date'> & { date: string | [number, number, number] };

const formFields: FormField[] = [
  { name: 'reportType', label: 'Report Type', type: 'select', options: ['Income Statement', 'Balance Sheet', 'Cash Flow', 'Profit & Loss'], required: true },
  { name: 'period', label: 'Period', type: 'text', required: true },
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Final', 'Under Review', 'Approved'], required: true },
  { name: 'amount', label: 'Amount', type: 'number', required: true },
  { name: 'department', label: 'Department', type: 'text', required: true },
  { name: 'preparedBy', label: 'Prepared By', type: 'text', required: true }
];

const viewFields: ViewField[] = [
  { name: 'reportType', label: 'Report Type', type: 'text' },
  { name: 'period', label: 'Period', type: 'text' },
  { name: 'date', label: 'Date', type: 'date' },
  { name: 'status', label: 'Status', type: 'status' },
  { name: 'amount', label: 'Amount', type: 'currency' },
  { name: 'department', label: 'Department', type: 'text' },
  { name: 'preparedBy', label: 'Prepared By', type: 'text' }
];

export default function FinancePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<FinanceReport | null>(null);
  const [data, setData] = useState<FinanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = APIURL +'/api/financereports';

  // --- Data Fetching (GET) ---
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: RawFinanceReport[] = await response.json();
      const mapped = result.map((item: RawFinanceReport) => {
        let dateStr = '';
        if (Array.isArray(item.date) && item.date.length === 3) {
          dateStr = `${item.date[0]}-${String(item.date[1]).padStart(2, '0')}-${String(item.date[2]).padStart(2, '0')}`;
        } else if (typeof item.date === 'string') {
          dateStr = item.date;
        } else {
          dateStr = '';
        }
        return {
          ...item,
          date: dateStr,
        };
      });
      setData(mapped);
    } catch (e: Error | unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      setError(`Failed to fetch reports: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleAddNew = () => {
    setSelectedReport(null);
    setIsFormOpen(true);
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Report Type,Period,Date,Status,Amount,Department,Prepared By\n"
      + data.map(item => [
        item.reportType,
        item.period,
        item.date,
        item.status,
        item.amount,
        item.department,
        item.preparedBy
      ].join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "finance_reports.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (item: FinanceReport) => {
    setSelectedReport(item);
    setIsViewOpen(true);
  };

  const handleEdit = (item: FinanceReport) => {
    setSelectedReport(item);
    setIsFormOpen(true);
  };

  // --- Data Deletion (DELETE) ---
  const handleDelete = async (item: FinanceReport) => {
    if (confirm(`Are you sure you want to delete ${item.reportType} for ${item.period}?`)) {
      try {
        const response = await fetch(`${API_URL}/${item.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        setData(prev => prev.filter(i => i.id !== item.id));
        toast.success('Report deleted successfully!');
      } catch (e: Error | unknown) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        toast.error(`Failed to delete report: ${errorMessage}`);
      }
    }
  };

  // --- Form Submission (POST/PUT) ---
  const handleFormSubmit = async (formData: Omit<FinanceReport, 'id'>) => {
    try {
      if (selectedReport) {
        // Edit existing item (PUT)
        const response = await fetch(`${API_URL}/${selectedReport.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const updatedReport = await response.json();
        setData(prev => prev.map(item =>
          item.id === selectedReport.id ? updatedReport : item
        ));
        toast.success('Report updated successfully!');
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
        const newReport = await response.json();
        setData(prev => [...prev, newReport]);
        toast.success('Report added successfully!');
      }
      setIsFormOpen(false);
      setSelectedReport(null);
    } catch (e: Error | unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      toast.error(`Failed to save report: ${errorMessage}`);
    }
  };

  const filteredData = data.filter(item =>
    (item.reportType?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item.period?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item.department?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <Toaster position="top-right" />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Finance Reports</h2>
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
            placeholder="Search by report type, period, or department..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="relative">
          
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading finance reports...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">{error}</div>
      ) : (
        <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Report Type</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Period</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Amount</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Department</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Prepared By</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 sm:px-4 lg:px-6 py-4 text-center text-gray-500">No finance reports found.</td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{item.reportType}</td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{item.period}</td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'Final' ? 'bg-green-100 text-green-800' :
                          item.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                          item.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">${item.amount.toLocaleString()}</td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{item.department}</td>
                      <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{item.preparedBy}</td>
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

      <DataForm<FinanceReport>
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedReport(null);
        }}
        onSubmit={handleFormSubmit}
        title={selectedReport ? 'Edit Finance Report' : 'Add Finance Report'}
        fields={formFields}
        initialData={selectedReport}
      />

      {isViewOpen && selectedReport && (
        <DataView
          isOpen={isViewOpen}
          onClose={() => {
            setIsViewOpen(false);
            setSelectedReport(null);
          }}
          data={selectedReport}
          fields={viewFields}
          title="Finance Report Details"
        />
      )}
    </div>
  );
} 