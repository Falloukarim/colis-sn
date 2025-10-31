'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendSMS, sendWhatsApp } from '@/lib/utils/notification';
import { isService } from '@/lib/utils/commande';

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

function handleSupabaseError(error: any): { message: string; code?: string } {
  if (error instanceof Error) {
    return { message: error.message };
  }

  if (typeof error === 'object' && error !== null) {
    const supabaseError = error as { code?: string; message?: string };
    if (supabaseError.code && supabaseError.message) {
      return { 
        message: supabaseError.message, 
        code: supabaseError.code 
      };
    }
  }

  return { 
    message: 'Une erreur inattendue est survenue' 
  };
}

export async function sendNotification(commandeId: string, type: 'sms' | 'whatsapp' | 'email'): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non autorisé');

    // Récupérer l'organization_id depuis la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;
    if (!userData) throw new Error('Utilisateur non trouvé');

    // Récupérer les détails de la commande
    const { data: commande } = await supabase
      .from('commandes')
      .select(`
        *,
        clients:client_id (*)
      `)
      .eq('id', commandeId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!commande) throw new Error('Commande non trouvée');

    // Déterminer si c'est un service
    const isServiceCommande = isService(commande.description);

    // Calculer le montant total selon le type
    let montantTotal = '0';
    if (isServiceCommande) {
      // Pour les services: quantité × prix fixe
      montantTotal = commande.quantite && commande.prix_kg 
        ? (commande.quantite * commande.prix_kg).toFixed(0)
        : '0';
    } else {
      // Pour les produits: poids × prix/kg
      montantTotal = commande.poids && commande.prix_kg 
        ? (commande.poids * commande.prix_kg).toFixed(0)
        : '0';
    }

    // Préparer le message adapté au type
    let message = '';
    
    if (isServiceCommande) {
      message = `Bonjour, Votre commande ${commande.numero_commande} est prête pour le retrait. Service: ${commande.description}, Quantité: ${commande.quantite || 1}, Prix unitaire: ${commande.prix_kg || 0} XOF, Total: ${montantTotal} XOF. Présentez-vous avec votre QR code pour vérification: ${process.env.NEXT_PUBLIC_APP_URL}/qr/public/${commande.id}`;
    } else {
      message = `Bonjour, Votre commande ${commande.numero_commande} est prête pour le retrait. Produit: ${commande.description}, Poids: ${commande.poids || 0}kg, Prix: ${commande.prix_kg || 0} XOF/kg, Total: ${montantTotal} XOF. Présentez-vous avec votre QR code pour vérification: ${process.env.NEXT_PUBLIC_APP_URL}/qr/public/${commande.id}`;
    }

    // Envoyer la notification selon le type
    let success = false;
    
    if (type === 'sms' && commande.clients?.telephone) {
      success = await sendSMS(commande.clients.telephone, message);
    } else if (type === 'whatsapp' && commande.clients?.whatsapp) {
      success = await sendWhatsApp(commande.clients.whatsapp, message);
    } else if (type === 'email' && commande.clients?.email) {
      // Implémenter l'envoi d'email ici
      console.log('Email à envoyer à:', commande.clients.email);
      console.log('Message:', message);
      success = true; // Simulation pour l'email
    }

    // Enregistrer la notification
    await supabase
      .from('notifications')
      .insert([{
        commande_id: commandeId,
        type,
        status: success ? 'sent' : 'failed',
        message: message
      }]);

    return { success: true };
  } catch (error) {
    console.error('Error sending notification:', error);
    const errorDetails = handleSupabaseError(error);
    return { success: false, error: errorDetails.message };
  }
}

export async function getNotifications(commandeId: string): Promise<{ notifications: any[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non autorisé');

    // Récupérer l'organization_id depuis la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;
    if (!userData) throw new Error('Utilisateur non trouvé');

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('commande_id', commandeId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { notifications: notifications || [] };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    const errorDetails = handleSupabaseError(error);
    return { notifications: [], error: errorDetails.message };
  }
}