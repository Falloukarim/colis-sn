// src/app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();

    try {
      console.log('Exchanging code for session...');
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(
          new URL('/login?error=Erreur de confirmation d\'email', request.url)
        );
      }

      console.log('Email confirmed successfully, redirecting to login...');
      return NextResponse.redirect(
        new URL('/login?message=Votre email a été confirmé avec succès', request.url)
      );
    } catch (error) {
      console.error('Unexpected error in auth callback:', error);
      return NextResponse.redirect(
        new URL('/login?error=Une erreur inattendue est survenue', request.url)
      );
    }
  }

  // Si pas de code, rediriger vers login
  console.log('No code provided, redirecting to login...');
  return NextResponse.redirect(new URL('/login', request.url));
}