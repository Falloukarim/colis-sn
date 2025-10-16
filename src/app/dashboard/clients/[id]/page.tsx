// src/app/dashboard/clients/[id]/page.tsx (exemple simplifié)
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MessageSquare, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getClientById } from '@/actions/client-actions';
import { Client } from '@/types/database.types';

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const clientId = params.id as string;

  useEffect(() => {
    async function fetchClient() {
      try {
        const { client: clientData, error } = await getClientById(clientId);
        if (error) {
          setError(error);
          return;
        }
        setClient(clientData);
      } catch (err) {
        setError('Erreur lors du chargement du client');
      } finally {
        setLoading(false);
      }
    }

    if (clientId) {
      fetchClient();
    }
  }, [clientId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg">{error || 'Client non trouvé'}</div>
          <Button onClick={() => router.push('/dashboard/clients')} className="mt-4">
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{client.nom}</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Téléphone</div>
                <div className="font-medium">{client.telephone}</div>
              </div>
            </div>

            {client.whatsapp && (
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-green-400" />
                <div>
                  <div className="text-sm text-gray-500">WhatsApp</div>
                  <div className="font-medium">{client.whatsapp}</div>
                </div>
              </div>
            )}

            {client.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-400" />
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-medium">{client.email}</div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {client.adresse && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Adresse</div>
                  <div className="font-medium whitespace-pre-line">{client.adresse}</div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="h-5 w-5 flex items-center justify-center">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-500">Date d'ajout</div>
                <div className="font-medium">
                  {new Date(client.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/clients/${clientId}/edit`)}
          >
            Modifier le client
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/clients')}
          >
            Retour à la liste
          </Button>
        </div>
      </div>
    </div>
  );
}