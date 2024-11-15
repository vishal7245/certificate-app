"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export function Navbar() {
  const currentPath = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const activeClassName =
    'border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium';
  const inactiveClassName =
    'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium';

  const mobileActiveClassName =
    'bg-blue-100 text-blue-600 inline-flex items-center justify-center w-full px-3 py-2 rounded-md text-sm font-medium';
  const mobileInactiveClassName =
    'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 inline-flex items-center justify-center w-full px-3 py-2 rounded-md text-sm font-medium';

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }

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

          {/* Right side: Logout button and mobile menu button */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <div className="sm:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {/* Close icon */}
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {/* Hamburger icon */}
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16m-7 6h7"
                    />
                  </svg>
                )}
              </button>
            </div>
            {/* Logout button, hidden on mobile */}
            <div className="hidden sm:block">
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
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="sm:hidden px-4 pt-2 pb-3 space-y-2">
          <Link
            href="/templates"
            className={
              currentPath === '/templates' ? mobileActiveClassName : mobileInactiveClassName
            }
          >
            Templates
          </Link>
          <Link
            href="/generate"
            className={
              currentPath === '/generate' ? mobileActiveClassName : mobileInactiveClassName
            }
          >
            Generate
          </Link>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 w-full px-3 py-2 rounded-md text-sm font-medium"
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      )}
    </nav>
  );
}
