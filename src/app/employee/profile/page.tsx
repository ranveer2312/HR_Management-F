'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Building,
  Edit,
  Camera,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Calendar,
} from 'lucide-react';

interface Employee {
  id?: number;
  employeeId: string;
  employeeName: string;
  email: string;
  phoneNumber: string;
  bloodGroup: string;
  profilePhotoUrl?: string;
  profilePhotoPublicId?: string;
  currentAddress: string;
  permanentAddress: string;
  password?: string;
  position: string;
  department: string;
  joiningDate: string;
  relievingDate?: string;
  status: string; // Joining, Active, Relieving
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hr-management-b.onrender.com/api';

// Enhanced API Service
class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      if (response.status === 401) {
        // Redirect to login on authentication failure
        window.location.href = '/login';
        throw new Error('Authentication failed. Please login again.');
      }
      
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        try {
          errorMessage = await response.text() || errorMessage;
        } catch {
          // Keep the default error message
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    // Handle different response formats
    if (data.success !== undefined) {
      return data;
    } else {
      return {
        success: true,
        data: data,
        message: 'Success'
      };
    }
  }

  async getEmployeeProfile(employeeId: string): Promise<ApiResponse<Employee>> {
    const response = await fetch(`${this.baseURL}/employees/byEmployeeId/${employeeId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse<Employee>(response);
  }

  async updateEmployeeProfile(employeeId: string, data: Partial<Employee>): Promise<ApiResponse<Employee>> {
    const response = await fetch(`${this.baseURL}/employees/byEmployeeId/${employeeId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    return this.handleResponse<Employee>(response);
  }

  async uploadProfilePhoto(employeeId: string, file: File): Promise<ApiResponse<{ profilePhotoUrl: string }>> {
    const formData = new FormData();
    formData.append('profilePhoto', file);

    const response = await fetch(`${this.baseURL}/employees/${employeeId}/photo`, {
      method: 'POST',
      body: formData,
    });
    
    return this.handleResponse<{ profilePhotoUrl: string }>(response);
  }
}

export default function EmployeeProfilePage() {
  const router = useRouter();
  
  // State management
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const apiService = new ApiService(API_BASE_URL);

  // Load employee profile on component mount
  useEffect(() => {
    loadEmployeeData();
  }, []);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get employee ID from localStorage (set during login)
      const employeeId = localStorage.getItem('employeeId');
      if (!employeeId) {
        router.replace('/login');
        return;
      }
      
      // Load employee profile
      const profileResponse = await apiService.getEmployeeProfile(employeeId);

      if (profileResponse.success) {
        setEmployee(profileResponse.data);
      } else {
        setError(profileResponse.error || 'Failed to load profile');
      }

    } catch (err) {
      if (err instanceof Error && err.message.includes('Authentication failed')) {
        router.replace('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error loading employee data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateExperience = (joiningDate: string) => {
    if (!joiningDate) return 'Not specified';
    const joinDate = new Date(joiningDate);
    const today = new Date();
    let years = today.getFullYear() - joinDate.getFullYear();
    let months = today.getMonth() - joinDate.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'joining': return 'bg-blue-100 text-blue-800';
      case 'relieving': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Error state when profile cannot be loaded
  if (error && !employee && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Profile</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          
          <div className="bg-gray-100 rounded-lg p-4 mb-4 text-left">
            <p className="text-sm text-gray-600 mb-2"><strong>API Endpoint:</strong></p>
            <p className="text-xs text-gray-500 break-all">
              {API_BASE_URL}/employees/byEmployeeId/[employeeId]
            </p>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={loadEmployeeData}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Retry Loading Profile'}
            </button>
            
            <button 
              onClick={() => router.replace('/login')}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Login
            </button>
            
            <div className="text-xs text-gray-500">
              <p><strong>Troubleshooting:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-left">
                <li>Check if your backend server is running</li>
                <li>Verify the API URL is correct</li>
                <li>Ensure database connection is active</li>
                <li>Check if you're properly logged in</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Main profile content
  if (!employee) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-8 mt-6 rounded">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
                <p className="text-red-700">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Profile Header */}
          <div className="border-b border-gray-200 px-8 py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-500 text-sm mt-1">View your personal information</p>
              <p className="text-xs text-gray-400 mt-1">Employee ID: {employee.employeeId}</p>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-12 gap-8">
              {/* Profile Section */}
              <div className="col-span-4">
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <div className="flex items-center mb-4">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Profile</span>
                  </div>
                  
                  <div className="text-center mb-6">
                    <div className="relative inline-block mb-4">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md mx-auto bg-gray-200">
                        {employee.profilePhotoUrl ? (
                          <img
                            src={employee.profilePhotoUrl.startsWith('http') 
                              ? employee.profilePhotoUrl 
                              : `${process.env.NEXT_PUBLIC_API_URL || 'https://hr-management-b.onrender.com'}${employee.profilePhotoUrl}`
                            }
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 text-2xl font-bold">
                            {employee.employeeName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      {/* Status indicator */}
                      <div className={`absolute -bottom-1 -right-1 px-2 py-1 text-xs font-medium rounded-full border-2 border-white ${getStatusColor(employee.status)}`}>
                        {employee.status}
                      </div>
                    </div>
                    
                    <h2 className="text-xl font-bold text-gray-900 mb-1">{employee.employeeName}</h2>
                    <p className="text-blue-600 font-semibold text-sm mb-1">{employee.position}</p>
                    <p className="text-gray-500 text-sm mb-4">{employee.department}</p>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div className="flex items-start space-x-3">
                      <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-600 text-xs">Email</p>
                        <p className="text-gray-900 font-medium break-all">{employee.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-600 text-xs">Phone</p>
                        <p className="text-gray-900 font-medium">{employee.phoneNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Building className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-600 text-xs">Employee ID</p>
                        <p className="text-gray-900 font-medium">{employee.employeeId}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Information Sections */}
              <div className="col-span-8 space-y-6">
                {/* Personal Information */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-blue-600 mr-3" />
                      <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                        <p className="text-gray-900 font-medium">{employee.employeeName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                        <p className="text-gray-900">{employee.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                        <p className="text-gray-900">{employee.phoneNumber}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Blood Group</label>
                        <span className="inline-flex px-2 py-1 bg-red-50 text-red-700 rounded text-sm font-medium">{employee.bloodGroup}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <Briefcase className="w-5 h-5 text-blue-600 mr-3" />
                      <h3 className="text-lg font-semibold text-gray-900">Professional Information</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Position/Title</label>
                        <p className="text-gray-900 font-medium">{employee.position}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Department</label>
                        <p className="text-gray-900">{employee.department}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Date of Joining</label>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <p className="text-gray-900">{formatDate(employee.joiningDate)}</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Experience with Company</label>
                        <p className="text-gray-900">{calculateExperience(employee.joiningDate)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(employee.status)}`}>
                          {employee.status}
                        </span>
                      </div>
                      {employee.relievingDate && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Relieving Date</label>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <p className="text-gray-900">{formatDate(employee.relievingDate)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-blue-600 mr-3" />
                      <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Current Address</label>
                        <p className="text-gray-900">{employee.currentAddress || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Permanent Address</label>
                        <p className="text-gray-900">{employee.permanentAddress || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}