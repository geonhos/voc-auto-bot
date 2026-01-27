'use client';

import { LogOutIcon, UserIcon, BellIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

import { useAuthStore } from '@/store/authStore';


export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="fixed top-0 right-0 left-64 z-30 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side - can add breadcrumb or search */}
        <div className="flex items-center gap-4">
          {/* Placeholder for search or breadcrumb */}
        </div>

        {/* Right side - notifications and user menu */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
            aria-label="알림"
          >
            <BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="사용자 메뉴"
              aria-expanded={showDropdown}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user?.name || '사용자'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role === 'ADMIN' ? '관리자' : user?.role === 'MANAGER' ? '매니저' : '운영자'}
                </p>
              </div>
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOutIcon className="h-4 w-4" />
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
