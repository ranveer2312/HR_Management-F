"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TrendingUp,
  ShoppingCart,
  Truck,
  FileText,
  CreditCard,
  Receipt,
  Calculator,
  Gavel,
  LucideIcon,
} from "lucide-react";

interface Module {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  path: string;
}

const modules: Module[] = [
  { id: "dashboard", name: "Dashboard", icon: TrendingUp, color: "bg-blue-500", path: "/data-manager" },
  { id: "sales", name: "Sales Management", icon: TrendingUp, color: "bg-green-500", path: "/data-manager/sales" },
  { id: "purchase", name: "Purchase Management", icon: ShoppingCart, color: "bg-orange-500", path: "/data-manager/purchase" },
  { id: "logistics", name: "Logistics Documents", icon: Truck, color: "bg-orange-500", path: "/data-manager/logistics" },
  { id: "registration", name: "Company Registration", icon: FileText, color: "bg-purple-500", path: "/data-manager/registration" },
  { id: "banking", name: "Bank Documents", icon: CreditCard, color: "bg-indigo-500", path: "/data-manager/bank" },
  { id: "billing", name: "Billing Management", icon: Receipt, color: "bg-teal-500", path: "/data-manager/billing" },
  { id: "ca-documents", name: "CA Documents", icon: Calculator, color: "bg-red-500", path: "/data-manager/ca" },
  { id: "tenders", name: "Tender Management", icon: Gavel, color: "bg-yellow-500", path: "/data-manager/tender" },
  { id: "finance", name: "Finance Reports", icon: TrendingUp, color: "bg-pink-500", path: "/data-manager/finance" },
];

export default function Sidebar({ setSidebarOpen }: { setSidebarOpen?: (open: boolean) => void }) {
  const pathname = usePathname();

  return (
    <div className="space-y-2">
      {modules.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.id}
            href={item.path}
            onClick={() => setSidebarOpen?.(false)}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors text-sm font-medium ${
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 ${
              isActive ? 'text-blue-700' : 'text-slate-400'
            }`} />
            <span className="truncate">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
