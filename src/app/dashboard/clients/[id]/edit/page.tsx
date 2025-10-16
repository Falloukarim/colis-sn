// src/app/dashboard/clients/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { getClientById, updateClient } from '@/actions/client-actions';
import { Client } from '@/types/database.types';

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState('');

  const clientId = params.id as string;

  useEffect(() => {
    async function fetchClient() {
      try {
        const { client: clientData, error } = await getClientById(clientId);
        if (error) {
          setError(error);
          toast({
            title: 'Erreur',
            description: error,
            variant: 'destructive',
          });
          return;
        }
        if (!clientData) {
          setError('Client non trouvé');
          return;
        }
        setClient(clientData);
      } catch (err) {
        setError('Erreur lors du chargement du client');
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données du client',
          variant: 'destructive',
        });
      }
    }

    if (clientId) {
      fetchClient();
    }
  }, [clientId, toast]);

  async function handleSubmit(formData: FormData) {
    if (!client) return;

    setLoading(true);
    setError('');

    const result = await updateClient(clientId, formData);

    if (result.success) {
      toast({
        title: 'Succès',
        description: 'Client modifié avec succès',
      });
      router.push(`/dashboard/clients/${clientId}`);
    } else {
      setError(result.error || 'Une erreur est survenue');
      toast({
        title: 'Erreur',
        description: result.error || 'Une erreur est survenue',
        variant: 'destructive',
      });
    }

    setLoading(false);
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Chargement...</div>
          {error && (
            <div className="mt-4 text-red-600">{error}</div>
          )}
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
        <h1 className="text-3xl font-bold">Modifier le client</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <form className="bg-white p-6 rounded-lg shadow space-y-6" action={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom complet *</Label>
            <Input
              id="nom"
              name="nom"
              placeholder="Jean Dupont"
              defaultValue={client.nom}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone *</Label>
            <Input
              id="telephone"
              name="telephone"
              type="tel"
              placeholder="+33 6 12 34 56 78"
              defaultValue={client.telephone}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              placeholder="+33 6 12 34 56 78"
              defaultValue={client.whatsapp || ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jean.dupont@email.com"
              defaultValue={client.email || ''}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="adresse">Adresse</Label>
          <Textarea
            id="adresse"
            name="adresse"
            placeholder="123 Avenue des Champs-Élysées, 75008 Paris, France"
            rows={3}
            defaultValue={client.adresse || ''}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/clients/${clientId}`)}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Modification...' : 'Modifier le client'}
          </Button>
        </div>
      </form>
    </div>
  );
}