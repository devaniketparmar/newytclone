import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface SearchFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
  className?: string;
}

export interface FilterState {
  uploadDate: string;
  duration: string;
  quality: string;
  viewCount: string;
  sort: string;
  category: string;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ 
  onFiltersChange, 
  initialFilters,
  className = '' 
}) => {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    uploadDate: initialFilters?.uploadDate || '',
    duration: initialFilters?.duration || '',
    quality: initialFilters?.quality || '',
    viewCount: initialFilters?.viewCount || '',
    sort: initialFilters?.sort || 'relevance',
    category: initialFilters?.category || ''
  });

  // Update URL when filters change
  useEffect(() => {
    const query = { ...router.query };
    
    // Remove empty filters from URL
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        query[key] = value;
      } else {
        delete query[key];
      }
    });

    // Update URL without triggering a page reload
    router.replace({
      pathname: router.pathname,
      query
    }, undefined, { shallow: true });
  }, [filters]); // Only depend on filters, not router

  // Notify parent component of filter changes
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters]); // Only depend on filters, not onFiltersChange

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
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

  const hasActiveFilters = Object.values(filters).some(value => 
    value && value !== '' && value !== 'relevance'
  );

  const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-900 mb-2">{title}</h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );

  const FilterButton = ({ 
    value, 
    label, 
    isActive, 
    onClick 
  }: { 
    value: string; 
    label: string; 
    isActive: boolean; 
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 text-sm rounded-full border transition-all duration-200
        ${isActive 
          ? 'bg-blue-100 border-blue-300 text-blue-700 font-medium' 
          : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
        }
      `}
    >
      {label}
    </button>
  );

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Filter Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            {hasActiveFilters && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                {Object.values(filters).filter(v => v && v !== '' && v !== 'relevance').length} active
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      <div className={`p-4 ${isExpanded ? 'block' : 'hidden'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Upload Date Filter */}
          <FilterSection title="Upload Date">
            <div className="flex flex-wrap gap-2">
              <FilterButton
                value="today"
                label="Today"
                isActive={filters.uploadDate === 'today'}
                onClick={() => handleFilterChange('uploadDate', filters.uploadDate === 'today' ? '' : 'today')}
              />
              <FilterButton
                value="week"
                label="This week"
                isActive={filters.uploadDate === 'week'}
                onClick={() => handleFilterChange('uploadDate', filters.uploadDate === 'week' ? '' : 'week')}
              />
              <FilterButton
                value="month"
                label="This month"
                isActive={filters.uploadDate === 'month'}
                onClick={() => handleFilterChange('uploadDate', filters.uploadDate === 'month' ? '' : 'month')}
              />
              <FilterButton
                value="year"
                label="This year"
                isActive={filters.uploadDate === 'year'}
                onClick={() => handleFilterChange('uploadDate', filters.uploadDate === 'year' ? '' : 'year')}
              />
            </div>
          </FilterSection>

          {/* Duration Filter */}
          <FilterSection title="Duration">
            <div className="flex flex-wrap gap-2">
              <FilterButton
                value="short"
                label="Under 4 minutes"
                isActive={filters.duration === 'short'}
                onClick={() => handleFilterChange('duration', filters.duration === 'short' ? '' : 'short')}
              />
              <FilterButton
                value="medium"
                label="4-20 minutes"
                isActive={filters.duration === 'medium'}
                onClick={() => handleFilterChange('duration', filters.duration === 'medium' ? '' : 'medium')}
              />
              <FilterButton
                value="long"
                label="Over 20 minutes"
                isActive={filters.duration === 'long'}
                onClick={() => handleFilterChange('duration', filters.duration === 'long' ? '' : 'long')}
              />
            </div>
          </FilterSection>

          {/* Video Quality Filter */}
          <FilterSection title="Video Quality">
            <div className="flex flex-wrap gap-2">
              <FilterButton
                value="hd"
                label="HD"
                isActive={filters.quality === 'hd'}
                onClick={() => handleFilterChange('quality', filters.quality === 'hd' ? '' : 'hd')}
              />
              <FilterButton
                value="sd"
                label="SD"
                isActive={filters.quality === 'sd'}
                onClick={() => handleFilterChange('quality', filters.quality === 'sd' ? '' : 'sd')}
              />
            </div>
          </FilterSection>

          {/* View Count Filter */}
          <FilterSection title="View Count">
            <div className="flex flex-wrap gap-2">
              <FilterButton
                value="low"
                label="Under 1K views"
                isActive={filters.viewCount === 'low'}
                onClick={() => handleFilterChange('viewCount', filters.viewCount === 'low' ? '' : 'low')}
              />
              <FilterButton
                value="medium"
                label="1K-100K views"
                isActive={filters.viewCount === 'medium'}
                onClick={() => handleFilterChange('viewCount', filters.viewCount === 'medium' ? '' : 'medium')}
              />
              <FilterButton
                value="high"
                label="100K+ views"
                isActive={filters.viewCount === 'high'}
                onClick={() => handleFilterChange('viewCount', filters.viewCount === 'high' ? '' : 'high')}
              />
            </div>
          </FilterSection>

          {/* Sort Options */}
          <FilterSection title="Sort by">
            <div className="space-y-2">
              {[
                { value: 'relevance', label: 'Relevance' },
                { value: 'date', label: 'Upload date' },
                { value: 'viewCount', label: 'View count' },
                { value: 'rating', label: 'Rating' },
                { value: 'duration', label: 'Duration' }
              ].map((option) => (
                <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sort"
                    value={option.value}
                    checked={filters.sort === option.value}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Category Filter */}
          <FilterSection title="Category">
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value=""
                  checked={filters.category === ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">All categories</span>
              </label>
              {/* Note: Categories would be populated from API */}
              <div className="text-xs text-gray-500 italic">
                Category filter coming soon...
              </div>
            </div>
          </FilterSection>

        </div>
      </div>

      {/* Quick Filter Summary (when collapsed) */}
      {!isExpanded && hasActiveFilters && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.uploadDate && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                {filters.uploadDate === 'today' ? 'Today' :
                 filters.uploadDate === 'week' ? 'This week' :
                 filters.uploadDate === 'month' ? 'This month' :
                 filters.uploadDate === 'year' ? 'This year' : filters.uploadDate}
              </span>
            )}
            {filters.duration && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                {filters.duration === 'short' ? 'Under 4 min' :
                 filters.duration === 'medium' ? '4-20 min' :
                 filters.duration === 'long' ? 'Over 20 min' : filters.duration}
              </span>
            )}
            {filters.quality && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                {filters.quality.toUpperCase()}
              </span>
            )}
            {filters.viewCount && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                {filters.viewCount === 'low' ? 'Under 1K views' :
                 filters.viewCount === 'medium' ? '1K-100K views' :
                 filters.viewCount === 'high' ? '100K+ views' : filters.viewCount}
              </span>
            )}
            {filters.sort && filters.sort !== 'relevance' && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                Sort: {filters.sort === 'date' ? 'Upload date' :
                       filters.sort === 'viewCount' ? 'View count' :
                       filters.sort === 'rating' ? 'Rating' :
                       filters.sort === 'duration' ? 'Duration' : filters.sort}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
