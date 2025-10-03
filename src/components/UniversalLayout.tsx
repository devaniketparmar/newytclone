import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';

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

  return (
    <div className={`min-h-screen bg-neutral-50 flex ${className}`}>
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        user={user}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Universal Header */}
        {showHeader && (
          <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
            <div className="flex items-center justify-between px-4 py-3">
              {/* Left Section */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-full hover:bg-neutral-100 transition-colors lg:hidden"
                >
                  <svg className="w-6 h-6 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <h1 className="text-xl font-bold text-neutral-900">YouTube</h1>
                </div>
              </div>

              {/* Center Section - Custom Header Content */}
              <div className="flex-1 max-w-2xl mx-8">
                {headerContent || (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search"
                      className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-l-full rounded-r-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button className="absolute right-0 top-0 bottom-0 px-6 bg-neutral-100 border border-l-0 border-neutral-300 rounded-r-full hover:bg-neutral-200 transition-colors">
                      <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Right Section */}
              <div className="flex items-center space-x-4">
                {user && (
                  <button 
                    onClick={() => router.push('/upload')}
                    className="p-2 rounded-full hover:bg-neutral-100 transition-colors" 
                    title="Create"
                  >
                    <svg className="w-6 h-6 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                )}

                <div className="flex items-center space-x-3">
                  {user ? (
                    <>
                      <div className="w-8 h-8 bg-neutral-300 rounded-full flex items-center justify-center">
                        <img
                          src={user?.avatarUrl || '/api/placeholder/32/32'}
                          alt={user?.firstName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      <button className="p-2 rounded-full hover:bg-neutral-100 transition-colors" title="Logout">
                        <svg className="w-6 h-6 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => router.push('/auth')}
                      className="px-4 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
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
