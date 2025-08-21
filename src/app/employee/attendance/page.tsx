'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCcw,
  MapPin,
  TrendingUp,
  Award,
  Target,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { APIURL } from '@/constants/api';

interface Attendance {
  id?: number;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: 'present' | 'absent' | 'half-day' | 'late';
  workHours: number;
  employeeId: string;
  workLocation?: string;
}

interface AttendanceRecord {
  id?: number;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workHours: number;
  status: 'present' | 'absent' | 'half-day' | 'late';
  employeeId: string;
  workLocation?: string;
}

const WORK_TARGET_HOURS = 8;

const WORK_LOCATIONS = [
  { value: 'head_office', label: 'Head Office' },
  { value: 'branch_office', label: 'Branch Office' },
  { value: 'remote', label: 'Remote' }
];

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'year'>('week');
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const router = useRouter();

  const API_BASE_URL = `${APIURL}/api/attendance`;

  useEffect(() => {
    const id = sessionStorage.getItem('employeeId') || localStorage.getItem('employeeId');
    if (!id) {
      router.replace('/login');
      return;
    }
    setEmployeeId(id);
  }, [router]);

  const fetchAttendance = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/employee/${employeeId}`);
      const fetchedAttendance: Attendance[] = response.data.map((record: AttendanceRecord) => ({
        ...record,
        checkInTime: record.checkInTime || null,
        checkOutTime: record.checkOutTime || null,
        workHours: record.workHours || 0,
      }));

      setAttendance(fetchedAttendance);
      const today = new Date();
      const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const existingTodayAttendance = fetchedAttendance.find((a) => a.date === formattedToday);

      if (existingTodayAttendance) {
        setTodayAttendance(existingTodayAttendance);
      } else {
        const newAttendance: Attendance = {
          date: formattedToday,
          checkInTime: null,
          checkOutTime: null,
          status: 'absent',
          workHours: 0,
          employeeId: employeeId,
        };
        setTodayAttendance(newAttendance);
        setAttendance((prev) => [newAttendance, ...prev]);
      }
    } catch (err: unknown) { // Changed to 'unknown' for better type safety
      if (err instanceof Error) {
        console.error('Error fetching attendance:', err.message);
        setError('Failed to fetch attendance data. Please try again.');
      } else {
        console.error('An unexpected error occurred:', err);
        setError('Failed to fetch attendance data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [employeeId, API_BASE_URL]);

  useEffect(() => {
    if (employeeId) {
      fetchAttendance();
    }
  }, [fetchAttendance, employeeId]);

  const handleSignIn = async (location: string) => {
    if (!employeeId) {
      setError('Employee ID and work location are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const payload = {
        employeeId: String(employeeId),
        checkInTime: String(timeString),
        workLocation: String(location),
        latitude: 0.0,
        longitude: 0.0
      };

      const response = await axios.post(`${API_BASE_URL}/mark`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      const updatedRecord = response.data;
      const formattedRecord = {
        ...updatedRecord,
        date: Array.isArray(updatedRecord.date)
          ? `${updatedRecord.date[0]}-${String(updatedRecord.date[1]).padStart(2, '0')}-${String(updatedRecord.date[2]).padStart(2, '0')}`
          : updatedRecord.date
      };

      setTodayAttendance(formattedRecord);
      setAttendance(prev => {
        const existingIndex = prev.findIndex(a => a.date === formattedRecord.date);
        if (existingIndex !== -1) {
          const newArr = [...prev];
          newArr[existingIndex] = formattedRecord;
          return newArr;
        } else {
          return [formattedRecord, ...prev];
        }
      });
      setError(null);
      setShowLocationDropdown(false);
    } catch (err: unknown) { // Changed to 'unknown'
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed. Please try again.';
      setError(errorMessage);
      setShowLocationDropdown(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!todayAttendance?.checkInTime || !employeeId) {
      return;
    }

    try {
      setLoading(true);
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const payload = {
        employeeId: employeeId,
        checkOutTime: timeString,
      };

      const response = await axios.post(`${API_BASE_URL}/mark`, payload);
      const updatedRecord = response.data as Attendance;

      const formattedRecord = {
        ...updatedRecord,
        date: Array.isArray(updatedRecord.date)
          ? `${updatedRecord.date[0]}-${String(updatedRecord.date[1]).padStart(2, '0')}-${String(updatedRecord.date[2]).padStart(2, '0')}`
          : updatedRecord.date
      };

      setTodayAttendance(formattedRecord);
      setAttendance(prev => {
        const index = prev.findIndex(a => a.date === formattedRecord.date);
        if (index !== -1) {
          const newArr = [...prev];
          newArr[index] = formattedRecord;
          return newArr;
        }
        return prev;
      });
      setError(null);
    } catch (err: unknown) { // Changed to 'unknown'
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location: string) => {
    // No need to set selectedLocation state if you call handleSignIn immediately
    handleSignIn(location);
  };

  const cancelSignIn = () => {
    setShowLocationDropdown(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'half-day':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'absent':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'late':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatWorkHours = (hours: number): string => {
    if (hours === 0) return '0 mins';
    const totalMinutes = Math.round(hours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0) {
      return `${mins} mins`;
    } else if (mins === 0) {
      return `${hrs} hour${hrs > 1 ? 's' : ''}`;
    } else {
      return `${hrs} hour${hrs > 1 ? 's' : ''} ${mins} mins`;
    }
  };

  const renderAttendanceStats = () => {
    const stats = attendance.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const totalWorkHours = attendance.reduce((acc, curr) => acc + curr.workHours, 0);
    const avgWorkHours = attendance.length > 0 ? totalWorkHours / attendance.length : 0;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-600 mb-1">Present Days</p>
              <p className="text-3xl font-bold text-emerald-700">{stats.present || 0}</p>
              <p className="text-xs text-emerald-600 mt-1">This period</p>
            </div>
            <div className="p-3 bg-emerald-200 rounded-xl">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-2xl border border-amber-200 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-600 mb-1">Half Days</p>
              <p className="text-3xl font-bold text-amber-700">{stats['half-day'] || 0}</p>
              <p className="text-xs text-amber-600 mt-1">This period</p>
            </div>
            <div className="p-3 bg-amber-200 rounded-xl">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-6 rounded-2xl border border-rose-200 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-rose-600 mb-1">Absent Days</p>
              <p className="text-3xl font-bold text-rose-700">{stats.absent || 0}</p>
              <p className="text-xs text-rose-600 mt-1">This period</p>
            </div>
            <div className="p-3 bg-rose-200 rounded-xl">
              <XCircle className="w-8 h-8 text-rose-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-2xl border border-indigo-200 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-600 mb-1">Avg Hours</p>
              <p className="text-3xl font-bold text-indigo-700">{avgWorkHours.toFixed(1)}</p>
              <p className="text-xs text-indigo-600 mt-1">Per day</p>
            </div>
            <div className="p-3 bg-indigo-200 rounded-xl">
              <TrendingUp className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const effectiveWorkHours = useMemo(() => {
    if (!todayAttendance) return 0;
    if (todayAttendance.checkOutTime) return todayAttendance.workHours || 0;
    if (todayAttendance.checkInTime) {
      const [h, m, s] = todayAttendance.checkInTime.split(':').map((v) => parseInt(v || '0', 10));
      const start = new Date();
      start.setHours(h, m, s || 0, 0);
      const now = new Date();
      const minutes = Math.max(0, Math.round((now.getTime() - start.getTime()) / 60000));
      return minutes / 60;
    }
    return 0;
  }, [todayAttendance]); // Removed 'tick' dependency

  const WorkHoursRing = ({ hours = 0, targetHours = WORK_TARGET_HOURS }: { hours: number; targetHours: number }) => {
    const percentage = Math.min((hours / targetHours) * 100, 100);
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    return (
      <div className="relative w-56 h-56 flex items-center justify-center">
        <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <circle cx="80" cy="80" r={radius} strokeWidth="12" className="stroke-slate-200" fill="none" />
          <circle
            cx="80"
            cy="80"
            r={radius}
            strokeWidth="12"
            stroke="url(#progressGradient)"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            filter="url(#glow)"
          />
        </svg>
        <div className="text-center z-10 bg-white rounded-full p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-center mb-2">
            <Target className="w-5 h-5 text-indigo-600 mr-2" />
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Progress</span>
          </div>
          <span className="text-4xl font-bold text-slate-800 block">{hours.toFixed(1)}</span>
          <span className="text-lg text-slate-500 block">/ {targetHours}h</span>
          <span className="text-sm text-slate-400 block mt-1">{percentage.toFixed(0)}% Complete</span>
        </div>
      </div>
    );
  };

  const renderAttendanceHistory = () => {
    const now = new Date();
    let filteredAttendance = attendance;
    if (viewMode === 'week') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      filteredAttendance = attendance.filter(record =>
        new Date(record.date) >= startOfWeek
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (viewMode === 'month') {
      filteredAttendance = attendance.filter(record =>
        new Date(record.date).getMonth() === now.getMonth() &&
        new Date(record.date).getFullYear() === now.getFullYear()
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (viewMode === 'year') {
      filteredAttendance = attendance.filter(record =>
        new Date(record.date).getFullYear() === now.getFullYear()
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Attendance History</h3>
            <p className="text-slate-600">Track your daily attendance and work patterns</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchAttendance}
              disabled={loading}
              className="p-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200 disabled:opacity-50 hover:scale-105"
              title="Refresh"
            >
              <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex space-x-1 bg-slate-100 rounded-xl p-1">
              {(['week', 'month', 'year'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 capitalize
                    ${viewMode === mode 
                      ? 'bg-white text-slate-800 shadow-md' 
                      : 'text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {filteredAttendance.length > 0 ? (
            filteredAttendance.map((record, index) => (
              <div key={record.id || index} 
                  className="group flex items-center justify-between p-6 border border-slate-200 rounded-xl 
                             transition-all duration-300 hover:shadow-lg hover:border-indigo-200 hover:-translate-y-1">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-600">
                      {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                    </p>
                    <p className="text-2xl font-bold text-slate-800">
                      {new Date(record.date).getDate()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(record.date).toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-8 text-sm">
                    <div>
                      <p className="font-semibold text-slate-600 mb-1">Sign In</p>
                      <p className="text-slate-800 font-medium">{record.checkInTime || '—'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-600 mb-1">Sign Out</p>
                      <p className="text-slate-800 font-medium">{record.checkOutTime || '—'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-600 mb-1">Hours</p>
                      <p className="text-slate-800 font-medium">{formatWorkHours(record.workHours || 0)}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-600 mb-1">Location</p>
                      <p className="text-slate-800 font-medium">
                        {record.workLocation ? 
                          WORK_LOCATIONS.find(loc => loc.value === record.workLocation)?.label || record.workLocation 
                          : '—'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {record.workHours >= 8 && (
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Award className="w-4 h-4 text-emerald-600" />
                    </div>
                  )}
                  <span className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors
                                 ${getStatusColor(record.status)}`}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No attendance records found for this period</p>
              <p className="text-slate-400 text-sm">Records will appear here once you start tracking attendance</p>
            </div>
          )}
        </div>
      </div>
    );
  };
 
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="mb-6">
              <Link
                href="/employee"
                className="inline-flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
            </div>

            <div className="space-y-10">
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 bg-slate-50 border-b border-slate-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Today&apos;s Attendance</h3>
                      <p className="text-sm text-slate-500 mb-2">
                        {new Date().toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <div className="inline-flex items-center space-x-2 text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-medium px-2 py-1 rounded-md border border-slate-300 bg-white">
                          {todayAttendance?.workLocation ? 
                            WORK_LOCATIONS.find(loc => loc.value === todayAttendance.workLocation)?.label || todayAttendance.workLocation
                            : 'Work location will be set on sign in'
                          }
                        </span>
                      </div>
                      {error && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Employee ID</p>
                      <p className="text-base font-semibold text-slate-800">{employeeId || 'Loading...'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex flex-wrap gap-3 mb-8">
                    <div className="relative">
                      <button
                        onClick={() => setShowLocationDropdown(true)}
                        disabled={loading || todayAttendance?.checkInTime !== null}
                        className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center space-x-3
                          ${todayAttendance?.checkInTime !== null
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            : loading
                            ? 'bg-emerald-400 text-white cursor-not-allowed'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                      >
                        <CheckCircle className="w-6 h-6" />
                        <span>{loading ? 'Processing...' : 'Sign In'}</span>
                        {!todayAttendance?.checkInTime && !loading && (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      
                      {showLocationDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                          <div className="p-4">
                            <p className="text-sm font-semibold text-slate-700 mb-3">Select Work Location</p>
                            <div className="space-y-2">
                              {WORK_LOCATIONS.map((location) => (
                                <button
                                  key={location.value}
                                  onClick={() => handleLocationSelect(location.value)}
                                  disabled={loading}
                                  className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-100 text-sm text-slate-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                                >
                                  <MapPin className="w-4 h-4 text-slate-400" />
                                  <span>{location.label}</span>
                                </button>
                              ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <button
                                onClick={cancelSignIn}
                                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={handleSignOut}
                      disabled={loading || !todayAttendance?.checkInTime || todayAttendance?.checkOutTime !== null}
                      className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center space-x-3
                        ${!todayAttendance?.checkInTime || todayAttendance?.checkOutTime !== null
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : loading
                          ? 'bg-red-400 text-white cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                    >
                      <XCircle className="w-6 h-6" />
                      <span>{loading ? 'Processing...' : 'Sign Out'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-center">
                    <div className="flex justify-center">
                      <WorkHoursRing hours={effectiveWorkHours} targetHours={WORK_TARGET_HOURS} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8">
                      <div className="text-center p-6 bg-slate-50 rounded-xl">
                        <Clock className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                        <p className="text-slate-600 font-semibold mb-2">Sign In</p>
                        <p className="text-2xl font-bold text-slate-800">
                          {todayAttendance?.checkInTime || '—'}
                        </p>
                      </div>
                      
                      <div className="text-center p-6 bg-slate-50 rounded-xl">
                        <Clock className="w-8 h-8 text-rose-600 mx-auto mb-3" />
                        <p className="text-slate-600 font-semibold mb-2">Sign Out</p>
                        <p className="text-2xl font-bold text-slate-800">
                          {todayAttendance?.checkOutTime || '—'}
                        </p>
                      </div>
                      
                      <div className="text-center p-6 bg-slate-50 rounded-xl">
                        <Target className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                        <p className="text-slate-600 font-semibold mb-2">Work Hours</p>
                        <p className="text-2xl font-bold text-slate-800">
                          {effectiveWorkHours.toFixed(1)} hrs
                        </p>
                      </div>
                      
                      <div className="text-center p-6 bg-slate-50 rounded-xl">
                        <Award className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                        <p className="text-slate-600 font-semibold mb-2">Status</p>
                        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold border
                                         ${todayAttendance ? getStatusColor(todayAttendance.status) : 'bg-slate-100 text-slate-600'}`}>
                          {todayAttendance ? todayAttendance.status.charAt(0).toUpperCase() + todayAttendance.status.slice(1) : 'Absent'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {renderAttendanceStats()}
              {renderAttendanceHistory()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}