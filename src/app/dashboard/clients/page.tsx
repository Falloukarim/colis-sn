import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getClients } from '@/actions/client-actions';
import { Button } from '@/components/ui/button';
import SearchClient from '@/components/clients/search-client';
import ClientsTable from '@/components/clients/clients-table';

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const searchQuery = params.search as string || '';
  
  const { clients, error } = await getClients();

  // Filtrer les clients en fonction de la recherche
  const filteredClients = searchQuery
    ? clients.filter(client =>
        client.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.telephone.includes(searchQuery) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : clients;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-gray-600 mt-1">
            Gestion de tous vos clients ({clients.length} total)
          </p>
        </div>
        <Link href="/dashboard/clients/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nouveau client
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <SearchClient initialSearch={searchQuery} />
        </div>

        <ClientsTable clients={filteredClients} />
      </div>
    </div>
  );
}