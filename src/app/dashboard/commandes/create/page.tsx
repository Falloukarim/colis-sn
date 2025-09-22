'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useElegantToast } from '@/hooks/use-elegant-toast'; // ← Modifié
import { createCommande } from '@/actions/commande-actions';
import { getClients } from '@/actions/client-actions';
import { Client } from '@/types/database.types';

export default function CreateCommandePage() {
  const router = useRouter();
  const showToast = useElegantToast(); // ← Modifié
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [formData, setFormData] = useState({
    client_id: '',
    description: '',
    date_reception: new Date().toISOString().split('T')[0],
    date_livraison_prevue: ''
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { clients, error } = await getClients();
        if (error) {
          showToast.error('Erreur', error); // ← Modifié
        } else {
          setClients(clients);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        showToast.error('Erreur', 'Erreur lors du chargement des clients'); // ← Modifié
      } finally {
        setClientsLoading(false);
      }
    };

    fetchClients();
  }, [showToast]); // ← Modifié

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('client_id', formData.client_id);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('date_reception', formData.date_reception);
      if (formData.date_livraison_prevue) {
        formDataToSend.append('date_livraison_prevue', formData.date_livraison_prevue);
      }

      const result = await createCommande(formDataToSend);

      if (result.success) {
        showToast.success('Succès', 'Commande créée avec succès'); // ← Modifié
        router.push('/dashboard/commandes');
      } else {
        showToast.error('Erreur', result.error || 'Erreur lors de la création'); // ← Modifié
      }
    } catch (error) {
      console.error('Error creating commande:', error);
      showToast.error('Erreur', 'Une erreur inattendue est survenue'); // ← Modifié
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/commandes">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nouvelle commande</h1>
          <p className="text-gray-600 mt-1">
            Créer une nouvelle commande pour un client
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de la commande</CardTitle>
          <CardDescription>
            Renseignez les détails de la nouvelle commande
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => handleChange('client_id', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientsLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : clients.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Aucun client trouvé
                      </div>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.nom} - {client.telephone}
                          {client.email && ` (${client.email})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description du produit</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Décrivez le produit, la marque, la quantité, etc."
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_reception">Date de réception *</Label>
                <Input
                  id="date_reception"
                  name="date_reception"
                  type="date"
                  value={formData.date_reception}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_livraison_prevue">Date de livraison prévue</Label>
                <Input
                  id="date_livraison_prevue"
                  name="date_livraison_prevue"
                  type="date"
                  value={formData.date_livraison_prevue}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading || !formData.client_id || clientsLoading || !formData.description}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Créer la commande
              </Button>
              <Link href="/dashboard/commandes">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
