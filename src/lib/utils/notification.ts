import { sendSMSMock, sendWhatsAppMock, validatePhoneNumber } from './notification-mock';
import { afrikSMSService } from '@/lib/services/afriksms';
import { isService } from './commande';

// Configuration pour basculer entre mock et AfrikSMS réel
const USE_MOCK_SERVICES = process.env.USE_MOCK_NOTIFICATIONS === 'true' || !process.env.AFRIKSMS_API_KEY;

// Export des fonctions mockées ou réelles
export const sendSMS = USE_MOCK_SERVICES ? sendSMSMock : sendSMSReal;
export const sendWhatsApp = USE_MOCK_SERVICES ? sendWhatsAppMock : sendWhatsAppReal;

// Fonction réelle avec AfrikSMS
async function sendSMSReal(to: string, body: string): Promise<boolean> {
  try {
    console.log('📱 AfrikSMS: Tentative d\'envoi SMS...');
    
    const result = await afrikSMSService.sendSMS(to, body);
    
    if (result.success) {
      console.log('✅ SMS envoyé avec succès via AfrikSMS');
      console.log('📱 ID Message:', result.message_id);
      console.log('💰 Crédits restants:', result.credits_remaining);
      return true;
    } else {
      console.error('❌ Échec envoi SMS AfrikSMS:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur inattendue AfrikSMS:', error);
    return false;
  }
}

// WhatsApp reste en simulation
async function sendWhatsAppReal(to: string, body: string): Promise<boolean> {
  console.log('💚 WhatsApp réel non disponible avec AfrikSMS - Utilisation du mode simulation');
  return sendWhatsAppMock(to, body);
}

// Export des fonctions utilitaires
export { validatePhoneNumber };

// Fonction pour vérifier l'état des services
export function getNotificationServiceStatus() {
  const hasAfrikSMSConfig = !!(process.env.AFRIKSMS_API_KEY && process.env.AFRIKSMS_API_SECRET);
  
  return {
    isMock: USE_MOCK_SERVICES,
    status: USE_MOCK_SERVICES ? 'mock' : 'real',
    provider: hasAfrikSMSConfig ? 'AfrikSMS' : 'Aucun',
    message: USE_MOCK_SERVICES 
      ? '📋 Services de notification en mode simulation' 
      : `🚀 Services SMS en mode production (AfrikSMS)`,
    hasWhatsApp: false
  };
}

// Fonction pour vérifier le solde
export async function getSMSBalance() {
  if (USE_MOCK_SERVICES) {
    return { balance: 100, error: null };
  }
  
  return await afrikSMSService.getBalance();
}

// Fonction utilitaire pour formater les messages de commande (adaptée pour services/produits)
export function formatCommandeMessage(commande: any): string {
  const isServiceCommande = isService(commande.description);
  
  let montantTotal = '0';
  let details = '';

  if (isServiceCommande) {
    // Pour les services: quantité × prix fixe
    montantTotal = commande.quantite && commande.prix_kg 
      ? (commande.quantite * commande.prix_kg).toFixed(0)
      : '0';
    details = `Service: ${commande.description}, Quantité: ${commande.quantite || 1}, Prix unitaire: ${commande.prix_kg || 0} XOF`;
  } else {
    // Pour les produits: poids × prix/kg
    montantTotal = commande.poids && commande.prix_kg 
      ? (commande.poids * commande.prix_kg).toFixed(0)
      : '0';
    details = `Produit: ${commande.description}, Poids: ${commande.poids || 0}kg, Prix: ${commande.prix_kg || 0} XOF/kg`;
  }

  return `Bonjour, Votre commande ${commande.numero_commande} est prête pour le retrait. ${details}, Total: ${montantTotal} XOF. Présentez-vous avec votre QR code pour vérification: ${process.env.NEXT_PUBLIC_APP_URL}/qr/public/${commande.id}`;
}