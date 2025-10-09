import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';

interface ChannelMenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  description?: string;
  badge?: number;
}

interface YourChannelMenuProps {
  user: any;
  isCollapsed: boolean;
  onNavigate: (path: string) => void;
}

export default function YourChannelMenu({ user, isCollapsed, onNavigate }: YourChannelMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [router.pathname]);

  const channelMenuItems: ChannelMenuItem[] = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      label: 'YouTube Studio',
      path: '/studio',
      description: 'Manage your channel and content'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Your Videos',
      path: '/my-videos',
      description: 'Manage your content'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      label: 'Upload Video',
      path: '/upload',
      description: 'Create new content'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      label: 'Playlists',
      path: '/playlists',
      description: 'Organize your videos'
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
      description: 'See your public channel'
    }
  ];

  const handleItemClick = (path: string) => {
    onNavigate(path);
    setIsOpen(false);
  };

  const isActive = router.pathname.startsWith('/channel/') || 
                   router.pathname === '/my-videos' || 
                   router.pathname === '/upload' ||
                   router.pathname === '/playlists';

  if (isCollapsed) {
    return (
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-center px-4 py-4 rounded-2xl text-left transition-all duration-300 group relative overflow-hidden
          ${isActive 
            ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 font-semibold shadow-lg shadow-blue-100/50 border border-blue-200/50' 
            : 'text-neutral-600 hover:bg-gradient-to-br hover:from-neutral-50 hover:to-neutral-100 hover:text-neutral-800 hover:shadow-md hover:shadow-neutral-100/50 hover:border hover:border-neutral-200/50'
          }
          hover:scale-110 hover:-translate-y-0.5
        `}
        title="Your Channel"
      >
        {/* Background glow effect for active items */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-blue-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        )}
        
        <span className={`
          transition-all duration-300 flex-shrink-0 relative z-10 w-7 h-7
          ${isActive 
            ? 'text-blue-600 drop-shadow-sm' 
            : 'text-neutral-500 group-hover:text-neutral-700 group-hover:drop-shadow-sm'
          }
          group-hover:scale-110
        `}>
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </span>
        
        {/* Enhanced active indicator for collapsed state */}
        {isActive && (
          <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1.5 h-10 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full shadow-lg shadow-blue-500/30"></div>
        )}
        
        {/* Subtle pulse animation for active collapsed items */}
        {isActive && (
          <div className="absolute inset-0 rounded-2xl bg-blue-500/5 animate-pulse"></div>
        )}
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center space-x-4 px-4 py-3 rounded-2xl text-left transition-all duration-300 group relative overflow-hidden
          ${isActive 
            ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 font-semibold shadow-lg shadow-blue-100/50 border border-blue-200/50' 
            : 'text-neutral-700 hover:bg-gradient-to-br hover:from-neutral-50 hover:to-neutral-100 hover:text-neutral-800 hover:shadow-md hover:shadow-neutral-100/50 hover:border hover:border-neutral-200/50'
          }
        `}
      >
        {/* Background glow effect for active items */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-blue-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        )}
        
        <span className={`
          transition-all duration-300 flex-shrink-0 relative z-10
          ${isActive 
            ? 'text-blue-600 drop-shadow-sm' 
            : 'text-neutral-500 group-hover:text-neutral-700 group-hover:drop-shadow-sm'
          }
        `}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </span>
        
        <span className="text-sm font-medium flex-1 truncate relative z-10">Your Channel</span>
        
        <svg className={`
          w-4 h-4 transition-transform duration-200 relative z-10
          ${isOpen ? 'rotate-180' : ''}
          ${isActive ? 'text-blue-600' : 'text-neutral-500 group-hover:text-neutral-700'}
        `} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        
        {/* Active indicator for expanded state */}
        {isActive && (
          <div className="ml-auto w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full shadow-sm relative z-10"></div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-2">
            {channelMenuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleItemClick(item.path)}
                className="w-full text-left px-3 py-3 hover:bg-neutral-50 rounded-lg transition-colors duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-neutral-500 group-hover:text-neutral-700 transition-colors duration-200">
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-neutral-900 truncate">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium min-w-[18px] text-center">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-neutral-500 mt-0.5 truncate">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
            
            {/* Divider */}
            <div className="border-t border-neutral-200 my-2"></div>
            
            {/* Quick Actions */}
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                Quick Actions
              </p>
              <div className="space-y-1">
                <button
                  onClick={() => handleItemClick('/upload')}
                  className="w-full text-left px-2 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Upload Video</span>
                </button>
                <button
                  onClick={() => handleItemClick('/playlists/create')}
                  className="w-full text-left px-2 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Create Playlist</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
