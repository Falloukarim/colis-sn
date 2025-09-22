import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Calendar, TrendingUp, BarChart3, Search, List } from 'lucide-react';
import { getPaymentStats, searchPayments, getAllPayments } from '@/actions/statistics-actions';
import { Button } from '@/components/ui/button';
import { SearchForm } from '@/components/search-form';

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Statistiques des Paiements</h1>
        <p className="text-gray-600 mt-1">
          Analyse des performances financières et tendances
        </p>
      </div>

      {/* Barre de recherche et actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <SearchForm initialQuery={searchQuery} />
        
        <div className="flex gap-2">
          <Button 
            variant={showAll ? "default" : "outline"} 
            asChild
          >
            <a href={showAll ? "/dashboard/statistiques" : "/dashboard/statistiques?showAll=true"}>
              <List className="h-4 w-4 mr-2" />
              {showAll ? "Voir moins" : "Tout l'historique"}
            </a>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today.total.toLocaleString()} XOF</div>
            <p className="text-xs text-muted-foreground">
              {stats.today.count} transaction(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cette semaine</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.week.total.toLocaleString()} XOF</div>
            <p className="text-xs text-muted-foreground">
              {stats.week.count} transaction(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ce mois</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.month.total.toLocaleString()} XOF</div>
            <p className="text-xs text-muted-foreground">
              {stats.month.count} transaction(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total général</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()} XOF</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCount} transaction(s) au total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Détails des transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Transactions récentes</CardTitle>
            <CardDescription>
              Les 10 dernières transactions enregistrées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentTransactions.length > 0 ? (
                stats.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{transaction.client_nom}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.date_retrait).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{transaction.montant_total.toLocaleString()} XOF</p>
                      <p className="text-sm text-gray-500">
                        {transaction.poids}kg × {transaction.prix_kg}XOF
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">Aucune transaction récente</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performances mensuelles</CardTitle>
            <CardDescription>
              Répartition des revenus par mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.monthlyPerformance.map((month) => (
                <div key={month.month} className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {new Date(2000, parseInt(month.month) - 1).toLocaleDateString('fr-FR', { month: 'long' })}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{month.count} trans.</span>
                    <span className="font-bold">{month.total.toLocaleString()} XOF</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques avancées */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse détaillée</CardTitle>
          <CardDescription>
            Métriques et tendances des paiements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-800">
                {stats.averageTransaction.toLocaleString()} XOF
              </p>
              <p className="text-sm text-blue-600">Moyenne par transaction</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-800">
                {stats.bestDay.total.toLocaleString()} XOF
              </p>
              <p className="text-sm text-green-600">
                Meilleur jour: {new Date(stats.bestDay.date).toLocaleDateString('fr-FR')}
              </p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-800">
                {stats.transactionsToday}
              </p>
              <p className="text-sm text-purple-600">Transactions aujourd'hui</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}