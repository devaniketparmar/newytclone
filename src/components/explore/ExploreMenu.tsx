import React from 'react';
import { useRouter } from 'next/router';
import ExploreSection from './ExploreSection';

interface ExploreMenuProps {
  isCollapsed: boolean;
  onNavigate: (path: string) => void;
}

export default function ExploreMenu({ isCollapsed, onNavigate }: ExploreMenuProps) {
  const router = useRouter();

  // Check if any submenu item is currently active
  const isSubmenuActive = router.pathname.startsWith('/category') || 
                         router.pathname.startsWith('/trending') || 
                         router.pathname.startsWith('/live') || 
                         router.pathname.startsWith('/shorts') || 
                         router.pathname.startsWith('/hashtags') || 
                         router.pathname.startsWith('/playlists') || 
                         router.pathname.startsWith('/channels') || 
                         router.pathname.startsWith('/music-discovery') ||
                         router.pathname === '/categories';

  // Always show submenu by default
  const shouldShowSubmenu = true;

  const handleNavigate = (path: string) => {
    onNavigate(path);
  };

  return (
    <div className="relative">
      {/* Main Explore Button */}
      <button
        className={`
          w-full flex items-center ${isCollapsed ? 'justify-center px-4 py-4' : 'space-x-4 px-4 py-3'} rounded-2xl text-left transition-all duration-300 group relative overflow-hidden
          ${isSubmenuActive
            ? isCollapsed 
              ? 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 font-semibold shadow-lg shadow-purple-100/50 border border-purple-200/50' 
              : 'bg-purple-50 text-purple-700 font-semibold shadow-sm'
            : isCollapsed
              ? 'text-neutral-600 hover:bg-gradient-to-br hover:from-neutral-50 hover:to-neutral-100 hover:text-neutral-800 hover:shadow-md hover:shadow-neutral-100/50 hover:border hover:border-neutral-200/50'
              : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
          }
          ${isCollapsed ? 'hover:scale-110 hover:-translate-y-0.5' : ''}
        `}
        title={isCollapsed ? 'Explore' : undefined}
      >
        {/* Background glow effect for active items */}
        {isSubmenuActive && isCollapsed && (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-purple-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        )}
        
        <span className={`
          transition-all duration-300 flex-shrink-0 relative z-10 ${isCollapsed ? 'w-7 h-7' : ''}
          ${isSubmenuActive
            ? 'text-purple-600 drop-shadow-sm' 
            : 'text-neutral-500 group-hover:text-neutral-700 group-hover:drop-shadow-sm'
          }
          ${isCollapsed ? 'group-hover:scale-110' : ''}
        `}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        
        {!isCollapsed && (
          <>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium flex-1 truncate relative z-10 block">
                Explore
              </span>
              <span className="text-xs text-neutral-500 truncate block mt-0.5">
                Discover new content
              </span>
            </div>
            
            {/* Active indicator */}
            {isSubmenuActive && (
              <div className="ml-auto w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full shadow-sm relative z-10"></div>
            )}
          </>
        )}
        
        {/* Enhanced active indicator for collapsed state */}
        {isSubmenuActive && isCollapsed && (
          <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1.5 h-10 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full shadow-lg shadow-purple-500/30"></div>
        )}
        
        {/* Subtle pulse animation for active collapsed items */}
        {isSubmenuActive && isCollapsed && (
          <div className="absolute inset-0 rounded-2xl bg-purple-500/5 animate-pulse"></div>
        )}
      </button>

      {/* Explore Submenu - Always visible by default */}
      {shouldShowSubmenu && (
        <div className={`${isCollapsed ? 'absolute left-full top-0 ml-2' : 'relative'} bg-white border border-neutral-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto min-w-64`}>
          <ExploreSection 
            isCollapsed={isCollapsed} 
            onNavigate={handleNavigate}
          />
        </div>
      )}
    </div>
  );
}
