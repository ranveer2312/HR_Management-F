'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  TrendingUp,
  Briefcase,
  UserPlus,
  Calendar,
  X,
  Eye,
  EyeOff,
  ChevronRight,
  Download,
  Settings,
  Clock,
  PieChart,
  Activity
} from 'lucide-react';
import { APIURL } from '@/constants/api';

interface Employee {
  id: number;
  employeeId: string;
  employeeName: string;
  department: string;
  status: string;
  joiningDate: string;
  position: string;
}

interface AttendanceData {
  day: string;
  present: number;
  absent: number;
  late: number;
}

interface LeaveRequest {
  id: number;
  employeeName: string;
  leaveType: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface RecentActivity {
  id: string;
  name: string;
  category: string;
  status: string;
  activityDate: string;
  description: string;
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
  trend?: number[];
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, changeType, icon: Icon, subtitle, trend }) => (
  <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-slate-200 transition-all duration-300 overflow-hidden">
    {/* Background Pattern */}
    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    
    {/* Trend Sparkline */}
    {trend && (
      <div className="absolute top-4 right-4 w-16 h-8 opacity-20 group-hover:opacity-30 transition-opacity">
        <svg width="64" height="32" viewBox="0 0 64 32">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            points={trend.map((val, i) => `${i * 12.8},${32 - (val * 24)}`).join(' ')}
            className="text-blue-500"
          />
        </svg>
      </div>
    )}
    
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br shadow-sm ${
          title.includes('Total') ? 'from-blue-500 to-blue-600' :
          title.includes('Active') ? 'from-emerald-500 to-emerald-600' :
          title.includes('New') ? 'from-purple-500 to-purple-600' :
          'from-orange-500 to-orange-600'
        }`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
          changeType === 'positive'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            : changeType === 'negative'
            ? 'bg-red-50 text-red-700 border border-red-100'
            : 'bg-slate-50 text-slate-700 border border-slate-100'
        }`}>
          {change}
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="text-3xl font-bold text-slate-900 tracking-tight">{value}</div>
        <div className="text-sm font-medium text-slate-600">{title}</div>
        {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
      </div>
    </div>
  </div>
);

// Chart Components
interface PieChartSegment {
  label: string;
  percentage: number;
  color?: string;
}

const ModernPieChart: React.FC<{ segments: PieChartSegment[]; size?: number; centerLabel?: string }> = ({
  segments,
  size = 200,
  centerLabel = 'Total'
}) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
  let cumulativePercentage = 0;
  const total = segments.reduce((sum, seg) => sum + seg.percentage, 0);

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 25}
            fill="transparent"
            stroke="#F8FAFC"
            strokeWidth="20"
          />
          
          {/* Segments */}
          {segments.map((segment, index) => {
            const strokeDasharray = `${segment.percentage * 2.83} ${283 - segment.percentage * 2.83}`;
            const strokeDashoffset = -cumulativePercentage * 2.83;
            cumulativePercentage += segment.percentage;

            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={size / 2 - 25}
                fill="transparent"
                stroke={colors[index % colors.length]}
                strokeWidth="20"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 hover:stroke-opacity-80"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-slate-900">{total}</div>
          <div className="text-sm text-slate-500 font-medium">{centerLabel}</div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="ml-8 space-y-3">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div
              className="w-4 h-4 rounded-full shadow-sm"
              style={{ backgroundColor: colors[index % colors.length] }}
            ></div>
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-900">{segment.label}</div>
              <div className="text-xs text-slate-500">{segment.percentage}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AttendanceBarChart: React.FC<{ data: AttendanceData[] }> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => Math.max(d.present, d.absent, d.late)));
  
  return (
    <div className="h-64 flex items-end justify-center space-x-4 px-4">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1 max-w-16">
          <div className="relative flex items-end space-x-1 h-40 mb-3">
            {/* Present bar */}
            <div className="relative group">
              <div
                className="w-4 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all duration-500 hover:from-blue-600 hover:to-blue-500"
                style={{ height: `${(item.present / maxValue) * 160}px` }}
              ></div>
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Present: {item.present}
              </div>
            </div>
            
            {/* Absent bar */}
            <div className="relative group">
              <div
                className="w-4 bg-gradient-to-t from-red-400 to-red-300 rounded-t-sm transition-all duration-500 hover:from-red-500 hover:to-red-400"
                style={{ height: `${(item.absent / maxValue) * 160}px` }}
              ></div>
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Absent: {item.absent}
              </div>
            </div>
            
            {/* Late bar */}
            <div className="relative group">
              <div
                className="w-4 bg-gradient-to-t from-amber-400 to-amber-300 rounded-t-sm transition-all duration-500 hover:from-amber-500 hover:to-amber-400"
                style={{ height: `${(item.late / maxValue) * 160}px` }}
              ></div>
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Late: {item.late}
              </div>
            </div>
          </div>
          
          <div className="text-sm font-medium text-slate-600">{item.day}</div>
        </div>
      ))}
    </div>
  );
};


export default function ModernHRDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
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
    //DOB
    dateOfBirth: '',
    status: 'Active',
    profilePhotoUrl: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumberOnly, setPhoneNumberOnly] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch all HR data
  useEffect(() => {
    const fetchHRData = async () => {
      try {
        setLoading(true);
        
        // Fetch employees
        const employeesRes = await fetch(`${APIURL}/api/employees`);
        if (employeesRes.ok) {
          const text = await employeesRes.text();
          const employeesData = text ? JSON.parse(text) : [];
          setEmployees(employeesData);
        }

        // Fetch attendance data (mock for now as specific endpoint not found)
        const mockAttendanceData = [
          { day: 'Mon', present: 1150, absent: 45, late: 85 },
          { day: 'Tue', present: 1200, absent: 30, late: 50 },
          { day: 'Wed', present: 1100, absent: 60, late: 120 },
          { day: 'Thu', present: 1180, absent: 40, late: 60 },
          { day: 'Fri', present: 1050, absent: 80, late: 150 }
        ];
        setAttendanceData(mockAttendanceData);

        // Fetch leave requests
        const leavesRes = await fetch(`${APIURL}/api/leave-requests`);
        if (leavesRes.ok) {
          const text = await leavesRes.text();
          const leavesData = text ? JSON.parse(text) : [];
          setLeaveRequests(leavesData);
        }

        // Fetch activities
        const activitiesRes = await fetch(`${APIURL}/api/activities`);
        if (activitiesRes.ok) {
          const text = await activitiesRes.text();
          const activitiesData = text ? JSON.parse(text) : [];
          setActivities(activitiesData.slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching HR data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHRData();
  }, []);

  // Calculate metrics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.status === 'Active').length;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newHires = employees.filter(emp => {
    const joinDate = new Date(emp.joiningDate);
    return joinDate >= thirtyDaysAgo;
  }).length;

  // Department distribution
  const deptCounts = employees.reduce((acc: Record<string, number>, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {});
  
  const departmentData = Object.entries(deptCounts).map(([label, count]: [string, number]) => ({
    label,
    percentage: Math.round((count / totalEmployees) * 100)
  }));

  // Calculate leave and performance metrics
  const onLeaveToday = leaveRequests.filter(req => {
    const today = new Date().toISOString().split('T')[0];
    return req.status === 'approved' && req.startDate <= today && req.endDate >= today;
  }).length;

  // No longer needed: const pendingReviews = 8;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <MetricCard
            title="Total Employees"
            value={loading ? "..." : totalEmployees.toLocaleString()}
            change="+5.2%"
            changeType="positive"
            icon={Users}
            subtitle="All-time high"
            trend={[0.2, 0.4, 0.3, 0.7, 0.6, 0.8]}
          />
          <MetricCard
            title="Active Today"
            value={loading ? "..." : activeEmployees.toLocaleString()}
            change="+2.1%"
            changeType="positive"
            icon={UserCheck}
            subtitle="Currently online"
            trend={[0.3, 0.6, 0.4, 0.8, 0.7, 0.9]}
          />
          <MetricCard
            title="New Hires"
            value={loading ? "..." : newHires.toString()}
            change="+12.5%"
            changeType="positive"
            icon={TrendingUp}
            subtitle="Last 30 days"
            trend={[0.1, 0.3, 0.2, 0.5, 0.4, 0.6]}
          />
          <MetricCard
            title="Departments"
            value={loading ? "..." : Object.keys(deptCounts).length.toString()}
            change="Stable"
            changeType="neutral"
            icon={Briefcase}
            subtitle="Active divisions"
            trend={[0.5, 0.5, 0.5, 0.5, 0.5, 0.5]}
          />
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* added responsive */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900">{loading ? "..." : onLeaveToday}</div>
                <div className="text-sm font-medium text-slate-600">On Leave Today</div>
              </div>
              <div className="p-2 sm:p-3 bg-orange-100 rounded-xl">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Department Distribution */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Department Distribution</h3>
                <p className="text-sm text-slate-500">Employee allocation</p>
              </div>
              <PieChart className="w-5 h-5 text-slate-400" />
            </div>
            <ModernPieChart segments={departmentData} size={180} centerLabel="Depts" />
          </div>

          {/* Attendance Trends */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Attendance Trends</h3>
                <p className="text-sm text-slate-500">Weekly overview</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-6 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-slate-600 font-medium">Present</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span className="text-slate-600 font-medium">Absent</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                    <span className="text-slate-600 font-medium">Late</span>
                  </div>
                </div>
                <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            <AttendanceBarChart data={attendanceData} />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Quick Actions</h3>
              <Settings className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/hr/leaves'}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-slate-900">Manage Leaves</div>
                    <div className="text-xs text-slate-500">Review requests</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
              
              <button
                onClick={() => window.location.href = '/hr/performance'}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-slate-900">Performance</div>
                    <div className="text-xs text-slate-500">Review metrics</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Recent Activity</h3>
              <button className="text-blue-600 text-sm hover:text-blue-700 font-medium transition-colors">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-slate-500">Loading activities...</div>
              ) : activities.length > 0 ? (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white bg-blue-500">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-900 truncate">{activity.name}</h4>
                        <div className="flex items-center text-xs text-slate-500 ml-2">
                          <Clock className="w-3 h-3 mr-1" />
                          {activity.activityDate}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{activity.description}</p>
                      <p className="text-xs text-slate-500 mt-1">{activity.category} • {activity.status}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">No recent activities</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Add New Employee</h2>
                    <p className="text-blue-100 mt-1">Create a new team member profile</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Employee ID *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                        placeholder="Enter Employee ID"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={formData.employeeName}
                        onChange={(e) => setFormData({...formData, employeeName: e.target.value})}
                        placeholder="Enter the FullName.."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                      <input
                        type="email"
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="Enter Email Address"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
                      <div className="flex space-x-2">
                        <select
                          className="px-3 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          value={countryCode}
                          onChange={e => setCountryCode(e.target.value)}
                        >
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+61">🇦🇺 +61</option>
                        </select>
                        <input
                          type="text"
                          required
                          maxLength={10}
                          className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          value={phoneNumberOnly}
                          onChange={e => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setPhoneNumberOnly(val);
                            setFormData({...formData, phoneNumber: countryCode + val});
                          }}
                          placeholder="Enter the Phone no"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={formData.dateOfBirth || ''}
                        onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Work Information */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    Work Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Job Title *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={formData.position}
                        onChange={(e) => setFormData({...formData, position: e.target.value})}
                        placeholder="Enter Department"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Department *</label>
                      <select
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                      >
                        <option value="">Select Department</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Sales">Sales</option>
                        <option value="Marketing">Marketing</option>
                        <option value="HR">Human Resources</option>
                        <option value="Operations">Operations</option>
                        <option value="Finance">Finance</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Joining Date *</label>
                      <input
                        type="date"
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={formData.joiningDate}
                        onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Employment Status</label>
                      <select
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="Active">Active</option>
                        <option value="Joining">Joining Soon</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Exit">Exit</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Security & Additional Info */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    Security & Additional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          placeholder="Enter secure password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Blood Group</label>
                      <select
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
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
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Current Address</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      value={formData.currentAddress}
                      onChange={(e) => setFormData({...formData, currentAddress: e.target.value})}
                      placeholder="Enter current residential address"
                    />
                  </div>
                  
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Permanent Address</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      value={formData.permanentAddress}
                      onChange={(e) => setFormData({...formData, permanentAddress: e.target.value})}
                      placeholder="Enter permanent address"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {formError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <p className="text-sm text-red-700 font-medium">{formError}</p>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex space-x-4 pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={async () => {
                      setFormError('');
                      
                      // Validation
                      if (!formData.email || !formData.email.includes('@')) {
                        setFormError('Please enter a valid email address.');
                        return;
                      }
                      if (!formData.password || formData.password.length < 8) {
                        setFormError('Password must be at least 8 characters long.');
                        return;
                      }
                      if (!phoneNumberOnly || phoneNumberOnly.length !== 10) {
                        setFormError('Phone number must be exactly 10 digits.');
                        return;
                      }
                      
                      try {
                        // Simulate API call
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        setShowAddEmployeeModal(false);
                        setFormData({
                          employeeId: '', employeeName: '', email: '', password: '',
                          phoneNumber: '', bloodGroup: '', currentAddress: '', permanentAddress: '',
                          position: '', department: '', joiningDate: '', dateOfBirth: '', status: 'Active', profilePhotoUrl: ''
                        });
                        setPhoneNumberOnly('');
                        setFormError('');
                      } catch {
                        setFormError('Failed to add employee. Please try again.');
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Create Employee
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddEmployeeModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-6 rounded-xl font-semibold transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}