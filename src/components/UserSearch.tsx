import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface UserResult {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface UserSearchProps {
  onSelectUser: (user: UserResult) => void;
  placeholder?: string;
  className?: string;
}

export function UserSearch({ onSelectUser, placeholder = "Search users...", className }: UserSearchProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim() || query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
          // .neq("id", user?.id || "") // Optional: exclude self if needed
          .limit(10);

        if (error) throw error;
        setResults(data || []);
      } catch (err) {
        console.error("Error searching users:", err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [query, user?.id]);

  const handleSelect = (result: UserResult) => {
    onSelectUser(result);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2 bg-card border-2 border-foreground font-mono text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
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

      {isOpen && (query.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border-2 border-foreground max-h-60 overflow-y-auto z-50">
          {loading ? (
            <div className="p-4 text-center font-mono text-sm text-muted-foreground">
              SEARCHING...
            </div>
          ) : results.length > 0 ? (
            results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
              >
                <div className="w-10 h-10 bg-muted border-2 border-foreground flex items-center justify-center overflow-hidden">
                  {result.avatar_url ? (
                    <img src={result.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-xs text-foreground">
                      {(result.username || result.full_name || "U").slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-foreground truncate">
                    {result.full_name || result.username || "User"}
                  </p>
                  {result.username && (
                    <p className="font-mono text-xs text-muted-foreground truncate">
                      @{result.username}
                    </p>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 text-center font-mono text-sm text-muted-foreground">
              NO USERS FOUND
            </div>
          )}
        </div>
      )}
    </div>
  );
}
