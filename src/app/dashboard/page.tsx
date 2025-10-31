import StatsCards from '@/components/dashboard/stats-cards';
import { createServerSupabaseClient } from '@/lib/supabase/server-ssr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Package, 
  Plus,
  TrendingUp,
  Clock,
  Calendar,
  Phone,
  Mail,
  ArrowUpRight,
  Sparkles,
  Target,
  BarChart3
} from 'lucide-react';
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

  // Récupérer les statistiques complètes
  const [
    { data: clients, error: clientsError },
    { data: recentCommandes, error: commandesError },
    { data: clientsCount },
    { data: commandesCount },
    { data: allCommandes }
  ] = await Promise.all([
    supabase
      .from('clients')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('commandes')
      .select('*, clients:client_id(nom, telephone, email)')
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
      .single(),
    supabase
      .from('commandes')
      .select('statut, description, created_at')
      .eq('organization_id', userData.organization_id)
  ]);

  // Calculer les statistiques sur TOUTES les commandes
  const totalCommandes = allCommandes?.length || 0;
  const enCoursCount = allCommandes?.filter(c => c.statut === 'en_cours').length || 0;
  const disponibleCount = allCommandes?.filter(c => c.statut === 'disponible').length || 0;
  const remisCount = allCommandes?.filter(c => c.statut === 'remis').length || 0;
  
  // Calculer produits vs services
  const produitsCount = allCommandes?.filter(c => !isService(c.description)).length || 0;
  const servicesCount = allCommandes?.filter(c => isService(c.description)).length || 0;

  // Commandes de cette semaine
  const thisWeekCommandes = allCommandes?.filter(commande => {
    const commandeDate = new Date(commande.created_at);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return commandeDate >= oneWeekAgo;
  }).length || 0;

  // Fonction utilitaire pour détecter les services
  function isService(description: string | null): boolean {
    if (!description) return false;
    const serviceKeywords = ['service', 'maintenance', 'réparation', 'installation', 'nettoyage'];
    return serviceKeywords.some(keyword => 
      description.toLowerCase().includes(keyword)
    );
  }

  const stats = {
    clients: clientsCount?.count || 0,
    total: totalCommandes,
    en_cours: enCoursCount,
    disponible: disponibleCount,
    remis: remisCount,
    produits: produitsCount,
    services: servicesCount,
    cette_semaine: thisWeekCommandes
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Header Sticky avec Glass Effect */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Tableau de bord
                </h1>
                <p className="text-sm text-gray-500">Aperçu de votre activité</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700">En ligne</span>
              </div>
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Section Actions Rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/25">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-100">Actions rapides</h3>
                <p className="text-blue-100/80 text-sm mt-1">Gérez votre activité</p>
              </div>
              <Sparkles className="h-8 w-8 text-blue-200" />
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button asChild size="sm" className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
                <Link href="/dashboard/clients/create" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Nouveau client</span>
                </Link>
              </Button>
              
              <Button asChild size="sm" className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
                <Link href="/dashboard/commandes/create" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="text-xs">Nouvelle commande</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Carte Performance */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/60 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Performance</h3>
                <p className="text-gray-500 text-sm mt-1">Cette semaine</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-gray-900">{stats.cette_semaine}</div>
                <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  +{Math.round((stats.cette_semaine / Math.max(stats.total, 1)) * 100)}%
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Nouvelles commandes</p>
            </div>
          </div>
        </div>

        {/* Cartes de statistiques améliorées */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCards
            clientsCount={stats.clients}
            commandesTotal={stats.total}
            commandesEnCours={stats.en_cours}
            commandesDisponibles={stats.disponible}
            commandesRemises={stats.remis}
            produitsCount={stats.produits}
            servicesCount={stats.services}
          />
        </div>

        {/* Grid principale des données */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Derniers clients - Carte améliorée */}
          <div className="xl:col-span-1 bg-white rounded-2xl border border-gray-200/60 shadow-sm backdrop-blur-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Derniers clients</h2>
                    <p className="text-sm text-gray-500">{stats.clients} clients au total</p>
                  </div>
                </div>
                <Link 
                  href="/dashboard/clients" 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                >
                  <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                </Link>
              </div>
            </div>
            
            <div className="p-4">
              {clients && clients.length > 0 ? (
                <div className="space-y-3">
                  {clients.map((client, index) => (
                    <div 
                      key={client.id} 
                      className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-200/50 hover:border-blue-200/50 transition-all duration-200 group hover:shadow-sm"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                        {client.nom.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {client.nom}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {client.telephone && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Phone className="h-3 w-3" />
                              <span>{client.telephone}</span>
                            </div>
                          )}
                          {client.email && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{client.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">Aucun client</p>
                  <p className="text-sm text-gray-400 mt-1">Commencez par ajouter votre premier client</p>
                  <Button asChild size="sm" className="mt-4">
                    <Link href="/dashboard/clients/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un client
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Commandes récentes - Carte améliorée */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200/60 shadow-sm backdrop-blur-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Commandes récentes</h2>
                    <p className="text-sm text-gray-500">{stats.total} commandes au total</p>
                  </div>
                </div>
                <Link 
                  href="/dashboard/commandes" 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                >
                  <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                </Link>
              </div>
            </div>
            
            <div className="p-4">
              {recentCommandes && recentCommandes.length > 0 ? (
                <div className="space-y-3">
                  {recentCommandes.map((commande) => (
                    <div 
                      key={commande.id} 
                      className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-200/50 hover:border-green-200/50 transition-all duration-200 group hover:shadow-sm"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={cn(
                          "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                          commande.statut === 'remis' ? 'bg-green-100 text-green-600' :
                          commande.statut === 'disponible' ? 'bg-blue-100 text-blue-600' :
                          'bg-yellow-100 text-yellow-600'
                        )}>
                          {commande.statut === 'remis' ? '✅' :
                           commande.statut === 'disponible' ? '📦' :
                           '⏳'}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <FormatNumeroCommande numero={commande.numero_commande} />
                            <span className={cn(
                              "px-2 py-1 text-xs font-medium rounded-full",
                              commande.statut === 'remis' ? 'bg-green-100 text-green-800' :
                              commande.statut === 'disponible' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            )}>
                              {commande.statut === 'remis' ? 'Remise' :
                               commande.statut === 'disponible' ? 'Disponible' :
                               'En cours'}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-1">
                            {(commande as any).clients?.nom || 'Client inconnu'}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {commande.poids ? (
                              <span>📦 {commande.poids} kg</span>
                            ) : commande.quantite ? (
                              <span>🔢 {commande.quantite} unités</span>
                            ) : (
                              <span>📝 Détails non spécifiés</span>
                            )}
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(commande.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <Button asChild variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/dashboard/commandes/${commande.id}`}>
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">Aucune commande</p>
                  <p className="text-sm text-gray-400 mt-1">Créez votre première commande</p>
                  <Button asChild size="sm" className="mt-4">
                    <Link href="/dashboard/commandes/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvelle commande
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer avec indicateurs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/50 rounded-2xl border border-gray-200/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Système opérationnel</span>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Données en temps réel
            </span>
            <span>•</span>
            <span>Mis à jour à {new Date().toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}