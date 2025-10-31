'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Commande } from '@/types/database.types';
import { generateQRCode, saveQRCode } from '@/lib/utils/qr-code';
import { sendSMS } from '@/lib/utils/notification';
import { isService, generateCommandeSummary } from '@/lib/utils/commande';

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
      },
    }
  );
}

// Fonction améliorée pour générer un numéro de commande unique
async function generateUniqueNumeroCommande(): Promise<string> {
  const supabase = await getSupabaseServerClient();
  
  // Générer un numéro basé sur la date et un timestamp
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
  const timePart = now.getTime().toString().slice(-6);
  
  // Ajouter un random pour plus d'unicité
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  const numeroCommande = `SN-${datePart}-${timePart}-${randomPart}`;
  
  // Vérifier si ce numéro existe déjà (très improbable mais on vérifie)
  const { data: existing } = await supabase
    .from('commandes')
    .select('id')
    .eq('numero_commande', numeroCommande)
    .single();
  
  // Si par extraordinaire il existe, on régénère
  if (existing) {
    return generateUniqueNumeroCommande();
  }
  
  return numeroCommande;
}

// Fonction alternative basée sur le client (moins risquée pour les créations multiples)
async function generateClientBasedNumeroCommande(clientId: string): Promise<string> {
  const supabase = await getSupabaseServerClient();
  
  // Récupérer les infos du client
  const { data: client, error } = await supabase
    .from('clients')
    .select('nom, telephone')
    .eq('id', clientId)
    .single();
  
  if (error || !client) {
    // Fallback à la méthode unique si client non trouvé
    return generateUniqueNumeroCommande();
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
  
  // Utiliser le timestamp pour l'unicité
  const timestamp = Date.now().toString().slice(-4);
  
  return `SN-${nomFormate}-${telFormate}-${timestamp}`;
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
    
    // Générer un numéro de commande unique avec timestamp
    const numeroCommande = await generateUniqueNumeroCommande();

    // Préparer les données de base
    const commandeData: any = {
      organization_id: userData.organization_id,
      client_id: clientId,
      numero_commande: numeroCommande,
      description: formData.get('description') as string || null,
      date_reception: formData.get('date_reception') as string || null,
      date_livraison_prevue: formData.get('date_livraison_prevue') as string || null,
      statut: 'en_cours' as const,
    };

    // Ajouter les champs spécifiques selon le type
    const type = formData.get('type') as 'produit' | 'service' | null;
    
   // Dans createCommande, modifiez cette partie :

if (type === 'service') {
  // Pour les services, utiliser quantité et prix_kg
  const quantite = formData.get('quantite') as string;
  const prixKg = formData.get('prix_kg') as string;
  
  if (quantite && prixKg) {
    commandeData.quantite = parseInt(quantite);
    commandeData.prix_kg = parseFloat(prixKg);
    // NE PAS inclure montant_total - il sera calculé automatiquement
  }
} else {
  // Pour les produits, utiliser poids et prix_kg
  const poids = formData.get('poids') as string;
  const prixKg = formData.get('prix_kg') as string;
  
  if (poids && prixKg) {
    commandeData.poids = parseFloat(poids);
    commandeData.prix_kg = parseFloat(prixKg);
  }
}

    const { data: commande, error } = await supabase
      .from('commandes')
      .insert([commandeData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

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

// Nouvelle fonction pour créer plusieurs commandes en une seule transaction
export async function createMultipleCommandes(
  clientIds: string[], 
  formData: FormData
): Promise<{ success: boolean; error?: string; createdCount?: number }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non autorisé');

    // Récupérer l'organization_id
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

    const description = formData.get('description') as string;
    const date_reception = formData.get('date_reception') as string;
    const date_livraison_prevue = formData.get('date_livraison_prevue') as string;
    const type = formData.get('type') as 'produit' | 'service';

    // Préparer toutes les commandes
   const commandesData = await Promise.all(
  clientIds.map(async (clientId) => {
    const numeroCommande = await generateUniqueNumeroCommande();
    
    const commandeData: any = {
      organization_id: userData.organization_id,
      client_id: clientId,
      numero_commande: numeroCommande,
      description,
      date_reception,
      date_livraison_prevue: date_livraison_prevue || null,
      statut: 'en_cours' as const,
    };

    // TOUJOURS ajouter le prix, même si le poids/quantité n'est pas fourni
    const prixKg = formData.get('prix_kg') as string;
    if (prixKg) {
      commandeData.prix_kg = parseFloat(prixKg);
    }

    // Ajouter les champs spécifiques selon le type (optionnels à la création)
    if (type === 'service') {
  const quantite = formData.get('quantite') as string;
  if (quantite) {
    commandeData.quantite = parseInt(quantite);
    // NE PAS calculer montant_total ici
  }
} else {
  const poids = formData.get('poids') as string;
  if (poids) {
    commandeData.poids = parseFloat(poids);
  }
}

    return commandeData;
  })
);

    // Insérer toutes les commandes en une seule fois
    const { data: commandes, error } = await supabase
      .from('commandes')
      .insert(commandesData)
      .select();

    if (error) {
      console.error('Supabase error creating multiple commandes:', error);
      throw error;
    }

    // Générer les QR codes pour chaque commande
    if (commandes) {
      await Promise.all(
        commandes.map(async (commande) => {
          const qrCodeData = await generateQRCode(commande.id);
          await supabase
            .from('commandes')
            .update({ qr_code: qrCodeData })
            .eq('id', commande.id);
        })
      );
    }

    revalidatePath('/dashboard/commandes');
    revalidatePath('/dashboard');
    
    return { 
      success: true, 
      createdCount: commandes?.length || 0 
    };
  } catch (error) {
    console.error('Error creating multiple commandes:', error);
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

    if (error && error.code !== 'PGRST116') throw error; 

    return { success: true, prix: prix || null };
  } catch (error) {
    console.error('Error fetching default prix kg:', error);
    return { success: false, error: 'Erreur lors de la récupération du prix par défaut', prix: null };
  }
}


export async function updateCommandeStatus(
  commandeId: string, 
  newStatus: Commande['statut'], 
  quantite?: number, 
  prixKg?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non autorisé');

    // Récupérer l'organization_id et les détails de la commande
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;
    if (!userData) throw new Error('Utilisateur non trouvé');

    // Récupérer la commande pour vérifier si c'est un service
    const { data: commande, error: commandeError } = await supabase
      .from('commandes')
      .select('description, statut')
      .eq('id', commandeId)
      .single();

    if (commandeError) throw commandeError;

    const updateData: any = { statut: newStatus };
    
    // Vérifier si c'est un service
    const isServiceCommande = isService(commande?.description);
    
    if (isServiceCommande) {
      // Pour les services, utiliser la quantité et le prix fixe
      if (quantite !== undefined && prixKg !== undefined) {
        updateData.quantite = quantite;
        updateData.prix_kg = prixKg;
        // NE PAS inclure montant_total - il sera calculé automatiquement
      }
    } else {
      // Pour les produits normaux, garder la logique existante
      if (quantite !== undefined && prixKg !== undefined) {
        updateData.poids = quantite; // Ici quantite représente le poids
        updateData.prix_kg = prixKg;
        // NE PAS inclure montant_total - il sera calculé automatiquement
      }
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
  supabase: any, 
  commandeId: string, 
  organizationId: string
): Promise<void> {
  try {
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

    // Générer le message de notification
    const { message } = generateCommandeSummary(commande);

    // Ajouter l'URL du QR code
    const fullMessage = `${message} Présentez ce QR code lors du retrait : ${process.env.NEXT_PUBLIC_APP_URL}/qr/public/${commande.id}`;

    // Envoyer la notification
    let notificationSent = false;
    let notificationType: 'sms' | 'email' = 'email';
    
    if (commande.clients?.whatsapp) {
      notificationSent = await sendSMS(commande.clients.whatsapp, fullMessage);
      notificationType = 'sms';
    }
    
    if (!notificationSent && commande.clients?.telephone) {
      notificationSent = await sendSMS(commande.clients.telephone, fullMessage);
      notificationType = 'sms';
    }

    // Enregistrer la notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert([{
        commande_id: commandeId,
        type: notificationType,
        status: notificationSent ? 'sent' : 'failed',
        message: fullMessage
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