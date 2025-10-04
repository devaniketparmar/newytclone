import React, { useState } from 'react';
import { useRouter } from 'next/router';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function Sidebar({ isOpen, onClose, user }: SidebarProps) {
  const router = useRouter();

  const mainNavigationItems = [
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      ),
      label: 'Home',
      path: '/videos',
      active: router.pathname === '/videos'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ),
      label: 'Trending',
      path: '/trending',
      active: router.pathname === '/trending'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ),
      label: 'Subscriptions',
      path: '/subscriptions',
      active: router.pathname === '/subscriptions'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
      ),
      label: 'Library',
      path: '/library',
      active: router.pathname === '/library'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
        </svg>
      ),
      label: 'History',
      path: '/history',
      active: router.pathname === '/history'
    }
  ];

  const userItems = [
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ),
      label: 'Your Channel',
      path: `/channel/${user?.id}`,
      active: router.pathname === `/channel/${user?.id}`
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
      ),
      label: 'Your Videos',
      path: '/my-videos',
      active: router.pathname === '/my-videos'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ),
      label: 'Liked Videos',
      path: '/liked',
      active: router.pathname === '/liked'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
      ),
      label: 'Upload Video',
      path: '/upload',
      active: router.pathname === '/upload'
    }
  ];

  const exploreItems = [
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ),
      label: 'Gaming',
      path: '/category/gaming',
      active: router.pathname === '/category/gaming'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
      ),
      label: 'Music',
      path: '/category/music',
      active: router.pathname === '/category/music'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ),
      label: 'Education',
      path: '/category/education',
      active: router.pathname === '/category/education'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
        </svg>
      ),
      label: 'News',
      path: '/category/news',
      active: router.pathname === '/category/news'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ),
      label: 'Sports',
      path: '/category/sports',
      active: router.pathname === '/category/sports'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ),
      label: 'Technology',
      path: '/category/technology',
      active: router.pathname === '/category/technology'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
        </svg>
      ),
      label: 'Entertainment',
      path: '/category/entertainment',
      active: router.pathname === '/category/entertainment'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ),
      label: 'Science',
      path: '/category/science',
      active: router.pathname === '/category/science'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
        </svg>
      ),
      label: 'Comedy',
      path: '/category/comedy',
      active: router.pathname === '/category/comedy'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ),
      label: 'Travel',
      path: '/category/travel',
      active: router.pathname === '/category/travel'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
        </svg>
      ),
      label: 'Food',
      path: '/category/food',
      active: router.pathname === '/category/food'
    }
  ];

  const settingsItems = [
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ),
      label: 'Settings',
      path: '/settings',
      active: router.pathname === '/settings'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
        </svg>
      ),
      label: 'Help',
      path: '/help',
      active: router.pathname === '/help'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
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

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white border-r border-neutral-200 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto lg:block
        w-64 lg:w-64
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <span className="text-lg font-bold text-neutral-900">YouTube</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-lg hover:bg-neutral-100"
            >
              <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            {/* Main Navigation */}
            <div className="p-2">
              {mainNavigationItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    w-full flex items-center space-x-4 px-3 py-2 rounded-lg text-left transition-colors
                    ${item.active 
                      ? 'bg-neutral-100 text-neutral-900 font-medium' 
                      : 'text-neutral-700 hover:bg-neutral-50'
                    }
                  `}
                >
                  <span className={item.active ? 'text-neutral-900' : 'text-neutral-600'}>
                    {item.icon}
                  </span>
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-neutral-200 my-2" />

            {/* User Section */}
            {user && (
              <div className="p-2">
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    You
                  </h3>
                </div>
                {userItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      w-full flex items-center space-x-4 px-3 py-2 rounded-lg text-left transition-colors
                      ${item.active 
                        ? 'bg-neutral-100 text-neutral-900 font-medium' 
                        : 'text-neutral-700 hover:bg-neutral-50'
                      }
                    `}
                  >
                    <span className={item.active ? 'text-neutral-900' : 'text-neutral-600'}>
                      {item.icon}
                    </span>
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-neutral-200 my-2" />

            {/* Explore Section */}
            <div className="p-2">
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Explore
                </h3>
              </div>
              {exploreItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    w-full flex items-center space-x-4 px-3 py-2 rounded-lg text-left transition-colors
                    ${item.active 
                      ? 'bg-neutral-100 text-neutral-900 font-medium' 
                      : 'text-neutral-700 hover:bg-neutral-50'
                    }
                  `}
                >
                  <span className={item.active ? 'text-neutral-900' : 'text-neutral-600'}>
                    {item.icon}
                  </span>
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-neutral-200 my-2" />

            {/* Settings Section */}
            <div className="p-2">
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Settings
                </h3>
              </div>
              {settingsItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    w-full flex items-center space-x-4 px-3 py-2 rounded-lg text-left transition-colors
                    ${item.active 
                      ? 'bg-neutral-100 text-neutral-900 font-medium' 
                      : 'text-neutral-700 hover:bg-neutral-50'
                    }
                  `}
                >
                  <span className={item.active ? 'text-neutral-900' : 'text-neutral-600'}>
                    {item.icon}
                  </span>
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-200">
            <div className="text-xs text-neutral-500 space-y-1">
              <div className="flex space-x-2">
                <a href="#" className="hover:text-neutral-700">About</a>
                <a href="#" className="hover:text-neutral-700">Press</a>
                <a href="#" className="hover:text-neutral-700">Copyright</a>
              </div>
              <div className="flex space-x-2">
                <a href="#" className="hover:text-neutral-700">Contact us</a>
                <a href="#" className="hover:text-neutral-700">Creators</a>
                <a href="#" className="hover:text-neutral-700">Advertise</a>
              </div>
              <div className="flex space-x-2">
                <a href="#" className="hover:text-neutral-700">Developers</a>
                <a href="#" className="hover:text-neutral-700">Terms</a>
                <a href="#" className="hover:text-neutral-700">Privacy</a>
              </div>
              <div className="pt-2 text-xs text-neutral-400">
                © 2024 YouTube Clone
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}