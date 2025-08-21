'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
  User,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Building,
  GraduationCap,
  Edit,
  Camera,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  XCircle,
  LogOut,
  Loader2,
  RefreshCw,
  Search,
  ChevronDown,
  Users
} from 'lucide-react';

interface Employee {
  id?: number;
  employeeId: string;
  employeeName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  dateOfBirth: string;
  dateOfJoining: string;
  salary: number;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  emergencyContact: string;
  emergencyPhone: string;
  bloodGroup: string;
  maritalStatus: string;
  education: string;
  experience: number;
  skills: string;
  profilePhotoUrl?: string;
  status: 'active' | 'inactive' | 'terminated';
  managerId?: string;
  managerName?: string;
}

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  averageWorkHours: number;
  totalWorkHours: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
const AUTH_TOKEN_KEY = 'auth_token';

// Enhanced API Service with employee search and selection
class ApiService {
  private baseURL: string;
  private token: string | null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = null;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      if (response.status === 401) {
        this.logout();
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

  async getAllEmployees(): Promise<ApiResponse<Employee[]>> {
    const response = await fetch(`${this.baseURL}/employees`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse<Employee[]>(response);
  }

  async searchEmployees(query: string): Promise<ApiResponse<Employee[]>> {
    const params = new URLSearchParams();
    params.append('q', query);
    
    const response = await fetch(`${this.baseURL}/employees/search?${params.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse<Employee[]>(response);
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

  async getAttendanceStats(employeeId: string, month?: string, year?: string): Promise<ApiResponse<AttendanceStats>> {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    
    const response = await fetch(`${this.baseURL}/employees/${employeeId}/attendance/stats?${params.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse<AttendanceStats>(response);
  }

  async uploadProfilePhoto(employeeId: string, file: File): Promise<ApiResponse<{ profilePhotoUrl: string }>> {
    const formData = new FormData();
    formData.append('profilePhoto', file);

    const headers: { [key: string]: string } = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}/employees/${employeeId}/photo`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    return this.handleResponse<{ profilePhotoUrl: string }>(response);
  }

  logout() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage?.removeItem(AUTH_TOKEN_KEY);
      localStorage?.removeItem('currentEmployeeId');
    }
    window.location.href = '/login';
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage?.setItem(AUTH_TOKEN_KEY, token);
    }
  }
}

// Employee Selector Component
function EmployeeSelector({ 
  employees, 
  selectedEmployeeId, 
  onEmployeeSelect, 
  loading: employeesLoading 
}: {
  employees: Employee[];
  selectedEmployeeId: string | null;
  onEmployeeSelect: (employeeId: string) => void;
  loading: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredEmployees = employees.filter(emp => 
    emp.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const selectedEmployee = employees.find(emp => emp.employeeId === selectedEmployeeId);
  
  const handleSelect = (employeeId: string) => {
    onEmployeeSelect(employeeId);
    setIsOpen(false);
    setSearchQuery('');
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-80 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        disabled={employeesLoading}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            {selectedEmployee ? (
              <span className="text-blue-600 font-medium text-sm">
                {selectedEmployee.employeeName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            ) : (
              <Users className="w-4 h-4 text-blue-600" />
            )}
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">
              {selectedEmployee ? selectedEmployee.employeeName : 'Select Employee'}
            </p>
            {selectedEmployee && (
              <p className="text-xs text-gray-500">
                {selectedEmployee.employeeId} - {selectedEmployee.position}
              </p>
            )}
          </div>
        </div>
        {employeesLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        ) : (
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {filteredEmployees.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchQuery ? 'No employees found matching your search' : 'No employees available'}
              </div>
            ) : (
              filteredEmployees.map((employee) => (
                <button
                  key={employee.employeeId}
                  onClick={() => handleSelect(employee.employeeId)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 ${
                    selectedEmployeeId === employee.employeeId ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {employee.employeeName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {employee.employeeName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {employee.employeeId} • {employee.position}
                    </p>
                    <p className="text-xs text-gray-400">
                      {employee.department} • {employee.email}
                    </p>
                  </div>
                  {employee.status === 'active' && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </button>
              ))
            )}
          </div>
          
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              {filteredEmployees.length} of {employees.length} employees
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmployeeProfilePage() {
  // State management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [employeesLoading, setEmployeesLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<Partial<Employee>>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);

  // Create apiService instance only once using useMemo
  const apiService = useMemo(() => new ApiService(API_BASE_URL), []);

  const loadEmployees = useCallback(async () => {
    try {
      setEmployeesLoading(true);
      setError(null);
      
      const response = await apiService.getAllEmployees();
      
      if (response.success) {
        setEmployees(response.data);
        
        // If no employee is selected and we have employees, select the first one
        if (!selectedEmployeeId && response.data.length > 0) {
          setSelectedEmployeeId(response.data[0].employeeId);
        }
      } else {
        setError(response.error || 'Failed to load employees');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employees');
      console.error('Error loading employees:', err);
    } finally {
      setEmployeesLoading(false);
    }
  }, [apiService, selectedEmployeeId]);

  const loadEmployeeData = useCallback(async (employeeId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Load employee profile
      const profileResponse = await apiService.getEmployeeProfile(employeeId);

      if (profileResponse.success) {
        setEmployee(profileResponse.data);
        setEditFormData(profileResponse.data);
      } else {
        setError(profileResponse.error || 'Failed to load profile');
      }

      // Load attendance stats (optional)
      try {
        const currentDate = new Date();
        const currentMonth = (currentDate.getMonth() + 1).toString();
        const currentYear = currentDate.getFullYear().toString();
        
        const attendanceResponse = await apiService.getAttendanceStats(
          employeeId, 
          currentMonth, 
          currentYear
        );
        
        if (attendanceResponse.success) {
          setAttendanceStats(attendanceResponse.data);
        }
      } catch (attendanceError) {
        console.warn('Attendance stats not available:', attendanceError);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error loading employee data:', err);
    } finally {
      setLoading(false);
    }
  }, [apiService]);

  // Load employees on component mount
  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Load employee profile when selection changes
  useEffect(() => {
    if (selectedEmployeeId) {
      loadEmployeeData(selectedEmployeeId);
      // Remember selection in localStorage
      localStorage?.setItem('currentEmployeeId', selectedEmployeeId);
    }
  }, [selectedEmployeeId, loadEmployeeData]);

  // Restore last selected employee from localStorage
  useEffect(() => {
    const lastSelectedId = localStorage?.getItem('currentEmployeeId');
    if (lastSelectedId && employees.length > 0 && !selectedEmployeeId) {
      const employeeExists = employees.some(emp => emp.employeeId === lastSelectedId);
      if (employeeExists) {
        setSelectedEmployeeId(lastSelectedId);
      }
    }
  }, [employees, selectedEmployeeId]);

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setEmployee(null); // Clear current employee while loading
    setAttendanceStats(null);
    setIsEditing(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (selectedEmployeeId) {
      await loadEmployeeData(selectedEmployeeId);
    }
    await loadEmployees();
    setRefreshing(false);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditFormData(employee || {});
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field: keyof Employee, value: string | number) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!employee) return;

    try {
      setSaving(true);
      setError(null);

      const response = await apiService.updateEmployeeProfile(employee.employeeId, editFormData);
      
      if (response.success) {
        setEmployee(response.data);
        setIsEditing(false);
        // Update employee in the list as well
        setEmployees(prev => prev.map(emp => 
          emp.employeeId === employee.employeeId ? response.data : emp
        ));
      } else {
        setError(response.error || 'Failed to update profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !employee) return;

    const file = event.target.files[0];
    
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, GIF)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Image file size should not exceed 5MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      setError(null);
      
      const response = await apiService.uploadProfilePhoto(employee.employeeId, file);
      
      if (response.success) {
        setEmployee(prev => prev ? {
          ...prev,
          profilePhotoUrl: response.data.profilePhotoUrl
        } : null);
      } else {
        setError(response.error || 'Failed to upload photo');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      apiService.logout();
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

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'Not specified';
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age + ' years';
  };

  const calculateExperience = (dateOfJoining: string) => {
    if (!dateOfJoining) return 'Not specified';
    const joinDate = new Date(dateOfJoining);
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

  // Error state when no employees can be loaded
  if (error && employees.length === 0 && !employeesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Employee Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          
          <div className="bg-gray-100 rounded-lg p-4 mb-4 text-left">
            <p className="text-sm text-gray-600 mb-2"><strong>API Endpoint:</strong></p>
            <p className="text-xs text-gray-500 break-all">
              {API_BASE_URL}/employees
            </p>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={loadEmployees}
              disabled={employeesLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {employeesLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Retry Loading Employees'}
            </button>
            
            <div className="text-xs text-gray-500">
              <p><strong>Troubleshooting:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-left">
                <li>Check if your backend server is running</li>
                <li>Verify the API URL is correct</li>
                <li>Ensure database connection is active</li>
                <li>Check authentication if required</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">Employee Portal</h1>
              <p className="text-white/80 text-sm">Self Service Dashboard</p>
            </div>
            
            {/* Employee Selector */}
            <EmployeeSelector
              employees={employees}
              selectedEmployeeId={selectedEmployeeId}
              onEmployeeSelect={handleEmployeeSelect}
              loading={employeesLoading}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            {employee && (
              <div className="flex items-center space-x-3 text-white">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {employee.employeeName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{employee.employeeName}</p>
                  <p className="text-xs text-white/80">{employee.position}</p>
                </div>
              </div>
            )}
            
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-2 bg-white/20 text-white rounded-lg border border-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-white/20 text-white rounded-lg border border-white/20 hover:bg-white/30 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Loading state */}
        {loading && selectedEmployeeId && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading employee profile...</p>
            <p className="text-sm text-gray-500 mt-2">Employee ID: {selectedEmployeeId}</p>
          </div>
        )}

        {/* No employee selected */}
        {!selectedEmployeeId && employees.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Select an Employee</h2>
            <p className="text-gray-600 mb-4">Choose an employee from the dropdown above to view their profile</p>
            <p className="text-sm text-gray-500">{employees.length} employees available</p>
          </div>
        )}

        {/* Employee profile content */}
        {employee && !loading && (
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
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Employee Profile</h1>
                  <p className="text-gray-500 text-sm mt-1">View and manage employee information</p>
                  <p className="text-xs text-gray-400 mt-1">Employee ID: {employee.employeeId}</p>
                </div>
                <div className="flex items-center space-x-3">
                  {isEditing ? (
                    <div className="flex space-x-2">
                      <button 
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span className="font-medium">Save Changes</span>
                      </button>
                      <button 
                        onClick={handleEditToggle}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span className="font-medium">Cancel</span>
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={handleEditToggle}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-200 transition-all"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="font-medium">Edit Profile</span>
                    </button>
                  )}
                </div>
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
                            <Image
                              src={employee.profilePhotoUrl}
                              alt={`${employee.employeeName} profile photo`}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                              priority
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 text-2xl font-bold">
                              {employee.employeeName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                          )}
                        </div>
                        
                        {/* Status indicator */}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                        
                        {/* Photo upload button */}
                        {isEditing && (
                          <label className="absolute -bottom-1 -left-1 w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
                            {uploadingPhoto ? (
                              <Loader2 className="w-3 h-3 text-white animate-spin" />
                            ) : (
                              <Camera className="w-3 h-3 text-white" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoUpload}
                              className="hidden"
                              disabled={uploadingPhoto}
                            />
                          </label>
                        )}
                      </div>
                      
                      <h2 className="text-xl font-bold text-gray-900 mb-1">{employee.employeeName}</h2>
                      <p className="text-blue-600 font-semibold text-sm mb-1">{employee.position}</p>
                      <p className="text-gray-500 text-sm mb-4">{employee.department}</p>
                      
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        employee.status === 'active' ? 'bg-green-100 text-green-800' :
                        employee.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          employee.status === 'active' ? 'bg-green-500' :
                          employee.status === 'inactive' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                        {employee.status === 'active' ? 'Active Employee' :
                         employee.status === 'inactive' ? 'Inactive Employee' :
                         'Terminated Employee'}
                      </div>
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
                          <p className="text-gray-900 font-medium">{employee.phone}</p>
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

                  {/* Attendance Summary */}
                  {attendanceStats && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Attendance Summary</h3>
                        <span className="text-xs text-gray-500">Current Month</span>
                      </div>
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-gray-900 mb-1">{attendanceStats.totalDays}</div>
                          <div className="text-sm text-gray-600">Total Working Days</div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Present</span>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-green-600">{attendanceStats.presentDays}</span>
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                ({Math.round((attendanceStats.presentDays / attendanceStats.totalDays) * 100)}%)
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Absent</span>
                            <span className="font-semibold text-red-600">{attendanceStats.absentDays}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Late</span>
                            <span className="font-semibold text-amber-600">{attendanceStats.lateDays}</span>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                            <span className="text-gray-600 text-sm">Avg. Hours/Day</span>
                            <span className="font-semibold text-blue-600">{attendanceStats.averageWorkHours}h</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
                          {isEditing ? (
                            <input
                              type="text"
                              value={editFormData.employeeName || ''}
                              onChange={(e) => handleInputChange('employeeName', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-gray-900 font-medium">{employee.employeeName}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
                          {isEditing ? (
                            <input
                              type="date"
                              value={editFormData.dateOfBirth || ''}
                              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-gray-900">{formatDate(employee.dateOfBirth)} ({calculateAge(employee.dateOfBirth)})</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                          {isEditing ? (
                            <input
                              type="email"
                              value={editFormData.email || ''}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-gray-900">{employee.email}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                          {isEditing ? (
                            <input
                              type="tel"
                              value={editFormData.phone || ''}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-gray-900">{employee.phone}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Blood Group</label>
                          {isEditing ? (
                            <select
                              value={editFormData.bloodGroup || ''}
                              onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select Blood Group</option>
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B-">B-</option>
                              <option value="AB+">AB+</option>
                              <option value="AB-">AB-</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                            </select>
                          ) : (
                            <span className="inline-flex px-2 py-1 bg-red-50 text-red-700 rounded text-sm font-medium">{employee.bloodGroup}</span>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Marital Status</label>
                          {isEditing ? (
                            <select
                              value={editFormData.maritalStatus || ''}
                              onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select Status</option>
                              <option value="Single">Single</option>
                              <option value="Married">Married</option>
                              <option value="Divorced">Divorced</option>
                              <option value="Widowed">Widowed</option>
                            </select>
                          ) : (
                            <p className="text-gray-900">{employee.maritalStatus}</p>
                          )}
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
                          {isEditing ? (
                            <input
                              type="text"
                              value={editFormData.position || ''}
                              onChange={(e) => handleInputChange('position', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-gray-900 font-medium">{employee.position}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Department</label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editFormData.department || ''}
                              onChange={(e) => handleInputChange('department', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-gray-900">{employee.department}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Date of Joining</label>
                          <p className="text-gray-900">{formatDate(employee.dateOfJoining)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Experience with Company</label>
                          <p className="text-gray-900">{calculateExperience(employee.dateOfJoining)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Annual Salary</label>
                          <p className="text-gray-900 font-semibold">₹{employee.salary?.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Reporting Manager</label>
                          <p className="text-gray-900">{employee.managerName || 'Not assigned'}</p>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-500 mb-1">Skills</label>
                          {isEditing ? (
                            <textarea
                              value={editFormData.skills || ''}
                              onChange={(e) => handleInputChange('skills', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter skills separated by commas"
                            />
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {employee.skills?.split(',').map((skill, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                                  {skill.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address & Emergency Contact */}
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 text-blue-600 mr-3" />
                        <h3 className="text-lg font-semibold text-gray-900">Address & Emergency Contact</h3>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-500 mb-1">Current Address</label>
                          {isEditing ? (
                            <textarea
                              value={editFormData.address || ''}
                              onChange={(e) => handleInputChange('address', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-gray-900">{employee.address}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">City</label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editFormData.city || ''}
                              onChange={(e) => handleInputChange('city', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-gray-900">{employee.city}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">State</label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editFormData.state || ''}
                              onChange={(e) => handleInputChange('state', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-gray-900">{employee.state}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Country</label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editFormData.country || ''}
                              onChange={(e) => handleInputChange('country', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-gray-900">{employee.country}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Postal Code</label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editFormData.postalCode || ''}
                              onChange={(e) => handleInputChange('postalCode', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-gray-900">{employee.postalCode}</p>
                          )}
                        </div>
                        <div className="col-span-2 pt-4 border-t border-gray-100">
                          <h4 className="text-md font-medium text-gray-900 mb-3">Emergency Contact</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-500 mb-1">Contact Name</label>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editFormData.emergencyContact || ''}
                                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              ) : (
                                <p className="text-gray-900">{employee.emergencyContact}</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500 mb-1">Contact Phone</label>
                              {isEditing ? (
                                <input
                                  type="tel"
                                  value={editFormData.emergencyPhone || ''}
                                  onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              ) : (
                                <p className="text-gray-900">{employee.emergencyPhone}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Education & Experience */}
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center">
                        <GraduationCap className="w-5 h-5 text-blue-600 mr-3" />
                        <h3 className="text-lg font-semibold text-gray-900">Education & Experience</h3>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Education</label>
                          {isEditing ? (
                            <textarea
                              value={editFormData.education || ''}
                              onChange={(e) => handleInputChange('education', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-gray-900">{employee.education}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Years of Experience</label>
                          {isEditing ? (
                            <input
                              type="number"
                              value={editFormData.experience || ''}
                              onChange={(e) => handleInputChange('experience', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-gray-900">{employee.experience} years</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connection Status Footer */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <span className="text-gray-600">
                      {error ? 'Connection Error' : 'Connected to Backend'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center space-x-4">
                    <span>API: {API_BASE_URL}</span>
                    <span>Employees: {employees.length}</span>
                    {selectedEmployeeId && <span>Selected: {selectedEmployeeId}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}