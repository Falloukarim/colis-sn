import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Vérifier le secret du webhook
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { event, data } = body;

    console.log('Webhook received:', { event, data });

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          async get(name: string) {
            return (await cookieStore).get(name)?.value;
          },
        },
      }
    );

    // Gérer différents types d'événements
    switch (event) {
      case 'subscription.expired':
        // Marquer l'abonnement comme expiré
        await handleSubscriptionExpired(data, supabase);
        break;

      case 'subscription.activated':
        // Activer un abonnement
        await handleSubscriptionActivated(data, supabase);
        break;

      case 'user.deleted':
        // Gérer la suppression d'utilisateur
        await handleUserDeleted(data, supabase);
        break;

      case 'organization.updated':
        // Mettre à jour une organisation
        await handleOrganizationUpdated(data, supabase);
        break;

      default:
        console.log('Event non géré:', event);
    }

    return NextResponse.json({ success: true, message: 'Webhook traité' });
  } catch (error) {
    console.error('Error in webhook API:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

async function handleSubscriptionExpired(data: any, supabase: any) {
  const { organization_id } = data;
  
  await supabase
    .from('organizations')
    .update({ 
      subscription_status: 'expired',
      updated_at: new Date().toISOString()
    })
    .eq('id', organization_id);

  console.log(`Abonnement expiré pour l'organisation: ${organization_id}`);
}

async function handleSubscriptionActivated(data: any, supabase: any) {
  const { organization_id, end_date } = data;
  
  await supabase
    .from('organizations')
    .update({ 
      subscription_status: 'active',
      subscription_end_date: end_date,
      updated_at: new Date().toISOString()
    })
    .eq('id', organization_id);

  console.log(`Abonnement activé pour l'organisation: ${organization_id}`);
}

async function handleUserDeleted(data: any, supabase: any) {
  const { user_id } = data;
  
  // Supprimer l'utilisateur de la table users
  await supabase
    .from('users')
    .delete()
    .eq('id', user_id);

  console.log(`Utilisateur supprimé: ${user_id}`);
}

async function handleOrganizationUpdated(data: any, supabase: any) {
  const { organization_id, updates } = data;
  
  await supabase
    .from('organizations')
    .update({ 
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', organization_id);

  console.log(`Organisation mise à jour: ${organization_id}`);
}

export async function GET(request: NextRequest) {
  // Endpoint de vérification pour les webhooks
  return NextResponse.json({ 
    status: 'active', 
    message: 'Webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}