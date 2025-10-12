import React, { useState, useEffect, useRef } from 'react';
import { FilterState } from './SearchFilters';

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string, filters: FilterState) => void;
  initialQuery?: string;
  initialFilters?: FilterState;
}

export default function AdvancedSearchModal({
  isOpen,
  onClose,
  onSearch,
  initialQuery = '',
  initialFilters = {
    uploadDate: '',
    duration: '',
    quality: '',
    viewCount: '',
    sort: 'relevance',
    category: ''
  }
}: AdvancedSearchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
    setFilters(initialFilters);
  }, [initialQuery, initialFilters]);

  useEffect(() => {
    if (!isOpen) return;

    // Save previously focused element so we can restore focus when modal closes
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    // Focus the main search input when modal opens (defer so DOM is ready)
    setTimeout(() => {
      const el = document.getElementById('searchQuery') as HTMLElement | null;
      el?.focus();
    }, 0);

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Trap Tab key inside the modal for keyboard users
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const container = modalRef.current;
      if (!container) return;

      const focusable = container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      const focusableEls = Array.from(focusable).filter(el => el.offsetParent !== null);
      if (focusableEls.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      // Restore focus to previously focused element (if still in document)
      try {
        previouslyFocusedRef.current?.focus();
      } catch (err) {
        // ignore
      }
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSubmitting(true);
    try {
      await onSearch(query.trim(), filters);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilterChange = (filterType: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      uploadDate: '',
      duration: '',
      quality: '',
      viewCount: '',
      sort: 'relevance',
      category: ''
    });
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value !== '' && value !== 'relevance').length;
  };

  const activeFilterCount = getActiveFilterCount();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-hidden={isOpen ? 'false' : 'true'}>
      <style jsx>{`
        select, select option {
          color: black !important;
        }
        input {
          color: black !important;
        }
      `}</style>
      
      {/* Enhanced Backdrop with Blur */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-all duration-500"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="advancedSearchTitle"
          className="relative w-full max-w-3xl md:max-w-4xl lg:max-w-5xl bg-white rounded-2xl shadow-xl transform transition-all duration-300 scale-100 border border-gray-100 overflow-hidden"
          style={{ color: 'black' }}
        >
          {/* Simplified header matching app theme */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-neutral-100 bg-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h2 id="advancedSearchTitle" className="text-lg md:text-xl font-semibold text-gray-900">Advanced Search</h2>
                <p className="text-sm text-gray-500">Refine results using filters and sorting</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearAllFilters}
                type="button"
                className="text-sm text-neutral-600 hover:text-neutral-800 px-3 py-2 rounded-md hover:bg-neutral-50 transition-colors"
                title="Clear all filters"
              >
                Clear
              </button>
              <button
                onClick={onClose}
                aria-label="Close advanced search"
                className="p-2 rounded-md hover:bg-neutral-50 transition-colors text-neutral-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Enhanced Tab Navigation */}
          {/* Pill segmented tabs */}
          <div className="p-4 md:p-5 border-b border-neutral-100 bg-neutral-50">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setActiveTab('basic')}
                role="tab"
                aria-selected={activeTab === 'basic'}
                aria-controls="basicTab"
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                  activeTab === 'basic' ? 'bg-white text-gray-900 shadow-sm' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                Basic
              </button>
              <button
                onClick={() => setActiveTab('advanced')}
                role="tab"
                aria-selected={activeTab === 'advanced'}
                aria-controls="advancedTab"
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                  activeTab === 'advanced' ? 'bg-white text-gray-900 shadow-sm' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6" role="tabpanel">
            {/* Search Query Section (theme inputs) */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Search Query</h3>
                  <p className="text-gray-600 text-sm">Enter what you're looking for</p>
                </div>
                <span className="text-red-500 text-lg font-bold">*</span>
              </div>
              
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  id="searchQuery"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What are you looking for?"
                  className="w-full pl-12 pr-8 py-3 border border-neutral-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus:border-blue-500 text-base transition-all duration-200 hover:border-neutral-300 bg-neutral-50"
                  autoFocus
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Basic Search Tab */}
            {activeTab === 'basic' && (
              <div id="basicTab" className="space-y-4" role="tabpanel" aria-hidden={activeTab !== 'basic'}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sort By */}
                  <div className="space-y-3">
                    <label htmlFor="sort" className="block text-sm font-semibold text-gray-800 flex items-center space-x-2">
                      <div className="p-1.5 bg-blue-100 rounded-md">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                        </svg>
                      </div>
                      <span>Sort By</span>
                    </label>
                    <select
                      id="sort"
                      value={filters.sort}
                      onChange={(e) => handleFilterChange('sort', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 hover:border-neutral-300 bg-white text-sm"
                    >
                      <option value="relevance">Most Relevant</option>
                      <option value="date">Most Recent</option>
                      <option value="viewCount">Most Viewed</option>
                      <option value="rating">Highest Rated</option>
                      <option value="duration">Duration</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div className="space-y-3">
                    <label htmlFor="category" className="block text-sm font-semibold text-gray-800 flex items-center space-x-2">
                      <div className="p-1.5 bg-green-100 rounded-md">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <span>Category</span>
                    </label>
                    <select
                      id="category"
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 hover:border-neutral-300 bg-white text-sm"
                    >
                      <option value="">All Categories</option>
                      <option value="music">🎵 Music</option>
                      <option value="gaming">🎮 Gaming</option>
                      <option value="education">📚 Education</option>
                      <option value="entertainment">🎬 Entertainment</option>
                      <option value="news">📰 News</option>
                      <option value="sports">⚽ Sports</option>
                      <option value="tech">💻 Technology</option>
                      <option value="travel">✈️ Travel</option>
                      <option value="cooking">👨‍🍳 Cooking</option>
                      <option value="fitness">💪 Fitness</option>
                      <option value="comedy">😂 Comedy</option>
                      <option value="science">🔬 Science</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Filters Tab */}
            {activeTab === 'advanced' && (
              <div id="advancedTab" className="space-y-4" role="tabpanel" aria-hidden={activeTab !== 'advanced'}>
                {/* Time & Duration Section */}
                <div className="bg-white rounded-lg p-4 border border-neutral-100">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                    <div className="p-2 bg-blue-50 rounded-md">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span>Time & Duration</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Upload Date */}
                    <div className="space-y-3">
                      <label htmlFor="uploadDate" className="block text-sm font-semibold text-gray-800">
                        Upload Date
                      </label>
                      <select
                        id="uploadDate"
                        value={filters.uploadDate}
                        onChange={(e) => handleFilterChange('uploadDate', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:border-gray-300 bg-white text-sm"
                      >
                        <option value="">Any time</option>
                        <option value="hour">Last hour</option>
                        <option value="today">Today</option>
                        <option value="week">This week</option>
                        <option value="month">This month</option>
                        <option value="year">This year</option>
                      </select>
                    </div>

                    {/* Duration */}
                    <div className="space-y-3">
                      <label htmlFor="duration" className="block text-sm font-semibold text-gray-800">
                        Duration
                      </label>
                      <select
                        id="duration"
                        value={filters.duration}
                        onChange={(e) => handleFilterChange('duration', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:border-gray-300 bg-white text-sm"
                      >
                        <option value="">Any duration</option>
                        <option value="short">Under 4 minutes</option>
                        <option value="medium">4 - 20 minutes</option>
                        <option value="long">Over 20 minutes</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Quality & Views Section */}
                <div className="bg-white rounded-lg p-4 border border-neutral-100">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                    <div className="p-2 bg-green-50 rounded-md">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span>Quality & Views</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Quality */}
                    <div className="space-y-3">
                      <label htmlFor="quality" className="block text-sm font-semibold text-gray-800">
                        Video Quality
                      </label>
                      <select
                        id="quality"
                        value={filters.quality}
                        onChange={(e) => handleFilterChange('quality', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:border-gray-300 bg-white text-sm"
                      >
                        <option value="">Any quality</option>
                        <option value="hd">HD (720p+)</option>
                        <option value="sd">SD (Below 720p)</option>
                      </select>
                    </div>

                    {/* View Count */}
                    <div className="space-y-3">
                      <label htmlFor="viewCount" className="block text-sm font-semibold text-gray-800">
                        View Count
                      </label>
                      <select
                        id="viewCount"
                        value={filters.viewCount}
                        onChange={(e) => handleFilterChange('viewCount', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:border-gray-300 bg-white text-sm"
                      >
                        <option value="">Any view count</option>
                        <option value="low">Under 1K views</option>
                        <option value="medium">1K - 100K views</option>
                        <option value="high">Over 100K views</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Active Filters Summary */}
            {activeFilterCount > 0 && (
              <div className="mt-6 p-4 bg-white border border-neutral-100 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-800">Active Filters ({activeFilterCount})</h4>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-sm text-neutral-600 hover:text-neutral-800 px-3 py-1 rounded-md hover:bg-neutral-50 transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {filters.uploadDate && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-gray-800 border border-blue-100">
                      {filters.uploadDate === 'hour' ? 'Last hour' :
                       filters.uploadDate === 'today' ? 'Today' :
                       filters.uploadDate === 'week' ? 'This week' :
                       filters.uploadDate === 'month' ? 'This month' :
                       filters.uploadDate === 'year' ? 'This year' : filters.uploadDate}
                    </span>
                  )}
                  {filters.duration && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-gray-800 border border-green-100">
                      {filters.duration === 'short' ? 'Under 4 min' :
                       filters.duration === 'medium' ? '4-20 min' :
                       filters.duration === 'long' ? 'Over 20 min' : filters.duration}
                    </span>
                  )}
                  {filters.quality && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-50 text-gray-800 border border-purple-100">
                      {filters.quality.toUpperCase()}
                    </span>
                  )}
                  {filters.viewCount && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-50 text-gray-800 border border-orange-100">
                      {filters.viewCount === 'low' ? 'Under 1K' :
                       filters.viewCount === 'medium' ? '1K-100K' :
                       filters.viewCount === 'high' ? '100K+' : filters.viewCount}
                    </span>
                  )}
                  {filters.sort && filters.sort !== 'relevance' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-gray-800 border border-indigo-100">
                      Sort: {filters.sort}
                    </span>
                  )}
                  {filters.category && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-50 text-gray-800 border border-teal-100">
                      {filters.category}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-neutral-100 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-neutral-700 hover:text-neutral-900 font-medium text-sm transition-all duration-200 rounded-md border border-neutral-200 hover:bg-neutral-50"
              >
                Cancel
              </button>
              
              <div className="flex items-center space-x-3">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-800 font-medium transition-all duration-200 hover:bg-neutral-50 rounded-md border border-neutral-200"
                  >
                    Clear Filters
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!query.trim() || isSubmitting}
                  className="px-5 py-2 bg-red-600 text-white font-semibold text-sm rounded-md hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-3 shadow"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>Search</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}