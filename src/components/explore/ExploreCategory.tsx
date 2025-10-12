import React from 'react';

interface ExploreItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
  description?: string;
}

interface ExploreCategoryProps {
  item: ExploreItem;
  isCollapsed: boolean;
  isActive: boolean;
  isExpanded: boolean;
  onClick: () => void;
}

export default function ExploreCategory({ 
  item, 
  isCollapsed, 
  isActive, 
  isExpanded, 
  onClick 
}: ExploreCategoryProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center ${isCollapsed ? 'justify-center px-4 py-4' : 'space-x-4 px-4 py-3'} rounded-2xl text-left transition-all duration-300 group relative overflow-hidden
        ${isActive 
          ? isCollapsed 
            ? 'bg-gradient-to-br from-green-50 to-green-100 text-green-700 font-semibold shadow-lg shadow-green-100/50 border border-green-200/50' 
            : 'bg-green-50 text-green-700 font-semibold shadow-sm'
          : isCollapsed
            ? 'text-neutral-600 hover:bg-gradient-to-br hover:from-neutral-50 hover:to-neutral-100 hover:text-neutral-800 hover:shadow-md hover:shadow-neutral-100/50 hover:border hover:border-neutral-200/50'
            : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
        }
        ${isCollapsed ? 'hover:scale-110 hover:-translate-y-0.5' : ''}
      `}
      title={isCollapsed ? item.label : undefined}
    >
      {/* Background glow effect for active items */}
      {isActive && isCollapsed && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-green-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      )}
      
      <span className={`
        transition-all duration-300 flex-shrink-0 relative z-10 ${isCollapsed ? 'w-7 h-7' : ''}
        ${isActive 
          ? 'text-green-600 drop-shadow-sm' 
          : 'text-neutral-500 group-hover:text-neutral-700 group-hover:drop-shadow-sm'
        }
        ${isCollapsed ? 'group-hover:scale-110' : ''}
      `}>
        {item.icon}
      </span>
      
      {!isCollapsed && (
        <>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium flex-1 truncate relative z-10 block">
              {item.label}
            </span>
            {item.description && (
              <span className="text-xs text-neutral-500 truncate block mt-0.5">
                {item.description}
              </span>
            )}
          </div>
          
          {/* Badge */}
          {item.badge && (
            <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-2 py-1 rounded-full font-medium min-w-[20px] text-center shadow-sm relative z-10">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
          
          {/* Expand/Collapse indicator */}
          {item.submenu && (
            <svg 
              className={`w-4 h-4 text-neutral-400 transition-transform duration-200 relative z-10 ${
                isExpanded ? 'rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
          
          {/* Active indicator */}
          {isActive && (
            <div className="ml-auto w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full shadow-sm relative z-10"></div>
          )}
        </>
      )}
      
      {/* Enhanced active indicator for collapsed state */}
      {isActive && isCollapsed && (
        <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1.5 h-10 bg-gradient-to-b from-green-500 to-green-600 rounded-full shadow-lg shadow-green-500/30"></div>
      )}
      
      {/* Subtle pulse animation for active collapsed items */}
      {isActive && isCollapsed && (
        <div className="absolute inset-0 rounded-2xl bg-green-500/5 animate-pulse"></div>
      )}
    </button>
  );
}
