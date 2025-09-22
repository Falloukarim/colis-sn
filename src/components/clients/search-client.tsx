'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchClientProps {
  initialSearch?: string;
}

export default function SearchClient({ initialSearch = '' }: SearchClientProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(initialSearch);

  const handleSearch = (value: string) => {
    const params = new URLSearchParams();
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    router.push(`/dashboard/clients?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(searchValue);
    }
  };

  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        placeholder="Rechercher un client..."
        className="pl-10"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyPress={handleKeyPress}
      />
    </div>
  );
}