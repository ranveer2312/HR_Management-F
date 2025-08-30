'use client';
import React, { useEffect, useState } from 'react';
import { 
  Users, 
  CheckCircle, 
  TrendingUp, 
  Award, 
  UserPlus, 
  LucideIcon,
  Building,
  GraduationCap,
  Briefcase,
  Search,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
} from 'lucide-react';
import { Employee } from './types';
import { APIURL } from '@/constants/api';
import Link from 'next/link';

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  trend?: string;
  color?: string;
  bgColor?: string;
}

interface Activity {
  icon: LucideIcon;
  title: string;
  time: string;
  status: 'completed' | 'pending' | 'rejected';
}

const iconMap: { [key: string]: LucideIcon } = {
  Users,
  CheckCircle,
  TrendingUp,
  Award,
  UserPlus,
  Building,
  GraduationCap,
  Briefcase,
};

export default function HRDashboard() {
  const [totalWorkforce, setTotalWorkforce] = useState<number | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [newHires, setNewHires] = useState<number | null>(null);
  const [openPositions, setOpenPositions] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [errorActivities, setErrorActivities] = useState<string | null>(null);

  useEffect(() => {
    setLoadingStats(true);
    setLoadingEmployees(true);
    setErrorStats(null);
    
    fetch(APIURL + '/api/employees')
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        return text ? JSON.parse(text) : [];
      })
      .then((data: Employee[]) => {
        setEmployees(data);
        setTotalWorkforce(data.length);
        const uniqueDepartments = Array.from(new Set(data.map((e) => (e as { department?: string }).department ?? '')));
        setDepartments(uniqueDepartments);
        
        const now = new Date();
        const hires = data.filter((e) => {
          if (!e.joinDate) return false;
          const joinDate = new Date(e.joinDate);
          return (now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24) <= 30;
        });
        setNewHires(hires.length);
        setOpenPositions(5); // Mock data
      })
      .catch(() => setErrorStats('Failed to fetch employee data'))
      .finally(() => {
        setLoadingStats(false);
        setLoadingEmployees(false);
      });
  }, []);

  useEffect(() => {
    setLoadingActivities(true);
    setErrorActivities(null);
    fetch(APIURL + '/api/activities')
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        return text ? JSON.parse(text) : [];
      })
      .then((data: Activity[]) => {
        const mapped = data.slice(0, 5).map(activity => ({
          ...activity,
          icon: iconMap[(activity.icon as unknown as string)] || Users,
        }));
        setActivities(mapped);
      })
      .catch(() => setErrorActivities('Failed to fetch activities'))
      .finally(() => setLoadingActivities(false));
  }, []);

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.id?.toString().includes(searchTerm.toLowerCase()) ||
                         employee.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || 
                             (employee as { department?: string }).department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const StatCard = ({ icon: Icon, title, value, trend, color = 'blue', bgColor = 'bg-blue-50' }: StatCardProps) => (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 flex items-center mt-2">
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Management</h1>
          <p className="text-gray-600">Manage your workforce and HR operations</p>
        </div>
       
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          title="Total Employees"
          value={loadingStats ? '...' : errorStats ? '!' : totalWorkforce?.toString() || '0'}
          trend="+12% from last month"
          color="blue"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={Building}
          title="Departments"
          value={loadingStats ? '...' : errorStats ? '!' : departments.length.toString()}
          color="purple"
          bgColor="bg-purple-50"
        />
        <StatCard
          icon={GraduationCap}
          title="Open Positions"
          value={openPositions !== null ? openPositions.toString() : 'N/A'}
          trend="3 urgent"
          color="green"
          bgColor="bg-green-50"
        />
        <StatCard
          icon={Briefcase}
          title="New Hires"
          value={loadingStats ? '...' : errorStats ? '!' : newHires?.toString() || '0'}
          trend="Last 30 days"
          color="orange"
          bgColor="bg-orange-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Employee List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Employee Directory</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  />
                </div>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-3 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            {loadingEmployees ? (
              <div className="text-center py-8 text-gray-500">Loading employees...</div>
            ) : (
              <div className="space-y-4">
                {filteredEmployees.slice(0, 10).map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{employee.name}</h3>
                        <p className="text-sm text-gray-500">{employee.position || 'N/A'}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {employee.email}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {employee.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        employee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {employee.status || 'Active'}
                      </span>
                      <div className="flex items-center space-x-1">
                        <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredEmployees.length > 10 && (
                  <div className="text-center py-4">
                    <button className="text-blue-600 hover:text-blue-800 font-medium">
                      View All {filteredEmployees.length} Employees
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          {/* Recent Activities */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent HR Activities</h3>
            {loadingActivities ? (
              <div className="text-gray-500">Loading...</div>
            ) : errorActivities ? (
              <div className="text-red-500">{errorActivities}</div>
            ) : activities.length === 0 ? (
              <div className="text-gray-500">No recent activities.</div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <activity.icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                      activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/admin/hr/recruitment">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Start Recruitment</span>
                </div>
              </Link>
              <Link href="/admin/hr/performance">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                  <Award className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Performance Review</span>
                </div>
              </Link>
              <Link href="/admin/hr/reports">
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">HR Analytics</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Department Overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Overview</h3>
            <div className="space-y-3">
              {departments.slice(0, 5).map((dept, idx) => {
                const deptEmployees = employees.filter(emp => (emp as { department?: string }).department === dept);
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Building className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">{dept || 'Unassigned'}</span>
                    </div>
                    <span className="text-sm text-gray-600">{deptEmployees.length} employees</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}