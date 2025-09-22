import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendSMS } from '@/lib/utils/notification';

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

    // Récupérer les commandes avec pagination et filtres
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const clientId = searchParams.get('client_id');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('commandes')
      .select('*, client:clients(*)', { count: 'exact' })
      .eq('organization_id', session.user.user_metadata.organization_id);

    // Appliquer les filtres
    if (status) {
      query = query.eq('statut', status);
    }
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: commandes, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching commandes:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({
      commandes,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in commandes API:', error);
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

    const body = await request.json();
    const { client_id } = body;

    if (!client_id) {
      return NextResponse.json({ error: 'ID client requis' }, { status: 400 });
    }

    const { data: commande, error } = await supabase
      .from('commandes')
      .insert([{
        organization_id: session.user.user_metadata.organization_id,
        client_id,
        statut: 'en_cours'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating commande:', error);
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
    }

    return NextResponse.json({ commande }, { status: 201 });
  } catch (error) {
    console.error('Error in commandes POST API:', error);
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
    const { id, statut, poids, prix_kg } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID commande requis' }, { status: 400 });
    }

    const updateData: any = { 
      statut,
      updated_at: new Date().toISOString()
    };

    if (poids !== undefined) updateData.poids = poids;
    if (prix_kg !== undefined) updateData.prix_kg = prix_kg;
    if (statut === 'remis') {
      updateData.date_retrait = new Date().toISOString();
    }

    const { data: commande, error } = await supabase
      .from('commandes')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', session.user.user_metadata.organization_id)
      .select('*, client:clients(*)')
      .single();

    if (error) {
      console.error('Error updating commande:', error);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    // Envoyer une notification si la commande devient disponible
    if (statut === 'disponible' && commande) {
      try {
        const message = `Votre commande est disponible. Poids: ${commande.poids}kg, Prix: ${commande.prix_kg}xof/kg, Total: ${commande.montant_total}xof. Présentez ce QR code pour retirer: ${process.env.NEXT_PUBLIC_APP_URL}/qr/${commande.id}`;
        
        let notificationSent = false;
        if (commande.client.whatsapp) {
          notificationSent = await sendSMS(commande.client.whatsapp, message);
        }
        if (!notificationSent && commande.client.telephone) {
          notificationSent = await sendSMS(commande.client.telephone, message);
        }

        // Enregistrer la notification
        await supabase
          .from('notifications')
          .insert([{
            commande_id: commande.id,
            type: notificationSent ? 'sms' : 'email',
            status: notificationSent ? 'sent' : 'failed'
          }]);
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
      }
    }

    return NextResponse.json({ commande });
  } catch (error) {
    console.error('Error in commandes PUT API:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}