import React, { useState } from 'react';
import { useRouter } from 'next/router';
import AdvancedSearchModal from './AdvancedSearchModal';
import { FilterState } from './SearchFilters';

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  showViewToggle?: boolean;
  compact?: boolean;
  onAdvancedSearch?: (query: string, filters: FilterState) => void;
}

export default function SearchHeader({ 
  searchQuery, 
  onSearchChange, 
  viewMode = 'grid',
  onViewModeChange,
  showViewToggle = true,
  compact = false,
  onAdvancedSearch
}: SearchHeaderProps) {
  const router = useRouter();
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchClick = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleAdvancedSearch = (query: string, filters: FilterState) => {
    if (onAdvancedSearch) {
      onAdvancedSearch(query, filters);
    } else {
      // Default behavior: redirect to search page with filters
      const params = new URLSearchParams();
      params.append('q', query);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value);
        }
      });
      
      router.push(`/search?${params.toString()}`);
    }
    setIsAdvancedSearchOpen(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="relative">
      <div className={`absolute inset-y-0 left-0 ${compact ? 'pl-2' : 'pl-3'} flex items-center pointer-events-none`}>
        <svg className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-gray-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        placeholder="Search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className={`w-full pl-${compact ? '9' : '10'} pr-4 ${compact ? 'py-1.5 text-sm' : 'py-2'} border border-neutral-300 rounded-l-full rounded-r-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500`}
      />
      <button 
        type="submit"
        onClick={handleSearchClick}
        className={`absolute right-0 top-0 bottom-0 ${compact ? 'px-4' : 'px-6'} bg-neutral-100 border border-l-0 border-neutral-300 rounded-r-full hover:bg-neutral-200 transition-colors`}
      >
        <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-gray-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
      
      {/* Advanced Search Filter Button */}
      <button
        type="button"
        onClick={() => setIsAdvancedSearchOpen(true)}
        className={`absolute ${showViewToggle && onViewModeChange ? 'right-20' : 'right-16'} top-1/2 transform -translate-y-1/2 ${compact ? 'p-1.5' : 'p-2'} rounded-full hover:bg-blue-50 transition-colors z-10 text-blue-600 hover:text-blue-700`}
        title="Advanced Search Filter"
      >
        <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {showViewToggle && onViewModeChange && (
        <button
          onClick={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
          className="absolute right-16 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-neutral-100 transition-colors"
          title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
        >
          {viewMode === 'grid' ? (
            <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          )}
        </button>
      )}
    </form>

    {/* Advanced Search Modal */}
    <AdvancedSearchModal
      isOpen={isAdvancedSearchOpen}
      onClose={() => setIsAdvancedSearchOpen(false)}
      onSearch={handleAdvancedSearch}
      initialQuery={searchQuery}
      initialFilters={{
        uploadDate: '',
        duration: '',
        quality: '',
        viewCount: '',
        sort: 'relevance',
        category: ''
      }}
    />
    </>
  );
}
