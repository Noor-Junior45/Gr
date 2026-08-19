import React from 'react';
import { Search, X } from 'lucide-react';

interface CategorySearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

export const CategorySearchBar: React.FC<CategorySearchBarProps> = ({
  searchQuery,
  onSearchChange,
  placeholder = 'Search products & equipment...'
}) => {
  const handleClear = () => {
    onSearchChange('');
  };

  return (
    <div className="sticky top-[94px] sm:top-[100px] z-30 w-full pointer-events-none py-2 px-4 flex justify-center">
      <div className="relative pointer-events-auto flex items-center w-full max-w-xl rounded-full bg-white/75 backdrop-blur-xl border border-slate-200/80 shadow-md hover:shadow-lg focus-within:shadow-lg focus-within:bg-white/95 focus-within:border-slate-400 transition-all duration-200">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full py-2.5 sm:py-3 pl-5 pr-20 bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-500 rounded-full focus:outline-none"
        />

        {/* Right Action Icons: Cross Button (if query exists) & Scope (Search) Logo */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {searchQuery.trim().length > 0 && (
            <button
              onClick={handleClear}
              type="button"
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Clear search and return"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          )}

          <div
            className="p-1.5 text-slate-600 flex items-center justify-center pointer-events-none"
            aria-hidden="true"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
          </div>
        </div>
      </div>
    </div>
  );
};
