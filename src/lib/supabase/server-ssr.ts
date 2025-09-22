// src/lib/supabase/server-ssr.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createServerSupabaseClient() {
  const cookieStore = cookies(); // pas de await

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookieStore).get(name)?.value;
        },
      },
    }
  );
}

export async function getServerSession() {
  const supabase = createServerSupabaseClient();
  return await supabase.auth.getSession();
}

export async function getServerUser() {
  const supabase = createServerSupabaseClient();
  return await supabase.auth.getUser();
}
