import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default async function HomePage() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    // Utilisateur déjà connecté → redirection vers le dashboard
    redirect('/dashboard');
  } else {
    // Utilisateur non connecté → redirection vers la connexion
    redirect('/login');
  }
}

