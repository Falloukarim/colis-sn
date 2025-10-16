'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/actions/client-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // ← Ajouté pour l'adresse
import { useElegantToast } from '@/hooks/use-elegant-toast';

export default function CreateClientPage() {
  const router = useRouter();
  const showToast = useElegantToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');

    const result = await createClient(formData);

    if (result.success) {
      showToast.success('Succès', 'Client créé avec succès');
      router.push('/dashboard/clients');
    } else {
      setError(result.error || 'Une erreur est survenue');
      showToast.error('Erreur', result.error || 'Une erreur est survenue');
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Nouveau client</h1>
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jean.dupont@email.com"
            />
          </div>
        </div>

        {/* Nouvelle section pour l'adresse */}
        <div className="space-y-2">
          <Label htmlFor="adresse">Adresse</Label>
          <Textarea
            id="adresse"
            name="adresse"
            placeholder="123 Avenue des Champs-Élysées, 75008 Paris, France"
            rows={3}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Création...' : 'Créer le client'}
          </Button>
        </div>
      </form>
    </div>
  );
}