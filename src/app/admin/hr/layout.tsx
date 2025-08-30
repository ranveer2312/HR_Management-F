'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  FileText, 
  Laptop, 
  Calendar, 
  Award, 
  UserPlus, 
  Clock,
 
  LucideIcon,
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

const menuItems: MenuItem[] = [
  { id: 'overview', label: 'Overview', icon: Home, path: '/admin/hr' },
  { id: 'documents', label: 'Employee Documents', icon: FileText, path: '/admin/hr/documents' },
  { id: 'assets', label: 'Asset Management', icon: Laptop, path: '/admin/hr/assets' },
  { id: 'leaves', label: 'Leave Management', icon: Calendar, path: '/admin/hr/leaves' },
  { id: 'performance', label: 'Performance', icon: Award, path: '/admin/hr/performance' },
  { id: 'joining', label: 'Joining/Relieving', icon: UserPlus, path: '/admin/hr/joining' },
  { id: 'activities', label: 'Weekly Activities', icon: Clock, path: '/admin/hr/activities' }
];

export default function HRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
 



  return (
    <div className="min-h-screen bg-gray-50">
     
   
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <a
                    key={item.id}
                    href={item.path}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main>{children}</main>
      </div>
    </div>
  );
} 