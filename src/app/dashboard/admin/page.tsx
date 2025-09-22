import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getOrganizations, getSubscriptionStats } from '@/actions/admin-actions';
import OrganizationsTable from '@/components/admin/organizations-table';
import { Users, Building, CreditCard, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function AdminPage() {
  const { organizations, error: orgError } = await getOrganizations();
  const { stats, error: statsError } = await getSubscriptionStats();

  // Gestion des erreurs avec UI friendly
  if (orgError || statsError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
        <Users className="h-12 w-12 text-red-600 mx-auto" />
        <h2 className="text-2xl font-semibold">Accès refusé</h2>
        <p className="text-gray-600">
          Cette section est réservée aux super administrateurs.
        </p>
        <Button asChild>
          <Link href="/dashboard">Retour au tableau de bord</Link>
        </Button>
      </div>
    );
  }

  const cardsData = [
    { title: 'Organisations', value: stats?.total || 0, icon: Building, color: 'text-blue-600', description: 'Total des organisations' },
    { title: 'Actives', value: stats?.active || 0, icon: BarChart3, color: 'text-green-600', description: 'Abonnements actifs' },
    { title: 'Inactives', value: stats?.inactive || 0, icon: CreditCard, color: 'text-gray-400', description: 'Abonnements inactifs' },
    { title: 'Problèmes', value: (stats?.expired || 0) + (stats?.suspended || 0), icon: Users, color: 'text-red-600', description: 'Abonnements expirés ou suspendus' },
  ];

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8 py-6">
      {/* Titre */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Administration</h1>
          <p className="text-gray-600 mt-1">
            Gestion des organisations et des abonnements
          </p>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {cardsData.map((card, idx) => (
          <Card key={idx} className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table des organisations */}
      <Card className="overflow-x-auto">
        <CardHeader>
          <CardTitle>Organisations</CardTitle>
          <CardDescription>
            Liste de toutes les organisations et gestion de leurs abonnements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationsTable organizations={organizations} />
        </CardContent>
      </Card>
    </div>
  );
}