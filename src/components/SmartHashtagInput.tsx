import React, { useState, useEffect, useRef } from 'react';

import { api } from '../lib/axios';
interface HashtagRecommendation {
  hashtag: string;
  confidence: number;
  reason: string;
  category: 'trending' | 'content' | 'category' | 'similar' | 'popular';
  usageCount: number;
  trendingScore: number;
}

interface SmartHashtagInputProps {
  value: string[];
  onChange: (hashtags: string[]) => void;
  placeholder?: string;
  maxHashtags?: number;
  showRecommendations?: boolean;
  videoContent?: {
    title: string;
    description: string;
    category?: string;
    duration?: number;
  };
  className?: string;
}

const SmartHashtagInput: React.FC<SmartHashtagInputProps> = ({
  value = [],
  onChange,
  placeholder = "Add hashtags...",
  maxHashtags = 10,
  showRecommendations = true,
  videoContent,
  className = '',
}) => {
  // Use the default values directly
  const hashtags = value;
  const placeholderText = placeholder;
  const maxTags = maxHashtags;
  const showRecs = showRecommendations;
  const cssClass = className;
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<HashtagRecommendation[]>([]);
  const [recommendations, setRecommendations] = useState<HashtagRecommendation[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load AI recommendations when video content is available
  useEffect(() => {
    if (showRecs && videoContent && videoContent.title) {
      loadRecommendations();
    }
  }, [videoContent, showRecs]);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadRecommendations = async () => {
    if (!videoContent) return;

    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/api/hashtags/recommendations?action=recommend', {
        title: videoContent.title,
        description: videoContent.description || '',
        category: videoContent.category,
        duration: videoContent.duration || 0,
        existingHashtags: hashtags,
        maxRecommendations: 8,
      });

      if (response.status === 200) {
        const data = response.data as any;
        if (data.success) {
          setRecommendations(data.data.recommendations);
        } else {
          setError(data.error || 'Failed to load recommendations');
        }
      } else {
        setError('Failed to load recommendations');
      }
    } catch (error: any) {
      console.error('Error loading recommendations:', error);
      setError('An error occurred while loading recommendations');
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await api.get(`/api/hashtags/recommendations?action=suggestions&q=${encodeURIComponent(query)}&limit=8`);
      
      if (response.status === 200) {
        const data = response.data as any;
        if (data.success) {
          setSuggestions(data.data.suggestions);
        }
      }
    } catch (error: any) {
      console.error('Error loading suggestions:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (newValue.includes('#')) {
      const hashtagQuery = newValue.split('#').pop() || '';
      loadSuggestions(hashtagQuery);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addHashtag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && hashtags.length > 0) {
      // Remove last hashtag when backspace is pressed on empty input
      const newHashtags = hashtags.slice(0, -1);
      onChange(newHashtags);
    }
  };

  const addHashtag = (hashtag: string) => {
    if (!hashtag.trim()) return;

    // Clean hashtag
    const cleanHashtag = hashtag
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase()
      .trim();

    if (cleanHashtag.length < 2) return;

    // Check if already exists
    if (hashtags.includes(cleanHashtag)) return;

    // Check max limit
    if (hashtags.length >= maxTags) return;

    const newHashtags = [...hashtags, cleanHashtag];
    onChange(newHashtags);
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeHashtag = (hashtagToRemove: string) => {
    const newHashtags = hashtags.filter(hashtag => hashtag !== hashtagToRemove);
    onChange(newHashtags);
  };

  const handleSuggestionClick = (suggestion: HashtagRecommendation) => {
    addHashtag(suggestion.hashtag);
  };

  const handleRecommendationClick = (recommendation: HashtagRecommendation) => {
    addHashtag(recommendation.hashtag);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'trending': return '🔥';
      case 'content': return '📝';
      case 'category': return '📂';
      case 'similar': return '🔗';
      case 'popular': return '⭐';
      default: return '🏷️';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'trending': return 'text-orange-600 bg-orange-100';
      case 'content': return 'text-blue-600 bg-blue-100';
      case 'category': return 'text-green-600 bg-green-100';
      case 'similar': return 'text-purple-600 bg-purple-100';
      case 'popular': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className={`space-y-4 ${cssClass}`}>
      {/* Input Field */}
      <div className="relative" ref={suggestionsRef}>
        <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-red-500 focus-within:border-transparent">
          {/* Hashtag Chips */}
          {hashtags.map((hashtag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full"
            >
              #{hashtag}
              <button
                type="button"
                onClick={() => removeHashtag(hashtag)}
                className="ml-2 text-red-600 hover:text-red-800"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          
          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={hashtags.length === 0 ? placeholderText : ''}
            className="flex-1 min-w-0 border-none outline-none text-sm"
            disabled={hashtags.length >= maxTags}
          />
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900">#{suggestion.hashtag}</span>
                    <p className="text-sm text-gray-600">{suggestion.reason}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(suggestion.category)}`}>
                      {getCategoryIcon(suggestion.category)} {suggestion.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatNumber(suggestion.usageCount)} uses
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* AI Recommendations */}
      {showRecs && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 flex items-center">
              <span className="mr-2">🤖</span>
              AI Recommendations
            </h4>
            <button
              onClick={loadRecommendations}
              disabled={loading}
              className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
              <span>Analyzing content and generating recommendations...</span>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recommendations.map((recommendation, index) => (
                <button
                  key={index}
                  onClick={() => handleRecommendationClick(recommendation)}
                  disabled={hashtags.includes(recommendation.hashtag) || hashtags.length >= maxTags}
                  className="p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">#{recommendation.hashtag}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(recommendation.category)}`}>
                        {getCategoryIcon(recommendation.category)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {(recommendation.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{recommendation.reason}</p>
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>{formatNumber(recommendation.usageCount)} uses</span>
                    <span>•</span>
                    <span>Score: {recommendation.trendingScore.toFixed(0)}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              No recommendations available. Add video content to get AI-powered suggestions.
            </div>
          )}
        </div>
      )}

      {/* Helper Text */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {hashtags.length}/{maxTags} hashtags
        </span>
        <span>
          Press Enter to add hashtag
        </span>
      </div>
    </div>
  );
};

export default SmartHashtagInput;
