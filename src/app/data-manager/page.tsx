'use client';

import { useState, useEffect } from 'react';
import { 
  Receipt, 
  LineChart,
  TrendingUp,
  ShoppingCart
} from 'lucide-react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { APIURL } from '@/constants/api';
import { useRouter } from "next/navigation";
// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// interface Module {
//   id: string;
//   name: string;
//   icon: React.ElementType;
//   color: string;
//   path: string;
//   count: number;
//   apiUrl: string;
// }

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string | string[];
  }[];
}


// Define a type for the expected data shape
type MonthlyDataItem = { [key: string]: string | number | undefined };

export default function DataManagerDashboard() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  const [salesData, setSalesData] = useState<ChartData>({
    labels: [],
    datasets: [{
      label: 'Sales',
      data: [],
      borderColor: '#36a2eb',
      backgroundColor: 'rgba(54, 162, 235, 0.3)',
    }]
  });
  const [purchaseData, setPurchaseData] = useState<ChartData>({
    labels: [],
    datasets: [{
      label: 'Purchases',
      data: [],
      borderColor: '#ff6384',
      backgroundColor: 'rgba(255, 99, 132, 0.3)',
    }]
  });
  const [paymentStatusData, setPaymentStatusData] = useState<ChartData>({
    labels: ['Paid', 'Pending', 'Overdue', 'Partially Paid'],
    datasets: [{
      label: 'Payment Status',
      data: [0, 0, 0, 0],
      backgroundColor: [
        '#36a2eb',
        '#ffce56',
        '#ff6384',
        '#4bc0c0',
      ],
    }]
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const roles = JSON.parse(localStorage.getItem('roles') || '[]');

    if (!token || !roles.includes('DATAMANAGER')) {
      router.replace('/login');
    } else {
      setAuthChecked(true);
    }
  }, [router]);


  useEffect(() => {
    if (!authChecked) return;
    const fetchData = async () => {
      setError(null);

      try {

        // Fetch sales data for charts
        const salesResponse = await fetch(APIURL + `/api/sales`);
        if (salesResponse.ok) {
          const sales = await salesResponse.json();
          const monthlySales = processMonthlyData(sales, 'date', 'amount');
          setSalesData({
            labels: monthlySales.labels,
            datasets: [{
              label: 'Sales',
              data: monthlySales.data,
              borderColor: '#36a2eb',
              backgroundColor: 'rgba(54, 162, 235, 0.3)',
            }]
          });
        }

        // Fetch purchase data for charts
        const purchasesResponse = await fetch(APIURL + `/api/purchases`);
        if (purchasesResponse.ok) {
          const purchases = await purchasesResponse.json();
          console.log('Purchases API response:', purchases);
          let monthlyPurchases: { labels: string[]; data: number[] } = { labels: [], data: [] };
          if (
            Array.isArray(purchases) &&
            purchases.length > 0 &&
            purchases.some(item => item.date && item.amount !== undefined)
          ) {
            monthlyPurchases = processMonthlyData(purchases, 'date', 'amount');
          } else if (Array.isArray(purchases) && purchases.length === 0) {
            // No error if empty, just show empty chart
            monthlyPurchases = { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], data: new Array(12).fill(0) };
          } else {
            setError('Purchase data format is invalid.');
          }
          setPurchaseData({
            labels: monthlyPurchases.labels,
            datasets: [{
              label: 'Purchases',
              data: monthlyPurchases.data,
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.3)',
            }]
          });
        } else {
          setError(prev => (prev ? prev + ' | ' : '') + 'Failed to fetch purchase data.');
        }

        // Fetch payment status data
        const salesForPaymentStatus = await fetch(APIURL +'/api/sales').then(res => res.ok ? res.json() : []);
        const paymentStatusCounts = {
          'Paid': 0,
          'Pending': 0,
          'Overdue': 0,
          'Partially Paid': 0
        };

        salesForPaymentStatus.forEach((sale: { paymentStatus: string }) => {
          if (sale.paymentStatus in paymentStatusCounts) {
            paymentStatusCounts[sale.paymentStatus as keyof typeof paymentStatusCounts]++;
          }
        });

        setPaymentStatusData({
          labels: Object.keys(paymentStatusCounts),
          datasets: [{
            label: 'Payment Status',
            data: Object.values(paymentStatusCounts),
            backgroundColor: [
              '#36a2eb',
              '#ffce56',
              '#ff6384',
              '#4bc0c0',
            ],
          }]
        });

      } catch (e: unknown) {
        setError(`Failed to fetch data: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    };

    fetchData();
  }, [authChecked]);

  // Helper function to process monthly data
  const processMonthlyData = (data: MonthlyDataItem[], dateField: string, amountField: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTotals = new Array(12).fill(0);
    const currentYear = new Date().getFullYear();

    data.forEach((item: MonthlyDataItem) => {
      const dateValue = item[dateField];
      let date: Date | null = null;

      if (Array.isArray(dateValue) && dateValue.length >= 3) {
        // JS months are 0-based, so subtract 1 from month
        date = new Date(dateValue[0], dateValue[1] - 1, dateValue[2]);
      } else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      }

      if (date && date.getFullYear() === currentYear) {
        const month = date.getMonth();
        monthlyTotals[month] += Number(item[amountField]) || 0;
      }
    });

    return {
      labels: months,
      data: monthlyTotals
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                Data Management Hub
              </h1>
              <p className="text-gray-600 mt-2 text-base sm:text-lg">Comprehensive business intelligence and document management</p>
            </div>
            <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 sm:px-4 py-2 rounded-full text-sm font-medium w-fit">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Live Data</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8">
        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Sales Trend Chart */}
          <div className="bg-white/70 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Sales Performance</h3>
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
            <div className="h-64 sm:h-80">
              <Line
                data={salesData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' as const },
                    title: { display: false },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { color: 'rgba(0,0,0,0.05)' },
                      ticks: { callback: (value) => `$${value.toLocaleString()}` },
                    },
                    x: { grid: { color: 'rgba(0,0,0,0.05)' } },
                  },
                }}
              />
            </div>
          </div>

          {/* Purchase Trend Chart */}
          <div className="bg-white/70 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Purchase Analytics</h3>
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
            <div className="h-64 sm:h-80">
              <Line
                data={purchaseData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' as const },
                    title: { display: false },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { color: 'rgba(0,0,0,0.05)' },
                      ticks: { callback: (value) => `$${value.toLocaleString()}` },
                    },
                    x: { grid: { color: 'rgba(0,0,0,0.05)' } },
                  },
                }}
              />
              {error && error.toLowerCase().includes('purchase') && (
                <div className="text-red-600 text-center mt-4 font-medium">{error}</div>
              )}
            </div>
          </div>

          {/* Payment Status Distribution */}
          <div className="bg-white/70 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Payment Status</h3>
              <div className="p-2 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg">
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
            <div className="h-64 sm:h-80">
              <Doughnut
                data={paymentStatusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'right' as const },
                  },
                }}
              />
            </div>
          </div>

          {/* Monthly Comparison */}
          <div className="bg-white/70 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Monthly Comparison</h3>
              <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg">
                <LineChart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
            <div className="h-64 sm:h-80">
              <Bar
                data={{
                  labels: salesData.labels,
                  datasets: [
                    {
                      label: 'Sales',
                      data: salesData.datasets[0].data,
                      backgroundColor: 'rgba(59, 130, 246, 0.8)',
                      borderRadius: 8,
                    },
                    {
                      label: 'Purchases',
                      data: purchaseData.datasets[0].data,
                      backgroundColor: 'rgba(239, 68, 68, 0.8)',
                      borderRadius: 8,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' as const } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { color: 'rgba(0,0,0,0.05)' },
                      ticks: { callback: (value) => `$${value.toLocaleString()}` },
                    },
                    x: { grid: { display: false } },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Management Modules */}
        {/* <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Management Modules</h2>
            <p className="text-gray-600">Access and manage your business operations</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!authChecked ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Checking authentication...</p>
              </div>
            ) : loading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-300 rounded w-1/4 mx-auto"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
                </div>
                <p className="text-gray-600 font-medium mt-4">Loading module data...</p>
              </div>
            ) : error ? (
              <div className="col-span-full text-center py-12">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
                  <p className="text-red-600 font-medium">{error}</p>
                </div>
              </div>
            ) : (
              modules.map((module) => (
                <Link
                  key={module.id}
                  href={module.path}
                  className="group bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {module.name}
                      </h3>
                      <p className="text-3xl font-bold text-gray-800 mt-2">
                        {moduleCounts[module.id] || 0}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Total Records</p>
                    </div>
                    <div className={`p-4 rounded-xl ${module.color} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <module.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700">Manage Records</span>
                    <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link> */}
              {/* ))
            )}
          </div>
        </div> */}
      </div>
    </div>
  );
}