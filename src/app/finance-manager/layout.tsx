'use client';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';


import {
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  TagIcon,
  CalculatorIcon,
  DocumentChartBarIcon,
  HomeIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';


export default function FinanceManagerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();


  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);


  const sidebarItems = [
    { name: 'Dashboard', href: '/finance-manager/dashboard', icon: HomeIcon },
    { name: 'Fixed Expenses', href: '/finance-manager/fixed-expenses', icon: BuildingOfficeIcon },
    { name: 'Variable Expenses', href: '/finance-manager/variable-expenses', icon: TagIcon },
    { name: 'TDS Calculator', href: '/finance-manager/tds-calculator', icon: CalculatorIcon },
    { name: 'GST Calculator', href: '/finance-manager/gst-calculator', icon: DocumentChartBarIcon },
  ];


  const handleLogout = () => {
    router.push('/login');
  };


  // Close sidebar when pathname changes (for mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);


  if (!mounted) {
    return null; // Prevent hydration mismatch
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-30 bg-white shadow-lg border-b border-gray-200">
        <div className="mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-blue-600">
                <CurrencyDollarIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Finance Management
                </h1>
                <p className="text-sm text-gray-600 font-medium">Advanced financial management system</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-3 rounded-lg bg-blue-600 text-white shadow hover:bg-blue-700 transition-colors"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 lg:px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>


             <div className="flex">
               {/* Sidebar */}
               <div className={`fixed top-20 bottom-0 left-0 z-50 w-72 bg-white border-r border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                   sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                 }`}>
                 
               
                 
                 {/* Navigation */}
                 <nav className="flex-1 p-4">
                   <div className="mb-4">
                     <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Finance Management</h3>
                   </div>
                   <div className="space-y-1">
                     {sidebarItems.map((item) => {
                       const Icon = item.icon;
                       const isActive = pathname === item.href;
                       return (
                         <button
                           key={item.name}
                           onClick={() => {
                             setSidebarOpen(false);
                             router.push(item.href);
                           }}
                           className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors w-full text-left ${
                             isActive
                               ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                               : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                           }`}
                         >
                           <div className={`p-2 rounded-md mr-3 ${
                             isActive ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-gray-200'
                           }`}>
                             <Icon className={`w-4 h-4 ${
                               isActive ? 'text-blue-600' : 'text-gray-500'
                             }`} />
                           </div>
                           <span className="flex-1">{item.name}</span>
                           {isActive && (
                             <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                           )}
                         </button>
                       );
                     })}
                   </div>
                 </nav>
                 
             
               </div>
               
               {/* Overlay for mobile */}
               {sidebarOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
               )}
               
               {/* Main Content */}
               <div className="flex-1 lg:ml-72">
                 {/* Mobile Header */}
                 <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-4 mt-20">
                   <button
                     onClick={() => setSidebarOpen(true)}
                     className="p-2 rounded-lg hover:bg-gray-100"
                   >
                     <Bars3Icon className="h-6 w-6 text-gray-600" />
                   </button>
                 </div>
                 
                 {/* Main Content */}
                 <main className="pt-20 min-h-screen">{children}</main>
               </div>
             </div>
           </div>
         );
       }

