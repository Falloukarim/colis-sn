'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return (await cookieStore).getAll();
        },
      },
    }
  );
}

export async function getPrixKg() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Non autorisé');

    // Récupérer l'organization_id
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) throw new Error('Utilisateur non trouvé');

    // Récupérer les prix de l'organisation
    const { data: prix, error } = await supabase
      .from('prix_kg')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('is_default', { ascending: false })
      .order('nom');

    if (error) throw error;

    return { success: true, prix: prix || [] };
  } catch (error) {
    console.error('Error fetching prix kg:', error);
    return { success: false, error: 'Erreur lors de la récupération des prix', prix: [] };
  }
}

export async function createPrixKg(formData: FormData) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Non autorisé');

    // Récupérer l'organization_id
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) throw new Error('Utilisateur non trouvé');

    const nom = formData.get('nom') as string;
    const prix = parseFloat(formData.get('prix') as string);
    const description = formData.get('description') as string;
    const isDefault = formData.get('is_default') === 'on';

    // Si c'est le prix par défaut, désactiver les autres par défaut
    if (isDefault) {
      await supabase
        .from('prix_kg')
        .update({ is_default: false })
        .eq('organization_id', userData.organization_id);
    }

    const { error } = await supabase
      .from('prix_kg')
      .insert([{
        organization_id: userData.organization_id,
        nom,
        prix,
        description,
        is_default: isDefault
      }]);

    if (error) throw error;

    revalidatePath('/dashboard/settings/prix');
    return { success: true };
  } catch (error) {
    console.error('Error creating prix kg:', error);
    return { success: false, error: 'Erreur lors de la création du prix' };
  }
}

export async function deletePrixKg(id: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from('prix_kg')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/settings/prix');
    return { success: true };
  } catch (error) {
    console.error('Error deleting prix kg:', error);
    return { success: false, error: 'Erreur lors de la suppression du prix' };
  }
}