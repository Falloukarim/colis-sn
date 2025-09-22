import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import QRCode from 'qrcode';

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

    // Vérifier l'authentification pour les QR codes sensibles
    const { data: { session } } = await supabase.auth.getSession();
    
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');
    const commande_id = searchParams.get('commande_id');
    const size = parseInt(searchParams.get('size') || '200');

    if (!text && !commande_id) {
      return NextResponse.json({ error: 'Texte ou ID commande requis' }, { status: 400 });
    }

    let qrText = text;

    // Si un ID commande est fourni, vérifier les permissions
    if (commande_id) {
      if (!session) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
      }

      const { data: commande } = await supabase
        .from('commandes')
        .select('id, statut')
        .eq('id', commande_id)
        .eq('organization_id', session.user.user_metadata.organization_id)
        .single();

      if (!commande) {
        return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
      }

      qrText = commande_id;
    }

    // Générer le QR code
    try {
      const qrCodeData = await QRCode.toDataURL(qrText!, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Retourner l'image base64
      return NextResponse.json({ 
        qr_code: qrCodeData,
        text: qrText
      });
    } catch (qrError) {
      console.error('Error generating QR code:', qrError);
      return NextResponse.json({ error: 'Erreur génération QR code' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in QR code API:', error);
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
    const { commande_id } = body;

    if (!commande_id) {
      return NextResponse.json({ error: 'ID commande requis' }, { status: 400 });
    }

    // Vérifier que la commande appartient à l'organisation
    const { data: commande } = await supabase
      .from('commandes')
      .select('id')
      .eq('id', commande_id)
      .eq('organization_id', session.user.user_metadata.organization_id)
      .single();

    if (!commande) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    // Générer le QR code
    const qrCodeData = await QRCode.toDataURL(commande_id, {
      width: 200,
      margin: 2
    });

    // Mettre à jour la commande avec le QR code (stockage base64)
    const { error: updateError } = await supabase
      .from('commandes')
      .update({ qr_code: qrCodeData })
      .eq('id', commande_id);

    if (updateError) {
      console.error('Error updating commande with QR code:', updateError);
      return NextResponse.json({ error: 'Erreur mise à jour commande' }, { status: 500 });
    }

    return NextResponse.json({ 
      qr_code: qrCodeData,
      commande_id 
    });
  } catch (error) {
    console.error('Error in QR code POST API:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}