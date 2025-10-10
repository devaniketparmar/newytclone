import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FilterState } from './SearchFilters';
import SearchSuggestions from './SearchSuggestions';
import AdvancedSearchModal from './AdvancedSearchModal';

interface YouTubeSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  showFilters?: boolean;
  compact?: boolean;
}

export default function YouTubeSearchBar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  filters,
  onFiltersChange,
  showFilters = true,
  compact = false
}: YouTubeSearchBarProps) {
  const router = useRouter();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search bar with Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      // Clear search with Escape when focused
      if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        onSearchChange('');
        setShowSuggestions(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSearchChange]);

  // Close filters and suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setIsFiltersOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      // If no search query, open advanced search modal
      setIsAdvancedSearchOpen(true);
      return;
    }

    setIsSearching(true);
    try {
      // Add to search history
      const newHistory = [searchQuery.trim(), ...searchHistory.filter(item => item !== searchQuery.trim())].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));

      await onSearchSubmit(searchQuery.trim());
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchClick = async () => {
    if (!searchQuery.trim()) {
      // If no search query, open advanced search modal
      setIsAdvancedSearchOpen(true);
      return;
    }

    setIsSearching(true);
    try {
      // Add to search history
      const newHistory = [searchQuery.trim(), ...searchHistory.filter(item => item !== searchQuery.trim())].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));

      await onSearchSubmit(searchQuery.trim());
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setIsSearching(true);
    try {
      // Add to search history
      const newHistory = [suggestion, ...searchHistory.filter(item => item !== suggestion)].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));

      onSearchChange(suggestion);
      await onSearchSubmit(suggestion);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputFocus = () => {
    setIsSearchFocused(true);
    if (searchQuery.trim()) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    setIsSearchFocused(false);
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchChange(value);
    setShowSuggestions(value.trim().length > 0);
  };

  const handleAdvancedSearch = (query: string, advancedFilters: FilterState) => {
    onSearchChange(query);
    onFiltersChange(advancedFilters);
    onSearchSubmit(query);
    setIsAdvancedSearchOpen(false);
  };

  const handleFilterChange = (filterType: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [filterType]: value };
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      uploadDate: '',
      duration: '',
      quality: '',
      viewCount: '',
      sort: 'relevance',
      category: ''
    };
    onFiltersChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value !== '' && value !== 'relevance').length;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="w-full">
      {/* Main Search Bar */}
      <div className="relative">
        <form onSubmit={handleSubmit} className="relative">
          <div className={`absolute inset-y-0 left-0 ${compact ? 'pl-3' : 'pl-4'} flex items-center pointer-events-none z-10`}>
            <svg className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <input
            ref={searchRef}
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className={`w-full ${compact ? 'pl-10 pr-32 py-2.5 text-sm' : 'pl-12 pr-36 py-3 text-base'} border border-gray-300 rounded-l-full rounded-r-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white shadow-sm transition-all duration-300 hover:shadow-md focus:shadow-lg ${
              isSearchFocused ? 'ring-2 ring-blue-500 border-blue-500' : ''
            }`}
            disabled={isSearching}
          />
          
          {/* Search Button */}
          <button 
            type="submit"
            onClick={handleSearchClick}
            disabled={isSearching}
            className={`absolute right-0 top-0 bottom-0 ${compact ? 'px-4' : 'px-6'} bg-gray-100 border border-l-0 border-gray-300 rounded-r-full hover:bg-gray-200 transition-all duration-200 z-10 disabled:opacity-50 disabled:cursor-not-allowed ${
              isSearching ? 'bg-blue-100 border-blue-300' : ''
            } ${!searchQuery.trim() ? 'hover:bg-blue-50 hover:border-blue-200' : ''}`}
            title={!searchQuery.trim() ? "Open Advanced Search" : "Search"}
          >
            {isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            ) : (
              <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} ${!searchQuery.trim() ? 'text-blue-600' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>

          {/* Advanced Search Button */}
          <button
            type="button"
            onClick={() => setIsAdvancedSearchOpen(true)}
            className={`absolute ${showFilters ? 'right-24' : 'right-12'} top-1/2 transform -translate-y-1/2 ${compact ? 'p-1.5' : 'p-2'} rounded-full hover:bg-gray-100 transition-colors z-10 text-gray-600`}
            title="Advanced Search"
          >
            <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Filters Toggle Button */}
          {showFilters && (
            <button
              type="button"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`absolute right-12 top-1/2 transform -translate-y-1/2 ${compact ? 'p-1.5' : 'p-2'} rounded-full hover:bg-gray-100 transition-colors z-10 ${
                activeFilterCount > 0 ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Filters"
            >
              <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </form>

        {/* Filters Dropdown */}
        {isFiltersOpen && showFilters && (
          <div 
            ref={filtersRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all ({activeFilterCount})
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Upload Date Filter */}
              <div>
                <label htmlFor="uploadDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Date
                </label>
                <select
                  id="uploadDate"
                  value={filters.uploadDate}
                  onChange={(e) => handleFilterChange('uploadDate', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Any time</option>
                  <option value="hour">Last hour</option>
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                  <option value="year">This year</option>
                </select>
              </div>

              {/* Duration Filter */}
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <select
                  id="duration"
                  value={filters.duration}
                  onChange={(e) => handleFilterChange('duration', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Any duration</option>
                  <option value="short">Under 4 minutes</option>
                  <option value="medium">4 - 20 minutes</option>
                  <option value="long">Over 20 minutes</option>
                </select>
              </div>

              {/* Quality Filter */}
              <div>
                <label htmlFor="quality" className="block text-sm font-medium text-gray-700 mb-1">
                  Quality
                </label>
                <select
                  id="quality"
                  value={filters.quality}
                  onChange={(e) => handleFilterChange('quality', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Any quality</option>
                  <option value="hd">HD</option>
                  <option value="sd">SD</option>
                </select>
              </div>

              {/* View Count Filter */}
              <div>
                <label htmlFor="viewCount" className="block text-sm font-medium text-gray-700 mb-1">
                  View Count
                </label>
                <select
                  id="viewCount"
                  value={filters.viewCount}
                  onChange={(e) => handleFilterChange('viewCount', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Any view count</option>
                  <option value="low">Under 1K</option>
                  <option value="medium">1K - 100K</option>
                  <option value="high">Over 100K</option>
                </select>
              </div>

              {/* Sort Filter */}
              <div>
                <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                  Sort by
                </label>
                <select
                  id="sort"
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Upload date</option>
                  <option value="viewCount">View count</option>
                  <option value="rating">Rating</option>
                  <option value="duration">Duration</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">All categories</option>
                  <option value="music">Music</option>
                  <option value="gaming">Gaming</option>
                  <option value="education">Education</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="news">News</option>
                  <option value="sports">Sports</option>
                  <option value="tech">Technology</option>
                  <option value="travel">Travel</option>
                </select>
              </div>
            </div>

            {/* Active Filters Summary */}
            {activeFilterCount > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {filters.uploadDate && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {filters.uploadDate === 'hour' ? 'Last hour' :
                       filters.uploadDate === 'today' ? 'Today' :
                       filters.uploadDate === 'week' ? 'This week' :
                       filters.uploadDate === 'month' ? 'This month' :
                       filters.uploadDate === 'year' ? 'This year' : filters.uploadDate}
                    </span>
                  )}
                  {filters.duration && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {filters.duration === 'short' ? 'Under 4 min' :
                       filters.duration === 'medium' ? '4-20 min' :
                       filters.duration === 'long' ? 'Over 20 min' : filters.duration}
                    </span>
                  )}
                  {filters.quality && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {filters.quality.toUpperCase()}
                    </span>
                  )}
                  {filters.viewCount && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {filters.viewCount === 'low' ? 'Under 1K views' :
                       filters.viewCount === 'medium' ? '1K-100K views' :
                       filters.viewCount === 'high' ? 'Over 100K views' : filters.viewCount}
                    </span>
                  )}
                  {filters.sort && filters.sort !== 'relevance' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Sort: {filters.sort}
                    </span>
                  )}
                  {filters.category && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {filters.category}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Suggestions */}
      <SearchSuggestions
        query={searchQuery}
        isVisible={showSuggestions}
        onSuggestionClick={handleSuggestionClick}
        onClose={() => setShowSuggestions(false)}
        searchHistory={searchHistory}
      />

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        isOpen={isAdvancedSearchOpen}
        onClose={() => setIsAdvancedSearchOpen(false)}
        onSearch={handleAdvancedSearch}
        initialQuery={searchQuery}
        initialFilters={filters}
      />
    </div>
  );
}
