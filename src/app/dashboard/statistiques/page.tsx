import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  Search, 
  List, 
  Target,
  Sparkles,
  ArrowUpRight,
  Users,
  Package,
  Clock,
  Award,
  Zap,
  Eye,
  Download,
  Filter
} from 'lucide-react';
import { getPaymentStats, searchPayments, getAllPayments } from '@/actions/statistics-actions';
import { Button } from '@/components/ui/button';
import { SearchForm } from '@/components/search-form';
import { Badge } from '@/components/ui/badge';

export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; showAll?: string }>;
}) {
  const params = await searchParams;
  const searchQuery = params?.q || '';
  const showAll = params?.showAll === 'true';
  
  const stats = await getPaymentStats();
  let transactions = stats.recentTransactions;

  // Si recherche activée
  if (searchQuery) {
    transactions = await searchPayments(searchQuery);
  }
  // Si historique complet demandé
  else if (showAll) {
    transactions = await getAllPayments();
  }

  // Fonction pour formater les montants avec style
  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} XOF`;
  };

  // Fonction pour obtenir la couleur en fonction du montant
  const getAmountColor = (amount: number) => {
    if (amount >= 1000000) return 'text-green-600';
    if (amount >= 500000) return 'text-blue-600';
    if (amount >= 100000) return 'text-purple-600';
    return 'text-gray-900';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/10 to-purple-50/10 p-4 md:p-6 space-y-6">
      {/* Header avec Glass Effect */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Analytics Financiers
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Analyse des performances et tendances en temps réel
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Données en direct
            </Badge>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Barre de recherche et actions améliorée */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 w-full">
            <SearchForm initialQuery={searchQuery} />
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant={showAll ? "default" : "outline"} 
              asChild
              className="rounded-xl gap-2"
            >
              <a href={showAll ? "/dashboard/statistiques" : "/dashboard/statistiques?showAll=true"}>
                {showAll ? (
                  <>
                    <Eye className="h-4 w-4" />
                    Vue résumée
                  </>
                ) : (
                  <>
                    <List className="h-4 w-4" />
                    Historique complet
                  </>
                )}
              </a>
            </Button>
            
            <Button variant="outline" className="rounded-xl gap-2">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-100">Aujourd'hui</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Zap className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold mb-1 ${getAmountColor(stats.today.total)}`}>
              {formatAmount(stats.today.total)}
            </div>
            <div className="flex items-center gap-2 text-blue-100 text-sm">
              <Users className="h-3 w-3" />
              <span>{stats.today.count} transaction(s)</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1 mt-3">
              <div 
                className="bg-white rounded-full h-1 transition-all duration-1000" 
                style={{ width: `${Math.min((stats.today.total / Math.max(stats.total, 1)) * 100, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-green-100">Cette semaine</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold mb-1 ${getAmountColor(stats.week.total)}`}>
              {formatAmount(stats.week.total)}
            </div>
            <div className="flex items-center gap-2 text-green-100 text-sm">
              <Package className="h-3 w-3" />
              <span>{stats.week.count} transaction(s)</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1 mt-3">
              <div 
                className="bg-white rounded-full h-1 transition-all duration-1000" 
                style={{ width: `${Math.min((stats.week.total / Math.max(stats.total, 1)) * 100, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-purple-100">Ce mois</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold mb-1 ${getAmountColor(stats.month.total)}`}>
              {formatAmount(stats.month.total)}
            </div>
            <div className="flex items-center gap-2 text-purple-100 text-sm">
              <Calendar className="h-3 w-3" />
              <span>{stats.month.count} transaction(s)</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1 mt-3">
              <div 
                className="bg-white rounded-full h-1 transition-all duration-1000" 
                style={{ width: `${Math.min((stats.month.total / Math.max(stats.total, 1)) * 100, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-orange-100">Total général</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1 text-white">
              {formatAmount(stats.total)}
            </div>
            <div className="flex items-center gap-2 text-orange-100 text-sm">
              <Award className="h-3 w-3" />
              <span>{stats.totalCount} transaction(s)</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1 mt-3">
              <div className="bg-white rounded-full h-1 w-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid principale des données */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Transactions récentes */}
        <div className="xl:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 overflow-hidden">
          <CardHeader className="border-b border-gray-200/60 bg-gradient-to-r from-gray-50 to-gray-100/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Transactions récentes</CardTitle>
                  <CardDescription>
                    {showAll ? 'Historique complet des transactions' : 'Les 10 dernières transactions'}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                {transactions.length} trans.
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {transactions.length > 0 ? (
                transactions.map((transaction, index) => (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50/50 rounded-xl border border-gray-200/50 hover:border-blue-200/50 transition-all duration-200 group hover:shadow-sm"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {transaction.client_nom}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(transaction.date_retrait).toLocaleDateString('fr-FR')}
                          </span>
                          <span>•</span>
                          <span>{transaction.poids}kg × {transaction.prix_kg} XOF</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getAmountColor(transaction.montant_total)}`}>
                        {formatAmount(transaction.montant_total)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Montant total</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Aucune transaction trouvée</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {searchQuery ? 'Essayez avec d\'autres termes de recherche' : 'Aucune donnée disponible'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </div>

        {/* Performances mensuelles */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 overflow-hidden">
          <CardHeader className="border-b border-gray-200/60 bg-gradient-to-r from-green-50 to-green-100/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Performance mensuelle</CardTitle>
                <CardDescription>
                  Répartition des revenus par mois
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {stats.monthlyPerformance.map((month, index) => (
                <div key={month.month} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {new Date(2000, parseInt(month.month) - 1).toLocaleDateString('fr-FR', { month: 'long' })}
                    </span>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-gray-100 text-gray-700 text-xs">
                        {month.count} trans.
                      </Badge>
                      <span className="font-bold text-gray-900">
                        {formatAmount(month.total)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-full h-2 transition-all duration-1000"
                      style={{ 
                        width: `${Math.min((month.total / Math.max(stats.monthlyPerformance.reduce((acc, m) => Math.max(acc, m.total), 0), 1)) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </div>
      </div>

      {/* Analytics Avancés */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 overflow-hidden">
        <CardHeader className="border-b border-gray-200/60 bg-gradient-to-r from-purple-50 to-purple-100/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Analytics Avancés</CardTitle>
                <CardDescription>
                  Métriques détaillées et insights
                </CardDescription>
              </div>
            </div>
            <Sparkles className="h-5 w-5 text-purple-400" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-2xl border border-blue-200/50">
              <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-800 mb-1">
                {formatAmount(stats.averageTransaction)}
              </p>
              <p className="text-sm text-blue-600 font-medium">Moyenne par transaction</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100/30 rounded-2xl border border-green-200/50">
              <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-xl flex items-center justify-center">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-800 mb-1">
                {formatAmount(stats.bestDay.total)}
              </p>
              <p className="text-sm text-green-600 font-medium">
                Record: {new Date(stats.bestDay.date).toLocaleDateString('fr-FR')}
              </p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100/30 rounded-2xl border border-purple-200/50">
              <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-800 mb-1">
                {stats.transactionsToday}
              </p>
              <p className="text-sm text-purple-600 font-medium">Transactions aujourd'hui</p>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Footer avec indicateurs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/50 rounded-2xl border border-gray-200/60 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Analytics en temps réel</span>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            Dernière mise à jour
          </span>
          <span>•</span>
          <span>{new Date().toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}</span>
        </div>
      </div>
    </div>
  );
}