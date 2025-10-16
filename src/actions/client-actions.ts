// src/actions/client-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Client } from '@/types/database.types';

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

export async function createClient(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non autorisé');

    // Récupérer l'organization_id depuis la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;
    if (!userData) throw new Error('Utilisateur non trouvé');

    const { data: organization } = await supabase
      .from('organizations')
      .select('id, subscription_status')
      .eq('id', userData.organization_id)
      .single();

    if (organization?.subscription_status !== 'active') {
      throw new Error('Abonnement de l\'organisation non actif');
    }

    const clientData = {
      organization_id: userData.organization_id,
      nom: formData.get('nom') as string,
      telephone: formData.get('telephone') as string,
      whatsapp: formData.get('whatsapp') as string || null,
      email: formData.get('email') as string || null,
      adresse: formData.get('adresse') as string || null, // ← Ajouté
    };

    const { error } = await supabase
      .from('clients')
      .insert([clientData]);

    if (error) throw error;

    revalidatePath('/dashboard/clients');
    return { success: true };
  } catch (error) {
    console.error('Error creating client:', error);
    const errorDetails = handleSupabaseError(error);
    return { 
      success: false, 
      error: errorDetails.message 
    };
  }
}

export async function getClients(): Promise<{ clients: Client[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non autorisé');

    let organizationId = user.user_metadata?.organization_id;
    
    if (!organizationId) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('Utilisateur non trouvé');
      
      organizationId = userData.organization_id;
    }

    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { clients: clients || [] };
  } catch (error) {
    console.error('Error fetching clients:', error);
    const errorDetails = handleSupabaseError(error);
    return { clients: [], error: errorDetails.message };
  }
}

export async function getClientById(clientId: string): Promise<{ client: Client | null; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non autorisé');

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;
    if (!userData) throw new Error('Utilisateur non trouvé');

    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (error) throw error;

    return { client };
  } catch (error) {
    console.error('Error fetching client:', error);
    const errorDetails = handleSupabaseError(error);
    return { client: null, error: errorDetails.message };
  }
}

export async function updateClient(clientId: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non autorisé');

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;
    if (!userData) throw new Error('Utilisateur non trouvé');

    const clientData = {
      nom: formData.get('nom') as string,
      telephone: formData.get('telephone') as string,
      whatsapp: formData.get('whatsapp') as string || null,
      email: formData.get('email') as string || null,
      adresse: formData.get('adresse') as string || null, // ← Ajouté
    };

    const { error } = await supabase
      .from('clients')
      .update(clientData)
      .eq('id', clientId)
      .eq('organization_id', userData.organization_id);

    if (error) throw error;

    revalidatePath('/dashboard/clients');
    revalidatePath(`/dashboard/clients/${clientId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating client:', error);
    const errorDetails = handleSupabaseError(error);
    return { success: false, error: errorDetails.message };
  }
}

export async function deleteClient(clientId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non autorisé');

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;
    if (!userData) throw new Error('Utilisateur non trouvé');

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('organization_id', userData.organization_id);

    if (error) throw error;

    revalidatePath('/dashboard/clients');
    return { success: true };
  } catch (error) {
    console.error('Error deleting client:', error);
    const errorDetails = handleSupabaseError(error);
    return { success: false, error: errorDetails.message };
  }
}

// Nouvelle fonction pour obtenir les statistiques avec adresse
export async function getClientsStats(): Promise<{ 
  total: number; 
  with_email: number; 
  with_whatsapp: number; 
  with_adresse: number;
  error?: string 
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non autorisé');

    let organizationId = user.user_metadata?.organization_id;
    
    if (!organizationId) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('Utilisateur non trouvé');
      
      organizationId = userData.organization_id;
    }

    const { data: clients, error } = await supabase
      .from('clients')
      .select('email, whatsapp, adresse')
      .eq('organization_id', organizationId);

    if (error) throw error;

    const stats = {
      total: clients?.length || 0,
      with_email: clients?.filter(client => client.email).length || 0,
      with_whatsapp: clients?.filter(client => client.whatsapp).length || 0,
      with_adresse: clients?.filter(client => client.adresse).length || 0, // ← Ajouté
    };

    return stats;
  } catch (error) {
    console.error('Error fetching clients stats:', error);
    const errorDetails = handleSupabaseError(error);
    return { 
      total: 0, 
      with_email: 0, 
      with_whatsapp: 0, 
      with_adresse: 0,
      error: errorDetails.message 
    };
  }
}