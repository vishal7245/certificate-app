"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const currentPath = usePathname();

  const activeClassName =
    'border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium';
  const inactiveClassName =
    'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium';

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl text-blue-600 font-bold">Certificate Generator</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/templates"
                className={currentPath === '/templates' ? activeClassName : inactiveClassName}
              >
                Templates
              </Link>
              <Link
                href="/generate"
                className={currentPath === '/generate' ? activeClassName : inactiveClassName}
              >
                Generate
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
