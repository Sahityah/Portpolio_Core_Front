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

// Mock securities data - in a real app, this would come from an API
const EQUITIES = [
  { symbol: "RELIANCE", name: "Reliance Industries Ltd", type: "equity" },
  { symbol: "TCS", name: "Tata Consultancy Services Ltd", type: "equity" },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", type: "equity" },
  { symbol: "INFY", name: "Infosys Ltd", type: "equity" },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd", type: "equity" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank Ltd", type: "equity" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd", type: "equity" },
  { symbol: "SBIN", name: "State Bank of India", type: "equity" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd", type: "equity" },
  { symbol: "ITC", name: "ITC Ltd", type: "equity" },
];

const FNO = [
  { symbol: "NIFTY", name: "NIFTY Index", type: "index" },
  { symbol: "BANKNIFTY", name: "BANK NIFTY Index", type: "index" },
  { symbol: "RELIANCE", name: "Reliance Industries Ltd", type: "fno" },
  { symbol: "TCS", name: "Tata Consultancy Services Ltd", type: "fno" },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", type: "fno" },
  { symbol: "INFY", name: "Infosys Ltd", type: "fno" },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd", type: "fno" },
];

interface Security {
  symbol: string;
  name: string;
  type: string;
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
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter securities based on segment prop
  const getSecuritiesBySegment = (): Security[] => {
    switch (segment) {
      case 'equity':
        return EQUITIES;
      case 'fno':
        return FNO;
      case 'all':
      default:
        return [...EQUITIES, ...FNO];
    }
  };

  useEffect(() => {
    if (query.length >= 2) {
      setIsLoading(true);
      
      // Simulate API call delay
      const timer = setTimeout(() => {
        const filteredResults = getSecuritiesBySegment().filter((item) => 
          item.symbol.toLowerCase().includes(query.toLowerCase()) || 
          item.name.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filteredResults);
        setIsLoading(false);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [query, segment]);

  const handleSelect = (security: Security) => {
    onSelect(security);
    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-8"
        />
      </div>
      
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute z-50 w-full mt-1">
          <Command className="rounded-lg border shadow-md">
            <CommandInput placeholder="Search securities..." value={query} onValueChange={setQuery} />
            <CommandList>
              {isLoading ? (
                <div className="py-6 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground mt-2">Searching securities...</p>
                </div>
              ) : (
                <>
                  <CommandEmpty>No results found</CommandEmpty>
                  {results.length > 0 && (
                    <CommandGroup heading="Securities">
                      {results.map((security) => (
                        <CommandItem
                          key={`${security.symbol}-${security.type}`}
                          value={`${security.symbol}-${security.name}`}
                          onSelect={() => handleSelect(security)}
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