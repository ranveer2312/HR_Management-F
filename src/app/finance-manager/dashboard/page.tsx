'use client';
import { useEffect, useState } from 'react';
import { APIURL } from '@/constants/api';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Loader from '@/components/Loader';
import toast, { Toaster } from 'react-hot-toast';

interface FixedExpense {
  amount: number;
}
interface VariableExpense {
  amount: number;
}
interface Investment {
  amount: number;
}

export default function FinanceDashboardPage() {
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [variableExpenses, setVariableExpenses] = useState<VariableExpense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const [
          fixedRes,
          variableRes,
          investmentsRes,
        ] = await Promise.all([
          fetch(`${APIURL}/api/fixed-expenses`).then(res => res.json()),
          fetch(`${APIURL}/api/variable-expenses`).then(res => res.json()),
          fetch(`${APIURL}/api/investments`).then(res => res.json()),
        ]);

        setFixedExpenses(fixedRes);
        setVariableExpenses(variableRes);
        setInvestments(investmentsRes);
      } catch (err) {
        setError('Failed to fetch financial data.');
        console.error('Error fetching data:', err);
        toast.error('Failed to fetch data. Please check the API connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  const totalFixedExpenses = fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
  const totalVariableExpenses = variableExpenses.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = totalFixedExpenses + totalVariableExpenses;
  const totalInvestments = investments.reduce((sum, item) => sum + item.amount, 0);
  const monthlyProfit = 50000; // Mocked data
  const profitTrend = 12.5; // Mocked data

  const keyMetrics = [
    {
      title: 'Total Expenses',
      value: `₹${totalExpenses.toLocaleString('en-IN')}`,
      icon: (
        <div className="flex items-center space-x-2">
          <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-500">+10%</span>
        </div>
      ),
      description: 'Total spending across all categories this month.',
      color: 'bg-red-100/50 dark:bg-red-900/30 text-red-600 dark:text-red-300',
    },
    {
      title: 'Total Investments',
      value: `₹${totalInvestments.toLocaleString('en-IN')}`,
      icon: (
        <div className="flex items-center space-x-2">
          <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-500">+15%</span>
        </div>
      ),
      description: 'Total capital allocated to investments.',
      color: 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300',
    },
    {
      title: 'Monthly Profit',
      value: `₹${monthlyProfit.toLocaleString('en-IN')}`,
      icon: (
        <div className="flex items-center space-x-2">
          <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-500">+${profitTrend}%</span>
        </div>
      ),
      description: 'Net profit after all expenses this month.',
      color: 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300',
    },
    {
      title: 'Operational Efficiency',
      value: `85%`,
      icon: (
        <div className="flex items-center space-x-2">
          <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-500">+2%</span>
        </div>
      ),
      description: 'Efficiency score based on expense management.',
      color: 'bg-purple-100/50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300',
    },
  ];

  const recentTransactions = [
    { type: 'Expense', description: 'Office Rent', amount: 35000, date: '2025-08-25', status: 'Completed', trend: 0 },
    { type: 'Investment', description: 'Tech Stocks', amount: 50000, date: '2025-08-24', status: 'Completed', trend: 15 },
    { type: 'Expense', description: 'Marketing Campaign', amount: 15000, date: '2025-08-23', status: 'Completed', trend: 0 },
    { type: 'Expense', description: 'Employee Salaries', amount: 120000, date: '2025-08-22', status: 'Completed', trend: 0 },
    { type: 'Expense', description: 'Electric Bill', amount: 8500, date: '2025-08-21', status: 'Completed', trend: 0 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-500">
          <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white p-6">
      <Toaster />
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Finance Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Overview of your company&apos;s financial performance.</p>
        </header>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {keyMetrics.map((metric) => (
              <div key={metric.title} className={`p-6 rounded-lg shadow-sm ${metric.color}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold">{metric.title}</span>
                  {metric.icon}
                </div>
                <div className="text-3xl font-extrabold mb-1">{metric.value}</div>
                <p className="text-sm opacity-75">{metric.description}</p>
              </div>
            ))}
          </div>
        </section>
        <hr className="my-10 border-t border-slate-200 dark:border-slate-800" />
        <section>
          <h2 className="text-xl font-semibold mb-4">Recent Financial Activity</h2>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trend</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.description}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{transaction.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{transaction.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">₹{transaction.amount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{transaction.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {transaction.trend > 0 ? (
                        <div className="flex items-center text-emerald-500">
                          <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                          <span>+{transaction.trend}%</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-500">
                          <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
                          <span>{transaction.trend}%</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}