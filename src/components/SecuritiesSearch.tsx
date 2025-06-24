import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Search, Loader2 } from "lucide-react";
import { securitiesApi } from "@/lib/api"; // Import your centralized API client
import { useClickOutside } from "@/hooks/useClickOutside"; // Custom hook for outside clicks
import { debounce } from "lodash"; // For debouncing search input

interface Security {
  symbol: string;
  name: string;
  type: string; // e.g., "equity", "fno", "index"
}

interface SecuritiesSearchProps {
  onSelect: (security: Security) => void;
  segment?: 'equity' | 'fno' | 'all';
  placeholder?: string;
  className?: string;
}

export function SecuritiesSearch({
  onSelect,
  segment = 'all',
  placeholder = "Search securities...",
  className = ""
}: SecuritiesSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Security[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // To distinguish between initial and no results
  const containerRef = useRef<HTMLDivElement>(null); // Ref for detecting clicks outside

  // Custom hook to close dropdown when clicking outside
  useClickOutside(containerRef, () => setIsOpen(false));

  // Debounce the API call to avoid excessive requests
  const debouncedSearch = useRef(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setResults([]);
        setIsLoading(false);
        setHasSearched(false);
        return;
      }

      setIsLoading(true);
      setHasSearched(true); // Indicate that a search has been attempted
      try {
        // Call your backend API for securities search
        // The segment prop can be passed to the backend for filtering
        const response = await securitiesApi.search(searchQuery, segment);
        setResults(response.data); // Assuming response.data is an array of Security
      } catch (error) {
        console.error("Failed to fetch securities:", error);
        setResults([]); // Clear results on error
        // Optionally, show a toast or error message to the user
      } finally {
        setIsLoading(false);
      }
    }, 300) // Debounce for 300ms
  ).current;

  // Effect to trigger debounced search when query changes
  useEffect(() => {
    debouncedSearch(query);
    // Cleanup debounce on component unmount
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, segment, debouncedSearch]); // Include debouncedSearch in dependencies

  const handleSelect = (security: Security) => {
    onSelect(security);
    setIsOpen(false);
    setQuery(""); // Clear query after selection
    // inputRef.current?.blur(); // No need to blur, Command handles it
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true); // Open dropdown when typing
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="pl-8"
          role="combobox" // ARIA role for a combobox
          aria-autocomplete="list" // Indicates that the input suggests completions
          aria-expanded={isOpen} // Indicates if the pop-up is visible
          aria-controls="security-search-list" // Connects to the CommandList ID
        />
      </div>

      {/* Render dropdown only if open and query is long enough OR results exist (from previous search) */}
      {isOpen && (query.length >= 2 || (hasSearched && results.length === 0) || (results.length > 0)) && (
        <div className="absolute z-50 w-full mt-1">
          <Command className="rounded-lg border shadow-md" id="security-search-list">
            {/* CommandInput here is primarily for visual consistency if needed, actual typing goes to <Input> */}
            {/* If you want CommandInput to handle typing, remove the above <Input> and pass props here */}
            {/* For now, it's decorative or for screen readers to confirm search text */}
            <CommandInput value={query} onValueChange={setQuery} className="hidden" />

            <CommandList>
              {isLoading ? (
                <div className="py-6 text-center" role="status" aria-live="polite">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground mt-2">Searching securities...</p>
                </div>
              ) : (
                <>
                  {hasSearched && results.length === 0 ? (
                    <CommandEmpty>No results found for "{query}"</CommandEmpty>
                  ) : query.length < 2 && !hasSearched ? (
                    <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
                  ) : (
                    <CommandGroup heading="Securities">
                      {results.map((security) => (
                        <CommandItem
                          key={`${security.symbol}-${security.type}`}
                          value={`${security.symbol} ${security.name}`} // Use a more descriptive value for command
                          onSelect={() => handleSelect(security)}
                          aria-label={`${security.symbol}: ${security.name} (${security.type === 'equity' ? 'Equity' : security.type === 'fno' ? 'Futures & Options' : 'Index'})`}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{security.symbol}</span>
                            <span className="text-xs text-muted-foreground">{security.name}</span>
                          </div>
                          <span className="ml-auto text-xs bg-secondary px-2 py-0.5 rounded-full">
                            {security.type === 'equity' ? 'EQ' : security.type === 'fno' ? 'F&O' : 'IDX'}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}