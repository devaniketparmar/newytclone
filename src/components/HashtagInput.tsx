import React, { useState, useEffect, useRef } from 'react';

import { api } from '../lib/axios';
interface HashtagInputProps {
  value: string[];
  onChange: (hashtags: string[]) => void;
  placeholder?: string;
  maxHashtags?: number;
  className?: string;
}

export default function HashtagInput({ 
  value = [], 
  onChange, 
  placeholder = "Add hashtags...",
  maxHashtags = 10,
  className = ""
}: HashtagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch hashtag suggestions
  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/api/hashtags?action=suggestions&query=${encodeURIComponent(query)}&limit=8`); 
      if (response.status === 200) {
        const data = response.data as any;
        if (data.success) {
          const hashtagNames = data.data.suggestions.map((tag: any) => tag.name);
          setSuggestions(hashtagNames);
        }
      }
    } catch (error: any) {
      console.error('Error fetching hashtag suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Extract hashtags from input
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    const matches = newValue.match(hashtagRegex) || [];
    const extractedHashtags = matches
      .map(tag => tag.toLowerCase().replace('#', ''))
      .filter(tag => tag.length > 0 && tag.length <= 50)
      .filter((tag, index, array) => array.indexOf(tag) === index);

    // Show suggestions for the last hashtag being typed
    const lastHashtag = extractedHashtags[extractedHashtags.length - 1];
    if (lastHashtag) {
      fetchSuggestions(lastHashtag);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addHashtag();
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last hashtag if input is empty and backspace is pressed
      const newHashtags = [...value];
      newHashtags.pop();
      onChange(newHashtags);
    }
  };

  // Add hashtag
  const addHashtag = () => {
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    const matches = inputValue.match(hashtagRegex) || [];
    const extractedHashtags = matches
      .map(tag => tag.toLowerCase().replace('#', ''))
      .filter(tag => tag.length > 0 && tag.length <= 50)
      .filter((tag, index, array) => array.indexOf(tag) === index);

    if (extractedHashtags.length > 0) {
      const newHashtags = [...value];
      extractedHashtags.forEach(hashtag => {
        if (!newHashtags.includes(hashtag) && newHashtags.length < maxHashtags) {
          newHashtags.push(hashtag);
        }
      });
      onChange(newHashtags);
      setInputValue('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Remove hashtag
  const removeHashtag = (hashtagToRemove: string) => {
    const newHashtags = value.filter(hashtag => hashtag !== hashtagToRemove);
    onChange(newHashtags);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    if (!value.includes(suggestion) && value.length < maxHashtags) {
      const newHashtags = [...value, suggestion];
      onChange(newHashtags);
    }
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Hashtag Display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {value.map((hashtag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800 border border-red-200"
            >
              #{hashtag}
              <button
                type="button"
                onClick={() => removeHashtag(hashtag)}
                className="ml-2 text-red-600 hover:text-red-800 focus:outline-none"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={value.length >= maxHashtags ? `Maximum ${maxHashtags} hashtags reached` : placeholder}
          disabled={value.length >= maxHashtags}
          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
            value.length >= maxHashtags ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          }`}
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={value.includes(suggestion) || value.length >= maxHashtags}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center ${
                value.includes(suggestion) || value.length >= maxHashtags 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-800'
              }`}
            >
              <span className="text-red-600 mr-2">#</span>
              <span className="flex-1">{suggestion}</span>
              {value.includes(suggestion) && (
                <span className="text-xs text-gray-500 ml-2">Added</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-2 text-xs text-gray-500">
        <p>Type hashtags with # symbol. Press Enter or comma to add. Maximum {maxHashtags} hashtags.</p>
        <p>Example: #gaming #tutorial #fun</p>
      </div>
    </div>
  );
}
