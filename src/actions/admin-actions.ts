'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

function handleSupabaseError(error: any): { message: string; code?: string } {
  if (error instanceof Error) {
    return { message: error.message };
  }

  if (typeof error === 'object' && error !== null) {
    const supabaseError = error as { code?: string; message?: string };
    if (supabaseError.code && supabaseError.message) {
      return { 
        message: supabaseError.message, 
        code: supabaseError.code 
      };
    }
  }

  return { 
    message: 'Une erreur inattendue est survenue' 
  };
}

export async function getOrganizations(): Promise<{ organizations: any[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Non autorisé');

    // Récupérer le rôle de l'utilisateur depuis la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;
    if (!userData) throw new Error('Utilisateur non trouvé');

    // Vérification du rôle superadmin
    if (userData.role !== 'superadmin') {
      throw new Error('Accès réservé aux super administrateurs');
    }

    const { data: organizations, error } = await supabase
      .from('organizations')
      .select(`
        *,
        users(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { organizations: organizations || [] };
  } catch (error) {
    console.error('Error fetching organizations:', error);
    const errorDetails = handleSupabaseError(error);
    return { organizations: [], error: errorDetails.message };
  }
}

export async function updateSubscriptionStatus(organizationId: string, status: 'active' | 'inactive' | 'expired' | 'suspended', endDate?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Non autorisé');

    // Récupérer le rôle de l'utilisateur depuis la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;
    if (!userData) throw new Error('Utilisateur non trouvé');

    // Vérification du rôle superadmin
    if (userData.role !== 'superadmin') {
      throw new Error('Accès réservé aux super administrateurs');
    }

    const updateData: any = { subscription_status: status };
    
    if (endDate) {
      updateData.subscription_end_date = endDate;
    }

    if (status === 'active' && !endDate) {
      // Définir la date de fin par défaut (1 mois)
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      updateData.subscription_end_date = oneMonthLater.toISOString();
    }

    const { error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId);

    if (error) throw error;

    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    console.error('Error updating subscription status:', error);
    const errorDetails = handleSupabaseError(error);
    return { success: false, error: errorDetails.message };
  }
}

export async function getSubscriptionStats(): Promise<{ stats: any; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Non autorisé');

    // Récupérer le rôle de l'utilisateur depuis la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;
    if (!userData) throw new Error('Utilisateur non trouvé');

    // Vérification du rôle superadmin
    if (userData.role !== 'superadmin') {
      throw new Error('Accès réservé aux super administrateurs');
    }

    // Récupérer les statistiques des abonnements
    const { data: organizations } = await supabase
      .from('organizations')
      .select('subscription_status');

    if (!organizations) {
      return { stats: {} };
    }

    const stats = {
      active: organizations.filter(org => org.subscription_status === 'active').length,
      inactive: organizations.filter(org => org.subscription_status === 'inactive').length,
      expired: organizations.filter(org => org.subscription_status === 'expired').length,
      suspended: organizations.filter(org => org.subscription_status === 'suspended').length,
      total: organizations.length
    };

    return { stats };
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    const errorDetails = handleSupabaseError(error);
    return { stats: {}, error: errorDetails.message };
  }
}