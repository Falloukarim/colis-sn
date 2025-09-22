import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getOrganizations } from '@/actions/admin-actions';
import OrganizationsTable from '@/components/admin/organizations-table';

export default async function AdminOrganizationsPage() {
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

  const { organizations, error } = await getOrganizations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Administration - Organisations</h1>
        <p className="text-gray-600 mt-1">
          Gestion de toutes les organisations ({organizations.length} total)
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <OrganizationsTable organizations={organizations} />
    </div>
  );
}