'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { APIURL } from '@/constants/api';
import {
  BuildingOfficeIcon,
  ChevronRightIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

interface ExpenseItem {
  amount?: number;
}

export default function FixedExpensesPage() {
  const [expenseData, setExpenseData] = useState({
    rent: { total: 0, count: 0, trend: 0 },
    electric: { total: 0, count: 0, trend: 0 },
    internet: { total: 0, count: 0, trend: 0 },
    sim: { total: 0, count: 0, trend: 0 },
    salaries: { total: 0, count: 0, trend: 0 },
  });

  const fixedExpenseItems = [
    {
      id: 'rent',
      name: 'Rent & Facilities',
      link: '/finance-manager/fixed-expenses/rent',
      icon: BuildingOfficeIcon,
      description: 'Property rent, maintenance, and facility management costs',
      category: 'Property',
      frequency: 'Monthly',
      priority: 'High',
      dataKey: 'rent'
    },
    {
      id: 'electric',
      name: 'Utilities',
      link: '/finance-manager/fixed-expenses/electric-bills',
      icon: '⚡',
      description: 'Electricity, water, and essential utility services',
      category: 'Utilities',
      frequency: 'Monthly',
      priority: 'High',
      dataKey: 'electric'
    },
    {
      id: 'internet',
      name: 'Internet & Telecom',
      link: '/finance-manager/fixed-expenses/internet-bills',
      icon: '🌐',
      description: 'Internet connectivity and telecommunications',
      category: 'Technology',
      frequency: 'Monthly',
      priority: 'Medium',
      dataKey: 'internet'
    },
    {
      id: 'sim',
      name: 'Mobile Services',
      link: '/finance-manager/fixed-expenses/sim-bills',
      icon: '📱',
      description: 'Mobile plans, data packages, and device services',
      category: 'Technology',
      frequency: 'Monthly',
      priority: 'Medium',
      dataKey: 'sim'
    },
    {
      id: 'salaries',
      name: 'Payroll',
      link: '/finance-manager/fixed-expenses/salaries',
      icon: '👥',
      description: 'Employee compensation, benefits, and payroll taxes',
      category: 'Human Resources',
      frequency: 'Monthly',
      priority: 'Critical',
      dataKey: 'salaries'
    },
  ];

  useEffect(() => {
    const fetchExpenseData = async () => {
      try {
        const safeJsonParse = async (url: string) => {
          try {
            const response = await fetch(url);
            if (!response.ok) return [];
            const text = await response.text();
            if (!text.trim()) return [];
            return JSON.parse(text);
          } catch {
            return [];
          }
        };

        const [rentData, electricData, internetData, simData, salariesData] = await Promise.all([
          safeJsonParse(`${APIURL}/api/rent`),
          safeJsonParse(`${APIURL}/api/electric-bills`),
          safeJsonParse(`${APIURL}/api/internet-bills`),
          safeJsonParse(`${APIURL}/api/sim-bills`),
          safeJsonParse(`${APIURL}/api/salaries`),
        ]);

        const calculateMetrics = (data: ExpenseItem[] | { total?: number; count?: number }) => {
          if (Array.isArray(data)) {
            const total = data.reduce((sum, item) => sum + (item.amount || 0), 0);
            const trend = Math.random() * 20 - 10; // Simulated trend data
            return {
              total,
              count: data.length,
              trend: parseFloat(trend.toFixed(1))
            };
          }
          return { total: data?.total || 0, count: data?.count || 0, trend: 0 };
        };

        setExpenseData({
          rent: calculateMetrics(rentData),
          electric: calculateMetrics(electricData),
          internet: calculateMetrics(internetData),
          sim: calculateMetrics(simData),
          salaries: calculateMetrics(salariesData),
        });
      } catch (error) {
        console.error('Failed to fetch expense data:', error);
      }
    };

    fetchExpenseData();
  }, []);

  const totalExpenses = Object.values(expenseData).reduce((sum, item) => sum + item.total, 0);
  const totalEntries = Object.values(expenseData).reduce((sum, item) => sum + item.count, 0);
  const avgExpensePerCategory = totalExpenses / fixedExpenseItems.length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Fixed Expenses Dashboard</h2>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <CurrencyDollarIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                TOTAL
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                ₹{totalExpenses.toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Fixed Expenses</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                AVERAGE
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                ₹{Math.round(avgExpensePerCategory).toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Average per Category</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <DocumentDuplicateIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                ENTRIES
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{totalEntries}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Expense Records</p>
            </div>
          </div>
        </div>

        {/* Expense Categories Table View */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Expense Categories</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Manage your recurring monthly expenses</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {fixedExpenseItems.map((item) => {
              const data = expenseData[item.dataKey as keyof typeof expenseData];
              const isPositiveTrend = data.trend > 0;
              
              return (
                <Link key={item.id} href={item.link} className="block group hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer">
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between">
                      {/* Left Section - Main Info */}
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {typeof item.icon === 'string' ? (
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-xl">
                              {item.icon}
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                              <item.icon className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {item.name}
                            </h3>
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                            <span className="px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{item.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center space-x-1">
                              <CalendarIcon className="w-3 h-3" />
                              <span>{item.frequency}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DocumentDuplicateIcon className="w-3 h-3" />
                              <span>{data.count} records</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Middle Section - Financial Data */}
                      <div className="text-center px-6">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-xl font-bold text-slate-900 dark:text-white">
                            ₹{data.total.toLocaleString('en-IN')}
                          </p>
                          {data.trend !== 0 && (
                            <div className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium ${
                              isPositiveTrend
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            }`}>
                              {isPositiveTrend ? (
                                <ArrowTrendingUpIcon className="w-3 h-3" />
                              ) : (
                                <ArrowTrendingDownIcon className="w-3 h-3" />
                              )}
                              <span>{Math.abs(data.trend)}%</span>
                            </div>
                          )}
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mb-1">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((data.total / totalExpenses) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {((data.total / totalExpenses) * 100).toFixed(1)}% of total
                        </p>
                      </div>

                      {/* Right Section - Visual Indicator */}
                      <div className="flex items-center">
                        <ChevronRightIcon className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Summary Section */}
        <div className="mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Monthly Overview</h3>
              <p className="text-indigo-100 text-sm leading-relaxed">
                Your fixed expenses represent the foundation of your budget planning. These recurring costs help establish baseline financial requirements.
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-3xl font-bold mb-1">₹{totalExpenses.toLocaleString('en-IN')}</p>
              <p className="text-indigo-200 text-sm">Total Monthly Fixed Costs</p>
              <div className="mt-3 flex justify-center">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-indigo-100">Updated automatically</span>
                </div>
              </div>
            </div>
            
            <div className="text-right md:text-left">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-indigo-200 text-sm">Categories:</span>
                  <span className="font-semibold">{fixedExpenseItems.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-200 text-sm">Records:</span>
                  <span className="font-semibold">{totalEntries}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-200 text-sm">Last Updated:</span>
                  <span className="font-semibold text-sm">Just now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}