import { redirect } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, Package, BarChart3 } from 'lucide-react';

export default async function AdminPage() {
  // Vérifier si l'utilisateur est admin
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (currentUser?.role !== 'owner') {
    redirect('/dashboard');
  }

  // Récupérer les statistiques
  const { data: organizations } = await supabase
    .from('organizations')
    .select('count');

  const { data: users } = await supabase
    .from('users')
    .select('count');

  const { data: commandes } = await supabase
    .from('commandes')
    .select('count');

  const adminCards = [
    {
      title: 'Organisations',
      value: organizations?.[0]?.count || 0,
      icon: Shield,
      href: '/admin/organizations',
      description: 'Gérer toutes les organisations'
    },
    {
      title: 'Utilisateurs',
      value: users?.[0]?.count || 0,
      icon: Users,
      href: '/admin/users',
      description: 'Voir tous les utilisateurs'
    },
    {
      title: 'Commandes',
      value: commandes?.[0]?.count || 0,
      icon: Package,
      href: '/admin/commandes',
      description: 'Statistiques des commandes'
    },
    {
      title: 'Abonnements',
      value: 'Gérer',
      icon: BarChart3,
      href: '/admin/subscriptions',
      description: 'Gérer les abonnements'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Administration</h1>
        <p className="text-gray-600 mt-1">
          Panel d'administration du système
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {adminCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Link key={index} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <IconComponent className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-gray-500">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Opérations administratives</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Vérifier les abonnements
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Exporter les données
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Envoyer une notification globale
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques système</CardTitle>
            <CardDescription>État du système</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Organisations actives</p>
                <p className="font-semibold">12</p>
              </div>
              <div>
                <p className="text-gray-600">Commandes aujourd'hui</p>
                <p className="font-semibold">24</p>
              </div>
              <div>
                <p className="text-gray-600">Notifications envoyées</p>
                <p className="font-semibold">156</p>
              </div>
              <div>
                <p className="text-gray-600">Taux de conversion</p>
                <p className="font-semibold">78%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}