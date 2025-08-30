'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArchiveBoxIcon,
  BookOpenIcon,
  DocumentArrowUpIcon,
  BeakerIcon,
  WrenchScrewdriverIcon,
  CubeTransparentIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  TableCellsIcon,
  CpuChipIcon,
  PrinterIcon,
  PencilSquareIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { APIURL } from '@/constants/api';

interface ItemData {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  apiUrl: string;
}

interface SectionData {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'emerald' | 'purple' | 'orange';
  count: string;
  items: ItemData[];
}

export default function StorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  const initialSections = useMemo((): SectionData[] => [
    {
      title: "Office Supplies & Assets",
      description: "Manage daily consumables and fixed office assets",
      icon: PencilSquareIcon,
      color: "blue" as const,
      count: "0",
      items: [
        {
          title: "Daily Consumables",
          description: "Pens, papers, and office supplies",
          href: "/store/stationary/regular",
          icon: BookOpenIcon,
          count: 0,
          apiUrl: APIURL + '/store/stationary/regular',
        },
        {
          title: "Fixed Assets",
          description: "Permanent office equipment",
          href: "/store/stationary/fixed",
          icon: ArchiveBoxIcon,
          count: 0,
          apiUrl: APIURL + '/store/stationary/fixed',
        },
        {
          title: "Inventory Tracking",
          description: "Monitor supply movements",
          href: "/store/stationary/inventory",
          icon: DocumentArrowUpIcon,
          count: 0,
          apiUrl: APIURL + '/store/stationary/inventory',
        }
      ]
    },
    {
      title: "Laboratory Management",
      description: "Scientific equipment and laboratory supplies",
      icon: BeakerIcon,
      color: "emerald" as const,
      count: "0",
      items: [
        {
          title: "Lab Instruments",
          description: "Scientific equipment and tools",
          href: "/store/lab/instruments",
          icon: BeakerIcon,
          count: 0,
          apiUrl: APIURL + '/store/lab/instruments',
        },
        {
          title: "Components & Parts",
          description: "Spare parts and modules",
          href: "/store/lab/components",
          icon: WrenchScrewdriverIcon,
          count: 0,
          apiUrl: APIURL + '/store/lab/components',
        },
        {
          title: "Lab Materials",
          description: "Consumable lab supplies",
          href: "/store/lab/materials",
          icon: CubeTransparentIcon,
          count: 0,
          apiUrl: APIURL + '/store/lab/materials',
        },
        {
          title: "Usage Analytics",
          description: "Track lab inventory usage",
          href: "/store/lab/inventory",
          icon: ChartBarIcon,
          count: 0,
          apiUrl: APIURL + '/store/lab/inventory',
        }
      ]
    },
    {
      title: "IT & Infrastructure",
      description: "Technology assets and office infrastructure",
      icon: BuildingOfficeIcon,
      color: "purple" as const,
      count: "0",
      items: [
        {
          title: "Furniture & Fixtures",
          description: "Office furniture and fittings",
          href: "/store/assets/furniture",
          icon: TableCellsIcon,
          count: 0,
          apiUrl: APIURL + '/store/assets/furniture',
        },
        {
          title: "Computer Systems",
          description: "Laptops, desktops, and servers",
          href: "/store/assets/systems",
          icon: CpuChipIcon,
          count: 0,
          apiUrl: APIURL + '/store/assets/systems',
        },
        {
          title: "Office Equipment",
          description: "Printers and peripherals",
          href: "/store/assets/printers",
          icon: PrinterIcon,
          count: 0,
          apiUrl: APIURL + '/store/assets/printers',
        }
      ]
    },
    // {
    //   title: "Material Flow Control",
    //   description: "Track all incoming and outgoing materials",
    //   icon: CubeTransparentIcon,
    //   color: "orange",
    //   count: "0",
    //   items: [
    //     {
    //       title: "Material Transactions",
    //       description: "Complete in/out material records",
    //       href: "/store/materials-in-out",
    //       icon: CubeTransparentIcon,
    //       count: 0,
    //       apiUrl: APIURL + "/api/materials",
    //     }
    //   ]
    // },
  ], []);

  const fetchAllCounts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const updatedSections = [...initialSections];
      let grandTotal = 0;
      
      for (let sectionIndex = 0; sectionIndex < updatedSections.length; sectionIndex++) {
        const section = updatedSections[sectionIndex];
        let sectionTotal = 0;

        for (let itemIndex = 0; itemIndex < section.items.length; itemIndex++) {
          const item = section.items[itemIndex];
          
          try {
            const response = await fetch(item.apiUrl.replace(APIURL, process.env.NEXT_PUBLIC_API_URL || APIURL), {
              method: 'GET',
              headers,
            });

            if (response.ok) {
              // Safe JSON parsing
              const text = await response.text();
              let data = [];
              
              if (text && text.trim()) {
                try {
                  data = JSON.parse(text);
                } catch (parseError) {
                  console.error(`JSON parse error for ${item.title}:`, parseError);
                  data = [];
                }
              }
              
              let count = 0;
              
              if (Array.isArray(data)) {
                count = data.length;
              } else if (data?.count) {
                count = data.count;
              } else if (data?.total) {
                count = data.total;
              }

              updatedSections[sectionIndex].items[itemIndex].count = count;
              sectionTotal += count;
            }
          } catch (error) {
            console.error(`Error fetching ${item.title}:`, error);
          }
        }

        updatedSections[sectionIndex].count = sectionTotal.toString();
        grandTotal += sectionTotal;
      }

      setSections(updatedSections);
      setTotalItems(grandTotal);
    } catch (error) {
      console.error('Error fetching counts:', error);
    } finally {
      setLoading(false);
    }
  }, [initialSections]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    let roles = [];
    
    try {
      const rolesString = localStorage.getItem('roles');
      if (rolesString && rolesString.trim()) {
        roles = JSON.parse(rolesString);
      }
    } catch (error) {
      console.error('Error parsing roles from localStorage:', error);
      roles = [];
    }

    if (!token || !roles.includes('STORE')) {
      router.replace('/login');
    } else {
      fetchAllCounts();
    }
  }, [router, fetchAllCounts]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Loading Inventory</h3>
            <p className="text-gray-600 dark:text-gray-400">Fetching store data...</p>
          </div>
        </div>
      </div>
    );
  }

  const colorSchemes = {
    blue: {
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
      border: 'border-blue-200/50 dark:border-blue-700/50',
      text: 'text-blue-700 dark:text-blue-300'
    },
    emerald: {
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
      border: 'border-emerald-200/50 dark:border-emerald-700/50',
      text: 'text-emerald-700 dark:text-emerald-300'
    },
    purple: {
      gradient: 'from-purple-500 to-pink-600',
      bg: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
      border: 'border-purple-200/50 dark:border-purple-700/50',
      text: 'text-purple-700 dark:text-purple-300'
    },
    orange: {
      gradient: 'from-orange-500 to-red-600',
      bg: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
      border: 'border-orange-200/50 dark:border-orange-700/50',
      text: 'text-orange-700 dark:text-orange-300'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      {/* Header Section */}
      <div className="px-4 py-6">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
            Store Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
            Inventory management system
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex items-center space-x-3 sm:flex-col sm:space-x-0 sm:space-y-2 sm:text-center">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                <CubeTransparentIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{totalItems}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex items-center space-x-3 sm:flex-col sm:space-x-0 sm:space-y-2 sm:text-center">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                <ArrowTrendingUpIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{sections.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Categories</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex items-center space-x-3 sm:flex-col sm:space-x-0 sm:space-y-2 sm:text-center">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                <ClockIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">Live</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Real-time</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="px-4 pb-8">
        <div className="space-y-6">
          {sections.map((section, index) => {
            const colors = colorSchemes[section.color];
            const SectionIcon = section.icon;
            
            return (
              <div 
                key={index}
                className={`bg-gradient-to-br ${colors.bg} backdrop-blur-xl rounded-xl p-4 border ${colors.border} shadow-xl`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Section Header */}
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 bg-gradient-to-r ${colors.gradient} rounded-lg shadow-lg`}>
                        <SectionIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {section.title}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {section.description}
                        </p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 bg-white/80 dark:bg-gray-800/80 rounded-lg border ${colors.border} shadow-lg text-center`}>
                      <span className={`text-lg font-bold ${colors.text}`}>
                        {section.count}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">items</p>
                    </div>
                  </div>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.items.map((item, itemIndex) => {
                    const ItemIcon = item.icon;
                    
                    return (
                      <Link key={itemIndex} href={item.href} className="group">
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-lg p-5 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 bg-gradient-to-r ${colors.gradient} rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300`}>
                              <ItemIcon className="h-5 w-5 text-white" />
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {item.count}
                              </span>
                              <p className="text-xs text-gray-500 dark:text-gray-400">items</p>
                            </div>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed">
                            {item.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className={`h-1 flex-1 bg-gradient-to-r ${colors.gradient} rounded-full opacity-20 group-hover:opacity-100 transition-opacity duration-300`}></div>
                            <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200 ml-2" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}