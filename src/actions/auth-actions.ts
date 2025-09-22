'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// 🔹 Client serveur SSR
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
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Gérer l'erreur si nécessaire
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Gérer l'erreur si nécessaire
          }
        },
      },
    }
  );
}

// Client service role
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function signUp(
  formData: FormData
): Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }> {
  try {
    const supabase = await getSupabaseServerClient();

    const organizationName = formData.get('organizationName') as string;
    const organizationPhone = formData.get('organizationPhone') as string;
    const organizationAddress = formData.get('organizationAddress') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;

    // Validation
    if (!organizationName || !organizationPhone || !email || !password || !firstName || !lastName) {
      return { success: false, error: 'Tous les champs obligatoires doivent être remplis' };
    }

    // Générer un sous-domaine unique
    const generateUniqueSubdomain = (baseName: string): string => {
      const cleanName = baseName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const timestamp = Date.now().toString(36);
      return `${cleanName}-${timestamp}`.slice(0, 63);
    };

    const subdomain = generateUniqueSubdomain(organizationName);

    // 1. Création de l'organisation
    const { data: organization, error: orgError } = await supabaseService
      .from('organizations')
      .insert([
        {
          name: organizationName,
          subdomain,
          phone: organizationPhone,
          address: organizationAddress,
          subscription_status: 'active',
          subscription_end_date: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      ])
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      return { success: false, error: 'Erreur de création d\'organisation' };
    }

    // 2. Création de l'utilisateur auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          organization_id: organization.id,
          role: 'owner',
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (authError) {
      await supabaseService.from('organizations').delete().eq('id', organization.id);
      return { success: false, error: authError.message };
    }

    // 3. Création de l'utilisateur dans la table users
    if (authData.user) {
      const { error: userError } = await supabaseService.from('users').insert([
        {
          id: authData.user.id,
          email: authData.user.email!,
          organization_id: organization.id,
          role: 'owner',
          first_name: firstName,
          last_name: lastName,
          phone: organizationPhone,
        },
      ]);

      if (userError) {
        console.error('Error creating user:', userError);
        return { success: false, error: 'Erreur lors de la création de l\'utilisateur' };
      }
    }

    return authData.session
      ? { success: true }
      : { success: true, needsEmailConfirmation: true };
  } catch (error) {
    console.error('Error in signUp:', error);
    return { success: false, error: 'Une erreur inattendue est survenue' };
  }
}

export async function signIn(email: string, password: string) {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("SignIn error:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function signOut(): Promise<void> {
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    redirect('/login');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}