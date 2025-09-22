import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendSMS, sendWhatsApp  } from '@/lib/utils/notification';

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
    const { commande_id, type } = body;

    if (!commande_id || !type) {
      return NextResponse.json({ error: 'ID commande et type requis' }, { status: 400 });
    }

    // Récupérer les détails de la commande
    const { data: commande } = await supabase
      .from('commandes')
      .select('*, client:clients(*)')
      .eq('id', commande_id)
      .eq('organization_id', session.user.user_metadata.organization_id)
      .single();

    if (!commande) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    // Préparer le message
    const message = `Votre commande est disponible. Poids: ${commande.poids}kg, Prix: ${commande.prix_kg}xof/kg, Total: ${commande.montant_total}xof. Présentez vous muni de vote CNI et de ce QR code lors du retrait: ${process.env.NEXT_PUBLIC_APP_URL}/qr/${commande.id}`;

    let success = false;
    let notificationType = type;

    // Envoyer la notification selon le type
    try {
      if (type === 'sms' && commande.client.telephone) {
        success = await sendSMS(commande.client.telephone, message);
      } else if (type === 'whatsapp' && commande.client.whatsapp) {
        success = await sendWhatsApp(commande.client.whatsapp, message);
        notificationType = 'whatsapp';
      } else if (type === 'email' && commande.client.email) {
        // Implémenter l'envoi d'email ici
        // success = await sendEmail(...);
        success = false; // Temporairement désactivé
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      success = false;
    }

    // Enregistrer la notification
    const { data: notification } = await supabase
      .from('notifications')
      .insert([{
        commande_id,
        type: notificationType,
        status: success ? 'sent' : 'failed'
      }])
      .select()
      .single();

    return NextResponse.json({ 
      success, 
      notification,
      message: success ? 'Notification envoyée' : 'Échec de l\'envoi'
    });
  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

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

    const { searchParams } = new URL(request.url);
    const commande_id = searchParams.get('commande_id');

    // Récupérer tous les IDs des commandes de l’organisation
    const { data: commandes, error: commandesError } = await supabase
      .from('commandes')
      .select('id')
      .eq('organization_id', session.user.user_metadata.organization_id);

    if (commandesError) {
      console.error('Error fetching commandes:', commandesError);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    const commandeIds = commandes?.map(c => c.id) || [];

    let query = supabase
      .from('notifications')
      .select('*')
      .in('commande_id', commandeIds);

    if (commande_id) {
      query = query.eq('commande_id', commande_id);
    }

    const { data: notifications, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error in notifications GET API:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
