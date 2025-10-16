// commandes-table.tsx (version améliorée)
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Edit, Package, Copy, Calendar, User, Scale, DollarSign, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Commande } from '@/types/commande';
import { useToast } from '@/components/ui/use-toast';
import { getStatutDisplayName, getStatutColor, calculateMontantTotal } from '@/types/commande';

interface CommandesTableProps {
  commandes: Commande[];
}

export default function CommandesTable({ commandes }: CommandesTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: '✅ Copié',
        description: 'Numéro de commande copié dans le presse-papier',
      });
    } catch {
      toast({
        title: '❌ Erreur',
        description: 'Impossible de copier le numéro de commande',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (commandes.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune commande trouvée</h3>
          <p className="text-gray-500 mb-6">
            Commencez par créer votre première commande pour vos clients.
          </p>
          <Link href="/dashboard/commandes/create">
            <Button className="bg-gradient-to-r from-purple-600 to-purple-700">
              Créer une commande
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {commandes.map((commande) => (
        <Card key={commande.id} className="group hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-100 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                  <Hash className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <span className="font-mono bg-purple-50 px-2 py-1 rounded text-purple-700">
                      {commande.numero_commande}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(commande.numero_commande || '')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Créée le {formatDate(commande.created_at)}
                  </p>
                </div>
              </div>
              
              <Badge 
                className={`${getStatutColor(commande.statut as any)} px-3 py-1 rounded-full font-medium`}
              >
                {getStatutDisplayName(commande.statut as any)}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Informations client */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-md">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {(commande as any).client_nom || 'Client inconnu'}
                </p>
                <p className="text-xs text-blue-600">Client</p>
              </div>
            </div>

            {/* Grille d'informations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Poids */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-gray-100 rounded-md">
                  <Scale className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{commande.poids || '-'} kg</p>
                  <p className="text-xs text-gray-600">Poids</p>
                </div>
              </div>

              {/* Prix au kg */}
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-md">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{commande.prix_kg ? `${commande.prix_kg} XOF/kg` : '-'}</p>
                  <p className="text-xs text-green-600">Prix au kg</p>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="p-2 bg-purple-100 rounded-md">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {commande.poids && commande.prix_kg 
                      ? `${calculateMontantTotal(commande)} XOF` 
                      : '-'}
                  </p>
                  <p className="text-xs text-purple-600">Montant total</p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <div className="p-2 bg-orange-100 rounded-md">
                  <Calendar className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{formatDate(commande.date_reception)}</p>
                  <p className="text-xs text-orange-600">Date réception</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                <div className="p-2 bg-indigo-100 rounded-md">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{formatDate(commande.date_livraison_prevue)}</p>
                  <p className="text-xs text-indigo-600">Livraison prévue</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <Link href={`/dashboard/commandes/${commande.id}`} className="flex-1">
                <Button 
                  variant="outline" 
                  className="w-full gap-2 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  disabled={loadingId === commande.id}
                >
                  <Eye className="h-4 w-4" />
                  Détails
                </Button>
              </Link>
              
              <Link href={`/dashboard/commandes/${commande.id}/edit`} className="flex-1">
                <Button 
                  variant="outline" 
                  className="w-full gap-2 hover:bg-green-50 hover:text-green-600 transition-colors"
                  disabled={loadingId === commande.id}
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Composant de chargement
export function CommandesTableSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="border-gray-100">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}