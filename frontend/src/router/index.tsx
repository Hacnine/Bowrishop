import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProtectedRoute, AdminRoute } from '../components/ProtectedRoute';
import { lazy, Suspense } from 'react';

const Loading = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
  </div>
);

const wrap = (Component: React.ComponentType) => (
  <Suspense fallback={<Loading />}><Component /></Suspense>
);

// Public pages
const HomePage = lazy(() => import('../pages/HomePage').then((m) => ({ default: m.HomePage })));
const ProductsPage = lazy(() => import('../pages/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const ContactPage = lazy(() => import('../pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

// Auth pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const OAuthCallbackPage = lazy(() => import('../pages/auth/OAuthCallbackPage').then((m) => ({ default: m.OAuthCallbackPage })));

// Protected pages
const CartPage = lazy(() => import('../pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('../pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const OrderConfirmationPage = lazy(() => import('../pages/OrderConfirmationPage').then((m) => ({ default: m.OrderConfirmationPage })));
const OrdersPage = lazy(() => import('../pages/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const ProfilePage = lazy(() => import('../pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const WishlistPage = lazy(() => import('../pages/WishlistPage').then((m) => ({ default: m.WishlistPage })));

// Admin pages
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminProducts = lazy(() => import('../pages/admin/AdminProducts').then((m) => ({ default: m.AdminProducts })));
const AdminCategories = lazy(() => import('../pages/admin/AdminCategories').then((m) => ({ default: m.AdminCategories })));
const AdminOrders = lazy(() => import('../pages/admin/AdminOrders').then((m) => ({ default: m.AdminOrders })));
const AdminCoupons = lazy(() => import('../pages/admin/AdminCoupons').then((m) => ({ default: m.AdminCoupons })));
const AdminInquiries = lazy(() => import('../pages/admin/AdminInquiries').then((m) => ({ default: m.AdminInquiries })));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers').then((m) => ({ default: m.AdminUsers })));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: wrap(HomePage) },
      { path: 'products', element: wrap(ProductsPage) },
      { path: 'products/:slug', element: wrap(ProductDetailPage) },
      { path: 'contact', element: wrap(ContactPage) },
      { path: 'login', element: wrap(LoginPage) },
      { path: 'register', element: wrap(RegisterPage) },
      { path: 'auth/callback', element: wrap(OAuthCallbackPage) },
      { path: 'cart', element: wrap(CartPage) },
      { path: 'checkout', element: wrap(CheckoutPage) },
      { path: 'orders/success/:id', element: wrap(OrderConfirmationPage) },
      { path: 'orders/guest-success/:id', element: wrap(OrderConfirmationPage) },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'profile/orders', element: wrap(OrdersPage) },
          { path: 'profile', element: wrap(ProfilePage) },
          { path: 'wishlist', element: wrap(WishlistPage) },
        ],
      },
    ],
  },
  {
    path: '/admin',
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: wrap(AdminDashboard) },
          { path: 'products', element: wrap(AdminProducts) },
          { path: 'categories', element: wrap(AdminCategories) },
          { path: 'orders', element: wrap(AdminOrders) },
          { path: 'coupons', element: wrap(AdminCoupons) },
          { path: 'inquiries', element: wrap(AdminInquiries) },
          { path: 'users', element: wrap(AdminUsers) },
        ],
      },
    ],
  },
  { path: '*', element: wrap(NotFoundPage) },
]);
