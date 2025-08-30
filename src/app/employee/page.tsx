'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // Import Next.js Image component
import axios from 'axios';
import {
  Clock, User, Activity, TrendingUp,
  Shield, Mail, Phone, MapPin, Briefcase,
} from 'lucide-react';

// Interfaces for data type
interface Employee {
  id: number;
  employeeName: string;
  employeeId: string;
  position: string;
  department: string;
  email: string;
  phoneNumber: string;
  bloodGroup: string;
  profilePhotoUrl: string;
  currentAddress: string;
  permanentAddress: string;
  joiningDate: string;
  relievingDate: string;
  status: string;
  password?: string;
}

interface TodayAttendance {
  id?: number;
  employeeId: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
  workHours: number;
  overtimeHours?: number;
  breakTime?: number;
}

// API Configuration
const APIURL = process.env.NEXT_PUBLIC_API_URL || 'https://hr-management-b.onrender.com';

// Work Hours Progress Ring Component
const WorkHoursRing = ({ hours = 0, targetHours = 8 }: { hours?: number; targetHours?: number }) => {
  const percentage = Math.min((hours / targetHours) * 100, 100);
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative w-56 h-56 flex items-center justify-center">
      <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="30%" stopColor="#8B5CF6" />
            <stop offset="60%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle
          cx="80" cy="80" r="70"
          strokeWidth="12"
          className="stroke-slate-100"
          fill="none"
        />
        <circle
          cx="80" cy="80" r="70"
          strokeWidth="12"
          stroke="url(#progressGradient)"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-2000 ease-out"
          filter="url(#glow)"
        />
      </svg>
      <div className="text-center z-10 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
        <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
          {hours.toFixed(1)}
        </span>
        <span className="text-lg text-slate-500 font-medium block">/ {targetHours}h</span>
        <span className="text-sm text-slate-400 block mt-1 font-medium">Today</span>
      </div>
    </div>
  );
};

// Profile Photo Component with error handling
const ProfilePhoto = ({ employee }: { employee: Employee }) => {
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoError, setPhotoError] = useState<boolean>(false);
  const [photoLoading, setPhotoLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadProfilePhoto = async () => {
      if (!employee?.profilePhotoUrl) {
        setPhotoLoading(false);
        return;
      }

      try {
        setPhotoLoading(true);
        setPhotoError(false);

        // If the URL is already a complete URL (from Cloudinary), use it directly
        if (employee.profilePhotoUrl.startsWith('http')) {
          setPhotoUrl(employee.profilePhotoUrl);
        } else {
          // If it's a relative path, construct the full URL
          setPhotoUrl(`${APIURL}${employee.profilePhotoUrl}`);
        }
      } catch (error) {
        console.error('Error loading profile photo:', error);
        setPhotoError(true);
      } finally {
        setPhotoLoading(false);
      }
    };

    loadProfilePhoto();
  }, [employee?.profilePhotoUrl]);

  const handleImageError = () => {
    setPhotoError(true);
    setPhotoLoading(false);
  };

  const handleImageLoad = () => {
    setPhotoLoading(false);
    setPhotoError(false);
  };

  if (photoLoading) {
    return (
      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shadow-lg animate-pulse">
        <User size={24} className="text-slate-400" />
      </div>
    );
  }

  if (photoError || !photoUrl) {
    return (
      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
        <User size={36} className="text-white" />
      </div>
    );
  }

  return (
    <Image
      src={photoUrl}
      alt={employee?.employeeName || 'User'}
      width={96}
      height={96}
      className="w-24 h-24 mx-auto mb-4 rounded-full object-cover border-4 border-white shadow-lg"
      onError={handleImageError}
      onLoad={handleImageLoad}
      unoptimized={!photoUrl.startsWith('http')} // Use unoptimized for local paths
    />
  );
};

// Main Dashboard Component
export default function MainDashboardPage() {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Timer for real-time work hours calculation
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  // Fetch all dashboard data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const employeeId = localStorage.getItem("employeeId");
    if (!employeeId) {
      router.replace('/login');
      return;
    }

    try {
      // Fetch employee data
      const employeeResponse = await axios.get<Employee>(
        `${APIURL}/api/employees/byEmployeeId/${employeeId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      const employeeData = employeeResponse.data;
      if (!employeeData) {
        throw new Error('Employee data not found.');
      }
      
      setEmployee(employeeData);

      // Fetch attendance data
      let attendanceData: TodayAttendance | null = null;
      try {
        const attendanceResponse = await axios.get<TodayAttendance[]>(
          `${APIURL}/api/attendance/employee/${employeeId}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );

        const today = new Date().toISOString().split('T')[0];
        const records = attendanceResponse.data || [];
        
        // Helper function to normalize date format
        const normalizeDate = (dateValue: number[] | string): string => {
          if (Array.isArray(dateValue) && dateValue.length >= 3) {
            return `${dateValue[0]}-${String(dateValue[1]).padStart(2, '0')}-${String(dateValue[2]).padStart(2, '0')}`;
          }
          if (typeof dateValue === 'string') {
            return dateValue.split('T')[0];
          }
          return '';
        };

        const todayRecord = records.find((record) => normalizeDate(record.date) === today);
        attendanceData = todayRecord || {
          employeeId: employeeId,
          date: today,
          checkInTime: null,
          checkOutTime: null,
          status: 'absent',
          workHours: 0
        };
      } catch (attendanceError) {
        console.warn('Failed to fetch attendance data:', attendanceError);
        attendanceData = {
          employeeId: employeeId,
          date: new Date().toISOString().split('T')[0],
          checkInTime: null,
          checkOutTime: null,
          status: 'absent',
          workHours: 0
        };
      }
      
      setTodayAttendance(attendanceData);

    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          setError("Employee not found. Please check your credentials.");
        } else if (err.response?.status === 401) {
          setError("Unauthorized access. Please login again.");
          localStorage.removeItem("employeeId");
          router.replace('/login');
          return;
        } else if (err.code === 'ECONNABORTED') {
          setError("Request timeout. Please check your internet connection.");
        } else {
          setError("Failed to load dashboard data. Please check your network and try again.");
        }
      } else {
        setError("Failed to load dashboard data. An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Calculate effective work hours
  const effectiveWorkHours = useMemo(() => {
    if (!todayAttendance) return 0;
    
    // If already checked out, use stored work hours
    if (todayAttendance.checkOutTime && todayAttendance.workHours) {
      return todayAttendance.workHours;
    }
    
    // If checked in but not out, calculate current work hours
    if (todayAttendance.checkInTime) {
      try {
        const [hours, minutes, seconds] = (todayAttendance.checkInTime || '00:00:00')
          .split(':')
          .map((v) => parseInt(v || '0', 10));
        
        const startTime = new Date();
        startTime.setHours(hours, minutes, seconds || 0, 0);
        
        const currentTime = new Date();
        const timeDifferenceMs = Math.max(0, currentTime.getTime() - startTime.getTime());
        const workMinutes = Math.round(timeDifferenceMs / 60000);
        
        return workMinutes / 60;
      } catch (error) {
        console.error('Error calculating work hours:', error);
        return 0;
      }
    }
    
    return 0;
  }, [todayAttendance, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-slate-700 mb-2">Loading Dashboard</h2>
          <p className="text-slate-600 font-medium">Fetching your latest data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl text-center max-w-md w-full">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Activity size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-red-800 mb-4">Dashboard Error</h2>
          <p className="text-red-600 font-medium mb-8 leading-relaxed">
            {error || 'Employee data not found. Please check your credentials.'}
          </p>
          <button
            onClick={fetchData}
            className="px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 mx-auto font-semibold"
          >
            <Activity size={20} /> Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Employee Dashboard
          </h1>
          <p className="text-slate-600 font-medium">
            Welcome back, {employee?.employeeName || 'User'}! Here&apos;s your daily overview.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Card */}
          <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl border border-slate-200/60 shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <ProfilePhoto employee={employee} />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <Shield size={16} className="text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                {employee?.employeeName || 'User'}
              </h3>
              <p className="text-lg text-blue-600 font-semibold">{employee?.position || 'Position'}</p>
              <p className="text-sm text-slate-500 font-medium mt-1">{employee?.department || 'Department'}</p>
              <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                {employee?.status || 'Active'}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center text-sm bg-slate-50/50 p-4 rounded-xl hover:bg-slate-100/50 transition-colors">
                <Mail size={18} className="text-blue-500 mr-3 flex-shrink-0" />
                <span className="text-slate-700 font-medium truncate">{employee?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm bg-slate-50/50 p-4 rounded-xl hover:bg-slate-100/50 transition-colors">
                <Phone size={18} className="text-green-500 mr-3 flex-shrink-0" />
                <span className="text-slate-700 font-medium">{employee?.phoneNumber || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm bg-slate-50/50 p-4 rounded-xl hover:bg-slate-100/50 transition-colors">
                <MapPin size={18} className="text-red-500 mr-3 flex-shrink-0" />
                <span className="text-slate-700 font-medium truncate">{employee?.currentAddress || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm bg-slate-50/50 p-4 rounded-xl hover:bg-slate-100/50 transition-colors">
                <Briefcase size={18} className="text-purple-500 mr-3 flex-shrink-0" />
                <span className="text-slate-700 font-medium">
                  Joined {employee?.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              {employee?.bloodGroup && (
                <div className="flex items-center text-sm bg-slate-50/50 p-4 rounded-xl hover:bg-slate-100/50 transition-colors">
                  <Activity size={18} className="text-red-500 mr-3 flex-shrink-0" />
                  <span className="text-slate-700 font-medium">Blood Group: {employee.bloodGroup}</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl border border-slate-200/60 shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col items-center justify-center">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
                Today&apos;s Progress
              </h3>
              <p className="text-sm text-slate-500 font-medium">Your daily productivity tracker</p>
            </div>
            
            <div className="flex justify-center mb-8">
              <WorkHoursRing hours={effectiveWorkHours} />
            </div>
            
            <div className="grid grid-cols-3 gap-4 w-full">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl text-center hover:scale-105 transition-transform">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Activity size={20} className="text-white" />
                </div>
                <p className="text-xs text-blue-600 mb-1 font-semibold uppercase tracking-wide">Status</p>
                <p className="text-sm font-bold text-blue-800 capitalize">
                  {todayAttendance?.status || 'Absent'}
                </p>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl text-center hover:scale-105 transition-transform">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Clock size={20} className="text-white" />
                </div>
                <p className="text-xs text-purple-600 mb-1 font-semibold uppercase tracking-wide">Hours</p>
                <p className="text-sm font-bold text-purple-800">
                  {effectiveWorkHours.toFixed(1)}h
                </p>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl text-center hover:scale-105 transition-transform">
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <p className="text-xs text-emerald-600 mb-1 font-semibold uppercase tracking-wide">Efficiency</p>
                <p className="text-sm font-bold text-emerald-800">
                  {Math.min(Math.round((effectiveWorkHours / 8) * 100), 100)}%
                </p>
              </div>
            </div>

            {/* Attendance Details */}
            {todayAttendance && (
              <div className="mt-6 w-full grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <p className="text-xs text-green-600 font-semibold mb-1">Check In</p>
                  <p className="text-sm font-bold text-green-800">
                    {todayAttendance.checkInTime || '--:--'}
                  </p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-xl">
                  <p className="text-xs text-red-600 font-semibold mb-1">Check Out</p>
                  <p className="text-sm font-bold text-red-800">
                    {todayAttendance.checkOutTime || '--:--'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl border border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-semibold mb-1">This Week</p>
                <p className="text-2xl font-bold text-slate-800">{(effectiveWorkHours * 5).toFixed(1)}h</p>
                <p className="text-xs text-emerald-600 font-medium">Estimated weekly hours</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Clock size={24} className="text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl border border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-semibold mb-1">Days Active</p>
                <p className="text-2xl font-bold text-slate-800">
                  {employee?.joiningDate ?
                    Math.floor((new Date().getTime() - new Date(employee.joiningDate).getTime()) / (1000 * 3600 * 24))
                    : 0}
                </p>
                <p className="text-xs text-purple-600 font-medium">Since joining</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Activity size={24} className="text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl border border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-semibold mb-1">Productivity</p>
                <p className="text-2xl font-bold text-slate-800">{Math.min(Math.round((effectiveWorkHours / 8) * 100), 100)}%</p>
                <p className="text-xs text-emerald-600 font-medium">Today&apos;s efficiency</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <TrendingUp size={24} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-slate-400 text-sm font-medium">
            Last updated: {new Date().toLocaleString()} • Employee ID: {employee?.employeeId}
          </p>
        </div>
      </div>
    </div>
  );
}