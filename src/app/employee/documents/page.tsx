'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  Eye,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Menu
} from 'lucide-react';
import axios from 'axios';
import { APIURL } from '@/constants/api';

interface Document {
  id: number;
  name: string;
  type: string;
  uploadDate: string;
  status: 'verified' | 'pending' | 'rejected';
}

interface ApiDocument {
  id: number;
  employeeId: string;
  documentType: string;
  fileName: string;
  originalFileName: string;
  fileDownloadUri: string;
  fileType: string;
  size: number;
}

function mapApiDocumentToDocument(api: ApiDocument): Document {
  return {
    id: api.id,
    name: api.originalFileName,
    type: api.documentType,
    uploadDate: new Date().toLocaleDateString(),
    status: 'verified',
  };
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [apiDocuments, setApiDocuments] = useState<ApiDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const employeeId = typeof window !== 'undefined' ? (sessionStorage.getItem('employeeId') || localStorage.getItem('employeeId')) : null;

  const fetchDocuments = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${APIURL}/api/hr/documents/employee/${employeeId}`);
      const list: ApiDocument[] = Array.isArray(res.data) ? res.data : [];
      setApiDocuments(list);
      setDocuments(list.map(mapApiDocumentToDocument));
    } catch { // <-- Removed the `_e` parameter
      setError('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDownload = async (document: Document) => {
    setDownloadingId(document.id);
    try {
      const apiDoc = apiDocuments.find((d) => d.originalFileName === document.name || d.id === document.id);
      if (apiDoc?.fileDownloadUri) {
        const url = apiDoc.fileDownloadUri.startsWith('http') ? apiDoc.fileDownloadUri : `${APIURL}${apiDoc.fileDownloadUri}`;
        window.open(url, '_blank');
      }
    } finally {
      setTimeout(() => setDownloadingId(null), 1200);
    }
  };

  const handleView = (document: Document) => {
    console.log('Viewing document:', document.name);
  };

  const getDocumentIcon = (type: string) => {
    const iconClass = "w-8 h-8";
    switch (type) {
      case 'resume':
        return <FileText className={`${iconClass} text-blue-500`} />;
      case 'marksCard':
        return <FileText className={`${iconClass} text-emerald-500`} />;
      case 'idProof':
        return <FileText className={`${iconClass} text-purple-500`} />;
      case 'offerLetter':
        return <FileText className={`${iconClass} text-orange-500`} />;
      default:
        return <FileText className={`${iconClass} text-gray-500`} />;
    }
  };

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'verified':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getCategoryGradient = (type: string) => {
    switch (type) {
      case 'resume':
        return 'bg-gradient-to-br from-blue-500 to-blue-600';
      case 'marksCard':
        return 'bg-gradient-to-br from-emerald-500 to-emerald-600';
      case 'idProof':
        return 'bg-gradient-to-br from-purple-500 to-purple-600';
      case 'offerLetter':
        return 'bg-gradient-to-br from-orange-500 to-orange-600';
      default:
        return 'bg-gradient-to-br from-gray-500 to-gray-600';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || doc.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const documentTypeLabels = {
    resume: 'Resume',
    marksCard: 'Marks Card',
    idProof: 'ID Proof',
    offerLetter: 'Offer Letter'
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mb-4 p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl shadow-lg"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Header Section */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-8 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                    Document Management
                  </h1>
                  <p className="mt-2 text-slate-600 text-lg">Manage and view your important documents securely</p>
                </div>
                <div className="hidden md:flex items-center space-x-2">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Document Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {['resume', 'marksCard', 'idProof', 'offerLetter'].map((type) => (
              <div key={type} className="group">
                <div className="bg-white rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className={`w-16 h-16 ${getCategoryGradient(type)} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-lg mb-2">
                    {documentTypeLabels[type as keyof typeof documentTypeLabels]}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    View and manage your {type.toLowerCase().replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                    className="pl-10 pr-8 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[150px]"
                  >
                    <option value="all">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Documents List */}
          <div className="bg-white rounded-2xl shadow-lg border border-white/20 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Your Documents</h2>
              <p className="text-slate-600 mt-1">{filteredDocuments.length} documents found</p>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
                <p className="mt-4 text-slate-600">Loading documents...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No documents found</h3>
                <p className="text-slate-600">No documents match your current search criteria</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredDocuments.map((document) => (
                  <div key={document.id} className="p-6 hover:bg-slate-50 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                          {getDocumentIcon(document.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 text-lg">{document.name}</h4>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-slate-600">
                              Uploaded: {new Date(document.uploadDate).toLocaleDateString()}
                            </span>
                            <span className="text-sm text-slate-400">•</span>
                            <span className="text-sm text-slate-600 capitalize">
                              {documentTypeLabels[document.type as keyof typeof documentTypeLabels]}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(document.status)}`}>
                          {getStatusIcon(document.status)}
                          <span className="ml-2 capitalize">{document.status}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleView(document)}
                            className="p-2.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200"
                            title="View Document"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDownload(document)}
                            disabled={downloadingId === document.id}
                            className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 disabled:opacity-50"
                            title="Download Document"
                          >
                            {downloadingId === document.id ? (
                              <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                            ) : (
                              <Download className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100">Verified</p>
                  <p className="text-3xl font-bold">{documents.filter(d => d.status === 'verified').length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100">Pending</p>
                  <p className="text-3xl font-bold">{documents.filter(d => d.status === 'pending').length}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300">Total Documents</p>
                  <p className="text-3xl font-bold">{documents.length}</p>
                </div>
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}