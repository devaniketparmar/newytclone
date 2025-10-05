import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

interface SidebarProps {
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

export default function Sidebar({ isOpen, onClose, user }: SidebarProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if (e.key === '/' && !searchRef.current?.matches(':focus')) {
        e.preventDefault();
        searchRef.current?.focus();
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

  const mainNavigationItems: NavigationItem[] = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      label: 'Home',
      path: '/videos',
      active: router.pathname === '/videos'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      label: 'Trending',
      path: '/trending',
      active: router.pathname === '/trending',
      badge: 12
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828zM4.828 17h8l-2.586-2.586a2 2 0 00-2.828 0L4.828 17z" />
        </svg>
      ),
      label: 'Subscriptions',
      path: '/subscriptions',
      active: router.pathname === '/subscriptions',
      badge: 3
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      label: 'Library',
      path: '/library',
      active: router.pathname === '/library'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'History',
      path: '/history',
      active: router.pathname === '/history'
    }
  ];

  const recentVideos = [
    {
      title: "How to Build Modern React Apps",
      thumbnail: "/api/placeholder/120/68",
      duration: "12:34",
      views: "1.2M",
      channel: "Tech Tutorials"
    },
    {
      title: "JavaScript ES2024 Features",
      thumbnail: "/api/placeholder/120/68", 
      duration: "8:45",
      views: "856K",
      channel: "Code Academy"
    },
    {
      title: "CSS Grid vs Flexbox",
      thumbnail: "/api/placeholder/120/68",
      duration: "15:22",
      views: "2.1M",
      channel: "Web Dev Tips"
    }
  ];

  const userItems: NavigationItem[] = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      label: 'Your Channel',
      path: `/channel/${user?.id}`,
      active: router.pathname === `/channel/${user?.id}`
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Your Videos',
      path: '/my-videos',
      active: router.pathname === '/my-videos'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      label: 'Liked Videos',
      path: '/liked',
      active: router.pathname === '/liked'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      label: 'Upload Video',
      path: '/upload',
      active: router.pathname === '/upload'
    }
  ];

  const exploreItems: NavigationItem[] = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2-10a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Gaming',
      path: '/category/gaming',
      active: router.pathname === '/category/gaming'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
      label: 'Music',
      path: '/category/music',
      active: router.pathname === '/category/music'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      label: 'Education',
      path: '/category/education',
      active: router.pathname === '/category/education'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      label: 'News',
      path: '/category/news',
      active: router.pathname === '/category/news'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: 'Sports',
      path: '/category/sports',
      active: router.pathname === '/category/sports'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Technology',
      path: '/category/technology',
      active: router.pathname === '/category/technology'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2-10a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Entertainment',
      path: '/category/entertainment',
      active: router.pathname === '/category/entertainment'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      label: 'Science',
      path: '/category/science',
      active: router.pathname === '/category/science'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2-10a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Comedy',
      path: '/category/comedy',
      active: router.pathname === '/category/comedy'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Travel',
      path: '/category/travel',
      active: router.pathname === '/category/travel'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
        </svg>
      ),
      label: 'Food',
      path: '/category/food',
      active: router.pathname === '/category/food'
    }
  ];

  const settingsItems: NavigationItem[] = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: 'Settings',
      path: '/settings',
      active: router.pathname === '/settings'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Help',
      path: '/help',
      active: router.pathname === '/help'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
      label: 'Feedback',
      path: '/feedback',
      active: router.pathname === '/feedback'
    }
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      onClose();
    }
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white border-r border-neutral-200 z-50 transform transition-all duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:sticky lg:top-0 lg:z-auto lg:block lg:h-screen
        ${isCollapsed ? 'w-0 lg:w-0' : 'w-60 lg:w-60'} shadow-xl lg:shadow-none
      `}>
        {/* make inner content scroll independently on large screens */}
  <div className={`flex flex-col h-full max-h-screen ${isCollapsed ? 'overflow-hidden' : 'overflow-y-auto lg:overflow-y-auto'}`} style={{ WebkitOverflowScrolling: 'touch' }}>
          {!isCollapsed && (
            <>
              {/* Header */}
              <div className="flex items-center bg-gradient-to-r from-white to-neutral-50 p-2 justify-between"> 
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <span className="text-xl font-bold text-neutral-900">YouTube</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
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
            {/* Main Navigation */}
            <div className={isCollapsed ? 'p-3' : 'p-4'}>
              <div className={isCollapsed ? 'space-y-3' : 'space-y-1'}>
                {mainNavigationItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      w-full flex items-center ${isCollapsed ? 'justify-center px-4 py-4' : 'space-x-4 px-4 py-3'} rounded-2xl text-left transition-all duration-300 group relative overflow-hidden
                      ${item.active 
                        ? isCollapsed 
                          ? 'bg-gradient-to-br from-red-50 to-red-100 text-red-700 font-semibold shadow-lg shadow-red-100/50 border border-red-200/50' 
                          : 'bg-red-50 text-red-700 font-semibold shadow-sm'
                        : isCollapsed
                          ? 'text-neutral-600 hover:bg-gradient-to-br hover:from-neutral-50 hover:to-neutral-100 hover:text-neutral-800 hover:shadow-md hover:shadow-neutral-100/50 hover:border hover:border-neutral-200/50'
                          : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                      }
                      ${isCollapsed ? 'hover:scale-110 hover:-translate-y-0.5' : ''}
                    `}
                    title={item.label}
                  >
                    {/* Background glow effect for active items */}
                    {item.active && isCollapsed && (
                      <div className="absolute inset-0 bg-gradient-to-r from-red-400/10 to-red-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                    
                    <span className={`
                      transition-all duration-300 flex-shrink-0 relative z-10 ${isCollapsed ? 'w-7 h-7' : ''}
                      ${item.active 
                        ? 'text-red-600 drop-shadow-sm' 
                        : 'text-neutral-500 group-hover:text-neutral-700 group-hover:drop-shadow-sm'
                      }
                      ${isCollapsed ? 'group-hover:scale-110' : ''}
                    `}>
                      {item.icon}
                    </span>
                    
                    <span className={`text-sm font-medium flex-1 truncate relative z-10 ${isCollapsed ? 'hidden' : ''}`}>{item.label}</span>
                    
                    {item.badge && !isCollapsed && (
                      <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-2 py-1 rounded-full font-medium min-w-[20px] text-center shadow-sm relative z-10">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                    
                    {/* Active indicator for expanded state */}
                    {item.active && !isCollapsed && (
                      <div className="ml-auto w-1 h-6 bg-gradient-to-b from-red-500 to-red-600 rounded-full shadow-sm relative z-10"></div>
                    )}
                    
                    {/* Enhanced active indicator for collapsed state */}
                    {item.active && isCollapsed && (
                      <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1.5 h-10 bg-gradient-to-b from-red-500 to-red-600 rounded-full shadow-lg shadow-red-500/30"></div>
                    )}
                    
                    {/* Subtle pulse animation for active collapsed items */}
                    {item.active && isCollapsed && (
                      <div className="absolute inset-0 rounded-2xl bg-red-500/5 animate-pulse"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="mx-4 border-t border-neutral-200" />

            {/* Recent Videos Section */}
            {/* {!isCollapsed && ( */}
            { false && (
              <div className="p-4">
                <div className="px-4 py-2 mb-3">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Recent Videos
                  </h3>
                </div>
              <div className="space-y-2">
                {recentVideos.map((video, index) => (
                  <div key={index} className="flex space-x-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors duration-200 cursor-pointer group">
                    <div className="relative w-16 h-10 bg-neutral-200 rounded-md overflow-hidden flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 opacity-80"></div>
                      <div className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-xs px-1 rounded text-[10px]">
                        {video.duration}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors duration-200 leading-tight">
                        {video.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5 truncate">{video.channel}</p>
                      <p className="text-xs text-gray-500">{video.views} views</p>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            )}

            {/* Divider */}
            <div className="mx-4 border-t border-neutral-200" />
            {/* User Profile Section */}
            {false && (
              <div className={`border-b border-neutral-200 bg-gradient-to-r from-red-50 to-orange-50 ${isCollapsed ? 'p-3' : 'p-4'}`}>
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} w-full p-3 rounded-xl hover:bg-white/50 transition-colors duration-200`}
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    {!isCollapsed && (
                      <div className="flex-1 text-left">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {user.name || 'User'}
                        </div>
                        <div className="text-xs text-gray-700 truncate">
                          {user.email || 'user@example.com'}
                        </div>
                      </div>
                    )}
                    {!isCollapsed && (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                  
                  {showUserMenu && !isCollapsed && (
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
            )}

            {/* User Section */}
            {false && (
              <div className={isCollapsed ? 'p-3' : 'p-4'}>
                {!isCollapsed && (
                  <div className="px-4 py-2 mb-2">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      You
                    </h3>
                  </div>
                )}
                <div className={isCollapsed ? 'space-y-3' : 'space-y-1'}>
                  {userItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleNavigation(item.path)}
                      className={`
                        w-full flex items-center ${isCollapsed ? 'justify-center px-4 py-4' : 'space-x-4 px-4 py-3'} rounded-2xl text-left transition-all duration-300 group relative overflow-hidden
                        ${item.active 
                          ? isCollapsed 
                            ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 font-semibold shadow-lg shadow-blue-100/50 border border-blue-200/50' 
                            : 'bg-red-50 text-red-700 font-semibold shadow-sm'
                          : isCollapsed
                            ? 'text-neutral-600 hover:bg-gradient-to-br hover:from-neutral-50 hover:to-neutral-100 hover:text-neutral-800 hover:shadow-md hover:shadow-neutral-100/50 hover:border hover:border-neutral-200/50'
                            : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                        }
                        ${isCollapsed ? 'hover:scale-110 hover:-translate-y-0.5' : ''}
                      `}
                      title={item.label}
                    >
                      {/* Background glow effect for active items */}
                      {item.active && isCollapsed && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-blue-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      )}
                      
                      <span className={`
                        transition-all duration-300 flex-shrink-0 relative z-10 ${isCollapsed ? 'w-7 h-7' : ''}
                        ${item.active 
                          ? 'text-blue-600 drop-shadow-sm' 
                          : 'text-neutral-500 group-hover:text-neutral-700 group-hover:drop-shadow-sm'
                        }
                        ${isCollapsed ? 'group-hover:scale-110' : ''}
                      `}>
                        {item.icon}
                      </span>
                      
                      <span className={`text-sm font-medium flex-1 truncate relative z-10 ${isCollapsed ? 'hidden' : ''}`}>{item.label}</span>
                      
                      {/* Active indicator for expanded state */}
                      {item.active && !isCollapsed && (
                        <div className="ml-auto w-1 h-6 bg-gradient-to-b from-red-500 to-red-600 rounded-full shadow-sm relative z-10"></div>
                      )}
                      
                      {/* Enhanced active indicator for collapsed state */}
                      {item.active && isCollapsed && (
                        <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1.5 h-10 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full shadow-lg shadow-blue-500/30"></div>
                      )}
                      
                      {/* Subtle pulse animation for active collapsed items */}
                      {item.active && isCollapsed && (
                        <div className="absolute inset-0 rounded-2xl bg-blue-500/5 animate-pulse"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className={`border-t border-neutral-200 ${isCollapsed ? 'mx-2' : 'mx-4'}`} />

            {/* Explore Section */}
            <div className={isCollapsed ? 'p-3' : 'p-4'}>
              {!isCollapsed && (
                <div className="px-4 py-2 mb-2">
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Explore
                  </h3>
                </div>
              )}
              <div className={isCollapsed ? 'space-y-3' : 'space-y-1'}>
                {exploreItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      w-full flex items-center ${isCollapsed ? 'justify-center px-4 py-4' : 'space-x-4 px-4 py-3'} rounded-2xl text-left transition-all duration-300 group relative overflow-hidden
                      ${item.active 
                        ? isCollapsed 
                          ? 'bg-gradient-to-br from-green-50 to-green-100 text-green-700 font-semibold shadow-lg shadow-green-100/50 border border-green-200/50' 
                          : 'bg-red-50 text-red-700 font-semibold shadow-sm'
                        : isCollapsed
                          ? 'text-neutral-600 hover:bg-gradient-to-br hover:from-neutral-50 hover:to-neutral-100 hover:text-neutral-800 hover:shadow-md hover:shadow-neutral-100/50 hover:border hover:border-neutral-200/50'
                          : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                      }
                      ${isCollapsed ? 'hover:scale-110 hover:-translate-y-0.5' : ''}
                    `}
                    title={item.label}
                  >
                    {/* Background glow effect for active items */}
                    {item.active && isCollapsed && (
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-green-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                    
                    <span className={`
                      transition-all duration-300 flex-shrink-0 relative z-10 ${isCollapsed ? 'w-7 h-7' : ''}
                      ${item.active 
                        ? 'text-green-600 drop-shadow-sm' 
                        : 'text-neutral-500 group-hover:text-neutral-700 group-hover:drop-shadow-sm'
                      }
                      ${isCollapsed ? 'group-hover:scale-110' : ''}
                    `}>
                      {item.icon}
                    </span>
                    
                    <span className={`text-sm font-medium flex-1 truncate relative z-10 ${isCollapsed ? 'hidden' : ''}`}>{item.label}</span>
                    
                    {/* Active indicator for expanded state */}
                    {item.active && !isCollapsed && (
                      <div className="ml-auto w-1 h-6 bg-gradient-to-b from-red-500 to-red-600 rounded-full shadow-sm relative z-10"></div>
                    )}
                    
                    {/* Enhanced active indicator for collapsed state */}
                    {item.active && isCollapsed && (
                      <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1.5 h-10 bg-gradient-to-b from-green-500 to-green-600 rounded-full shadow-lg shadow-green-500/30"></div>
                    )}
                    
                    {/* Subtle pulse animation for active collapsed items */}
                    {item.active && isCollapsed && (
                      <div className="absolute inset-0 rounded-2xl bg-green-500/5 animate-pulse"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="mx-4 border-t border-neutral-200" />

            {/* Settings Section */}
            <div className="p-4">
              <div className="px-4 py-2 mb-2">
                <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Settings
                </h3>
              </div>
              <div className="space-y-1">
                {settingsItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-left transition-all duration-200 group
                      ${item.active 
                        ? 'bg-red-50 text-red-700 font-semibold shadow-sm' 
                        : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                      }
                    `}
                  >
                    <span className={`
                      transition-colors duration-200
                      ${item.active 
                        ? 'text-red-600' 
                        : 'text-neutral-500 group-hover:text-neutral-700'
                      }
                    `}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.active && (
                      <div className="ml-auto w-1 h-6 bg-red-600 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-neutral-200 bg-neutral-50">
            <div className="text-xs text-neutral-500 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <a href="#" className="hover:text-neutral-700 transition-colors duration-200">About</a>
                <a href="#" className="hover:text-neutral-700 transition-colors duration-200">Press</a>
                <a href="#" className="hover:text-neutral-700 transition-colors duration-200">Copyright</a>
                <a href="#" className="hover:text-neutral-700 transition-colors duration-200">Contact us</a>
                <a href="#" className="hover:text-neutral-700 transition-colors duration-200">Creators</a>
                <a href="#" className="hover:text-neutral-700 transition-colors duration-200">Advertise</a>
                <a href="#" className="hover:text-neutral-700 transition-colors duration-200">Developers</a>
                <a href="#" className="hover:text-neutral-700 transition-colors duration-200">Terms</a>
                <a href="#" className="hover:text-neutral-700 transition-colors duration-200">Privacy</a>
              </div>
              <div className="pt-2 text-xs text-neutral-400 font-medium">
                © 2024 YouTube Clone
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </div>

      {/* Hamburger Menu Button - Show when sidebar is hidden */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed top-1 left-4 z-50 lg:flex hidden p-2 bg-white rounded-xl shadow-lg border border-neutral-200 hover:bg-neutral-50 transition-all duration-200 hover:scale-105"
          title="Show sidebar"
        >
          <svg className="w-6 h-6 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </>
  );
}