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

    // Vérifier le statut de l'abonnement
    const { data: organization } = await supabase
      .from('organizations')
      .select('subscription_status')
      .eq('id', session.user.user_metadata.organization_id)
      .single();

    if (organization?.subscription_status !== 'active') {
      return NextResponse.json({ error: 'Abonnement non actif' }, { status: 403 });
    }

    // Récupérer les clients avec pagination et recherche
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let query = supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .eq('organization_id', session.user.user_metadata.organization_id);

    // Appliquer la recherche si fournie
    if (search) {
      query = query.or(`nom.ilike.%${search}%,telephone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: clients, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({
      clients,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in clients API:', error);
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

    // Vérifier le statut de l'abonnement
    const { data: organization } = await supabase
      .from('organizations')
      .select('subscription_status')
      .eq('id', session.user.user_metadata.organization_id)
      .single();

    if (organization?.subscription_status !== 'active') {
      return NextResponse.json({ error: 'Abonnement non actif' }, { status: 403 });
    }

    const body = await request.json();
    const { nom, telephone, whatsapp, email } = body;

    // Validation
    if (!nom || !telephone) {
      return NextResponse.json({ error: 'Nom et téléphone requis' }, { status: 400 });
    }

    const { data: client, error } = await supabase
      .from('clients')
      .insert([{
        organization_id: session.user.user_metadata.organization_id,
        nom,
        telephone,
        whatsapp: whatsapp || null,
        email: email || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
    }

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    console.error('Error in clients POST API:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { id, nom, telephone, whatsapp, email } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID client requis' }, { status: 400 });
    }

    const { data: client, error } = await supabase
      .from('clients')
      .update({
        nom,
        telephone,
        whatsapp: whatsapp || null,
        email: email || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', session.user.user_metadata.organization_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Error in clients PUT API:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID client requis' }, { status: 400 });
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('organization_id', session.user.user_metadata.organization_id);

    if (error) {
      console.error('Error deleting client:', error);
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in clients DELETE API:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}