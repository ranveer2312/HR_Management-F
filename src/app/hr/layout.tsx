'use client';


import React, { useState, useEffect } from 'react';
import {
  Home,
  FileText,
  Archive,
  Calendar,
  Activity,
  UserPlus,
  TrendingUp,
  GraduationCap,
  LogOut,
  Search,
  Bell,
  User
} from 'lucide-react';
import Link from 'next/link';
import { APIURL } from '@/constants/api';


// ------------------- Interfaces --------------------
interface LeaveRequest {
  id: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  status: string;
}


interface Employee {
  id: string;
  name: string;
  status?: string;
}


// ------------------- Sidebar Items -------------------
const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/hr', active: true },
  { id: 'documents', label: 'Document Vault', icon: FileText, path: '/hr/documents' },
  { id: 'assets', label: 'Asset Tracker', icon: Archive, path: '/hr/assets' },
  { id: 'leave', label: 'Leave Management', icon: Calendar, path: '/hr/leaves' },
  { id: 'performance', label: 'Performance Plus', icon: Activity, path: '/hr/performance' },
  { id: 'onboarding', label: 'Smart Onboarding', icon: UserPlus, path: '/hr/joining' },
  { id: 'activities', label: 'Activity Stream', icon: TrendingUp, path: '/hr/activities' },
  { id: 'training', label: 'Training and Development', icon: GraduationCap, path: '/hr/training' }
];


// ------------------- Notification Bell -------------------
const NotificationBell = () => {
  const [notifications, setNotifications] = useState<LeaveRequest[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);


  useEffect(() => {
    fetch(`${APIURL}/api/leave-requests`)
      .then(res => res.json())
      .then((data: LeaveRequest[]) => {
        const pendingRequests = data.filter((req: LeaveRequest) => req.status === 'Pending');
        setNotifications(pendingRequests);
        setUnreadCount(pendingRequests.length);
      })
      .catch(() => {
        setNotifications([]);
        setUnreadCount(0);
      });
  }, []);


  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>


      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Leave Requests</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div key={notification.id} className="p-4 border-b border-slate-100 hover:bg-slate-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-900">{notification.employeeName}</p>
                      <p className="text-sm text-slate-600">{notification.leaveType}</p>
                      <p className="text-xs text-slate-500">Start: {notification.startDate}</p>
                    </div>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      {notification.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-500">
                No pending leave requests
              </div>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="p-4 border-t border-slate-200">
              <Link href="/hr/leaves" className="text-blue-600 text-sm hover:underline">
                View all leave requests →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


// ------------------- Welcome Section -------------------
const WelcomeSection = () => {
  const [currentDate, setCurrentDate] = useState('');
  const [greeting, setGreeting] = useState('');
  const [activeEmployees, setActiveEmployees] = useState('...');


  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');


    const today = new Date();
    setCurrentDate(today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));


    fetch(`${APIURL}/api/employees`)
      .then(res => res.json())
      .then((data: Employee[]) => {
        const active = data.filter((emp: Employee) => emp.status === 'Active' || !emp.status).length;
        setActiveEmployees(active.toString());
      })
      .catch(() => setActiveEmployees('N/A'));
  }, []);


  return (
    <div className="px-6 py-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Hello, {greeting}!
          </h2>
          <p className="text-slate-600 text-lg">
            Here&apos;s what&apos;s happening with your team today.
          </p>
        </div>
        <div className="flex items-center space-x-4 text-sm text-slate-600">
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-slate-200">
            <span className="font-medium">Today:</span> {currentDate}
          </div>
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-slate-200">
            <span className="font-medium">Active Employees:</span> {activeEmployees}
          </div>
        </div>
      </div>
    </div>
  );
};


// ------------------- HR Layout -------------------
export default function HRLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">HR</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  HR Manager
                </h1>
                <p className="text-sm text-slate-500">Enterprise Workforce Management</p>
              </div>
            </div>


            <div className="flex items-center space-x-6">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employees, documents, reports..."
                  className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
                />
              </div>


              <div className="flex items-center space-x-3">
                <NotificationBell />


                <div className="w-px h-6 bg-slate-200"></div>


                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-slate-900">Bharath</div>
                    <div className="text-slate-500">HR Manager</div>
                  </div>
                </div>


                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                  }}
                  className="flex items-center space-x-2 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>


        <WelcomeSection />
      </header>


      <div className="flex">
        {/* Sidebar */}
        <nav className="w-72 bg-white border-r border-slate-200 shadow-sm min-h-screen">
          <div className="p-6">
            <div className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.path}
                    className="flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Icon className="w-5 h-5 transition-colors text-slate-400 group-hover:text-slate-600" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>


        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}