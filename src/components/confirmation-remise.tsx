// src/components/confirmation-remise.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { updateCommandeStatus } from '@/actions/commande-actions';
import { Commande, Client } from '@/types/database.types';
import { 
  User, 
  Phone, 
  Mail, 
  MessageSquare, 
  MapPin, 
  Package, 
  Calendar,
  DollarSign,
  Weight,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

interface ConfirmationRemiseProps {
  commande: Commande;
  client: Client;
  onBack: () => void;
  onSuccess: () => void;
}

export default function ConfirmationRemise({ 
  commande, 
  client, 
  onBack, 
  onSuccess 
}: ConfirmationRemiseProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleConfirmerRemise = async () => {
    setLoading(true);
    
    try {
      const result = await updateCommandeStatus(commande.id, 'remis');
      
      if (result.success) {
        toast({
          title: 'Succès',
          description: `La commande #${commande.numero_commande} a été marquée comme remise`,
        });
        onSuccess();
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Erreur lors de la mise à jour',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (statut: string) => {
    const statusConfig = {
      'en_cours': { label: 'En cours', variant: 'secondary' as const },
      'disponible': { label: 'Disponible', variant: 'default' as const },
      'remis': { label: 'Remis', variant: 'default' as const } // Changé de 'success' à 'default'
    };
    
    const config = statusConfig[statut as keyof typeof statusConfig] || statusConfig.en_cours;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Confirmation de remise</h1>
          <p className="text-gray-600">Vérifiez les informations avant de confirmer la remise</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informations client */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Informations client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{client.nom}</h3>
              <p className="text-sm text-gray-500">
                Client depuis le {new Date(client.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{client.telephone}</span>
              </div>
              
              {client.whatsapp && (
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-400" />
                  <span className="text-sm">{client.whatsapp}</span>
                </div>
              )}
              
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span className="text-sm">{client.email}</span>
                </div>
              )}
              
              {client.adresse && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-red-400 mt-0.5" />
                  <span className="text-sm whitespace-pre-line">{client.adresse}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informations commande */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              Détails de la commande
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">Commande #{commande.numero_commande}</h3>
                <p className="text-sm text-gray-500">
                  Créée le {new Date(commande.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              {getStatusBadge(commande.statut)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {commande.poids && (
                <div className="flex items-center gap-2">
                  <Weight className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Poids</div>
                    <div className="font-medium">{commande.poids} kg</div>
                  </div>
                </div>
              )}
              
              {commande.prix_kg && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Prix/kg</div>
                    <div className="font-medium">{commande.prix_kg} €</div>
                  </div>
                </div>
              )}
              
              {commande.montant_total && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="font-medium">{commande.montant_total} €</div>
                  </div>
                </div>
              )}
              
              {commande.date_reception && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Reçue le</div>
                    <div className="font-medium">
                      {new Date(commande.date_reception).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {commande.description && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Description</div>
                <p className="text-sm">{commande.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bouton de confirmation */}
      <div className="flex justify-center pt-6">
        <Button 
          onClick={handleConfirmerRemise}
          disabled={loading || commande.statut === 'remis'}
          size="lg"
          className="gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Confirmation...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5" />
              {commande.statut === 'remis' ? 'Déjà remise' : 'Confirmer la remise'}
            </>
          )}
        </Button>
      </div>

      {commande.statut === 'remis' && (
        <div className="text-center text-green-600 text-sm">
          Cette commande a déjà été remise le {commande.date_retrait ? 
            new Date(commande.date_retrait).toLocaleDateString('fr-FR') : 
            'précédemment'}
        </div>
      )}
    </div>
  );
}