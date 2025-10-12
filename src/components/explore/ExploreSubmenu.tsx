import React from 'react';

interface ExploreItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface ExploreSubmenuProps {
  items: ExploreItem[];
  onItemClick: (path: string) => void;
  currentPath: string;
}

export default function ExploreSubmenu({ items, onItemClick, currentPath }: ExploreSubmenuProps) {
  return (
    <div className="ml-6 mt-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
      {items.map((item) => {
        const isActive = currentPath === item.path;
        
        return (
          <button
            key={item.id}
            onClick={() => onItemClick(item.path)}
            className={`
              w-full flex items-center space-x-3 px-4 py-2 rounded-xl text-left transition-all duration-200 group relative
              ${isActive 
                ? 'bg-green-50 text-green-700 font-medium shadow-sm border-l-2 border-green-500' 
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
              }
            `}
          >
            <span className={`
              transition-colors duration-200 flex-shrink-0
              ${isActive 
                ? 'text-green-600' 
                : 'text-neutral-400 group-hover:text-neutral-600'
              }
            `}>
              {item.icon}
            </span>
            
            <span className="text-sm font-medium flex-1 truncate">
              {item.label}
            </span>
            
            {isActive && (
              <div className="w-1 h-4 bg-green-500 rounded-full"></div>
            )}
          </button>
        );
      })}
    </div>
  );
}
