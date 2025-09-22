import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        }       
      },
    }
  );
}

export default async function SettingsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Récupérer l'organization_id depuis la table users (évitez user_metadata si possible)
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', session.user.id)
    .single();

  if (!userData) {
    redirect('/login');
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', userData.organization_id)
    .single();

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .eq('organization_id', userData.organization_id);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'expired':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'inactive':
        return 'Inactif';
      case 'expired':
        return 'Expiré';
      case 'suspended':
        return 'Suspendu';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Paramètres</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations de l'organisation</CardTitle>
            <CardDescription>Détails de votre entreprise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Nom</p>
              <p className="text-lg">{organization?.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Sous-domaine</p>
              <p className="text-lg">{organization?.subdomain}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Statut d'abonnement</p>
              <div className="flex items-center gap-2">
                {organization && getStatusIcon(organization.subscription_status)}
                <span className="text-lg">
                  {organization ? getStatusText(organization.subscription_status) : 'Inconnu'}
                </span>
              </div>
            </div>
            {organization?.subscription_end_date && (
              <div>
                <p className="text-sm font-medium text-gray-600">Date d'expiration</p>
                <p className="text-lg">
                  {new Date(organization.subscription_end_date).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs</CardTitle>
            <CardDescription>Membres de votre organisation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users?.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-gray-600 capitalize">{user.role}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    Inscrit le {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {organization?.subscription_status !== 'active' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Abonnement non actif
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Votre abonnement n'est pas actif. Certaines fonctionnalités peuvent être limitées.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="border-yellow-300 text-yellow-700">
              Contacter le support
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Opérations sur votre compte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button variant="outline">Exporter les données</Button>
            <Button variant="outline">Modifier le profil</Button>
            <Button variant="outline" className="text-red-600 border-red-200">
              Supprimer le compte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}