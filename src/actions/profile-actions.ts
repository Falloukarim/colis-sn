'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

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


export async function updateProfile(formData: {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Updating profile with data:', formData); // ← Ajoutez ce log
    const supabase = await getSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('User not authenticated'); // ← Log d'erreur
      return { success: false, error: 'Non autorisé' };
    }

    // Mettre à jour le profil dans la table users
    const { error } = await supabase
      .from('users')
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error); // ← Log détaillé
      return { success: false, error: 'Erreur lors de la mise à jour du profil' };
    }

    // Mettre à jour l'email dans l'auth si nécessaire
    if (formData.email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: formData.email
      });

      if (emailError) {
        console.error('Error updating email:', emailError);
        return { success: false, error: 'Erreur lors de la mise à jour de l\'email' };
      }
    }

    console.log('Profile updated successfully'); // ← Log de succès
    revalidatePath('/dashboard/profil');
    return { success: true };
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

export async function changePassword(formData: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Changing password');
    const supabase = await getSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('User not authenticated for password change');
      return { success: false, error: 'Non autorisé' };
    }

    // Vérifier le mot de passe actuel
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: formData.currentPassword
    });

    if (signInError) {
      console.error('Current password incorrect:', signInError);
      
      // Messages d'erreur plus précis
      if (signInError.message.includes('Invalid login credentials')) {
        return { success: false, error: 'Mot de passe actuel incorrect' };
      } else if (signInError.message.includes('Email not confirmed')) {
        return { success: false, error: 'Email non confirmé' };
      } else {
        return { success: false, error: 'Erreur de vérification du mot de passe' };
      }
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    if (formData.currentPassword === formData.newPassword) {
      return { success: false, error: 'Le nouveau mot de passe doit être différent de l\'actuel' };
    }

    // Vérifier la force du mot de passe
    if (formData.newPassword.length < 6) {
      return { success: false, error: 'Le mot de passe doit contenir au moins 6 caractères' };
    }

    // Changer le mot de passe
    const { error: updateError } = await supabase.auth.updateUser({
      password: formData.newPassword
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
      
      // Messages d'erreur spécifiques pour la mise à jour
      if (updateError.message.includes('password')) {
        return { success: false, error: 'Le mot de passe ne respecte pas les exigences de sécurité' };
      } else {
        return { success: false, error: 'Erreur lors du changement de mot de passe' };
      }
    }

    console.log('Password changed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error in changePassword:', error);
    return { success: false, error: 'Erreur serveur lors du changement de mot de passe' };
  }
}

export async function getProfile(): Promise<{ 
  success: boolean; 
  error?: string; 
  profile?: any 
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Non autorisé' };
    }

    const { data: profile, error } = await supabase
      .from('users')
      .select('first_name, last_name, email, phone')
      .eq('id', user.id)
      .single();

    if (error) {
      return { success: false, error: 'Erreur lors de la récupération du profil' };
    }

    return { success: true, profile };
  } catch (error) {
    console.error('Error in getProfile:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}