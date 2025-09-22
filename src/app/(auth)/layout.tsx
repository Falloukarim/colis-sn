import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Vérifier si l'utilisateur est déjà connecté
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {children}
      </div>
    </div>
  );
}