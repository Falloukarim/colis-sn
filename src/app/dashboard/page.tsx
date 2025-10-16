import StatsCards from '@/components/dashboard/stats-cards';
import { createServerSupabaseClient } from '@/lib/supabase/server-ssr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import FormatNumeroCommande from '@/components/dashboard/format-numero-commande';

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return <div className="p-4 text-red-600">Erreur d'authentification</div>;
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!userData) {
    return <div className="p-4 text-red-600">Utilisateur non trouvé</div>;
  }

  const [
    { data: clients, error: clientsError },
    { data: commandes, error: commandesError },
    { data: clientsCount },
    { data: commandesCount }
  ] = await Promise.all([
    supabase
      .from('clients')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('commandes')
      .select('*, clients:client_id(nom, telephone)')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('clients')
      .select('count')
      .eq('organization_id', userData.organization_id)
      .single(),
    supabase
      .from('commandes')
      .select('count')
      .eq('organization_id', userData.organization_id)
      .single()
  ]);

  const stats = {
    clients: clientsCount?.count || 0,
    en_cours: commandes?.filter(c => c.statut === 'en_cours').length || 0,
    disponible: commandes?.filter(c => c.statut === 'disponible').length || 0,
    remis: commandes?.filter(c => c.statut === 'remis').length || 0
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6 w-full">
      {/* Header avec actions rapides */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Link href="/dashboard/clients/create">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Nouveau client</span>
              <span className="xs:hidden">Client</span>
            </Link>
          </Button>
          
          <Button asChild size="sm" variant="outline" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Link href="/dashboard/commandes/create">
              <Package className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Nouvelle commande</span>
              <span className="xs:hidden">Commande</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCards
          clientsCount={stats.clients}
          commandesEnCours={stats.en_cours}
          commandesDisponibles={stats.disponible}
          commandesRemises={stats.remis}
        />
      </div>

      {/* Grid responsive pour les données récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Derniers clients */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
          <div className="flex justify-between items-center mb-3 md:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Derniers clients</h2>
            <Link href="/dashboard/clients" className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap">
              Voir tout
            </Link>
          </div>
          
          {clients && clients.length > 0 ? (
            <div className="space-y-2 md:space-y-3">
              {clients.map((client) => (
                <div key={client.id} className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-sm md:text-base">{client.nom}</p>
                    <p className="text-xs md:text-sm text-gray-500 truncate">{client.telephone}</p>
                    {client.email && (
                      <p className="text-xs md:text-sm text-gray-500 truncate">{client.email}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 md:py-8 text-gray-500">
              <Users className="h-8 w-8 md:h-12 md:w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-sm md:text-base">Aucun client</p>
            </div>
          )}
        </div>

        {/* Commandes récentes */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
          <div className="flex justify-between items-center mb-3 md:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Commandes récentes</h2>
            <Link href="/dashboard/commandes" className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap">
              Voir tout
            </Link>
          </div>
          
          {commandes && commandes.length > 0 ? (
            <div className="space-y-2 md:space-y-3">
              {commandes.map((commande) => (
                <div key={commande.id} className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0 mr-2">
                    <FormatNumeroCommande numero={commande.numero_commande} />
                    <p className="text-xs text-gray-500 mt-1">
                      {(commande as any).clients?.nom || 'Client inconnu'}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">
                      {commande.poids ? `${commande.poids} kg` : 'Poids non spécifié'}
                    </p>
                  </div>
                  <span className={cn(
                    "px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap flex-shrink-0",
                    commande.statut === 'remis' ? 'bg-green-100 text-green-800' :
                    commande.statut === 'disponible' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  )}>
                    {commande.statut}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 md:py-8 text-gray-500">
              <Package className="h-8 w-8 md:h-12 md:w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-sm md:text-base">Aucune commande</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
