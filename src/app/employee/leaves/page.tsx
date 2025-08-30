'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, XCircle, Plus } from 'lucide-react';
import axios from 'axios';
import { APIURL } from '@/constants/api';

interface Leave {
  id?: number;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  numberOfDays?: number;
  status: string;
  reason: string;
  hrComments?: string;
  requestDate?: string;
}

interface LeaveApiResponse {
  id: number;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string | number[];
  endDate: string | number[];
  numberOfDays?: number;
  status: string;
  reason: string;
  hrComments?: string;
  requestDate?: string | number[];
}

interface Holiday {
  id: number;
  holidayName: string;
  day: string;
  startDate: [number, number, number];
  endDate: [number, number, number];
  type: string;
  coverage: string;
}

interface HolidayApiResponse {
  id: number;
  holidayName?: string;
  employeeName?: string;
  day?: string;
  startDate?: [number, number, number];
  endDate?: [number, number, number];
  type?: string;
  coverage?: string;
}

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [newLeave, setNewLeave] = useState<Partial<Leave>>({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const normalizeDate = (d: string | number[] | undefined): string => {
    if (!d) return '';
    if (Array.isArray(d) && d.length >= 3) {
      const [y, m, day] = d;
      return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    if (typeof d === 'string') return d.split('T')[0];
    return '';
  };

  const fetchLeaves = useCallback(async (empId: string) => {
    try {
      const res = await axios.get(`${APIURL}/api/leave-requests/employee/${empId}`);
      const list = Array.isArray(res.data) ? res.data : [];
      const mapped: Leave[] = list.map((r: LeaveApiResponse) => ({
        id: r.id,
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        leaveType: r.leaveType,
        startDate: normalizeDate(r.startDate),
        endDate: normalizeDate(r.endDate),
        numberOfDays: r.numberOfDays,
        status: (r.status?.toLowerCase?.() || r.status || 'pending'),
        reason: r.reason,
        hrComments: r.hrComments,
        requestDate: normalizeDate(r.requestDate)
      }));
      setLeaves(mapped);
    } catch {
      // Logic for handling the error can be added here
    }
  }, []);

  const fetchHolidays = useCallback(async () => {
    try {
      const res = await axios.get(`${APIURL}/api/holidays`);
      const list = Array.isArray(res.data) ? res.data : [];
      const mapped: Holiday[] = list.map((h: HolidayApiResponse) => ({
        id: h.id,
        holidayName: h.holidayName || h.employeeName || 'Holiday',
        day: h.day || '',
        startDate: Array.isArray(h.startDate) ? h.startDate : [0, 0, 0],
        endDate: Array.isArray(h.endDate) ? h.endDate : [0, 0, 0],
        type: h.type || 'General',
        coverage: h.coverage || 'All'
      }));
      setHolidays(mapped);
    } catch {
      // keep holidays empty silently
    }
  }, []);

  useEffect(() => {
    const id = sessionStorage.getItem('employeeId') || localStorage.getItem('employeeId');
    if (id) {
      setEmployeeId(id);
      fetchLeaves(id);
    }
    fetchHolidays();
  }, [fetchLeaves, fetchHolidays]);

  const handleSubmit = async () => {
    if (!newLeave.startDate || !newLeave.endDate || !newLeave.reason || !employeeId) {
      return;
    }
    const diffMs = new Date(newLeave.endDate).getTime() - new Date(newLeave.startDate).getTime();
    const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1);

    const payload = {
      employeeId,
      leaveType: newLeave.leaveType || 'casual',
      startDate: newLeave.startDate,
      endDate: newLeave.endDate,
      reason: newLeave.reason,
      status: 'pending'
    };

    try {
      const res = await axios.post(`${APIURL}/api/leave-requests/employee`, payload);
      const r = res.data;
      const added: Leave = {
        id: r.id,
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        leaveType: r.leaveType,
        startDate: normalizeDate(r.startDate || payload.startDate),
        endDate: normalizeDate(r.endDate || payload.endDate),
        numberOfDays: r.numberOfDays ?? days,
        status: (r.status || 'pending').toLowerCase(),
        reason: r.reason,
        hrComments: r.hrComments,
        requestDate: normalizeDate(r.requestDate) || new Date().toISOString().split('T')[0]
      };
      setLeaves((prev) => [added, ...prev]);
      setShowForm(false);
      setNewLeave({ leaveType: 'casual', startDate: '', endDate: '', reason: '' });
    } catch {
      // Logic for handling the error can be added here
    }
  };

  const formatDateForDisplay = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getLeaveIcon = (type: string) => {
    switch (type) {
      case 'sick': return '🏥';
      case 'casual': return '✈️';
      case 'annual': return '🌴';
      case 'emergency': return '🚨';
      default: return '📋';
    }
  };

  const approvedCount = leaves.filter(l => l.status === 'approved').length;
  const pendingCount = leaves.filter(l => l.status === 'pending').length;
  const rejectedCount = leaves.filter(l => l.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1">
          {/* Content Area */}
          <div className="p-8">
            {/* Page Title */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Leave Management</h1>
              <p className="text-gray-600">Request and track your leaves</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-8 mb-10">
              {/* Approved */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-bold text-gray-900 mb-1">{approvedCount}</p>
                    <p className="text-sm font-medium text-gray-600">Approved Leaves</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>

              {/* Pending */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-bold text-gray-900 mb-1">{pendingCount}</p>
                    <p className="text-sm font-medium text-gray-600">Pending Leaves</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                    <Clock className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>

              {/* Rejected */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-bold text-gray-900 mb-1">{rejectedCount}</p>
                    <p className="text-sm font-medium text-gray-600">Rejected Leaves</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                    <XCircle className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-8">
              {/* Left Column - Request Leave & Leave History */}
              <div className="col-span-2 space-y-8">
                {/* Request Leave Section */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                  <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Request Leave</h2>
                    <button
                      onClick={() => setShowForm(!showForm)}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 flex items-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Request
                    </button>
                  </div>

                  {showForm && (
                    <div className="p-8 border-b border-gray-100 bg-gradient-to-br from-blue-50 to-indigo-50">
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">Leave Type</label>
                          <select
                            value={newLeave.leaveType}
                            onChange={(e) => setNewLeave({ ...newLeave, leaveType: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                          >
                            <option value="casual">✈️ Casual Leave</option>
                            <option value="sick">🏥 Sick Leave</option>
                            <option value="annual">🌴 Annual Leave</option>
                            <option value="emergency">🚨 Emergency Leave</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">Reason</label>
                          <input
                            type="text"
                            value={newLeave.reason}
                            onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                            placeholder="Enter reason"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">Start Date</label>
                          <input
                            type="date"
                            value={newLeave.startDate}
                            onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">End Date</label>
                          <input
                            type="date"
                            value={newLeave.endDate}
                            onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-4">
                        <button
                          onClick={() => setShowForm(false)}
                          className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm hover:shadow transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSubmit}
                          className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Leave History */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                  <div className="px-8 py-6 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900">Leave History</h2>
                  </div>
                  <div className="p-8">
                    <div className="space-y-4">
                      {leaves.map((leave) => (
                        <div key={leave.id} className="flex items-start justify-between border border-gray-200 rounded-xl p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 hover:shadow-md group">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
                              <span className="text-xl">{getLeaveIcon(leave.leaveType)}</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 capitalize mb-1">{leave.leaveType} Leave</h3>
                              <p className="text-sm text-gray-600 mb-2">
                                <span className="font-medium">{formatDateForDisplay(leave.startDate)} - {formatDateForDisplay(leave.endDate)}</span>
                              </p>
                              <p className="text-sm text-gray-700 mb-2">{leave.reason}</p>
                              <p className="text-xs text-gray-500">
                                Requested on {formatDateForDisplay(leave.requestDate)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-4 py-2 rounded-full text-xs font-semibold shadow-sm ${
                              leave.status === 'approved' ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800' :
                              leave.status === 'pending' ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800' :
                              'bg-gradient-to-r from-red-100 to-rose-100 text-red-800'
                            }`}>
                              {leave.status === 'pending' ? 'Pending' : leave.status === 'approved' ? 'Approved' : 'Rejected'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Company Holidays */}
              <div className="col-span-1">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 sticky top-8">
                  <div className="px-6 py-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-2xl">
                    <h2 className="text-xl font-semibold text-gray-900">Company Holidays</h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {holidays.map((holiday, index) => (
                        <div key={holiday.id} className={`border-l-4 pl-4 py-3 rounded-r-lg transition-all duration-200 hover:bg-gray-50 ${
                          index === 0 ? 'border-emerald-400 bg-emerald-50' :
                          index === 1 ? 'border-blue-400 bg-blue-50' :
                          'border-purple-400 bg-purple-50'
                        }`}>
                          <h3 className="text-base font-semibold text-gray-900 mb-1">{holiday.holidayName}</h3>
                          <p className="text-sm text-gray-600 mb-1">
                            {formatDateForDisplay(`${holiday.startDate[0]}-${holiday.startDate[1]}-${holiday.startDate[2]}`)}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{holiday.day}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              index === 0 ? 'bg-emerald-200 text-emerald-800' :
                              index === 1 ? 'bg-blue-200 text-blue-800' :
                              'bg-purple-200 text-purple-800'
                            }`}>
                              {holiday.type}
                            </span>
                          </div>
                        </div>
                      ))}
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