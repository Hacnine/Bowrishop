import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAuthenticated = request.cookies.has('auth_token');

  if (pathname === '/products' && request.nextUrl.search) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = '/products/search';
    return NextResponse.rewrite(rewriteUrl);
  }

  // Protected routes that require authentication
  const protectedRoutes = [
    '/profile',
    '/profile/orders',
    '/profile/wishlist',
    '/wishlist',
    '/checkout',
  ];

  // Admin routes
  const adminRoutes = ['/admin'];

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the route is an admin route
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  // If accessing protected route without auth, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If accessing admin route without auth, redirect to login
  if (isAdminRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
