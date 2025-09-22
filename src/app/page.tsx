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

// Option: Page de chargement minimaliste en attendant la redirection
export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}