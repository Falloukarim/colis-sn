// Service mock pour les notifications pendant la vérification Twilio

export async function sendSMSMock(to: string, body: string): Promise<boolean> {
  try {
    console.log('📱 [MOCK SMS] Envoi simulé à:', to);
    console.log('📱 [MOCK SMS] Message:', body);
    
    // Simuler un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simuler un succès (ou échec aléatoire pour les tests)
    const success = Math.random() > 0.1; // 90% de succès
    console.log('📱 [MOCK SMS] Résultat:', success ? 'SUCCÈS' : 'ÉCHEC');
    
    return success;
  } catch (error) {
    console.error('Erreur mock SMS:', error);
    return false;
  }
}

export async function sendWhatsAppMock(to: string, body: string): Promise<boolean> {
  try {
    console.log('💚 [MOCK WhatsApp] Envoi simulé à:', to);
    console.log('💚 [MOCK WhatsApp] Message:', body);
    
    // Simuler un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simuler un succès
    const success = Math.random() > 0.05; // 95% de succès
    console.log('💚 [MOCK WhatsApp] Résultat:', success ? 'SUCCÈS' : 'ÉCHEC');
    
    return success;
  } catch (error) {
    console.error('Erreur mock WhatsApp:', error);
    return false;
  }
}

// Fonction utilitaire pour valider les numéros
export function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[\s\+]/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

// Fonction pour obtenir la description des erreurs
export function getTwilioErrorDescription(error: any): string {
  if (!error?.code) return 'Erreur inconnue';
  
  const errorCodes: { [key: string]: string } = {
    '21211': 'Numéro de téléphone invalide',
    '21608': 'Numéro non autorisé pour WhatsApp',
    '21610': 'Message trop long',
    '21614': 'Numéro non abonné à WhatsApp',
    '21612': 'Numéro blacklisté',
    '13225': 'Quota dépassé',
  };
  
  return errorCodes[error.code] || `Erreur Twilio: ${error.code}`;
}