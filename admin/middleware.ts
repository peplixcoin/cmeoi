import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('adminToken')?.value;
  const role = request.cookies.get('adminRole')?.value;
  const pathname = request.nextUrl.pathname;

  // Define protected routes and their required roles
  const protectedRoutes = {
    '/': ['SuperAdmin'],
    '/menu': ['SuperAdmin'],
    '/feedbacks': ['SuperAdmin'],
    '/today-orders': ['Manager'],
    '/history': ['Manager'],
    '/manager': ['Manager'],
    '/cook': ['Manager', 'Cook'],
    '/deliver-order': ['DeliveryMan'],
    '/ticket-scanner': ['TicketScanner'], 
  };

  // Check if the current route is protected
  const isProtected = Object.keys(protectedRoutes).some(route => 
    pathname.startsWith(route)
  );

  if (isProtected || pathname === '/') {
    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if user has the required role for the route
    const requiredRoles = Object.entries(protectedRoutes)
      .find(([route]) => pathname.startsWith(route))?.[1] || [];

    // If accessing root or a protected route, redirect DeliveryMan to /deliver-order
    if (role === 'DeliveryMan') {
      if (pathname !== '/deliver-order') {
        return NextResponse.redirect(new URL('/deliver-order', request.url));
      }
    } else if (!requiredRoles.includes(role as string)) {
      // Redirect to default page based on role
      if (role === 'Manager') {
        return NextResponse.redirect(new URL('/today-orders', request.url));
      } else if (role === 'Cook') {
        return NextResponse.redirect(new URL('/cook', request.url));
      } 
      else if (role === 'TicketScanner') {
        return NextResponse.redirect(new URL('/ticket-scanner', request.url));
      } 
      else if (role === 'SuperAdmin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login page
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
};