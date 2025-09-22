import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
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

    // Vérifier l'authentification
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier les permissions admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'owner') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Récupérer les statistiques des abonnements
    const { data: organizations } = await supabase
      .from('organizations')
      .select('subscription_status');

    if (!organizations) {
      return NextResponse.json({ stats: {} });
    }

    const stats = {
      active: organizations.filter(org => org.subscription_status === 'active').length,
      inactive: organizations.filter(org => org.subscription_status === 'inactive').length,
      expired: organizations.filter(org => org.subscription_status === 'expired').length,
      suspended: organizations.filter(org => org.subscription_status === 'suspended').length,
      total: organizations.length
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error in subscriptions API:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
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

    // Vérifier l'authentification
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier les permissions admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'owner') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { organizationId, status, endDate } = body;

    if (!organizationId || !status) {
      return NextResponse.json({ error: 'ID organisation et statut requis' }, { status: 400 });
    }

    const updateData: any = { subscription_status: status };
    if (endDate) {
      updateData.subscription_end_date = endDate;
    }

    const { data: organization, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription:', error);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    return NextResponse.json({ organization });
  } catch (error) {
    console.error('Error in subscriptions POST API:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}