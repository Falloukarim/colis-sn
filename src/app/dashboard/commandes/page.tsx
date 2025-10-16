// commandes-page.tsx (version améliorée)
import Link from 'next/link';
import { Download, Filter, Plus, Package, TrendingUp, Clock, CheckCircle, Truck } from 'lucide-react';
import { getCommandes } from '@/actions/commande-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CommandesTable from '@/components/commandes/commandes-table';
import SearchCommande from '@/components/commandes/search-commande';
import { ExportButton } from '@/components/commandes/export-button';
import { getStatutDisplayName } from '@/types/commande';

export default async function CommandesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const searchQuery = params.search as string || '';
  const statusFilter = params.status as string || '';

  const { commandes, error } = await getCommandes();

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

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'en_cours': return <Clock className="h-4 w-4" />;
      case 'disponible': return <Package className="h-4 w-4" />;
      case 'remis': return <CheckCircle className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header amélioré */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Commandes
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <span>Gestion de votre activité de nettoyage</span>
                <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                  {commandes.length} commande{commandes.length > 1 ? 's' : ''}
                </Badge>
              </p>
            </div>
          </div>
        </div>
        
        <Link href="/dashboard/commandes/create">
          <Button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all duration-200">
            <Plus className="h-4 w-4" />
            Nouvelle commande
          </Button>
        </Link>
      </div>

      {/* Cartes de statistiques améliorées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total"
          value={stats.total}
          icon={<TrendingUp className="h-5 w-5" />}
          description="Toutes les commandes"
          gradient="from-blue-500 to-blue-600"
        />
        <StatCard
          title="En cours"
          value={stats.en_cours}
          icon={<Clock className="h-5 w-5" />}
          description="En traitement"
          gradient="from-yellow-500 to-yellow-600"
        />
        <StatCard
          title="Disponibles"
          value={stats.disponible}
          icon={<Package className="h-5 w-5" />}
          description="Prêtes à être remises"
          gradient="from-green-500 to-green-600"
        />
        <StatCard
          title="Remises"
          value={stats.remis}
          icon={<CheckCircle className="h-5 w-5" />}
          description="Commandes terminées"
          gradient="from-gray-500 to-gray-600"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          {error}
        </div>
      )}

      {/* Carte principale */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-semibold">Liste des commandes</CardTitle>
              <CardDescription>
                {searchQuery || statusFilter ? (
                  <span>
                    {filteredCommandes.length} commande{filteredCommandes.length > 1 ? 's' : ''} trouvée{filteredCommandes.length > 1 ? 's' : ''}
                    {searchQuery && ` pour "${searchQuery}"`}
                    {statusFilter && ` avec le statut "${getStatutDisplayName(statusFilter as any)}"`}
                  </span>
                ) : (
                  'Toutes vos commandes en cours et terminées'
                )}
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <SearchCommande initialSearch={searchQuery} />
              
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Statut
                      {statusFilter && (
                        <Badge variant="secondary" className="ml-1">
                          {getStatutDisplayName(statusFilter as any)}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/commandes" className="flex items-center gap-2 w-full">
                        <TrendingUp className="h-4 w-4" />
                        Tous les statuts
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/commandes?status=en_cours" className="flex items-center gap-2 w-full">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        En cours
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/commandes?status=disponible" className="flex items-center gap-2 w-full">
                        <Package className="h-4 w-4 text-green-600" />
                        Disponible
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/commandes?status=remis" className="flex items-center gap-2 w-full">
                        <CheckCircle className="h-4 w-4 text-gray-600" />
                        Remis
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <ExportButton 
                  commandes={filteredCommandes}
                  filters={{
                    search: searchQuery,
                    status: statusFilter
                  }}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <CommandesTable commandes={filteredCommandes} />
        </CardContent>
      </Card>
    </div>
  );
}

// Composant de carte de statistiques
function StatCard({ 
  title, 
  value, 
  icon, 
  description, 
  gradient 
}: { 
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  gradient: string;
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${gradient} opacity-5 rounded-full -m-4`}></div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          <div className={`p-3 bg-gradient-to-br ${gradient} rounded-lg text-white`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}