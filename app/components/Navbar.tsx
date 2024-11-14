"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export function Navbar() {
  const currentPath = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const activeClassName =
    'border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium';
  const inactiveClassName =
    'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium';

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }

      // Optionally, you can handle the response message
      // const data = await response.json();
      // console.log(data.message);

      // Redirect the user to the login page or homepage
      router.push('/login'); // Change '/login' to your login page route
    } catch (error) {
      console.error('Error during logout:', error);
      alert('Failed to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side: Logo and navigation links */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl text-blue-600 font-bold">
                Certificate Generator
              </span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/templates"
                className={
                  currentPath === '/templates' ? activeClassName : inactiveClassName
                }
              >
                Templates
              </Link>
              <Link
                href="/generate"
                className={
                  currentPath === '/generate' ? activeClassName : inactiveClassName
                }
              >
                Generate
              </Link>
            </div>
          </div>

          {/* Right side: Logout button */}
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
