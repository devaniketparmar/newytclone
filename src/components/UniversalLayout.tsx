import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';
import Search from './Search';

import { api } from '../lib/axios';
interface UniversalLayoutProps {
  children: React.ReactNode;
  user?: any;
  showHeader?: boolean;
  headerContent?: React.ReactNode;
  className?: string;
}

export default function UniversalLayout({ 
  children, 
  user, 
  showHeader = true, 
  headerContent,
  className = ""
}: UniversalLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const response = await api.get('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.status === 200) {
        // Clear any client-side state if needed
        // Redirect to auth page
        router.push('/auth');
      } else {
        console.error('Logout failed');
        // Still redirect to auth page even if logout fails
        router.push('/auth');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect to auth page even if logout fails
      router.push('/auth');
    }
  };

  // Load sidebar open state from sessionStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSidebarState = sessionStorage.getItem('sidebar-open');
      if (savedSidebarState !== null) {
        setSidebarOpen(JSON.parse(savedSidebarState));
      }
    }
  }, []);

  // Save sidebar open state to sessionStorage whenever it changes
  const handleSidebarToggle = (open: boolean) => {
    setSidebarOpen(open);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sidebar-open', JSON.stringify(open));
    }
  };

  return (
    <div className={`min-h-screen bg-neutral-50 flex ${className}`}>
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => handleSidebarToggle(false)} 
        user={user}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col transition-all duration-300 ease-out"> 
        {/* Universal Header */}
        {showHeader && (
          <header className="sticky top-0 z-30 main-header">
            {/* ultra-slim header: minimal paddings, smaller icons and tighter spacing */}
            <div className="flex items-center justify-between px-3 py-1.5">
              {/* Left Section */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleSidebarToggle(!sidebarOpen)}
                  className="p-2 rounded-full hover:bg-neutral-100 transition-all duration-200 hover:scale-105 lg:hidden"
                >
                  <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              {/* Center Section - Search Bar */}
              <div className="flex-1 max-w-md mx-2">
                {headerContent || (
                  <Search 
                    placeholder="Search videos, channels, and more"
                    showFilters={false}
                    compact
                  />
                )}
              </div>

              {/* Right Section */}
              <div className="flex items-center space-x-2">
                {user && (
                  <button 
                    onClick={() => router.push('/upload')}
                    className="p-1.5 rounded-full hover:bg-neutral-100 transition-colors" 
                    title="Create"
                  >
                    <svg className="w-4 h-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                )}

                <div className="flex items-center space-x-2">
                  {user ? (
                    <>
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl.startsWith('/uploads/') ? `/api/uploads/${user.avatarUrl.replace('/uploads/', '')}` : user.avatarUrl}
                          alt={user.firstName || user.username || 'User'}
                          className="w-7 h-7 rounded-full object-cover"
                          onError={(e) => {
                            // Fallback to initials if image fails to load
                            e.currentTarget.style.display = 'none';
                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                            if (nextElement) {
                              nextElement.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-7 h-7 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-sm ${user.avatarUrl ? 'hidden' : 'flex'}`}
                      >
                        {user?.firstName ? user.firstName.charAt(0).toUpperCase() : user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <button 
                        onClick={handleLogout}
                        className="p-1.5 rounded-full hover:bg-neutral-100 transition-colors" 
                        title="Logout"
                      >
                        <svg className="w-4 h-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => router.push('/auth')}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors font-medium text-sm"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
