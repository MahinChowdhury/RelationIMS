import React, { useState, useEffect } from 'react';

const GlobalSearch = () => {
    const [query, setQuery] = useState('');

    const handleSearch = () => {
        if (query) {
            // @ts-ignore - window.find is non-standard but widely supported
            if (typeof window.find === 'function') {
                // params: aString, aCaseSensitive, aBackwards, aWrapAround, aWholeWord, aSearchInFrames, aShowDialog
                (window as any).find(query, false, false, true, false, false, false);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Auto-search as you type (debounced slightly)
    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (query && typeof (window as any).find === 'function') {
                (window as any).find(query, false, false, true, false, false, false);
            }
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [query]);

    return (
        <div className="fixed top-3 right-16 lg:right-6 z-[60] flex items-center animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-lg">search</span>
                </div>
                <input
                    type="text"
                    className="block w-40 sm:w-56 md:w-64 rounded-full border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-sm dark:shadow-black/20 py-1.5 pl-10 pr-4 text-sm text-text-main dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 opacity-60 hover:opacity-100 focus:opacity-100"
                    placeholder="Find on page..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                />

                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default GlobalSearch;
