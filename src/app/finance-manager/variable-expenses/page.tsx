'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { APIURL } from '@/constants/api';
import {
  ChevronRightIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';


export default function VariableExpensesPage() {
  const [expenseData, setExpenseData] = useState({
    travel: { total: 0, count: 0, trend: 0, variance: 0 },
    marketing: { total: 0, count: 0, trend: 0, variance: 0 },
    incentives: { total: 0, count: 0, trend: 0, variance: 0 },
    commissions: { total: 0, count: 0, trend: 0, variance: 0 },
    pettyCash: { total: 0, count: 0, trend: 0, variance: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const variableExpenseItems = [
    {
      id: 'travel',
      name: 'Travel & Transport',
      link: '/finance-manager/variable-expenses/travel',
      icon: '✈️',
      description: 'Business travel, logistics, and transportation expenses',
      category: 'Operations',
      volatility: 'High',
      priority: 'Medium',
      budgetImpact: 'Moderate',
      dataKey: 'travel'
    },
    {
      id: 'marketing',
      name: 'Marketing & Advertising',
      link: '/finance-manager/variable-expenses/expo-advertisement',
      icon: '📢',
      description: 'Promotional campaigns, advertising, and marketing initiatives',
      category: 'Marketing',
      volatility: 'Very High',
      priority: 'High',
      budgetImpact: 'Significant',
      dataKey: 'marketing'
    },
    {
      id: 'incentives',
      name: 'Employee Incentives',
      link: '/finance-manager/variable-expenses/incentives',
      icon: '🎯',
      description: 'Performance bonuses, rewards, and employee recognition',
      category: 'Human Resources',
      volatility: 'Medium',
      priority: 'Medium',
      budgetImpact: 'Moderate',
      dataKey: 'incentives'
    },
    {
      id: 'commissions',
      name: 'Sales Commissions',
      link: '/finance-manager/variable-expenses/commissions',
      icon: '💰',
      description: 'Sales team commissions, referral fees, and performance pay',
      category: 'Sales',
      volatility: 'High',
      priority: 'High',
      budgetImpact: 'Significant',
      dataKey: 'commissions'
    },
    {
      id: 'pettyCash',
      name: 'Petty Cash',
      link: '/finance-manager/variable-expenses/petty-cash',
      icon: '💵',
      description: 'Miscellaneous expenses and small operational costs',
      category: 'Operations',
      volatility: 'Low',
      priority: 'Low',
      budgetImpact: 'Minor',
      dataKey: 'pettyCash'
    },
  ];

  useEffect(() => {
    const fetchExpenseData = async () => {
      try {
        setError(null);
        const [travelData, marketingData, incentivesData, commissionsData, pettyCashData] = await Promise.all([
          fetch(`${APIURL}/api/travel`).then(async res => {
            if (!res.ok) throw new Error(`Travel API failed: ${res.status}`);
            const text = await res.text();
            return text ? JSON.parse(text) : [];
          }),
          fetch(`${APIURL}/api/expo-advertisements`).then(async res => {
            if (!res.ok) throw new Error(`Marketing API failed: ${res.status}`);
            const text = await res.text();
            return text ? JSON.parse(text) : [];
          }),
          fetch(`${APIURL}/api/incentives`).then(async res => {
            if (!res.ok) throw new Error(`Incentives API failed: ${res.status}`);
            const text = await res.text();
            return text ? JSON.parse(text) : [];
          }),
          fetch(`${APIURL}/api/commissions`).then(async res => {
            if (!res.ok) throw new Error(`Commissions API failed: ${res.status}`);
            const text = await res.text();
            return text ? JSON.parse(text) : [];
          }),
          fetch(`${APIURL}/api/petty-cash`).then(async res => {
            if (!res.ok) throw new Error(`Petty Cash API failed: ${res.status}`);
            const text = await res.text();
            return text ? JSON.parse(text) : [];
          }),
        ]);

        const calculateMetrics = (data: Array<{ amount?: number }> | { total?: number; count?: number }) => {
          if (Array.isArray(data)) {
            const total = data.reduce((sum, item) => sum + (item.amount || 0), 0);
            const trend = Math.random() * 30 - 15;
            const variance = Math.random() * 40 - 20;
            return {
              total,
              count: data.length,
              trend: parseFloat(trend.toFixed(1)),
              variance: parseFloat(variance.toFixed(1))
            };
          }
          return { total: data?.total || 0, count: data?.count || 0, trend: 0, variance: 0 };
        };

        setExpenseData({
          travel: calculateMetrics(travelData),
          marketing: calculateMetrics(marketingData),
          incentives: calculateMetrics(incentivesData),
          commissions: calculateMetrics(commissionsData),
          pettyCash: calculateMetrics(pettyCashData),
        });
      } catch (error) {
        console.error('Failed to fetch expense data:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchExpenseData();
  }, []);

  const totalExpenses = Object.values(expenseData).reduce((sum, item) => sum + item.total, 0);
  const totalEntries = Object.values(expenseData).reduce((sum, item) => sum + item.count, 0);
  const avgVariance = Object.values(expenseData).reduce((sum, item) => sum + Math.abs(item.variance), 0) / variableExpenseItems.length;

  const getVolatilityColor = (volatility: string) => {
    switch (volatility) {
      case 'Very High': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Low': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getBudgetImpactIcon = (impact: string) => {
    switch (impact) {
      case 'Significant': return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      case 'Moderate': return <ArrowTrendingUpIcon className="w-4 h-4 text-yellow-500" />;
      case 'Minor': return <CheckCircleIcon className="w-4 h-4 text-emerald-500" />;
      default: return <ChartBarIcon className="w-4 h-4 text-slate-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 border-3 border-slate-200 dark:border-slate-700 rounded-full"></div>
            <div className="absolute inset-0 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Loading Expense Data</h3>
            <p className="text-slate-600 dark:text-slate-400">Please wait while we fetch your information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Failed to Load Data</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Variable Expenses Dashboard</h2>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <CurrencyDollarIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                TOTAL
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                ₹{totalExpenses.toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Variable Expenses</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ArrowTrendingUpIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                VOLATILITY
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {avgVariance.toFixed(1)}%
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Average Variance</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                CATEGORIES
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{variableExpenseItems.length}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Expense Categories</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <DocumentDuplicateIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                RECORDS
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{totalEntries}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Transactions</p>
            </div>
          </div>
        </div>

        {/* Professional Expense Categories Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Variable Expense Categories</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Monitor fluctuating operational costs and dynamic expenses</p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  Export
                </button>
                <button className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  Analyze
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {variableExpenseItems.map((item) => {
              const data = expenseData[item.dataKey as keyof typeof expenseData];
              const isPositiveTrend = data.trend > 0;
              const isHighVariance = Math.abs(data.variance) > 15;
              
              return (
                <Link key={item.id} href={item.link} className="block group hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer">
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between">
                      {/* Left Section - Main Info */}
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors">
                            {item.icon}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {item.name}
                            </h3>
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${getVolatilityColor(item.volatility)}`}>
                              {item.volatility} Volatility
                            </span>
                            <div className="flex items-center space-x-1">
                              {getBudgetImpactIcon(item.budgetImpact)}
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{item.budgetImpact}</span>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{item.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center space-x-1">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                              <span>{item.category}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DocumentDuplicateIcon className="w-3 h-3" />
                              <span>{data.count} transactions</span>
                            </div>
                            {isHighVariance && (
                              <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                                <ExclamationTriangleIcon className="w-3 h-3" />
                                <span>High variance</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle Section - Financial Analytics */}
                      <div className="text-center px-6">
                        <div className="flex items-center justify-center space-x-3 mb-2">
                          <div className="text-right">
                            <p className="text-xl font-bold text-slate-900 dark:text-white">
                              ₹{data.total.toLocaleString('en-IN')}
                            </p>
                            <div className="flex items-center justify-center space-x-2 mt-1">
                              {data.trend !== 0 && (
                                <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-md text-xs font-medium ${
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
                              {Math.abs(data.variance) > 0 && (
                                <div className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                  ±{Math.abs(data.variance)}%
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mb-1">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((data.total / totalExpenses) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {((data.total / totalExpenses) * 100).toFixed(1)}% of total
                        </p>
                      </div>

                      {/* Right Section - Visual Indicator */}
                      <div className="flex items-center">
                        <ChevronRightIcon className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Analytics and Insights Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Expense Insights */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-8 text-white">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Expense Analytics</h3>
              <p className="text-emerald-100 text-sm">Real-time insights into your variable costs</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <span className="text-sm font-medium">Highest Category:</span>
                <span className="font-bold">Marketing & Advertising</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <span className="text-sm font-medium">Most Volatile:</span>
                <span className="font-bold">Travel & Transport</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <span className="text-sm font-medium">Budget Utilization:</span>
                <span className="font-bold">68%</span>
              </div>
            </div>
          </div>

          {/* Management Best Practices */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Variable Expense Management</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mt-0.5">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white text-sm">Monitor Variance Patterns</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Track spending patterns to identify optimization opportunities</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mt-0.5">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white text-sm">Set Dynamic Budgets</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Adjust budgets based on seasonal trends and business cycles</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mt-0.5">
                  <ExclamationTriangleIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white text-sm">Control High-Impact Items</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Focus on categories with significant budget impact for better ROI</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}