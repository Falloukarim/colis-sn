import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getSubscriptionStats } from '@/actions/admin-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react';

export default async function AdminSubscriptionsPage() {
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

  const { stats, error } = await getSubscriptionStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Administration - Abonnements</h1>
        <p className="text-gray-600 mt-1">
          Statistiques et gestion des abonnements
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-gray-500">Organisations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-gray-500">Abonnements actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactifs</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inactive}</div>
            <p className="text-xs text-gray-500">Abonnements inactifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirés</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-xs text-gray-500">Abonnements expirés</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions d'administration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Utilisez le tableau des organisations pour gérer les abonnements individuels.
            Les abonnements expirés sont automatiquement détectés et mis à jour quotidiennement.
          </p>
          <div className="flex gap-4">
            <button
              onClick={async () => {
                // Script pour vérifier manuellement les abonnements
                'use server';
                // Implémenter la vérification manuelle ici
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Vérifier les abonnements maintenant
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}