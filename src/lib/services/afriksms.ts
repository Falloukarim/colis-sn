interface AfrikSMSResponse {
  success: boolean;
  message_id?: string;
  error?: string;
  credits_remaining?: number;
  rawResponse?: string;
}

export class AfrikSMSService {
  private clientId: string;
  private apiKey: string;
  private senderId: string;
  private baseURL = 'https://api.afriksms.com/api/web/web_v1/outbounds/send';

  constructor() {
    this.clientId = process.env.AFRIKSMS_CLIENT_ID || '';
    this.apiKey = process.env.AFRIKSMS_API_KEY || '';
    this.senderId = process.env.AFRIKSMS_SENDER_ID || '';
    
    console.log('🔧 Configuration AfrikSMS:', {
      clientId: this.clientId ? '✓ Présent' : '✗ Manquant',
      apiKey: this.apiKey ? '✓ Présente' : '✗ Manquante',
      senderId: this.senderId,
      endpoint: this.baseURL
    });
  }

  /**
   * Envoyer un SMS via AfrikSMS - Version FINALE
   */
  async sendSMS(to: string, message: string): Promise<AfrikSMSResponse> {
    try {
      // Validation du numéro
      const formattedTo = this.formatPhoneNumber(to);
      if (!formattedTo) {
        return {
          success: false,
          error: 'Numéro de téléphone invalide'
        };
      }

      // Validation du message
      if (!message || message.length > 459) {
        return {
          success: false,
          error: 'Message vide ou trop long (max 459 caractères)'
        };
      }

      console.log('='.repeat(60));
      console.log('📱 AFRIKSMS - ENVOI SMS');
      console.log('🌐 URL:', this.baseURL);
      console.log('👤 ClientId:', this.clientId);
      console.log('🔑 ApiKey:', this.apiKey);
      console.log('📞 Destinataire:', formattedTo);
      console.log('👤 Expéditeur:', this.senderId);
      console.log('💬 Message:', message);
      console.log('='.repeat(60));

      // Construction de l'URL avec les paramètres GET comme dans la documentation
      const params = new URLSearchParams({
        ClientId: this.clientId,
        ApiKey: this.apiKey,
        SenderId: this.senderId,
        Message: message,
        MobileNumbers: formattedTo
      });

      const url = `${this.baseURL}?${params.toString()}`;

      console.log('🔗 URL complète:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseText = await response.text();
      console.log('📱 Réponse AfrikSMS:', responseText);

      // Analyser la réponse
      const result = this.parseResponse(responseText);

      if (!result.success) {
        console.error('❌ ERREUR AFRIKSMS:', result.error);
        return {
          success: false,
          error: result.error,
          rawResponse: responseText
        };
      }

      console.log('🎉 SUCCÈS AFRIKSMS!');
      console.log('   Code:', result.code);
      console.log('   Message:', result.message);
      console.log('   ResourceId:', result.resourceId);
      console.log('='.repeat(60));
      
      return {
        success: true,
        message_id: result.resourceId,
        rawResponse: responseText
      };

    } catch (error) {
      console.error('💥 ERREUR RÉSEAU AFRIKSMS:', error);
      return {
        success: false,
        error: 'Erreur de connexion au service SMS'
      };
    }
  }

  /**
   * Analyser la réponse AfrikSMS - Version FINALE
   */
  private parseResponse(responseText: string): any {
    const cleanResponse = responseText.trim();
    
    console.log('🔍 Analyse réponse:', cleanResponse);

    try {
      const jsonResponse = JSON.parse(cleanResponse);
      
      // ✅ Vérifier le code 100 comme indiqué dans la documentation
      if (jsonResponse.code === 100) {
        return {
          success: true,
          code: jsonResponse.code,
          message: jsonResponse.message,
          resourceId: jsonResponse.resourceId
        };
      }

      // Gérer les erreurs selon les codes de la documentation
      const errorMessages: { [key: number]: string } = {
        40: 'Credentials manquants ou incorrects',
        45: 'Numéro de téléphone invalide',
        101: 'Erreur lors de l\'envoi à certains numéros'
      };

      return {
        success: false,
        error: errorMessages[jsonResponse.code] || jsonResponse.message || `Erreur code ${jsonResponse.code}`
      };

    } catch (e) {
      return {
        success: false,
        error: `Réponse invalide: ${cleanResponse.substring(0, 100)}...`
      };
    }
  }

  /**
   * Formater le numéro de téléphone selon la documentation
   */
private formatPhoneNumber(phone: string): string | null {
  const cleaned = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  
  console.log('📞 Formatage numéro:', { original: phone, cleaned });

  // ✅ Format EXACT selon la documentation: "221701234567" (sans + ou 00)
  
  // Si commence par +, retirer le +
  if (cleaned.startsWith('+')) {
    return cleaned.substring(1);
  }
  
  // Si commence par 00, retirer le 00
  if (cleaned.startsWith('00')) {
    return cleaned.substring(2);
  }
  
  // Si commence par 0 et a 9 ou 10 chiffres → Sénégal (221)
  if (cleaned.startsWith('0') && (cleaned.length === 10 || cleaned.length === 9)) {
    return '221' + cleaned.substring(1);
  }
  
  // Si commence par 77/78/76/70 et a 9 chiffres → Sénégal (221)
  if ((cleaned.startsWith('77') || cleaned.startsWith('78') || cleaned.startsWith('76') || cleaned.startsWith('70')) && cleaned.length === 9) {
    return '221' + cleaned;
  }
  
  // Si déjà au format 221 et 12 chiffres → bon format
  if (cleaned.startsWith('221') && cleaned.length === 12) {
    return cleaned;
  }
  
  // Si numéro international sans + (ex: 221783849885)
  if (cleaned.length === 12 && cleaned.startsWith('221')) {
    return cleaned;
  }
  
  // Si c'est juste 9 chiffres (783849885) → probablement Sénégal
  if (cleaned.length === 9 && /^[5678]/.test(cleaned)) {
    return '221' + cleaned;
  }
  
  console.log('❌ Numéro invalide pour AfrikSMS:', cleaned);
  return null;
}

  /**
   * Vérifier le solde de crédits
   */
  async getBalance(): Promise<{ balance: number; error?: string }> {
    try {
      // URL pour le solde (à adapter selon la doc)
      const balanceURL = 'https://api.afriksms.com/api/web/web_v1/account/balance';
      
      const params = new URLSearchParams({
        ClientId: this.clientId,
        ApiKey: this.apiKey
      });

      const url = `${balanceURL}?${params.toString()}`;

      console.log('💰 Vérification solde...', { url });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseText = await response.text();
      console.log('💰 Réponse solde:', responseText);

      const jsonResponse = JSON.parse(responseText);
      
      if (jsonResponse.code === 100) {
        return { balance: jsonResponse.balance || 0 };
      } else {
        return { balance: 0, error: jsonResponse.message || 'Erreur inconnue' };
      }

    } catch (error) {
      console.error('Erreur vérification solde:', error);
      return { balance: 0, error: 'Erreur de connexion' };
    }
  }
}

export const afrikSMSService = new AfrikSMSService();