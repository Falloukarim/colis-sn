// clients-page.tsx (version finale avec import corrigé)
import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import { getClients } from '@/actions/client-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SearchClient from '@/components/clients/search-client';
import ClientsCardList from '@/components/clients/clients-card-list';

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const searchQuery = params.search as string || '';
  
  const { clients, error } = await getClients();

  const filteredClients = searchQuery
    ? clients.filter(client =>
        client.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.telephone.includes(searchQuery) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : clients;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Clients
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <span>Gestion de votre portefeuille clients</span>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  {clients.length} client{clients.length > 1 ? 's' : ''}
                </Badge>
              </p>
            </div>
          </div>
        </div>
        
        <Link href="/dashboard/clients/create">
          <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200">
            <Plus className="h-4 w-4" />
            Nouveau client
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          {error}
        </div>
      )}

      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-semibold">Liste des clients</CardTitle>
              <CardDescription>
                {searchQuery ? (
                  <span>
                    {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} trouvé{filteredClients.length > 1 ? 's' : ''} pour "{searchQuery}"
                  </span>
                ) : (
                  'Tous vos clients en un seul endroit'
                )}
              </CardDescription>
            </div>
            
            <div className="w-full sm:w-auto">
              <SearchClient initialSearch={searchQuery} />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ClientsCardList clients={filteredClients} searchQuery={searchQuery} />
        </CardContent>
      </Card>
    </div>
  );
}