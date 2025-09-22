'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Commande } from '@/types/database.types';
import { generateQRCode, saveQRCode } from '@/lib/utils/qr-code';
import { sendSMS } from '@/lib/utils/notification';

async function getSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return (await cookieStore).getAll();
        },
        // on ne définit pas setAll ni removeAll → supabase gère
      },
    }
  );
}


async function generateNumeroCommande(clientId: string): Promise<string> {
  const supabase = await getSupabaseServerClient();
  
  // Récupérer les infos du client
  const { data: client, error } = await supabase
    .from('clients')
    .select('nom, telephone')
    .eq('id', clientId)
    .single();
  
  if (error || !client) {
    throw new Error('Client non trouvé pour générer le numéro de commande');
  }
  
  // Formater le nom (premières lettres en majuscules)
  const nomFormate = client.nom
    .toUpperCase()
    .split(' ')
    .map((word: string) => word.charAt(0))
    .join('')
    .substring(0, 3);
  
  // Formater le téléphone (derniers 4 chiffres)
  const telFormate = client.telephone.replace(/\D/g, '').slice(-4);
  
  // Récupérer le nombre de commandes existantes pour ce client
  const { count } = await supabase
    .from('commandes')
    .select('*', { count: 'exact' })
    .eq('client_id', clientId);
  
  const sequence = (count || 0) + 1;
  
  return `SN-${nomFormate}-${telFormate}-${sequence.toString().padStart(3, '0')}`;
}

// Fonction alternative séquentielle simple
async function generateSequentialNumeroCommande(): Promise<string> {
  const supabase = await getSupabaseServerClient();
  
  // Compter le nombre total de commandes
  const { count } = await supabase
    .from('commandes')
    .select('*', { count: 'exact' });
  
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
  const sequence = (count || 0) + 1;
  
  return `SN-${datePart}-${sequence.toString().padStart(4, '0')}`;
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



export async function createCommande(formData: FormData): Promise<{ success: boolean; error?: string; commandeId?: string }> {
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

    // Vérifier le statut de l'abonnement
    const { data: organization } = await supabase
      .from('organizations')
      .select('subscription_status')
      .eq('id', userData.organization_id)
      .single();

    if (organization?.subscription_status !== 'active') {
      throw new Error('Abonnement de l\'organisation non actif');
    }

    const clientId = formData.get('client_id') as string;
    
    // Générer le numéro de commande professionnel
    const numeroCommande = await generateNumeroCommande(clientId);

    const commandeData = {
      organization_id: userData.organization_id,
      client_id: clientId,
      numero_commande: numeroCommande, // Utiliser le nouveau format
      description: formData.get('description') as string || null,
      date_reception: formData.get('date_reception') as string || null,
      date_livraison_prevue: formData.get('date_livraison_prevue') as string || null,
      statut: 'en_cours' as const,
    };

    const { data: commande, error } = await supabase
      .from('commandes')
      .insert([commandeData])
      .select()
      .single();

    if (error) throw error;

    // Générer le QR code
    const qrCodeData = await generateQRCode(commande.id);

    // Mettre à jour la commande avec le QR code
    const { error: updateError } = await supabase
      .from('commandes')
      .update({ qr_code: qrCodeData })
      .eq('id', commande.id);

    if (updateError) throw updateError;

    revalidatePath('/dashboard/commandes');
    revalidatePath('/dashboard'); 
    return { success: true, commandeId: commande.id };
  } catch (error) {
    console.error('Error creating commande:', error);
    const errorDetails = handleSupabaseError(error);
    return { success: false, error: errorDetails.message };
  }
}

export async function getDefaultPrixKg() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Non autorisé');

    // Récupérer l'organization_id
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) throw new Error('Utilisateur non trouvé');

    // Récupérer le prix par défaut
    const { data: prix, error } = await supabase
      .from('prix_kg')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found

    return { success: true, prix: prix || null };
  } catch (error) {
    console.error('Error fetching default prix kg:', error);
    return { success: false, error: 'Erreur lors de la récupération du prix par défaut', prix: null };
  }
}

export async function updateCommandeStatus(commandeId: string, newStatus: Commande['statut'], poids?: number, prixKg?: number): Promise<{ success: boolean; error?: string }> {
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

    const updateData: any = { statut: newStatus };
    
    if (poids !== undefined && prixKg !== undefined) {
      updateData.poids = poids;
      updateData.prix_kg = prixKg;
    }

    if (newStatus === 'remis') {
      updateData.date_retrait = new Date().toISOString();
    }

    const { error } = await supabase
      .from('commandes')
      .update(updateData)
      .eq('id', commandeId)
      .eq('organization_id', userData.organization_id);

    if (error) throw error;

    // Si la commande devient disponible, envoyer une notification
    if (newStatus === 'disponible') {
  await sendCommandeNotification(supabase, commandeId, userData.organization_id);
}

    revalidatePath('/dashboard/commandes');
    revalidatePath(`/dashboard/commandes/${commandeId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating commande status:', error);
    const errorDetails = handleSupabaseError(error);
    return { success: false, error: errorDetails.message };
  }
}

export async function getCommandes(): Promise<{ commandes: Commande[]; error?: string }> {
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

    const { data: commandes, error } = await supabase
      .from('commandes')
      .select(`
        *,
        clients:client_id (nom)
      `)
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Formater les données pour inclure le nom du client
    const formattedCommandes = commandes.map(commande => ({
      ...commande,
      client_nom: commande.clients?.nom || 'Client inconnu'
    }));

    return { commandes: formattedCommandes || [] };
  } catch (error) {
    console.error('Error fetching commandes:', error);
    const errorDetails = handleSupabaseError(error);
    return { commandes: [], error: errorDetails.message };
  }
}

export async function getCommandeById(commandeId: string): Promise<{ commande: Commande | null; error?: string }> {
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

    const { data: commande, error } = await supabase
      .from('commandes')
      .select(`
        *,
        clients:client_id (nom, telephone, email, whatsapp)
      `)
      .eq('id', commandeId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (error) throw error;

    return { commande };
  } catch (error) {
    console.error('Error fetching commande:', error);
    const errorDetails = handleSupabaseError(error);
    return { commande: null, error: errorDetails.message };
  }
}

async function sendCommandeNotification(
  supabase: any, // ← Ajoutez ce paramètre
  commandeId: string, 
  organizationId: string
): Promise<void> {
  try {
    // Supprimez cette ligne : const supabase = await getSupabaseServerClient();

    // Récupérer les détails de la commande et du client
    const { data: commande, error: commandeError } = await supabase
      .from('commandes')
      .select(`
        *,
        clients:client_id (nom, telephone, email, whatsapp)
      `)
      .eq('id', commandeId)
      .eq('organization_id', organizationId)
      .single();

    if (commandeError) {
      console.error('Error fetching commande for notification:', commandeError);
      return;
    }

    if (!commande) {
      console.error('Commande non trouvée pour notification');
      return;
    }

    // Calculer le montant total
    const montantTotal = commande.poids && commande.prix_kg 
      ? (commande.poids * commande.prix_kg).toFixed(2)
      : '0.00';

    // Préparer le message
const message = `Votre commande est disponible. Poids: ${commande.poids}kg, Prix: ${commande.prix_kg}xof/kg, Total: ${montantTotal}xof. Présentez ce QR code pour retirer: ${process.env.NEXT_PUBLIC_APP_URL}/qr/public/${commande.id}`;
    // Envoyer la notification
    let notificationSent = false;
    let notificationType: 'sms' | 'email' = 'email';
    
    if (commande.clients?.whatsapp) {
      notificationSent = await sendSMS(commande.clients.whatsapp, message);
      notificationType = 'sms';
    }
    
    if (!notificationSent && commande.clients?.telephone) {
      notificationSent = await sendSMS(commande.clients.telephone, message);
      notificationType = 'sms';
    }

    // Enregistrer la notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert([{
        commande_id: commandeId,
        type: notificationType,
        status: notificationSent ? 'sent' : 'failed',
        message: message
      }]);

    if (notificationError) {
      console.error('Error saving notification:', notificationError);
    } else {
      console.log('✅ Notification enregistrée en base de données');
    }

  } catch (error) {
    console.error('Error in sendCommandeNotification:', error);
  }
}

export async function deleteCommande(commandeId: string): Promise<{ success: boolean; error?: string }> {
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

    const { error } = await supabase
      .from('commandes')
      .delete()
      .eq('id', commandeId)
      .eq('organization_id', userData.organization_id);

    if (error) throw error;

    revalidatePath('/dashboard/commandes');
    return { success: true };
  } catch (error) {
    console.error('Error deleting commande:', error);
    const errorDetails = handleSupabaseError(error);
    return { success: false, error: errorDetails.message };
  }
}