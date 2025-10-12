import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FilterState } from './SearchFilters';
import SearchSuggestions from './SearchSuggestions';
import AdvancedSearchModal from './AdvancedSearchModal';

interface YouTubeSearchBarProps {
  // Original interface
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
  filters?: FilterState;
  onFiltersChange?: (filters: FilterState) => void;
  showFilters?: boolean;
  compact?: boolean;
  
  // Alternative interface for search page
  initialQuery?: string;
  onSearch?: (query: string, filters?: FilterState) => void;
}

export default function YouTubeSearchBar({
  searchQuery: propSearchQuery,
  onSearchChange,
  onSearchSubmit,
  filters: propFilters,
  onFiltersChange,
  showFilters = true,
  compact = false,
  initialQuery,
  onSearch
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

  // Handle both interfaces
  const [internalSearchQuery, setInternalSearchQuery] = useState(initialQuery || propSearchQuery || '');
  const [internalFilters, setInternalFilters] = useState<FilterState>(propFilters || {
    uploadDate: '',
    duration: '',
    quality: '',
    viewCount: '',
    sort: 'relevance',
    category: ''
  });

  // Use the appropriate values based on which interface is being used
  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : internalSearchQuery;
  const filters = propFilters !== undefined ? propFilters : internalFilters;

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

      if (onSearch) {
        await onSearch(searchQuery.trim(), filters);
      } else if (onSearchSubmit) {
        await onSearchSubmit(searchQuery.trim());
      }
      setShowSuggestions(false);
    } catch (error) {
      console.error('Search submission error:', error);
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
    } catch (error) {
      console.error('Search click error:', error);
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
    } catch (error) {
      console.error('Suggestion click error:', error);
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
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearchQuery(value);
    }
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
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    } else {
      setInternalFilters(newFilters);
    }
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
            placeholder={compact ? "Search" : "Search"}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className={`w-full ${compact ? 'pl-10 pr-20 py-2.5 text-sm' : 'pl-12 pr-24 py-3.5 text-base'} 
              border border-gray-300 rounded-l-full rounded-r-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
              text-gray-900 placeholder-gray-500 bg-white transition-all duration-300 ease-out
              ${isSearchFocused ? 'ring-2 ring-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/10' : 'hover:border-gray-400'}
              ${searchQuery.trim() ? 'border-blue-400 bg-blue-50/30' : ''}
            `}
            disabled={isSearching}
          />
          
          {/* Search Button */}
          <button 
            type="submit"
            onClick={handleSearchClick}
            disabled={isSearching}
            className={`absolute right-0 top-0 bottom-0 ${compact ? 'px-4' : 'px-6'} 
              bg-gray-100 border border-l-0 border-gray-300 rounded-r-full hover:bg-gray-200 
              transition-all duration-300 ease-out z-10 disabled:opacity-50 disabled:cursor-not-allowed
              ${isSearching ? 'bg-gray-200' : ''}
              hover:shadow-md hover:scale-105 active:scale-95
            `}
            title="Search"
          >
            {isSearching ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
                <span className="text-xs text-gray-600 hidden sm:inline">Searching...</span>
              </div>
            ) : (
              <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-gray-600 transition-transform duration-200 hover:scale-110`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>

          {/* Advanced Search Button */}
          <button
            type="button"
            onClick={() => setIsAdvancedSearchOpen(true)}
            className={`absolute ${showFilters ? 'right-24' : 'right-12'} top-1/2 transform -translate-y-1/2 
              ${compact ? 'p-1.5' : 'p-2'} rounded-full hover:bg-gray-100 transition-all duration-300 ease-out z-10 
              text-gray-600 hover:text-gray-800 hover:scale-110 active:scale-95 group`}
            title="Advanced Search"
          >
            <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} transition-transform duration-200 group-hover:rotate-90`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Filters Toggle Button */}
          {showFilters && (
            <button
              type="button"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`absolute right-12 top-1/2 transform -translate-y-1/2 
                ${compact ? 'p-1.5' : 'p-2'} rounded-full hover:bg-gray-100 transition-all duration-300 ease-out z-10
                text-gray-600 hover:text-gray-800 hover:scale-110 active:scale-95 group
                ${activeFilterCount > 0 ? 'text-blue-600 bg-blue-50' : ''}
              `}
              title="Filters"
            >
              <div className="relative">
                <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} transition-transform duration-200 group-hover:rotate-180`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium animate-pulse">
                    {activeFilterCount}
                  </span>
                )}
              </div>
            </button>
          )}
        </form>

        {/* Filters Dropdown */}
        {isFiltersOpen && showFilters && (
          <div 
            ref={filtersRef}
            className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-6 
              animate-in slide-in-from-top-2 duration-300 ease-out backdrop-blur-sm bg-white/95"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Search Filters</span>
              </h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all duration-200 flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Clear all ({activeFilterCount})</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Upload Date Filter */}
              <div className="space-y-3">
                <label htmlFor="uploadDate" className="block text-sm font-semibold text-gray-800 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Upload date</span>
                </label>
                <select
                  id="uploadDate"
                  value={filters.uploadDate}
                  onChange={(e) => handleFilterChange('uploadDate', e.target.value)}
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all duration-200 hover:border-gray-300 hover:shadow-sm bg-white"
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
              <div className="space-y-3">
                <label htmlFor="duration" className="block text-sm font-semibold text-gray-800 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Duration</span>
                </label>
                <select
                  id="duration"
                  value={filters.duration}
                  onChange={(e) => handleFilterChange('duration', e.target.value)}
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all duration-200 hover:border-gray-300 hover:shadow-sm bg-white"
                >
                  <option value="">Any duration</option>
                  <option value="short">Under 4 minutes</option>
                  <option value="medium">4 - 20 minutes</option>
                  <option value="long">Over 20 minutes</option>
                </select>
              </div>

              {/* Quality Filter */}
              <div className="space-y-3">
                <label htmlFor="quality" className="block text-sm font-semibold text-gray-800 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Quality</span>
                </label>
                <select
                  id="quality"
                  value={filters.quality}
                  onChange={(e) => handleFilterChange('quality', e.target.value)}
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all duration-200 hover:border-gray-300 hover:shadow-sm bg-white"
                >
                  <option value="">Any quality</option>
                  <option value="hd">HD</option>
                  <option value="sd">SD</option>
                </select>
              </div>

              {/* View Count Filter */}
              <div className="space-y-3">
                <label htmlFor="viewCount" className="block text-sm font-semibold text-gray-800 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>View count</span>
                </label>
                <select
                  id="viewCount"
                  value={filters.viewCount}
                  onChange={(e) => handleFilterChange('viewCount', e.target.value)}
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all duration-200 hover:border-gray-300 hover:shadow-sm bg-white"
                >
                  <option value="">Any view count</option>
                  <option value="low">Under 1K</option>
                  <option value="medium">1K - 100K</option>
                  <option value="high">Over 100K</option>
                </select>
              </div>

              {/* Sort Filter */}
              <div className="space-y-3">
                <label htmlFor="sort" className="block text-sm font-semibold text-gray-800 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  <span>Sort by</span>
                </label>
                <select
                  id="sort"
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all duration-200 hover:border-gray-300 hover:shadow-sm bg-white"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Upload date</option>
                  <option value="viewCount">View count</option>
                  <option value="rating">Rating</option>
                  <option value="duration">Duration</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="space-y-3">
                <label htmlFor="category" className="block text-sm font-semibold text-gray-800 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Category</span>
                </label>
                <select
                  id="category"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all duration-200 hover:border-gray-300 hover:shadow-sm bg-white"
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
              <div className="mt-6 pt-6 border-t-2 border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Active Filters ({activeFilterCount})</span>
                  </h4>
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-gray-700 hover:text-gray-900 font-semibold transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Clear All</span>
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {filters.uploadDate && (
                    <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-gray-800 border border-blue-200">
                      <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {filters.uploadDate === 'hour' ? 'Last hour' :
                       filters.uploadDate === 'today' ? 'Today' :
                       filters.uploadDate === 'week' ? 'This week' :
                       filters.uploadDate === 'month' ? 'This month' :
                       filters.uploadDate === 'year' ? 'This year' : filters.uploadDate}
                    </span>
                  )}
                  {filters.duration && (
                    <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-gray-800 border border-green-200">
                      <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {filters.duration === 'short' ? 'Under 4 min' :
                       filters.duration === 'medium' ? '4-20 min' :
                       filters.duration === 'long' ? 'Over 20 min' : filters.duration}
                    </span>
                  )}
                  {filters.quality && (
                    <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-gray-800 border border-purple-200">
                      <svg className="w-4 h-4 mr-1 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {filters.quality.toUpperCase()}
                    </span>
                  )}
                  {filters.viewCount && (
                    <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-orange-100 to-red-100 text-gray-800 border border-orange-200">
                      <svg className="w-4 h-4 mr-1 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {filters.viewCount === 'low' ? 'Under 1K views' :
                       filters.viewCount === 'medium' ? '1K-100K views' :
                       filters.viewCount === 'high' ? 'Over 100K views' : filters.viewCount}
                    </span>
                  )}
                  {filters.sort && filters.sort !== 'relevance' && (
                    <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-100 to-blue-100 text-gray-800 border border-indigo-200">
                      <svg className="w-4 h-4 mr-1 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                      Sort: {filters.sort}
                    </span>
                  )}
                  {filters.category && (
                    <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-teal-100 to-cyan-100 text-gray-800 border border-teal-200">
                      <svg className="w-4 h-4 mr-1 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
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
