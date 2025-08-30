'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image'; // <-- Import the Image component
import {
  Search,
  Plus,
  X,
  Edit,
  Trash2,
  Eye,
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  EyeOff
} from 'lucide-react';
import { APIURL } from '@/constants/api';
import toast, { Toaster } from 'react-hot-toast';
import Loader from '@/components/Loader';

import axios from 'axios';

interface Employee {
  id: string;
  employeeId: string;
  employeeName: string;
  email: string;
  password:string;
  phoneNumber: string;
  bloodGroup: string;
  profilePhotoUrl: string | null;
  currentAddress: string;
  permanentAddress: string;
  position: string;
  department: string;
  joiningDate: string; // YYYY-MM-DD
  //added DOB
  dateOfBirth?: string; // YYYY-MM-DD
  status: 'Active' | 'Joining' | 'Exit';
}

interface ApiEmployeeResponse extends Omit<Employee, 'joiningDate' | 'status'> {
  joiningDate: [number, number, number] | string;
  status: string;
}

const transformEmployeeFromApiResponse = (apiEmployee: ApiEmployeeResponse): Employee => {
  let formattedDate = '';
  
  try {
    if (Array.isArray(apiEmployee.joiningDate) && apiEmployee.joiningDate.length === 3) {
      const [year, month, day] = apiEmployee.joiningDate;
      if (year && month && day && year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      } else {
        formattedDate = new Date().toISOString().split('T')[0];
      }
    } else if (typeof apiEmployee.joiningDate === 'string' && apiEmployee.joiningDate.length >= 7) {
      if (apiEmployee.joiningDate.includes('-')) {
        formattedDate = apiEmployee.joiningDate;
      } else if (apiEmployee.joiningDate.length === 8) {
        const year = apiEmployee.joiningDate.substring(0, 4);
        const month = apiEmployee.joiningDate.substring(4, 6);
        const day = apiEmployee.joiningDate.substring(6, 8);
        formattedDate = `${year}-${month}-${day}`;
      } else {
        formattedDate = new Date().toISOString().split('T')[0];
      }
    } else {
      formattedDate = new Date().toISOString().split('T')[0];
    }
  } catch (error) {
    console.error('Date parsing error:', error);
    formattedDate = new Date().toISOString().split('T')[0];
  }
  
  return {
    id: apiEmployee.id,
    employeeId: apiEmployee.employeeId,
    employeeName: apiEmployee.employeeName,
    email: apiEmployee.email,
    password: apiEmployee.password,
    phoneNumber: apiEmployee.phoneNumber,
    bloodGroup: apiEmployee.bloodGroup,
    currentAddress: apiEmployee.currentAddress,
    permanentAddress: apiEmployee.permanentAddress,
    position: apiEmployee.position,
    department: apiEmployee.department,
    joiningDate: formattedDate,
    status: apiEmployee.status as Employee['status'],
    profilePhotoUrl: apiEmployee.profilePhotoUrl,
  };
};

const API_BASE_URL = `${APIURL}/api/employees`;

const employeesAPI = {
  getAll: async (): Promise<Employee[]> => {
    const res = await fetch(API_BASE_URL);
    if (!res.ok) throw new Error('Failed to fetch employees');
    const data: ApiEmployeeResponse[] = await res.json();
    return data.map(transformEmployeeFromApiResponse);
  },
  
  create: async (employee: Omit<Employee, 'id'>, profilePhotoFile?: File | null): Promise<Employee> => {
    const formData = new FormData();
    formData.append('employee', JSON.stringify(employee));
    if (profilePhotoFile) {
      formData.append('photo', profilePhotoFile);
    }
    
    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error('Failed to create employee');
    const data: ApiEmployeeResponse = await res.json();
    return transformEmployeeFromApiResponse(data);
  },
  
  update: async (id: string, employee: Omit<Employee, 'id'>, profilePhotoFile?: File | null): Promise<Employee> => {
    const formData = new FormData();
    formData.append('employee', JSON.stringify(employee));
    if (profilePhotoFile) {
      formData.append('photo', profilePhotoFile);
    }

    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      body: formData,
    });

    if (!res.ok) throw new Error('Failed to update employee');
    const data: ApiEmployeeResponse = await res.json();
    return transformEmployeeFromApiResponse(data);
  },
  
  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete employee');
  },
};

// Add axios-based multi-part form data functions
const submitEmployee = async (employeeObj: Omit<Employee, 'id'>, photoFile?: File | null) => {
  const formData = new FormData();
  formData.append('employee', JSON.stringify(employeeObj));
  if (photoFile) {
    formData.append('photo', photoFile);
  }
  try {
    const response = await axios.post(APIURL + '/api/employees', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error: unknown) {
    console.error('Submit employee error:', error);
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.response?.data || error.message;
      throw new Error(typeof message === 'string' ? message : 'Failed to create employee');
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to create employee');
  }
};


const updateEmployee = async (id: string, employeeObj: Omit<Employee, 'id'>, photoFile?: File | null) => {
  const formData = new FormData();
  formData.append('employee', JSON.stringify(employeeObj));
  if (photoFile) {
    formData.append('photo', photoFile);
  }
  try {
    const response = await axios.put(APIURL +`/api/employees/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error: unknown) {
    console.error('Update employee error:', error);
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.response?.data || error.message;
      throw new Error(typeof message === 'string' ? message : 'Failed to update employee');
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to update employee');
  }
};

type ModalType = 'add' | 'edit' | 'view';

export default function JoiningPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('add');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  
  // Error boundary state
  const [hasError, setHasError] = useState(false);
  const departmentOptions = [
      'Sales and marketing', 'IT', 'Backend operations', 'design and development', 'HR', 'Manpower and internship', 'Other'
  ];
  const bloodGroupOptions = [
    '', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ];
  const [formError, setFormError] = useState('');
  
  // Add country code options
  const countryCodeOptions = ['+91', '+1', '+44', '+61', '+81', '+971', '+49', '+86', '+33', '+7'];
  const [countryCode, setCountryCode] = useState<string>(countryCodeOptions[0]);
  const [phoneNumberOnly, setPhoneNumberOnly] = useState<string>('');
  
  // Add a state for employee ID error
  const [employeeIdError, setEmployeeIdError] = useState('');
  // Add a state for employee ID prefix
  const [employeeIdPrefix, setEmployeeIdPrefix] = useState('EMPTA');
  
  const isViewMode = modalType === 'view';
  
  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      setError(null);
      setHasError(false);
      try {
        const data = await employeesAPI.getAll();
        setEmployees(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch employees');
        setEmployees([]);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployees();
  }, []);
  
  // Update formData.phoneNumber when either changes
  useEffect(() => {
    setFormData({ ...formData, phoneNumber: countryCode + phoneNumberOnly });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode, phoneNumberOnly]);
  
  // Real-time check for duplicate Employee ID and enforce 'EMP' prefix
  useEffect(() => {
    if (!formData.employeeId) {
      setEmployeeIdError('');
      return;
    }
    let empId = formData.employeeId;
    // Auto-prepend 'EMP' if not present
    if (!empId.startsWith('EMP')) {
      empId = 'EMP' + empId.replace(/^emp/i, '').replace(/^EMP/i, '');
      setFormData({ ...formData, employeeId: empId });
      return;
    }
    // Check for duplicate
    const exists = employees.some(emp => emp.employeeId === empId);
    if (exists && (modalType === 'add' || (modalType === 'edit' && empId !== selectedEmployee?.employeeId))) {
      setEmployeeIdError('Employee ID already exists.');
    } else {
      setEmployeeIdError('');
    }
  }, [formData, employees, modalType, selectedEmployee]);
  
  const openModal = (type: ModalType, employee?: Employee) => {
    setModalType(type);
    setSelectedEmployee(employee || null);
    setProfilePhotoFile(null);
    setProfilePhotoPreview(null);
    if (type === 'add') {
      // Default to EMP prefix
      const prefix = 'EMPTA';
      setEmployeeIdPrefix(prefix);
      // Auto-increment Employee ID for the prefix
      let nextId = prefix + '1';
      if (employees.length > 0) {
        // Find the highest numeric part for the prefix
        const ids = employees
          .map(e => e.employeeId)
          .filter(id => id.startsWith(prefix) && /^EMPTA[A-Z]*\d+$/.test(id));
        if (ids.length > 0) {
          const result = ids.reduce((acc, id) => {
            const match = id.match(/^(EMPTA[A-Z]*)(\d+)$/);
            if (match && match[1] === prefix) {
              const num = parseInt(match[2], 10);
              if (num > acc.maxNum) {
                return {maxNum: num};
              }
            }
            return acc;
          }, {maxNum: 0});
          nextId = prefix + String(result.maxNum + 1).padStart(3, '0');
        } else {
          nextId = prefix + '001';
        }
      } else {
        nextId = prefix + '001';
      }
      setFormData({
        employeeId: nextId,
        employeeName: '',
        email: '',
        password: '',
        phoneNumber: '',
        bloodGroup: '',
        currentAddress: '',
        permanentAddress: '',
        position: '',
        department: '',
        joiningDate: '',
        dateOfBirth: '',
        status: 'Active',
        profilePhotoUrl: '',
      });
      setCountryCode(countryCodeOptions[0]);
      setPhoneNumberOnly('');
    } else if (employee) {
      setFormData({ ...employee });
      // Set prefix for edit/view
      const match = employee.employeeId.match(/^(EMP[A-Z]*)/);
      setEmployeeIdPrefix(match ? match[1] : 'EMP');
      // Set phone number and country code for edit/view
      const phone = employee.phoneNumber || '';
      const matchedCode = countryCodeOptions.find(code => phone.startsWith(code)) || countryCodeOptions[0];
      setCountryCode(matchedCode);
      setPhoneNumberOnly(phone.replace(matchedCode, ''));
      if (employee.profilePhotoUrl) {
        setProfilePhotoPreview(employee.profilePhotoUrl);
      }
    }
    setShowModal(true);
  };
  
  const closeModal = () => {
    setShowModal(false);
    setSelectedEmployee(null);
    setFormData({});
    setProfilePhotoFile(null);
    setProfilePhotoPreview(null);
  };
  
  const handleSubmit = async () => {
    setFormError('');
    if (employeeIdError) {
      setFormError(employeeIdError);
      return;
    }
    // Email validation: must not be empty and must contain @
    if (!formData.email) {
      setFormError('Email is required.');
      return;
    }
    if (!formData.email.includes('@')) {
      setFormError('Please enter a valid email address containing "@".');
      return;
    }
    // Password validation: must not be empty and must meet requirements
    const password = formData.password || '';
    if (!password) {
      setFormError('Password is required.');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setFormError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      return;
    }
    // Phone number validation: country code from dropdown, 10 digits only
    if (!countryCode) {
      setFormError('Country code is required.');
      return;
    }
    if (!phoneNumberOnly) {
      setFormError('Phone number is required.');
      return;
    }
    const phoneDigitsRegex = /^\d{10}$/;
    if (!phoneDigitsRegex.test(phoneNumberOnly)) {
      setFormError('Phone number must be exactly 10 digits.');
      return;
    }
    // Other required fields
    if (!formData.employeeId) {
      setFormError('Employee ID is required.');
      return;
    }
    if (!formData.employeeName) {
      setFormError('Employee Name is required.');
      return;
    }
    if (!formData.position) {
      setFormError('Position is required.');
      return;
    }
    if (!formData.department) {
      setFormError('Department is required.');
      return;
    }
    if (!formData.joiningDate) {
      setFormError('Joining Date is required.');
      return;
    }
    if (!formData.bloodGroup) {
      setFormError('Blood Group is required.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (modalType === 'add') {
        const newEmployee = await submitEmployee(formData as Omit<Employee, 'id'>, profilePhotoFile);
        setEmployees([...employees, newEmployee]);
        toast.success('Employee added successfully');
      } else if (modalType === 'edit' && selectedEmployee) {
        await updateEmployee(selectedEmployee.id, formData as Omit<Employee, 'id'>, profilePhotoFile);
        // Refresh the employee list to get the latest data
        const refreshedData = await employeesAPI.getAll();
        setEmployees(refreshedData);
        toast.success('Employee updated successfully');
      }
      closeModal();
    } catch (error) {
      console.error('Error saving employee:', error);
      let errorMessage = 'Failed to save employee';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = (error as { message?: string }).message || JSON.stringify(error);
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee record?')) {
      try {
        await employeesAPI.delete(id);
        setEmployees(employees.filter(employee => employee.id !== id));
        toast.success('Employee deleted successfully');
      } catch (error) {
        console.error('Error deleting employee:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to delete employee');
      }
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch =
      employee.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment;
    const matchesStatus = selectedStatus === 'all' || employee.status === selectedStatus;
    return matchesSearch && matchesDepartment && matchesStatus;
  });
  
  const departments = [ 'all','Sales and marketing', 'IT', 'Backend operations', 'design and development', 'HR', 'Manpower and internship', 'Other'];
  const statuses = ['all', 'Active', 'Joining', 'Exit'];
  
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }
  
  if (error || hasError) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-red-600">
          <p>Error: {error || 'Something went wrong'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toaster position="top-right" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <button
            onClick={() => openModal('add')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Employee</span>
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search employees..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                {departments.map(department => (
                  <option key={department} value={department}>
                    {department === 'all' ? 'All Departments' : department}
                  </option>
                ))}
              </select>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Status' : status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Employees Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-6">
          {filteredEmployees.map((employee) => {
            return (
              <div key={employee.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 flex flex-col">
                <div className="flex items-center mb-4">
                  {employee.profilePhotoUrl ? (
                    <div className="w-16 h-16 mr-4 shrink-0 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      <Image
                        src={employee.profilePhotoUrl}
                        alt={employee.employeeName || 'Employee'}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 mr-4 shrink-0 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">{employee.employeeName}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${employee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {employee.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{employee.position}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4 flex-grow">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    <span>{employee.employeeId}</span>
                  </div>
                  <div className="flex items-center">
                    <Briefcase className="w-4 h-4 mr-2" />
                    <span>{employee.department}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Joined: {employee.joiningDate}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>{employee.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{employee.phoneNumber}</span>
                  </div>
                </div>

                <div className="flex space-x-2 mt-auto pt-4 border-t border-gray-100">
                  <button
                    onClick={() => openModal('view', employee)}
                    className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => openModal('edit', employee)}
                    className="flex-1 bg-green-50 text-green-600 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(employee.id)}
                    className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              key={modalType + String(showModal)} // Force re-render on modal open/type change
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {modalType === 'add' && 'Add New Employee'}
                    {modalType === 'edit' && 'Edit Employee'}
                    {modalType === 'view' && 'Employee Details'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {isViewMode ? (
                  <div className="space-y-4">
                    <div className="flex justify-center mb-4">
                      {selectedEmployee?.profilePhotoUrl ? (
                        <div className="w-30 h-30 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          <Image
                            src={selectedEmployee.profilePhotoUrl}
                            alt={selectedEmployee.employeeName || 'Employee'}
                            width={120}
                            height={120}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-30 h-30 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Employee ID</p>
                        <p className="font-medium">{selectedEmployee?.employeeId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">{selectedEmployee?.employeeName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{selectedEmployee?.email}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Password</p>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{showPassword ? selectedEmployee?.password : '••••••••'}</p>
                          <button
                            onClick={togglePasswordVisibility}
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4 text-gray-600" /> : <Eye className="w-4 h-4 text-gray-600" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone Number</p>
                        <p className="font-medium">{selectedEmployee?.phoneNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Position</p>
                        <p className="font-medium">{selectedEmployee?.position}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Department</p>
                        <p className="font-medium">{selectedEmployee?.department}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Joining Date</p>
                        <p className="font-medium">{selectedEmployee?.joiningDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="font-medium">{selectedEmployee?.status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Blood Group</p>
                        <p className="font-medium">{selectedEmployee?.bloodGroup}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Date of Birth</p>
                        <p className="font-medium">{selectedEmployee?.dateOfBirth || 'Not provided'}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Current Address</p>
                      <p className="font-medium">{selectedEmployee?.currentAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Permanent Address</p>
                      <p className="font-medium">{selectedEmployee?.permanentAddress}</p>
                    </div>
                    
                  </div>

                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                        <div className="flex items-center">
                          <select
                            className="px-2 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={employeeIdPrefix}
                            onChange={e => {
                              const newPrefix = e.target.value;
                              setEmployeeIdPrefix(newPrefix);
                              // Auto-increment for new prefix
                              const ids = employees
                                .map(e => e.employeeId)
                                .filter(id => id.startsWith(newPrefix) && /^EMPTA[A-Z]*\d+$/.test(id));
                              let nextId = newPrefix + '001';
                              if (ids.length > 0) {
                                const result = ids.reduce((acc, id) => {
                                  const match = id.match(/^(EMPTA[A-Z]*)(\d+)$/);
                                  if (match && match[1] === newPrefix) {
                                    const num = parseInt(match[2], 10);
                                    if (num > acc.maxNum) {
                                      return {maxNum: num};
                                    }
                                  }
                                  return acc;
                                }, {maxNum: 0});
                                nextId = newPrefix + String(result.maxNum + 1).padStart(3, '0');
                              }
                              setFormData({ ...formData, employeeId: nextId });
                            }}
                          >
                            <option value="EMPTA">EMPTA</option>
                          </select>
                          <input
                            type="text"
                            required
                            autoComplete="off"
                            className="w-full px-3 py-2 border-t border-b border-r border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.employeeId ? formData.employeeId.replace(employeeIdPrefix, '') : ''}
                            onChange={e => {
                              // Only allow alphanumeric characters
                              const val = e.target.value.replace(/[^0-9A-Za-z]/g, '');
                              setFormData({ ...formData, employeeId: employeeIdPrefix + val });
                            }}
                            placeholder="Enter unique ID"
                          />
                        </div>
                        {employeeIdError && <div className="text-red-600 text-xs mt-1">{employeeIdError}</div>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Employee Name</label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.employeeName || ''}
                          onChange={(e) => setFormData({...formData, employeeName: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            autoComplete="new-password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.password || ''}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                          />
                          <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4 text-gray-600" /> : <Eye className="w-4 h-4 text-gray-600" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <div className="flex gap-2">
                          <select
                            className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={countryCode}
                            onChange={e => setCountryCode(e.target.value)}
                          >
                            {countryCodeOptions.map(code => (
                              <option key={code} value={code}>{code}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            required
                            maxLength={10}
                            pattern="\\d{10}"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={phoneNumberOnly}
                            onChange={e => {
                              // Only allow digits
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setPhoneNumberOnly(val);
                            }}
                            placeholder="10 digit number"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.position || ''}
                          onChange={(e) => setFormData({...formData, position: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                        <select
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.department || ''}
                          onChange={(e) => setFormData({...formData, department: e.target.value})}
                        >
                          {departmentOptions.map(opt => (
                            <option key={opt} value={opt}>{opt ? opt : 'Select department'}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date</label>
                        <input
                          type="date"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.joiningDate || ''}
                          onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.status || 'Active'}
                          onChange={(e) => setFormData({...formData, status: e.target.value as Employee['status']})}
                        >
                          <option value="Active">Active</option>
                          <option value="Joining">Joining</option>
                          <option value="Exit">Exit</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                        <select
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.bloodGroup || ''}
                          onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
                        >
                          {bloodGroupOptions.map(opt => (
                            <option key={opt} value={opt}>{opt ? opt : 'Select blood group'}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.dateOfBirth || ''}
                          onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                        <div className="flex items-center space-x-3">
                          <input
                            id="profile-photo-input"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setProfilePhotoFile(file);
                                setProfilePhotoPreview(URL.createObjectURL(file));
                              } else {
                                setProfilePhotoFile(null);
                                setProfilePhotoPreview(selectedEmployee?.profilePhotoUrl || null);
                              }
                            }}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('profile-photo-input')?.click()}
                            className="flex items-center px-5 py-4 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-lg"
                          >
                            <Plus className="w-6 h-6 mr-2" />
                            <span>Select Photo</span>
                          </button>
                        </div>
                        {profilePhotoPreview && (
                          <div className="w-30 h-30 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mt-4">
                            <Image
                              src={profilePhotoPreview}
                              alt="Profile Preview"
                              width={120}
                              height={120}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Address</label>
                      <textarea
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.currentAddress || ''}
                        onChange={(e) => setFormData({...formData, currentAddress: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Permanent Address</label>
                      <textarea
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.permanentAddress || ''}
                        onChange={(e) => setFormData({...formData, permanentAddress: e.target.value})}
                      />
                    </div>
                    
                    {formError && <div className="text-red-600 text-sm mb-2">{formError}</div>}
                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                        disabled={
                          isSubmitting ||
                          !formData.employeeId ||
                          !formData.employeeName ||
                          !formData.email ||
                          !formData.password ||
                          !formData.phoneNumber ||
                          !formData.position ||
                          !formData.department ||
                          !formData.joiningDate ||
                          !formData.bloodGroup
                        }
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5">
                            <Loader />
                          </div>
                        ) : (
                          modalType === 'add' ? 'Add Employee' : 'Update Employee'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={closeModal}
                        className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}