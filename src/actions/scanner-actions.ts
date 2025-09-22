'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function validateQRCode(qrData: string): Promise<{ 
  success: boolean; 
  error?: string; 
  commande?: any 
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Non autorisé' };
    }

    // Extraire l'ID de commande du QR code
    const commandeId = extractCommandeIdFromQR(qrData);
    if (!commandeId) {
      return { success: false, error: 'QR code invalide' };
    }

    // Récupérer la commande
    const { data: commande, error: commandeError } = await supabase
      .from('commandes')
      .select(`
        *,
        clients:client_id (nom),
        organizations:organization_id (id)
      `)
      .eq('id', commandeId)
      .single();

    if (commandeError || !commande) {
      return { success: false, error: 'Commande non trouvée' };
    }

    // Vérifier l'organisation
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userData?.organization_id !== commande.organization_id) {
      return { success: false, error: 'Commande ne vous appartient pas' };
    }

    // Vérifier le statut
    if (commande.statut !== 'disponible') {
      return { 
        success: false, 
        error: `Commande déjà ${commande.statut === 'remis' ? 'remise' : 'en cours'}` 
      };
    }

    // Mettre à jour la commande
    const { error: updateError } = await supabase
      .from('commandes')
      .update({
        statut: 'remis',
        date_retrait: new Date().toISOString(),
        scanned_by: user.id,
        scanned_at: new Date().toISOString()
      })
      .eq('id', commandeId);

    if (updateError) {
      return { success: false, error: 'Erreur de mise à jour' };
    }

    revalidatePath('/dashboard/commandes');
    return { success: true, commande };

  } catch (error) {
    console.error('Scanner error:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

function extractCommandeIdFromQR(qrData: string): string | null {
  // Support multiple QR formats:
  
  // 1. Direct UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(qrData)) {
    return qrData;
  }
  
  // 2. URL format: http://localhost:3000/qr/{id}
  const urlMatch = qrData.match(/qr\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (urlMatch) {
    return urlMatch[1];
  }
  
  return null;
}