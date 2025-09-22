'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().min(1, 'La recherche ne peut pas être vide').max(100),
});

type SearchFormData = z.infer<typeof searchSchema>;

interface SearchFormProps {
  initialQuery?: string;
}

export function SearchForm({ initialQuery = '' }: SearchFormProps) {
  const router = useRouter();
  const { register, handleSubmit, reset, watch } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: initialQuery },
  });

  const currentQuery = watch('query');

  const onSubmit = (data: SearchFormData) => {
    if (data.query.trim()) {
      router.push(`/dashboard/statistiques?q=${encodeURIComponent(data.query.trim())}`);
    }
  };

  const clearSearch = () => {
    reset({ query: '' });
    router.push('/dashboard/statistiques');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 w-full max-w-md">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          {...register('query')}
          placeholder="Rechercher par nom client, montant, description..."
          className="pl-10 pr-10"
        />
        {currentQuery && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Button type="submit">
        <Search className="h-4 w-4 mr-2" />
        Rechercher
      </Button>
    </form>
  );
}