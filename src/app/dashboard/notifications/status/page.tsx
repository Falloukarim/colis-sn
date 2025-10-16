'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getNotificationServiceStatus, getSMSBalance } from '@/lib/utils/notification';
import { Bell, Smartphone, MessageSquare, CreditCard } from 'lucide-react';

export default function NotificationStatusPage() {
  const [status, setStatus] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const serviceStatus = getNotificationServiceStatus();
    setStatus(serviceStatus);
    
    // Charger le solde
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const balanceData = await getSMSBalance();
      setBalance(balanceData.balance);
    } catch (error) {
      console.error('Erreur chargement solde:', error);
    } finally {
      setLoading(false);
    }
  };

  const testNotification = async (type: 'sms' | 'whatsapp') => {
    const testMessage = `Test ${type.toUpperCase()} - Votre commande #TEST-123 est disponible. Poids: 2.5kg, Prix: 10xof/kg, Total: 25xof.`;
    const testNumber = '+221701234567'; // Numéro de test Sénégal
    
    console.log(`🧪 Début du test ${type}...`);
    
    if (type === 'sms') {
      const { sendSMS } = await import('@/lib/utils/notification');
      const result = await sendSMS(testNumber, testMessage);
      alert(`Test SMS ${result ? 'réussi' : 'échoué'} - Voir la console pour les détails`);
      // Recharger le solde après test
      loadBalance();
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
          État actuel des services d'envoi de SMS (AfrikSMS)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <div className="flex items-center justify-between">
                  <span className="font-medium">Fournisseur:</span>
                  <Badge variant="outline">
                    {status.provider}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{status.message}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde SMS</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {loading ? (
                <div className="animate-pulse">Chargement...</div>
              ) : balance !== null ? (
                <>
                  <div className="text-2xl font-bold">{balance} crédits</div>
                  <p className="text-xs text-muted-foreground">
                    {balance > 10 ? '✅ Solde suffisant' : '⚠️ Solde faible'}
                  </p>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Solde non disponible
                </div>
              )}
            </div>
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
                disabled={status?.isMock}
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
                Tester WhatsApp (Simulation)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration AfrikSMS</CardTitle>
          <CardDescription>
            Instructions pour la configuration du service SMS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-blue-800 font-semibold">📋 Configuration requise</h3>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Compte AfrikSMS actif avec crédits</li>
                <li>Clé API et Secret API obtenus depuis votre dashboard AfrikSMS</li>
                <li>Sender ID approuvé (INFOSMS)</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200 mt-4">
              <h3 className="text-green-800 font-semibold">🚀 Passage en production</h3>
              <ul className="list-disc list-inside space-y-1 text-green-700">
                <li>Remplissez les variables d'environnement :</li>
                <pre className="bg-gray-100 p-2 rounded text-sm mt-2">
{`AFRIKSMS_API_KEY=26686715
AFRIKSMS_API_SECRET=7GDQIQPNeOnTKjj9fIqvxNsixVCqaNdV
AFRIKSMS_SENDER_ID=INFOSMS
USE_MOCK_NOTIFICATIONS=false`}
                </pre>
                <li>Testez avec de vrais numéros sénégalais (format: 221701234567)</li>
                <li>Vérifiez régulièrement votre solde de crédits</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}