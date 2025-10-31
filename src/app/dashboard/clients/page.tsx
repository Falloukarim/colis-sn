import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import { getClients } from '@/actions/client-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SearchClient from '@/components/clients/search-client';
import ClientsCardList from '@/components/clients/clients-card-list';
import AnimatedContainer from '@/components/AnimatedContainer';

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const searchQuery = (params.search as string) || '';
  
  const { clients, error } = await getClients();

  const filteredClients = searchQuery
    ? clients.filter(client =>
        client.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.telephone.includes(searchQuery) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : clients;

  return (
    <AnimatedContainer>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Gestion des Clients
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base flex items-center gap-2">
              Votre portefeuille client à portée de main
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-medium">
                {clients.length} client{clients.length > 1 ? 's' : ''}
              </Badge>
            </p>
          </div>
        </div>

        <Link href="/dashboard/clients/create">
          <Button 
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="h-4 w-4" />
            Nouveau client
          </Button>
        </Link>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          {error}
        </div>
      )}

      {/* Liste des clients */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">Liste des clients</CardTitle>
              <CardDescription className="text-gray-600">
                {searchQuery ? (
                  <span>
                    {filteredClients.length} résultat{filteredClients.length > 1 ? 's' : ''} pour "{searchQuery}"
                  </span>
                ) : (
                  'Tous vos clients regroupés ici'
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
    </AnimatedContainer>
  );
}
