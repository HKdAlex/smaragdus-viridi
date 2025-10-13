/**
 * Search Input Component with Autocomplete
 * 
 * Features:
 * - Real-time autocomplete suggestions
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Debounced API calls (300ms)
 * - Loading states
 * - Category-based suggestions
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useSearchSuggestionsQuery } from '../hooks/use-search-suggestions-query';

export interface SearchInputProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
  autoFocus?: boolean;
  showSuggestions?: boolean;
  defaultValue?: string;
}

export function SearchInput({
  placeholder,
  className = '',
  onSearch,
  autoFocus = false,
  showSuggestions = true,
  defaultValue = '',
}: SearchInputProps) {
  const t = useTranslations('search');
  const router = useRouter();
  
  const [query, setQuery] = useState(defaultValue);
  const [debouncedQuery, setDebouncedQuery] = useState(defaultValue);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch suggestions
  const { data, isLoading } = useSearchSuggestionsQuery(debouncedQuery, {
    enabled: showSuggestions && debouncedQuery.length >= 2,
  });

  const suggestions = data?.suggestions || [];

  // Show dropdown when we have suggestions
  useEffect(() => {
    setShowDropdown(suggestions.length > 0 && query.length >= 2);
  }, [suggestions, query]);

  // Handle search submission
  const handleSearch = useCallback(
    (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) return;

      setShowDropdown(false);
      
      if (onSearch) {
        onSearch(trimmed);
      } else {
        // Navigate to search results page
        router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      }
    },
    [onSearch, router]
  );

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      handleSearch(suggestion);
    },
    [handleSearch]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showDropdown) {
        if (e.key === 'Enter') {
          handleSearch(query);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;

        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            handleSelectSuggestion(suggestions[selectedIndex].suggestion);
          } else {
            handleSearch(query);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setShowDropdown(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [showDropdown, query, suggestions, selectedIndex, handleSearch, handleSelectSuggestion]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Category badge styling
  const getCategoryBadge = (category: string) => {
    const badges = {
      serial_number: { label: t('serialNumber'), color: 'bg-blue-100 text-blue-800' },
      type: { label: t('type'), color: 'bg-purple-100 text-purple-800' },
      color: { label: t('color'), color: 'bg-green-100 text-green-800' },
    };
    return badges[category as keyof typeof badges] || badges.type;
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 && query.length >= 2) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder || t('placeholder')}
          autoFocus={autoFocus}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />
        
        {/* Search Icon */}
        <button
          onClick={() => handleSearch(query)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label={t('search')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>

      {/* Autocomplete Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              {t('loading')}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              {t('noSuggestions')}
            </div>
          ) : (
            <ul className="py-1">
              {suggestions.map((suggestion, index) => {
                const badge = getCategoryBadge(suggestion.category);
                const isSelected = index === selectedIndex;
                
                return (
                  <li key={`${suggestion.suggestion}-${index}`}>
                    <button
                      onClick={() => handleSelectSuggestion(suggestion.suggestion)}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                        isSelected ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                    >
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {suggestion.suggestion}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${badge.color}`}>
                        {badge.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

