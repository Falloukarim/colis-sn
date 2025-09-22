import Link from 'next/link';
import { Plus, Search, Filter, Download } from 'lucide-react';
import { getCommandes } from '@/actions/commande-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CommandesTable from '@/components/commandes/commandes-table';
import SearchCommande from '@/components/commandes/search-commande';

export default async function CommandesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const searchQuery = params.search as string || '';
  const statusFilter = params.status as string || '';

  const { commandes, error } = await getCommandes();

  // Filtrer les commandes en fonction de la recherche et du statut
  const filteredCommandes = commandes.filter(commande => {
    const matchesSearch = searchQuery
  ? (commande.numero_commande?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (commande as any).client_nom?.toLowerCase().includes(searchQuery.toLowerCase()))
  : true;


    const matchesStatus = statusFilter
      ? commande.statut === statusFilter
      : true;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: commandes.length,
    en_cours: commandes.filter(c => c.statut === 'en_cours').length,
    disponible: commandes.filter(c => c.statut === 'disponible').length,
    remis: commandes.filter(c => c.statut === 'remis').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Commandes</h1>
          <p className="text-gray-600 mt-1">
            Gestion de toutes vos commandes ({commandes.length} total)
          </p>
        </div>
        <Link href="/dashboard/commandes/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle commande
          </Button>
        </Link>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{stats.en_cours}</div>
          <div className="text-sm text-blue-600">En cours</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{stats.disponible}</div>
          <div className="text-sm text-green-600">Disponible</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-600">{stats.remis}</div>
          <div className="text-sm text-gray-600">Remis</div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <SearchCommande initialSearch={searchQuery} />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtre
                {statusFilter && (
                  <Badge variant="secondary" className="ml-1">
                    {statusFilter === 'en_cours' ? 'En cours' :
                     statusFilter === 'disponible' ? 'Disponible' :
                     statusFilter === 'remis' ? 'Remis' : statusFilter}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Link href="/dashboard/commandes" className="w-full">
                  Tous les statuts
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/dashboard/commandes?status=en_cours" className="w-full">
                  En cours
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/dashboard/commandes?status=disponible" className="w-full">
                  Disponible
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/dashboard/commandes?status=remis" className="w-full">
                  Remis
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>

        <CommandesTable commandes={filteredCommandes} />
      </div>
    </div>
  );
}