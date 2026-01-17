import { useState, useEffect, useRef } from "react";
import { Search, X, User, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { useSearch, SearchResult } from "@/hooks/useSearch";
import { cn } from "@/lib/utils";

interface SearchUsersProps {
  className?: string;
}

export function SearchUsers({ className }: SearchUsersProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { results, loading, search, clearResults } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim()) {
        search(query);
      } else {
        clearResults();
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, search, clearResults]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClear = () => {
    setQuery("");
    clearResults();
    inputRef.current?.focus();
  };

  const handleResultClick = () => {
    setIsOpen(false);
    setQuery("");
    clearResults();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search users or posts..."
          className="w-full pl-10 pr-10 py-2 bg-background border-2 border-foreground font-mono text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (query || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border-2 border-foreground shadow-lg z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center font-mono text-sm text-muted-foreground">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y-2 divide-border">
              {results.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  to={result.type === "user" ? `/profile/${result.title.toLowerCase().replace("@", "")}` : `/post/${result.id}`}
                  onClick={handleResultClick}
                  className="flex items-center gap-3 p-3 hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 bg-muted border-2 border-foreground flex items-center justify-center">
                    {result.type === "user" ? (
                      result.avatar ? (
                        <img src={result.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display text-sm text-foreground">
                          {result.title.slice(0, 2).toUpperCase()}
                        </span>
                      )
                    ) : (
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-foreground truncate">
                      {result.type === "user" ? result.title : result.content}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground truncate">
                      {result.subtitle}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">
                    {result.type}
                  </span>
                </Link>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center">
              <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="font-mono text-sm text-muted-foreground">No results found</p>
            </div>
          ) : query.length > 0 ? (
            <div className="p-4 text-center font-mono text-xs text-muted-foreground">
              Type at least 2 characters to search
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
