'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, User, Search, Menu, X, Heart, LogOut, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout } from '../features/auth/authSlice';
import { useGetCartQuery } from '../features/cart/cartApi';
import { toast } from 'react-hot-toast';
import { useGTM } from '@/hooks/useGTM';
import { useGA4 } from '@/hooks/useGA4';

export function Header() {
  const { isAuthenticated, user, isAdmin } = useAuth();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { trackSearch } = useGTM();
  const { trackSearch: trackGA4Search } = useGA4();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // ── hydration fix ──────────────────────────────────────────────────────────
  // Server always renders the "logged-out" state. We flip this flag after the
  // first client render so auth-dependent UI only appears after hydration.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  // ──────────────────────────────────────────────────────────────────────────

  const { data: cart } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const authCartCount = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const guestCartCount = useAppSelector((s) => s.guestCart.items.reduce((sum, i) => sum + i.quantity, 0));
  const cartCount = isAuthenticated ? authCartCount : guestCartCount;

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out');
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchQuery.trim();
    if (term) {
      trackSearch(term);
      trackGA4Search(term);
      router.push(`/products?q=${encodeURIComponent(term)}`);
    }
  };

  // What to render before hydration — always "logged out" shape, matches server HTML
  const authNav = !mounted ? (
    <>
      <Link href="/login" className="text-sm text-gray-600 hover:text-indigo-600 font-medium">Sign In</Link>
      <Link href="/register" className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700">
        Sign Up
      </Link>
    </>
  ) : isAuthenticated ? (
    <>
      <Link href="/profile/wishlist" className="relative text-gray-600 hover:text-indigo-600">
        <Heart className="w-5 h-5" />
      </Link>
      <div className="relative group">
        <button className="flex items-center gap-1 text-sm text-gray-700 hover:text-indigo-600">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <User className="w-5 h-5" />
          )}
          <span className="font-medium">{user?.name.split(' ')[0]}</span>
        </button>
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
          <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <User className="w-4 h-4" /> Profile
          </Link>
          <Link href="/profile/orders" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <ShoppingCart className="w-4 h-4" /> Orders
          </Link>
          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50">
              <LayoutDashboard className="w-4 h-4" /> Admin Panel
            </Link>
          )}
          <hr className="my-1" />
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </>
  ) : (
    <>
      <Link href="/login" className="text-sm text-gray-600 hover:text-indigo-600 font-medium">Sign In</Link>
      <Link href="/register" className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700">
        Sign Up
      </Link>
    </>
  );

  const authMobileNav = !mounted ? (
    <>
      <Link href="/login" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-700">Sign In</Link>
      <Link href="/register" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-indigo-600">Sign Up</Link>
    </>
  ) : isAuthenticated ? (
    <>
      <Link href="/profile/wishlist" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm text-gray-700">
        <Heart className="w-4 h-4" /> Wishlist
      </Link>
      <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm text-gray-700">
        <User className="w-4 h-4" /> Profile
      </Link>
      {isAdmin && (
        <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm text-indigo-600">
          <LayoutDashboard className="w-4 h-4" /> Admin Panel
        </Link>
      )}
      <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-600">
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </>
  ) : (
    <>
      <Link href="/login" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-700">Sign In</Link>
      <Link href="/register" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-indigo-600">Sign Up</Link>
    </>
  );

  return (
    <header className="bg-[#fceddf] border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center overflow-hidden h-16">
            <img src="/Icon/icon-3.webp" className="h-24 w-auto object-contain -my-4" />
          </Link>

          {/* Search - desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-4 pr-10 py-2 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/products" className="text-sm text-gray-600 hover:text-indigo-600 font-medium">Shop</Link>
            {authNav}
            {/* Cart — always visible */}
            <Link href="/cart" className="relative text-gray-600 hover:text-indigo-600">
              <ShoppingCart className="w-5 h-5" />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-gray-600" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="flex-1 pl-3 pr-4 py-2 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="bg-indigo-600 text-white p-2 rounded-full">
              <Search className="w-4 h-4" />
            </button>
          </form>
          <Link href="/products" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-700">Shop</Link>
          <Link href="/contact" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-700">Contact</Link>
          {/* Cart — always visible */}
          <Link href="/cart" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm text-gray-700">
            <ShoppingCart className="w-4 h-4" /> Cart {mounted && cartCount > 0 && `(${cartCount})`}
          </Link>
          {authMobileNav}
        </div>
      )}
    </header>
  );
}