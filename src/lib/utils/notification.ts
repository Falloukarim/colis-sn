import { sendSMSMock, sendWhatsAppMock, validatePhoneNumber, getTwilioErrorDescription } from './notification-mock';

// Configuration pour basculer entre mock et Twilio réel
const USE_MOCK_SERVICES = process.env.USE_MOCK_NOTIFICATIONS === 'true' || !process.env.TWILIO_ACCOUNT_SID;

// Export des fonctions mockées ou réelles
export const sendSMS = USE_MOCK_SERVICES ? sendSMSMock : sendSMSReal;
export const sendWhatsApp = USE_MOCK_SERVICES ? sendWhatsAppMock : sendWhatsAppReal;

// Fonctions réelles (seront utilisées plus tard)
async function sendSMSReal(to: string, body: string): Promise<boolean> {
  console.log('📱 SMS réel désactivé pendant la vérification Twilio');
  console.log('📱 Destinataire:', to);
  console.log('📱 Message:', body);
  return false;
}

async function sendWhatsAppReal(to: string, body: string): Promise<boolean> {
  console.log('💚 WhatsApp réel désactivé pendant la vérification Twilio');
  console.log('💚 Destinataire:', to);
  console.log('💚 Message:', body);
  return false;
}

// Export des autres fonctions utilitaires
export { validatePhoneNumber, getTwilioErrorDescription };

// Fonction pour vérifier l'état des services
export function getNotificationServiceStatus() {
  return {
    isMock: USE_MOCK_SERVICES,
    status: USE_MOCK_SERVICES ? 'mock' : 'real',
    message: USE_MOCK_SERVICES 
      ? '📋 Services de notification en mode simulation' 
      : '🚀 Services de notification en mode production'
  };
}