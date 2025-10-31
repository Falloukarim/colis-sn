// src/app/dashboard/clients/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Calendar,
  Edit,
  Users,
  Building,
  Loader2,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <div className="text-lg font-medium text-gray-600">Chargement du client...</div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <div className="text-red-600 text-lg font-semibold mb-2">
            {error || 'Client non trouvé'}
          </div>
          <p className="text-gray-600 mb-6">
            {error ? 'Impossible de charger les données du client' : 'Le client que vous recherchez n\'existe pas ou a été supprimé.'}
          </p>
          <Button 
            onClick={() => router.push('/dashboard/clients')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg hover:shadow-xl transition-all"
          >
            <Users className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
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
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Building className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  {client.nom}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <Badge className="bg-blue-100 text-blue-700 border-0 shadow-sm">
                    Client
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    Ajouté le {new Date(client.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Coordonnées principales */}
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200/60 rounded-2xl shadow-xl overflow-hidden">
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-blue-100/30 border-b border-gray-200/60">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Phone className="h-4 w-4 text-white" />
                </div>
                Coordonnées
              </h2>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Téléphone */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50/80 to-blue-100/30 rounded-xl border border-blue-100/50">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Téléphone</div>
                  <div className="text-lg font-semibold text-gray-900">{client.telephone}</div>
                </div>
              </div>

              {/* WhatsApp */}
              {client.whatsapp && (
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50/80 to-green-100/30 rounded-xl border border-green-100/50">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">WhatsApp</div>
                    <div className="text-lg font-semibold text-gray-900">{client.whatsapp}</div>
                  </div>
                </div>
              )}

              {/* Email */}
              {client.email && (
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50/80 to-purple-100/30 rounded-xl border border-purple-100/50">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Email</div>
                    <div className="text-lg font-semibold text-gray-900 truncate">{client.email}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations supplémentaires */}
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200/60 rounded-2xl shadow-xl overflow-hidden">
            <CardHeader className="pb-4 bg-gradient-to-r from-orange-50/50 to-orange-100/30 border-b border-gray-200/60">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                Informations
              </h2>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Adresse */}
              {client.adresse && (
                <div className="p-4 bg-gradient-to-r from-orange-50/80 to-orange-100/30 rounded-xl border border-orange-100/50">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm mt-0.5">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-500 mb-2">Adresse</div>
                      <div className="text-gray-900 leading-relaxed whitespace-pre-line">
                        {client.adresse}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Date d'ajout */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50/80 to-gray-100/30 rounded-xl border border-gray-100/50">
                <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Date d'ajout</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {new Date(client.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-6 border-t border-gray-200/60">
          <Button
            onClick={() => router.push(`/dashboard/clients/${clientId}/edit`)}
            className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all font-semibold"
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier le client
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/clients')}
            className="flex-1 h-12 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm hover:border-gray-300 hover:bg-gray-50 transition-all font-semibold"
          >
            <Users className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        </div>
      </div>
    </div>
  );
}