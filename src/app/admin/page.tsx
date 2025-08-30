'use client';

import Link from 'next/link';
import {
  Users,
  Package,
  Database,
  DollarSign,
  BarChart3,
  Clock,
  CheckCircle,
  TrendingUp,
  Zap,
  Activity,
  Award,
  AlertCircle,
  ArrowUpRight,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { APIURL } from '@/constants/api';

interface CreateUserForm {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: string;
}

interface RecentActivity {
  id: string;
  name: string;
  description: string;
  activityDate: string;
  activityTime: string;
  category: string;
  status: string;
}

interface Employee {
  id: string;
  name: string;
  department?: string;
  status?: string;
  joiningDate?: string;
  joinDate?: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status: string;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface ActivityData {
  id: string;
  name: string;
  status: string;
}

export default function AdminDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    totalDepartments: 0,
    newEmployees: 0,
    activeProjects: 0,
    systemHealth: 0,
    presentToday: 0,
    onLeave: 0,
    tasksCompleted: 0,
    activeToday: 0,
  });
  const [metricsLoading, setMetricsLoading] = useState(true);

  const [formData, setFormData] = useState<CreateUserForm>({
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: 'ADMIN',
  });

  // ✅ Helper to always send auth header
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return [];
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        console.error(`Error fetching ${url}:`, response.status);
        return [];
      }
      
      const text = await response.text();
      if (!text.trim()) {
        return [];
      }
      
      try {
        return JSON.parse(text);
      } catch {
        console.error(`Invalid JSON from ${url}`);
        return [];
      }
    } catch (err) {
      console.error(`Network error for ${url}:`, err);
      return [];
    }
  };

  const quickActions = [
    { title: 'Employee Management', description: 'Manage employee records', icon: Users, href: '/admin/hr', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { title: 'Attendance Tracking', description: 'Monitor attendance', icon: Clock, href: '/admin/attendence', color: 'bg-green-50 text-green-600 border-green-200' },
    { title: 'Finance Management', description: 'Financial operations', icon: DollarSign, href: '/admin/finance-manager/dashboard', color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { title: 'Inventory Control', description: 'Manage Store', icon: Package, href: '/admin/store', color: 'bg-orange-50 text-orange-600 border-orange-200' },
    { title: 'Reports & Analytics', description: 'Generate reports', icon: BarChart3, href: '/admin/reports', color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    { title: 'Data Management', description: 'System data control', icon: Database, href: '/admin/data-manager', color: 'bg-red-50 text-red-600 border-red-200' },
  ];

  useEffect(() => {
    const fetchActivities = async () => {
      setActivitiesLoading(true);
      const data = await fetchWithAuth(`${APIURL}/api/activities`);
      setRecentActivities(Array.isArray(data) ? data.slice(0, 6) : []);
      setActivitiesLoading(false);
    };

    const fetchMetrics = async () => {
      setMetricsLoading(true);

      const employees = await fetchWithAuth(`${APIURL}/api/employees`);
      const attendanceData = await fetchWithAuth(`${APIURL}/api/attendance`);
      const leaveData = await fetchWithAuth(`${APIURL}/api/leave-requests`);
      const activitiesData = await fetchWithAuth(`${APIURL}/api/activities`);

      const totalEmployees = Array.isArray(employees) ? employees.length : 0;
      const activeEmployees = Array.isArray(employees) ? employees.filter((emp: Employee) => emp.status === 'active' || !emp.status).length : 0;

      const departments = new Set(Array.isArray(employees) ? employees.map((emp: Employee) => emp.department || '').filter(Boolean) : []);
      const totalDepartments = departments.size;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newEmployees = Array.isArray(employees) ? employees.filter((emp: Employee) => {
        if (!emp.joiningDate && !emp.joinDate) return false;
        const dateString = emp.joiningDate || emp.joinDate;
        if (!dateString) return false;
        const joinDate = new Date(dateString);
        return !isNaN(joinDate.getTime()) && joinDate >= thirtyDaysAgo;
      }).length : 0;

      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = Array.isArray(attendanceData) ? attendanceData.filter((record: AttendanceRecord) => record.date === today && record.status === 'present') : [];

      const onLeaveToday = Array.isArray(leaveData) ? leaveData.filter((leave: LeaveRequest) => {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const todayDate = new Date();
        return leave.status === 'Approved' && start <= todayDate && end >= todayDate;
      }).length : 0;

      const completedTasks = Array.isArray(activitiesData) ? activitiesData.filter((act: ActivityData) => act.status === 'completed').length : 0;

      const systemHealth = Math.min(
        98,
        Math.max(85, 95 - (onLeaveToday / (totalEmployees || 1)) * 10 + (todayAttendance.length / (totalEmployees || 1)) * 5),
      );

      setMetrics({
        totalEmployees,
        totalDepartments,
        newEmployees,
        activeProjects: 12,
        systemHealth: Math.round(systemHealth),
        presentToday: todayAttendance.length,
        onLeave: onLeaveToday,
        tasksCompleted: completedTasks,
        activeToday: activeEmployees,
      });

      setMetricsLoading(false);
    };

    fetchActivities();
    fetchMetrics();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${APIURL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('User created successfully!');
        setFormData({ username: '', password: '', fullName: '', email: '', role: 'ADMIN' });
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccess('');
        }, 2000);
      } else {
        setError(data.message || 'Failed to create user');
      }
    } catch {
      setError('Failed to create user: Network error');
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, Admin!
              </h1>
              <p className="text-gray-600">Here&apos;s what&apos;s happening in your organization today.</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Employees</p>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">{metricsLoading ? '...' : metrics.totalEmployees}</p>
                    <p className="text-sm text-green-600 mt-1">+12% from last month</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Present Today</p>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">{metricsLoading ? '...' : metrics.presentToday}</p>
                    <p className="text-sm text-green-600 mt-1">Employees at work</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Departments</p>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">{metricsLoading ? '...' : metrics.totalDepartments}</p>
                    <p className="text-sm text-blue-600 mt-1">Active departments</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">New Hires</p>
                    <p className="text-2xl font-semibold text-green-600 mt-1">0</p>
                    <p className="text-sm text-gray-600 mt-1">Any new hires</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-8">Admin Panel</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quickActions.map((action, index) => (
                  <Link key={index} href={action.href}>
                    <div className={`p-6 rounded-xl border-2 hover:shadow-lg transition-all duration-200 cursor-pointer group ${action.color}`}>
                      <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-xl bg-white/80 group-hover:scale-110 transition-transform duration-200">
                          <action.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                          <p className="text-sm opacity-75">{action.description}</p>
                        </div>
                        <ArrowUpRight className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activities */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activities</h3>
                {activitiesLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading activities...</div>
                ) : recentActivities.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Activity className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activity.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                              activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {activity.status}
                            </span>
                            <span className="text-xs text-gray-500">{activity.activityDate}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent activities</p>
                  </div>
                )}
              </div>

              {/* System Overview */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">System Overview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">Present Today</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">{metricsLoading ? '...' : metrics.presentToday}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      <span className="text-sm font-medium text-gray-900">On Leave</span>
                    </div>
                    <span className="text-sm font-semibold text-orange-600">{metricsLoading ? '...' : metrics.onLeave}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Award className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">Tasks Completed</span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">{metricsLoading ? '...' : metrics.tasksCompleted}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Zap className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-gray-900">System Status</span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">Healthy</span>
                  </div>
                </div>
              </div>
        </div>
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <div className="text-center mb-6">
              <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
              <p className="text-sm text-gray-500 mt-1">Fill in the details to create a new user account</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="ADMIN">Admin</option>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="STORE">Store Manager</option>
                  <option value="HR">HR</option>
                  <option value="DATAMANAGER">Data Manager</option>
                  <option value="FINANCEMANAGER">Finance Manager</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}