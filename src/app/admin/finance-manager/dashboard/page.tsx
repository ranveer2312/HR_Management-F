'use client';
import Link from 'next/link';
import {  ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';


import {
  BuildingOfficeIcon,
  TagIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
 
} from '@heroicons/react/24/outline';
import { APIURL } from '@/constants/api';




interface Expense {
  id: number;
  amount: number;
  date: string;
  description: string;
}




export default function FinanceManagerDashboard() {
 
  const [stats, setStats] = useState([
    { name: 'Monthly Budget', value: 'Loading...', change: '', icon: BanknotesIcon },
    { name: 'Fixed Costs', value: 'Loading...', change: '', icon: BuildingOfficeIcon },
    { name: 'Variable Costs', value: 'Loading...', change: '', icon: ChartBarIcon },
    { name: 'Savings', value: 'Loading...', change: '', icon: ArrowTrendingUpIcon },
  ]);


  useEffect(() => {
   


    // Fetch all expense data
    const fetchExpenseData = async () => {
      try {
        // Helper function to safely parse JSON
        const safeJsonParse = async (response: Response) => {
          if (!response.ok) return { data: [] };
          const text = await response.text();
          if (!text.trim()) return { data: [] };
          try {
            return JSON.parse(text);
          } catch {
            return { data: [] };
          }
        };

        // Fetch fixed expenses
        const fixedExpensesResponses = await Promise.all([
          fetch(APIURL +`/api/rent`).then(safeJsonParse),
          fetch(APIURL +`/api/electric-bills`).then(safeJsonParse),
          fetch(APIURL +`/api/internet-bills`).then(safeJsonParse),
          fetch(APIURL +`/api/sim-bills`).then(safeJsonParse),
          fetch(APIURL +`/api/salaries`).then(safeJsonParse),
        ]);

        // Fetch variable expenses
        const variableExpensesResponses = await Promise.all([
          fetch(APIURL +`/api/travel`).then(safeJsonParse),
          fetch(APIURL +`/api/expo-advertisements`).then(safeJsonParse),
          fetch(APIURL +`/api/incentives/incentive`).then(safeJsonParse),
          fetch(APIURL +`/api/commissions`).then(safeJsonParse),
          fetch(APIURL +`/api/petty-cash`).then(safeJsonParse),
        ]);


        // Extract data arrays from responses and ensure they are arrays
        const fixedExpenses = fixedExpensesResponses.map(response => {
          const data = response.data || response;
          return Array.isArray(data) ? data : [];
        });


        const variableExpenses = variableExpensesResponses.map(response => {
          const data = response.data || response;
          return Array.isArray(data) ? data : [];
        });


        // Calculate totals
        const totalFixedCosts = fixedExpenses.reduce((sum: number, expenses: Expense[]) => {
          return sum + expenses.reduce((expenseSum: number, expense: Expense) => {
            const amount = typeof expense.amount === 'number' ? expense.amount : 0;
            return expenseSum + amount;
          }, 0);
        }, 0);


        const totalVariableCosts = variableExpenses.reduce((sum: number, expenses: Expense[]) => {
          return sum + expenses.reduce((expenseSum: number, expense: Expense) => {
            const amount = typeof expense.amount === 'number' ? expense.amount : 0;
            return expenseSum + amount;
          }, 0);
        }, 0);


        const monthlyBudget = 25000; // This could also be fetched from an API
        const savings = monthlyBudget - (totalFixedCosts + totalVariableCosts);


        // Calculate percentage changes (you might want to fetch historical data for accurate changes)
        const calculateChange = (current: number, previous: number) => {
          if (previous === 0) return '+0%';
          const change = ((current - previous) / previous) * 100;
          return `${change > 0 ? '+' : ''}${change.toFixed(0)}%`;
        };


        // Update stats with calculated values
        setStats([
          {
            name: 'Monthly Budget',
            value: `₹${monthlyBudget.toLocaleString('en-IN')}`,
            change: '+0%',
            icon: BanknotesIcon
          },
          {
            name: 'Fixed Costs',
            value: `₹${totalFixedCosts.toLocaleString('en-IN')}`,
            change: calculateChange(totalFixedCosts, totalFixedCosts * 0.9), // Example previous value
            icon: BuildingOfficeIcon
          },
          {
            name: 'Variable Costs',
            value: `₹${totalVariableCosts.toLocaleString('en-IN')}`,
            change: calculateChange(totalVariableCosts, totalVariableCosts * 0.95), // Example previous value
            icon: ChartBarIcon
          },
          {
            name: 'Savings',
            value: `₹${savings.toLocaleString('en-IN')}`,
            change: calculateChange(savings, savings * 1.1), // Example previous value
            icon: ArrowTrendingUpIcon
          },
        ]);
      } catch (error) {
        console.error('Error fetching expense data:', error);
        // Set error state in stats
        setStats([
          { name: 'Monthly Budget', value: 'Error', change: '', icon: BanknotesIcon },
          { name: 'Fixed Costs', value: 'Error', change: '', icon: BuildingOfficeIcon },
          { name: 'Variable Costs', value: 'Error', change: '', icon: ChartBarIcon },
          { name: 'Savings', value: 'Error', change: '', icon: ArrowTrendingUpIcon },
        ]);
      }
    };


    fetchExpenseData();
  }, []);


  const financeSections = [
    {
      title: 'Recurring Expenditures',
      icon: BuildingOfficeIcon,
      description: 'Manage recurring fixed costs and monthly obligations',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      features: [
        { name: 'Facility Rent', link: '/admin/finance-manager/fixed-expenses/rent', icon: '🏠' },
        { name: 'Electricity Charges', link: '/admin/finance-manager/fixed-expenses/electric-bills', icon: '⚡' },
        { name: 'Broadband Services', link: '/admin/finance-manager/fixed-expenses/internet-bills', icon: '🌐' },
        { name: 'Telecom Subscriptions', link: '/admin/finance-manager/fixed-expenses/sim-bills', icon: '📱' },
        { name: 'Employee Salaries', link: '/admin/finance-manager/fixed-expenses/salaries', icon: '👥' },
      ],
    },
    {
      title: 'Operational Overhead',
      icon: TagIcon,
      description: 'Track fluctuating costs and dynamic business expenses',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      features: [
        { name: 'Business Travel', link: '/admin/finance-manager/variable-expenses/travel', icon: '✈️' },
        { name: 'Marketing & Promotions', link: '/admin/finance-manager/variable-expenses/expo-advertisement', icon: '📢' },
        { name: 'Employee Incentives', link: '/admin/finance-manager/variable-expenses/incentives', icon: '🎯' },
        { name: 'Sales Commissions', link: '/admin/finance-manager/variable-expenses/commissions', icon: '💰' },
        { name: 'petty Cash', link: '/admin/finance-manager/variable-expenses/other', icon: '💰' },


      ],
    },
  ];


  // const quickActions = [
  //   {
  //     name: 'Add Expense',
  //     icon: '➕',
  //     color: 'text-blue-600',
  //     action: () => router.push('/finance-manager/fixed-expenses/rent'),
  //   },
  //   {
  //     name: 'Generate Report',
  //     icon: '📊',
  //     color: 'text-green-600',
  //     action: () => {
  //       // TODO: Implement report generation
  //       alert('Report generation feature coming soon!');
  //     },
  //   },
  //   {
  //     name: 'Set Budget',
  //     icon: '🎯',
  //     color: 'text-purple-600',
  //     action: () => {
  //       // TODO: Implement budget setting
  //       alert('Budget setting feature coming soon!');
  //     },
  //   },
  //   {
  //     name: 'Export Data',
  //     icon: '📤',
  //     color: 'text-orange-600',
  //     action: () => {
  //       // TODO: Implement data export
  //       alert('Data export feature coming soon!');
  //     },
  //   },
  // ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Finance Manager
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comprehensive expense tracking and budget management
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 bg-green-50 dark:bg-green-900/30 px-3 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Live Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">{stat.change}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <stat.icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>


        {/* Quick Actions */}
        <div className="mb-8">
          {/* <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3> */}
          {/* <QuickActions actions={quickActions} /> */}
        </div>


        {/* Main Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {financeSections.map((section) => (
            <div key={section.title} className="group">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 h-full">
                {/* Section Header */}
                <div className={`${section.bgColor} p-6 relative overflow-hidden`}>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl bg-white dark:bg-gray-800 shadow-md`}>
                        <section.icon className={`h-7 w-7 ${section.iconColor}`} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{section.title}</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{section.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full -mr-16 -mt-16"></div>
                </div>


                {/* Features Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {section.features.map((feature) => (
                      <Link key={feature.name} href={feature.link}>
                        <div className="group/item p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{feature.icon}</span>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">
                                {feature.name}
                              </p>
                            </div>
                            <svg className="w-4 h-4 text-gray-400 group-hover/item:text-blue-500 group-hover/item:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>


                {/* Section Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {section.features.length} categories
                    </span>
                    <button className={`text-sm font-medium ${section.iconColor} hover:underline flex items-center space-x-1`}>
                      <span>View All</span>
                      <ArrowLeft className="w-3 h-3 rotate-180" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


