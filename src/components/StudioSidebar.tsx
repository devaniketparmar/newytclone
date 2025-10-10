import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

interface StudioSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

interface NavigationItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  active: boolean;
  badge?: number;
}

export default function StudioSidebar({ isOpen, onClose, user }: StudioSidebarProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Load collapsed state from sessionStorage and handle hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCollapsedState = sessionStorage.getItem('studio-sidebar-collapsed');
      if (savedCollapsedState !== null) {
        setIsCollapsed(JSON.parse(savedCollapsedState));
      }
      setIsHydrated(true);
    }
  }, []);

  // Save collapsed state to sessionStorage whenever it changes
  const handleCollapseToggle = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('studio-sidebar-collapsed', JSON.stringify(collapsed));
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const studioNavigationItems: NavigationItem[] = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      label: 'Overview',
      path: '/studio',
      active: router.pathname === '/studio'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Content',
      path: '/studio?tab=content',
      active: router.pathname === '/studio' && router.query.tab === 'content'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      label: 'Analytics',
      path: '/studio?tab=analytics',
      active: router.pathname === '/studio' && router.query.tab === 'analytics'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
      label: 'Comments',
      path: '/studio?tab=comments',
      active: router.pathname === '/studio' && router.query.tab === 'comments'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      label: 'Subscribers',
      path: '/studio?tab=subscribers',
      active: router.pathname === '/studio' && router.query.tab === 'subscribers'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: 'Settings',
      path: '/studio?tab=settings',
      active: router.pathname === '/studio' && router.query.tab === 'settings'
    }
  ];

  const quickActionsItems: NavigationItem[] = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      label: 'Upload Video',
      path: '/upload',
      active: router.pathname === '/upload'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      label: 'Create Playlist',
      path: '/playlists/create',
      active: router.pathname === '/playlists/create'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      label: 'View Channel',
      path: `/channel/${user?.id}`,
      active: router.pathname === `/channel/${user?.id}`
    }
  ];

  const handleNavigation = (path: string) => {
    if (path.startsWith('/studio')) {
      // Handle studio tab navigation
      const url = new URL(path, window.location.origin);
      const tab = url.searchParams.get('tab');
      if (tab) {
        router.push(`/studio?tab=${tab}`);
      } else {
        router.push('/studio');
      }
    } else {
      // Handle external navigation
      router.push(path);
    }
    onClose();
  };

  const renderNavigationItem = (item: NavigationItem, index: number) => (
    <button
      key={index}
      onClick={() => handleNavigation(item.path)}
      className={`
        w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-left transition-all duration-200 group relative
        ${item.active 
          ? 'bg-red-50 text-red-700 font-semibold shadow-sm' 
          : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
        }
      `}
      title={item.label}
    >
      <span className={`
        transition-colors duration-200 flex-shrink-0
        ${item.active 
          ? 'text-red-600' 
          : 'text-neutral-500 group-hover:text-neutral-700'
        }
      `}>
        {item.icon}
      </span>
      <span className="text-sm font-medium flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium min-w-[20px] text-center">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
      {item.active && (
        <div className="ml-auto w-1 h-6 bg-red-600 rounded-full"></div>
      )}
    </button>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-all duration-300 ease-out"
          onClick={onClose}
          style={{
            animation: 'fadeIn 0.3s ease-out'
          }}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white border-r border-neutral-200 z-50 transform transition-all duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:sticky lg:top-0 lg:z-auto lg:block lg:h-screen
        ${isCollapsed ? 'w-0 lg:w-0' : 'w-60 lg:w-60'} shadow-xl lg:shadow-none
      `}
      style={{
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* make inner content scroll independently on large screens */}
        <div className={`flex flex-col h-full max-h-screen transition-all duration-300 ease-out ${isCollapsed ? 'overflow-hidden opacity-0' : 'overflow-y-auto lg:overflow-y-auto opacity-100'}`} style={{ WebkitOverflowScrolling: 'touch' }}>
          {!isCollapsed && isHydrated && (
            <>
              {/* Header */}
              <div className="flex items-center bg-gradient-to-r from-white to-neutral-50 p-2 justify-between"> 
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <span className="text-xl font-bold text-neutral-900">Studio</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCollapseToggle(!isCollapsed)}
                    className="hidden lg:flex p-2 rounded-xl hover:bg-neutral-100 transition-colors duration-200"
                    title="Hide sidebar"
                  >
                    <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={onClose}
                    className="lg:hidden p-2 rounded-xl hover:bg-neutral-100 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent hover:scrollbar-thumb-neutral-400 scroll-smooth">
                {/* Studio Navigation */}
                <div className="p-4">
                  <div className="px-4 py-2 mb-2">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Studio
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {studioNavigationItems.map((item, index) => renderNavigationItem(item, index))}
                  </div>
                </div>

                {/* Divider */}
                <div className="mx-4 border-t border-neutral-200" />

                {/* Quick Actions */}
                <div className="p-4">
                  <div className="px-4 py-2 mb-2">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Quick Actions
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {quickActionsItems.map((item, index) => renderNavigationItem(item, index))}
                  </div>
                </div>

                {/* Divider */}
                <div className="mx-4 border-t border-neutral-200" />

                {/* User Profile Section */}
                <div className="p-4">
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-3 w-full p-3 rounded-xl hover:bg-neutral-50 transition-colors duration-200"
                    >
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl.startsWith('/uploads/') ? `/api/uploads/${user.avatarUrl.replace('/uploads/', '')}` : user.avatarUrl}
                          alt={user.firstName || user.username || 'User'}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            // Fallback to initials if image fails to load
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold ${user?.avatarUrl ? 'hidden' : 'flex'}`}
                      >
                        {user?.firstName ? user.firstName.charAt(0).toUpperCase() : user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {user?.name || 'User'}
                        </div>
                        <div className="text-xs text-gray-700 truncate">
                          {user?.email || 'user@example.com'}
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showUserMenu && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-xl shadow-lg z-50">
                        <div className="p-2">
                          <button className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                            View Profile
                          </button>
                          <button className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                            Account Settings
                          </button>
                          <button className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-neutral-200 bg-neutral-50">
                <div className="text-xs text-neutral-500 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <a href="#" className="hover:text-neutral-700 transition-colors duration-200">Help</a>
                    <a href="#" className="hover:text-neutral-700 transition-colors duration-200">Feedback</a>
                    <a href="#" className="hover:text-neutral-700 transition-colors duration-200">Terms</a>
                    <a href="#" className="hover:text-neutral-700 transition-colors duration-200">Privacy</a>
                  </div>
                  <div className="pt-2 text-xs text-neutral-400 font-medium">
                    © 2024 YouTube Studio
                  </div>
                </div>
              </div>
            </>
          )}
          
          {/* Fallback content for SSR */}
          {!isHydrated && (
            <div className="flex flex-col h-full">
              <div className="flex items-center bg-gradient-to-r from-white to-neutral-50 p-2 justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <span className="text-xl font-bold text-neutral-900">Studio</span>
                </div>
              </div>
              <div className="flex-1 p-4">
                <div className="space-y-1">
                  {studioNavigationItems.map((item, index) => (
                    <div key={index} className="w-full flex items-center space-x-4 px-4 py-3 rounded-2xl text-left">
                      <span className="w-5 h-5 text-neutral-500">{item.icon}</span>
                      <span className="text-sm font-medium flex-1 truncate">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hamburger Menu Button - Show when sidebar is hidden */}
      {isCollapsed && (
        <button
          onClick={() => handleCollapseToggle(false)}
          className="fixed top-1 left-4 z-50 lg:flex hidden p-2 bg-white rounded-xl shadow-lg border border-neutral-200 hover:bg-neutral-50 transition-all duration-200 hover:scale-105"
          title="Show sidebar"
        >
          <svg className="w-6 h-6 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        @keyframes slideOut {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </>
  );
}
