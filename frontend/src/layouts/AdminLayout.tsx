import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, ShoppingBag, Ticket, MessageSquare, Users, ChevronRight,
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { cn } from '../utils';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/inquiries', label: 'Inquiries', icon: MessageSquare },
  { to: '/admin/users', label: 'Users', icon: Users },
];

export function AdminLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Toaster position="top-right" />
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-gray-200 flex flex-col flex-shrink-0">
        <Link to="/" className="px-6 py-5 text-xl font-bold text-white border-b border-gray-800">
          Trendora
        </Link>
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors',
                  active ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-4 border-t border-gray-800">
          <Link to="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Store
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
