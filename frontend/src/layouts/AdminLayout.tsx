import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, ShoppingBag, Ticket, MessageSquare, Users,
  ChevronRight, PanelLeftClose, PanelLeftOpen,
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

const SIDEBAR_STORAGE_KEY = 'admin:sidebarCollapsed';

function getInitialCollapsed() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function AdminLayout() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
    } catch {
      // localStorage unavailable (private mode, etc.) — fail silently
    }
  }, [collapsed]);

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Toaster position="top-right" />
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-gray-900 text-gray-200 flex flex-col flex-shrink-0 transition-[width] duration-200 ease-in-out',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        <div
          className={cn(
            'flex items-center border-b border-gray-800 h-[65px]',
            collapsed ? 'justify-center px-0' : 'justify-between px-6',
          )}
        >
          <Link
            to="/"
            className={cn(
              'text-xl font-bold text-white whitespace-nowrap overflow-hidden transition-all',
              collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100',
            )}
          >
            Bowri Shop
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex-shrink-0 p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          {navItems.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                className={cn(
                  'flex items-center gap-3 py-3 text-sm font-medium transition-colors',
                  collapsed ? 'justify-center px-0' : 'px-6',
                  active ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span
                  className={cn(
                    'whitespace-nowrap overflow-hidden transition-all',
                    collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100',
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            'py-4 border-t border-gray-800',
            collapsed ? 'flex justify-center px-0' : 'px-6',
          )}
        >
          <Link
            to="/"
            title={collapsed ? 'Back to Store' : undefined}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
          >
            <ChevronRight className="w-4 h-4 rotate-180 flex-shrink-0" />
            <span
              className={cn(
                'whitespace-nowrap overflow-hidden transition-all',
                collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100',
              )}
            >
              Back to Store
            </span>
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