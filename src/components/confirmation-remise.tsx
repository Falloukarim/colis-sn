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
  CheckCircle,
  ArrowLeft,
  ClipboardList,
  Weight,
  Clock,
  ShieldCheck,
  AlertTriangle
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
          title: '✅ Remise confirmée',
          description: `La commande #${commande.numero_commande} a été marquée comme remise au client`,
          className: 'bg-green-50 border-green-200'
        });
        onSuccess();
      } else {
        toast({
          title: '❌ Erreur',
          description: result.error || 'Erreur lors de la confirmation',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '❌ Erreur',
        description: 'Une erreur inattendue est survenue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (statut: string) => {
    const config = {
      'en_cours': { 
        label: 'En traitement', 
        variant: 'secondary' as const,
        icon: Clock,
        className: 'bg-amber-50 text-amber-700 border-amber-200'
      },
      'disponible': { 
        label: 'Prêt à récupérer', 
        variant: 'default' as const,
        icon: Package,
        className: 'bg-blue-50 text-blue-700 border-blue-200'
      },
      'remis': { 
        label: 'Commande remise', 
        variant: 'default' as const,
        icon: CheckCircle,
        className: 'bg-green-50 text-green-700 border-green-200'
      }
    };
    
    return config[statut as keyof typeof config] || config.en_cours;
  };

  const statusConfig = getStatusConfig(commande.statut);
  const StatusIcon = statusConfig.icon;

  // Calcul du solde restant si applicable
  const soldeRestant = commande.montant_total && commande.accompte 
    ? commande.montant_total - commande.accompte 
    : null;

  return (
    <div className="min-h-screen bg-gray-50/30 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* En-tête avec navigation */}
        <div className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onBack}
            className="h-10 w-10 rounded-xl border-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {commande.statut === 'remis' ? 'Commande déjà remise' : 'Finalisation de la commande'}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {commande.statut === 'remis' 
                ? 'Cette commande a déjà été remise au client'
                : 'Vérifiez les détails avant de confirmer la remise au client'
              }
            </p>
          </div>
          <div className={`
            px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5
            ${statusConfig.className}
          `}>
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </div>
        </div>

        {/* Avertissement pour commande déjà remise */}
        {commande.statut === 'remis' && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="font-semibold text-amber-800">Commande déjà remise</h3>
                  <p className="text-amber-700 text-sm mt-1">
                    Cette commande a été remise {commande.date_retrait ? 
                      `le ${new Date(commande.date_retrait).toLocaleDateString('fr-FR')}` : 
                      'précédemment'}. Aucune action n'est nécessaire.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grid principale */}
        <div className="grid gap-4">
          {/* Carte Client */}
          <Card className="border-0 shadow-sm rounded-2xl bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <span>Informations client</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{client.nom}</h3>
                  <p className="text-gray-500 text-sm">
                    Client depuis {new Date(client.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">{client.telephone}</span>
                </div>
                
                {client.whatsapp && (
                  <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">{client.whatsapp}</span>
                  </div>
                )}
                
                {client.email && (
                  <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">{client.email}</span>
                  </div>
                )}
                
                {client.adresse && (
                  <div className="flex items-start gap-3 p-2 bg-red-50 rounded-lg">
                    <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm whitespace-pre-line">{client.adresse}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Carte Détails de la Commande */}
          <Card className="border-0 shadow-sm rounded-2xl bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <ClipboardList className="h-4 w-4 text-purple-600" />
                </div>
                <span>Détails de la commande</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">Commande #{commande.numero_commande}</h3>
                  <p className="text-gray-500 text-sm">
                    Créée le {new Date(commande.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              {/* Grid des informations principales */}
              <div className="grid grid-cols-2 gap-3">
                {/* Poids */}
                {commande.poids && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Weight className="h-4 w-4 text-gray-600" />
                    <div>
                      <div className="text-xs text-gray-500">Poids</div>
                      <div className="font-medium text-sm">{commande.poids} kg</div>
                    </div>
                  </div>
                )}

                {/* Prix au kg */}
                {commande.prix_kg && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-xs text-gray-500">Prix/kg</div>
                      <div className="font-medium text-sm">{commande.prix_kg} CFA</div>
                    </div>
                  </div>
                )}

                {/* Montant total */}
                {commande.montant_total && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-xs text-gray-500">Montant total</div>
                      <div className="font-medium text-sm">{commande.montant_total} CFA</div>
                    </div>
                  </div>
                )}

                {/* Date de réception */}
                {commande.date_reception && (
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="text-xs text-gray-500">Réception</div>
                      <div className="font-medium text-sm">
                        {new Date(commande.date_reception).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                )}

                {/* Date de retrait prévue - Utilisation de date_retrait si disponible */}
                {commande.date_retrait && commande.statut !== 'remis' && (
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    <div>
                      <div className="text-xs text-gray-500">Retrait prévu</div>
                      <div className="font-medium text-sm">
                        {new Date(commande.date_retrait).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                )}

                {/* Date de remise effective */}
                {commande.date_retrait && commande.statut === 'remis' && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-xs text-gray-500">Remise effectuée</div>
                      <div className="font-medium text-sm">
                        {new Date(commande.date_retrait).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {commande.description && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-2">Description</div>
                  <p className="text-sm text-gray-700 leading-relaxed">{commande.description}</p>
                </div>
              )}

              {/* Notes - Utilisation du champ description pour les notes si besoin */}
              {commande.notes && (
                <div className="p-3 bg-blue-50 rounded-xl">
                  <div className="text-xs text-blue-600 mb-2 font-medium">Notes</div>
                  <p className="text-sm text-blue-700 leading-relaxed">{commande.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Section de confirmation */}
        <Card className="border-0 shadow-sm rounded-2xl bg-white sticky bottom-4">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              {commande.statut === 'remis' ? (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Commande déjà remise</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Cette commande a été remise {commande.date_retrait ? 
                        `le ${new Date(commande.date_retrait).toLocaleDateString('fr-FR')}` : 
                        'précédemment'}
                    </p>
                  </div>
                  <Button 
                    onClick={onBack} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Retour au scanner
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Confirmation sécurisée</span>
                  </div>                
                  
                  <Button 
                    onClick={handleConfirmerRemise}
                    disabled={loading}
                    size="lg"
                    className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Confirmation en cours...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>Confirmer la remise de la commande</span>
                      </div>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={onBack}
                    disabled={loading}
                    className="w-full rounded-xl border-gray-300"
                  >
                    Retour au scanner
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}