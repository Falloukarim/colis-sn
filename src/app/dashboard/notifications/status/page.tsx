'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getNotificationServiceStatus } from '@/lib/utils/notification';
import { Bell, Smartphone, MessageSquare } from 'lucide-react';

export default function NotificationStatusPage() {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    const serviceStatus = getNotificationServiceStatus();
    setStatus(serviceStatus);
  }, []);

  const testNotification = async (type: 'sms' | 'whatsapp') => {
    const testMessage = `Test ${type.toUpperCase()} - Votre commande #TEST-123 est disponible. Poids: 2.5kg, Prix: 10xof/kg, Total: 25xof.`;
    const testNumber = '+33612345678';
    
    console.log(`🧪 Début du test ${type}...`);
    
    if (type === 'sms') {
      const { sendSMS } = await import('@/lib/utils/notification');
      const result = await sendSMS(testNumber, testMessage);
      alert(`Test SMS ${result ? 'réussi' : 'échoué'} - Voir la console pour les détails`);
    } else {
      const { sendWhatsApp } = await import('@/lib/utils/notification');
      const result = await sendWhatsApp(testNumber, testMessage);
      alert(`Test WhatsApp ${result ? 'réussi' : 'échoué'} - Voir la console pour les détails`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Statut des Services de Notification</h1>
        <p className="text-gray-600 mt-1">
          État actuel des services d'envoi de SMS et WhatsApp
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mode de fonctionnement</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {status && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Mode:</span>
                  <Badge variant={status.isMock ? "secondary" : "default"}>
                    {status.isMock ? "Simulation" : "Production"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{status.message}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions de test</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => testNotification('sms')}
              >
                <Smartphone className="mr-2 h-4 w-4" />
                Tester SMS
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => testNotification('whatsapp')}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Tester WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instructions pour le mode simulation</CardTitle>
          <CardDescription>
            Configuration actuelle pendant la vérification Twilio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-blue-800 font-semibold">📋 Mode simulation activé</h3>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Les SMS et WhatsApp sont simulés dans la console du navigateur</li>
                <li>Les notifications sont enregistrées normalement dans la base de données</li>
                <li>Les clients ne recevront pas de vraies notifications pour le moment</li>
                <li>Parfait pour le développement et les tests sans coût</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200 mt-4">
              <h3 className="text-green-800 font-semibold">🚀 Passage en production</h3>
              <ul className="list-disc list-inside space-y-1 text-green-700">
                <li>Une fois Twilio vérifié, configurez les variables d'environnement</li>
                <li>Définissez <code>USE_MOCK_NOTIFICATIONS=false</code> dans .env.local</li>
                <li>Remplissez les informations Twilio réelles :</li>
                <pre className="bg-gray-100 p-2 rounded text-sm mt-2">
{`TWILIO_ACCOUNT_SID=votre_sid_reel
TWILIO_AUTH_TOKEN=votre_token_reel
TWILIO_PHONE_NUMBER=votre_numero_twilio`}
                </pre>
                <li>Testez avec de vrais numéros avant la mise en production</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Journal des notifications simulées</CardTitle>
          <CardDescription>
            Ouvrez la console du navigateur (F12) pour voir les logs en temps réel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
            <div className="text-blue-600">📱 [MOCK SMS] Envoi simulé à: +33612345678</div>
            <div className="text-blue-600 ml-4">📱 [MOCK SMS] Message: Votre commande est disponible...</div>
            <div className="text-green-600 ml-4">📱 [MOCK SMS] Résultat: SUCCÈS</div>
            <div className="mt-2 text-green-600">💚 [MOCK WhatsApp] Envoi simulé à: +33687654321</div>
            <div className="text-green-600 ml-4">💚 [MOCK WhatsApp] Message: Votre commande est disponible...</div>
            <div className="text-green-600 ml-4">💚 [MOCK WhatsApp] Résultat: SUCCÈS</div>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              💡 <strong>Astuce :</strong> Utilisez les boutons "Tester SMS" et "Tester WhatsApp" 
              ci-dessus pour générer des logs réels dans votre console.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}