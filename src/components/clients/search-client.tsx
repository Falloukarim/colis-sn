// search-client.tsx (version corrigée)
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Implémentation du hook useDebounce directement dans le fichier
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface SearchClientProps {
  initialSearch?: string;
}

export default function SearchClient({ initialSearch = '' }: SearchClientProps) {
  const [search, setSearch] = useState(initialSearch);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useDebounce(search, 500);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (debouncedSearch !== initialSearch) {
      setIsSearching(true);
      const params = new URLSearchParams();
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }
      
      const url = debouncedSearch ? `${pathname}?${params.toString()}` : pathname;
      router.push(url);
      
      const timer = setTimeout(() => setIsSearching(false), 300);
      return () => clearTimeout(timer);
    }
  }, [debouncedSearch, router, pathname, initialSearch]);

  const clearSearch = () => {
    setSearch('');
    router.push(pathname);
  };

  return (
    <div className="relative w-full sm:w-80">
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isSearching ? 'text-blue-500' : 'text-gray-400'}`} />
        <Input
          type="text"
          placeholder="Rechercher un client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-10 bg-white border-gray-200 focus:border-blue-500 transition-colors"
        />
        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        {isSearching && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          </div>
        )}
      </div>
    </div>
  );
}