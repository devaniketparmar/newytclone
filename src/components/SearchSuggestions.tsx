import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'query' | 'channel' | 'video';
  thumbnail?: string;
  subscriberCount?: number;
  viewCount?: number;
}

interface SearchSuggestionsProps {
  query: string;
  isVisible: boolean;
  onSuggestionClick: (suggestion: string) => void;
  onClose: () => void;
  searchHistory?: string[];
}

export default function SearchSuggestions({
  query,
  isVisible,
  onSuggestionClick,
  onClose,
  searchHistory = []
}: SearchSuggestionsProps) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch search suggestions
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            onSuggestionClick(suggestions[selectedIndex].text);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, suggestions, selectedIndex, onSuggestionClick, onClose]);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  if (!isVisible || (!loading && suggestions.length === 0 && (!query.trim() && searchHistory.length === 0))) {
    return null;
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onSuggestionClick(suggestion.text);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'channel':
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'video':
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div 
      ref={suggestionsRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto
        animate-in slide-in-from-top-2 duration-300 ease-out"
    >
      {loading ? (
        <div className="p-6 text-center">
          <div className="inline-flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            <span className="text-sm font-medium text-gray-600">Searching...</span>
          </div>
        </div>
      ) : (
        <div className="py-3">
          {/* Search History */}
          {!query.trim() && searchHistory.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-100/50">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Recent Searches</span>
              </div>
              {searchHistory.slice(0, 5).map((item, index) => (
                <button
                  key={`history-${index}`}
                  onClick={() => onSuggestionClick(item)}
                  className="w-full px-3 py-2.5 text-left hover:bg-blue-50 transition-all duration-200 flex items-center space-x-3 text-sm text-gray-700 rounded-lg group"
                >
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="truncate group-hover:text-blue-700 transition-colors">{item}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search Suggestions */}
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-all duration-200 flex items-center space-x-3 group ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex-shrink-0">
                {getSuggestionIcon(suggestion.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                  {suggestion.text}
                </div>
                
                {suggestion.type === 'channel' && suggestion.subscriberCount && (
                  <div className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{formatCount(suggestion.subscriberCount)} subscribers</span>
                  </div>
                )}
                
                {suggestion.type === 'video' && suggestion.viewCount && (
                  <div className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{formatCount(suggestion.viewCount)} views</span>
                  </div>
                )}
              </div>
              
              {suggestion.thumbnail && (
                <div className="flex-shrink-0">
                  <img 
                    src={suggestion.thumbnail} 
                    alt="" 
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  />
                </div>
              )}
            </button>
          ))}
          
          {suggestions.length === 0 && query.trim() && (
            <div className="px-4 py-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">
                No suggestions found for "{query}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
