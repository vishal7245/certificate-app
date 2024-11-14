import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const protectedPaths = ['/api/templates', '/api/generate-certificates', '/templates', '/generate'];

  if (protectedPaths.some((path) => req.nextUrl.pathname.startsWith(path))) {
    if (!token || !jwt.verify(token, JWT_SECRET)) {
      if (req.nextUrl.pathname.startsWith('/api/')) {
        // Return 401 for API routes
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      } else {
        // Redirect to /login for other routes
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }
  }

  return NextResponse.next();
}
