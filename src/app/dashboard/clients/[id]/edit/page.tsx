// src/app/dashboard/clients/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MessageCircle, 
  Mail, 
  MapPin, 
  Save,
  Loader2,
  Building
} from 'lucide-react';
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
            title: '❌ Erreur',
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
          title: '❌ Erreur',
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
        title: '✅ Succès',
        description: 'Client modifié avec succès',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      router.push(`/dashboard/clients/${clientId}`);
    } else {
      setError(result.error || 'Une erreur est survenue');
      toast({
        title: '❌ Erreur',
        description: result.error || 'Une erreur est survenue',
        variant: 'destructive',
      });
    }

    setLoading(false);
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Building className="h-8 w-8 text-blue-600 animate-pulse" />
          </div>
          <div className="text-lg text-gray-600 font-medium">Chargement du client...</div>
          {error && (
            <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl max-w-md">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm hover:border-blue-300 hover:bg-blue-50/50 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Modifier le client
            </h1>
            <p className="text-gray-600 mt-1">
              Mettez à jour les informations de {client.nom}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl backdrop-blur-sm">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-red-500 text-sm">!</span>
              </div>
              {error}
            </div>
          </div>
        )}

        {/* Form */}
        <form 
          className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-200/60 space-y-8"
          action={handleSubmit}
        >
          {/* Informations de base */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Informations personnelles</h2>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Nom */}
              <div className="space-y-3">
                <Label htmlFor="nom" className="text-sm font-semibold text-gray-700">
                  Nom complet *
                </Label>
                <div className="relative">
                  <Input
                    id="nom"
                    name="nom"
                    placeholder="Jean Dupont"
                    defaultValue={client.nom}
                    required
                    className="pl-11 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white/50 backdrop-blur-sm"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="jean.dupont@email.com"
                    defaultValue={client.email || ''}
                    className="pl-11 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white/50 backdrop-blur-sm"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Coordonnées */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Coordonnées</h2>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Téléphone */}
              <div className="space-y-3">
                <Label htmlFor="telephone" className="text-sm font-semibold text-gray-700">
                  Téléphone *
                </Label>
                <div className="relative">
                  <Input
                    id="telephone"
                    name="telephone"
                    type="tel"
                    placeholder="+33 6 12 34 56 78"
                    defaultValue={client.telephone}
                    required
                    className="pl-11 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white/50 backdrop-blur-sm"
                  />
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* WhatsApp */}
              <div className="space-y-3">
                <Label htmlFor="whatsapp" className="text-sm font-semibold text-gray-700">
                  WhatsApp
                </Label>
                <div className="relative">
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    type="tel"
                    placeholder="+33 6 12 34 56 78"
                    defaultValue={client.whatsapp || ''}
                    className="pl-11 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white/50 backdrop-blur-sm"
                  />
                  <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Adresse</h2>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="adresse" className="text-sm font-semibold text-gray-700">
                Adresse complète
              </Label>
              <div className="relative">
                <Textarea
                  id="adresse"
                  name="adresse"
                  placeholder="123 Avenue des Champs-Élysées, 75008 Paris, France"
                  rows={4}
                  defaultValue={client.adresse || ''}
                  className="pl-11 pt-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white/50 backdrop-blur-sm resize-none"
                />
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/clients/${clientId}`)}
              className="flex-1 h-12 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm hover:border-gray-300 hover:bg-gray-50 transition-all font-semibold"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Modification...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}