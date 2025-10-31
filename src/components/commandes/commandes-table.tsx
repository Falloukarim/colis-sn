'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Eye, 
  Edit, 
  Package, 
  Copy, 
  Calendar, 
  User, 
  Scale, 
  DollarSign, 
  Hash, 
  Truck,
  ArrowUpRight,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Download,
  QrCode,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Commande } from '@/types/commande';
import { useToast } from '@/components/ui/use-toast';
import { getStatutDisplayName, getStatutColor, calculateMontantTotal } from '@/types/commande';
import { isService } from '@/lib/utils/commande';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface CommandesTableProps {
  commandes: Commande[];
}

export default function CommandesTable({ commandes }: CommandesTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const { toast } = useToast();

  // Fonction pour déterminer le type de commande
  const getCommandeType = (commande: Commande) => {
    return isService(commande.description) ? 'service' : 'produit';
  };

  // Fonction pour formater le prix selon le type
  const formatPrix = (commande: Commande) => {
    const type = getCommandeType(commande);
    if (!commande.prix_kg) return { display: 'Non défini', type: 'text' };
    
    if (type === 'service') {
      return { 
        display: `${commande.prix_kg.toLocaleString('fr-FR')} XOF`, 
        type: 'service',
        label: 'Prix fixe'
      };
    } else {
      return { 
        display: `${commande.prix_kg.toLocaleString('fr-FR')} XOF/kg`, 
        type: 'produit',
        label: 'Prix au kg'
      };
    }
  };

  // Fonction pour formater le montant selon le type
  const formatMontant = (commande: Commande) => {
    const type = getCommandeType(commande);
    const montant = calculateMontantTotal(commande);
    
    if (montant === 0) return { display: 'Non calculé', type: 'text' };
    
    return { 
      display: `${montant.toLocaleString('fr-FR')} XOF`,
      type,
      label: type === 'service' ? 'Total service' : 'Total produit'
    };
  };

  // Fonction pour formater le poids/quantité selon le type
  const formatPoidsQuantite = (commande: Commande) => {
    const type = getCommandeType(commande);
    
    if (type === 'service') {
      return {
        display: commande.quantite ? `${commande.quantite}` : '-',
        type: 'service',
        label: 'Quantité',
        icon: <Hash className="h-3 w-3 sm:h-4 sm:w-4" />
      };
    } else {
      return {
        display: commande.poids ? `${commande.poids} kg` : '-',
        type: 'produit',
        label: 'Poids',
        icon: <Scale className="h-3 w-3 sm:h-4 sm:w-4" />
      };
    }
  };

  // Fonction pour obtenir l'icône de statut
  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'remis':
        return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />;
      case 'disponible':
        return <Package className="h-3 w-3 sm:h-4 sm:w-4" />;
      case 'en_cours':
        return <Clock className="h-3 w-3 sm:h-4 sm:w-4" />;
      default:
        return <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: '✅ Copié',
        description: 'Numéro de commande copié dans le presse-papier',
        duration: 2000,
      });
    } catch {
      toast({
        title: '❌ Erreur',
        description: 'Impossible de copier le numéro de commande',
        variant: 'destructive',
        duration: 2000,
      });
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  if (commandes.length === 0) {
    return (
      <div className="text-center py-8 sm:py-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center">
            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Aucune commande trouvée</h3>
          <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed">
            Commencez par créer votre première commande pour gérer votre activité professionnelle.
          </p>
          <Link href="/dashboard/commandes/create">
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/25 text-sm sm:text-base">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Créer une commande
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 p-2 sm:p-4 md:p-6">
      {commandes.map((commande) => {
        const commandeType = getCommandeType(commande);
        const prixInfo = formatPrix(commande);
        const montantInfo = formatMontant(commande);
        const poidsQuantiteInfo = formatPoidsQuantite(commande);
        const statutIcon = getStatutIcon(commande.statut);
        const isExpanded = expandedCard === commande.id;

        return (
          <Card 
            key={commande.id} 
            className="group hover:shadow-lg sm:hover:shadow-2xl transition-all duration-300 border border-gray-200/60 hover:border-purple-200/80 overflow-hidden backdrop-blur-sm bg-white/95"
          >
            <CardHeader className="pb-3 sm:pb-4 border-b border-gray-100/60">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                {/* Header principal - Version mobile compacte */}
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0 w-full">
                  <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0 ${
                    commandeType === 'service' 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                      : 'bg-gradient-to-br from-purple-500 to-purple-600'
                  }`}>
                    {commandeType === 'service' ? (
                      <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    ) : (
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 flex-wrap">
                        <span className={`font-mono px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-xs sm:text-sm ${
                          commandeType === 'service' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {commande.numero_commande}
                        </span>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 sm:h-7 sm:w-7 rounded-md sm:rounded-lg hover:bg-gray-100 transition-colors"
                          onClick={() => copyToClipboard(commande.numero_commande || '')}
                        >
                          <Copy className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                        </Button>

                        <Badge 
                          variant="outline" 
                          className="text-xs px-2 py-0.5 sm:px-2 sm:py-1"
                        >
                          {commandeType === 'service' ? '📦' : '⚖️'}
                          <span className="hidden xs:inline ml-1">{commandeType === 'service' ? 'Service' : 'Produit'}</span>
                        </Badge>
                      </CardTitle>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500">
                        <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span>Créée le {formatDate(commande.created_at)}</span>
                      </div>

                      {/* Bouton expand/collapse pour mobile */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="sm:hidden h-6 w-6 rounded-md"
                        onClick={() => toggleCardExpansion(commande.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Statut et menu - Version desktop */}
                <div className="hidden sm:flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-normal mt-3 sm:mt-0">
                  <Badge 
                    className={`${getStatutColor(commande.statut as any)} px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl font-semibold flex items-center gap-2 min-w-[100px] sm:min-w-[120px] justify-center text-xs sm:text-sm`}
                  >
                    {statutIcon}
                    <span className="hidden xs:inline">{getStatutDisplayName(commande.statut as any)}</span>
                    <span className="xs:hidden">
                      {commande.statut === 'remis' ? 'Remis' :
                       commande.statut === 'disponible' ? 'Dispo' :
                       'En cours'}
                    </span>
                  </Badge>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg">
                        <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/commandes/${commande.id}`} className="cursor-pointer">
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/commandes/${commande.id}/edit`} className="cursor-pointer">
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/qr/public/${commande.id}`} className="cursor-pointer">
                          <QrCode className="h-4 w-4 mr-2" />
                          QR Code
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyToClipboard(commande.numero_commande || '')}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copier le numéro
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Statut pour mobile */}
                <div className="sm:hidden flex items-center justify-between w-full mt-2">
                  <Badge 
                    className={`${getStatutColor(commande.statut as any)} px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 justify-center text-xs flex-1 mr-2`}
                  >
                    {statutIcon}
                    {getStatutDisplayName(commande.statut as any)}
                  </Badge>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/commandes/${commande.id}`} className="cursor-pointer">
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/commandes/${commande.id}/edit`} className="cursor-pointer">
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/qr/public/${commande.id}`} className="cursor-pointer">
                          <QrCode className="h-4 w-4 mr-2" />
                          QR Code
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyToClipboard(commande.numero_commande || '')}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copier le numéro
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            
            {/* Contenu principal - Gestion expand/collapse sur mobile */}
            <CardContent className={cn(
              "space-y-4 sm:space-y-5 pt-4 sm:pt-5",
              "sm:block",
              isExpanded ? "block" : "hidden"
            )}>
              {/* Informations client */}
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-blue-100/30 rounded-xl sm:rounded-2xl border border-blue-200/50">
                <div className="p-2 bg-blue-100 rounded-lg sm:rounded-xl flex-shrink-0">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-blue-900 truncate">
                    {(commande as any).client_nom || 'Client inconnu'}
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">Client assigné</p>
                </div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-pulse flex-shrink-0"></div>
              </div>

              {/* Description */}
              <div className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100/30 rounded-xl sm:rounded-2xl border border-gray-200/50">
                <p className="text-sm text-gray-700 font-medium leading-relaxed line-clamp-2">
                  {commande.description || 'Aucune description fournie'}
                </p>
                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                  <span>📝</span>
                  Description
                </p>
              </div>

              {/* Grille d'informations responsive */}
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Poids/Quantité */}
                <div className={`flex items-center gap-3 p-3 rounded-xl sm:rounded-2xl border transition-all duration-200 ${
                  poidsQuantiteInfo.type === 'service' 
                    ? 'bg-blue-50/50 border-blue-200/50 hover:border-blue-300/50' 
                    : 'bg-gray-50/50 border-gray-200/50 hover:border-gray-300/50'
                }`}>
                  <div className={`p-2 rounded-lg sm:rounded-xl flex-shrink-0 ${
                    poidsQuantiteInfo.type === 'service' 
                      ? 'bg-blue-100' 
                      : 'bg-gray-100'
                  }`}>
                    {poidsQuantiteInfo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base sm:text-lg font-bold text-gray-900 truncate">{poidsQuantiteInfo.display}</p>
                    <p className={`text-xs font-medium mt-0.5 ${
                      poidsQuantiteInfo.type === 'service' 
                        ? 'text-blue-600' 
                        : 'text-gray-600'
                    }`}>
                      {poidsQuantiteInfo.label}
                    </p>
                  </div>
                </div>

                {/* Prix */}
                <div className={`flex items-center gap-3 p-3 rounded-xl sm:rounded-2xl border transition-all duration-200 ${
                  prixInfo.type === 'service' 
                    ? 'bg-green-50/50 border-green-200/50 hover:border-green-300/50' 
                    : prixInfo.type === 'produit' 
                    ? 'bg-orange-50/50 border-orange-200/50 hover:border-orange-300/50' 
                    : 'bg-gray-50/50 border-gray-200/50 hover:border-gray-300/50'
                }`}>
                  <div className={`p-2 rounded-lg sm:rounded-xl flex-shrink-0 ${
                    prixInfo.type === 'service' 
                      ? 'bg-green-100' 
                      : prixInfo.type === 'produit' 
                      ? 'bg-orange-100' 
                      : 'bg-gray-100'
                  }`}>
                    <DollarSign className={`h-4 w-4 sm:h-5 sm:w-5 ${
                      prixInfo.type === 'service' 
                        ? 'text-green-600' 
                        : prixInfo.type === 'produit' 
                        ? 'text-orange-600' 
                        : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base sm:text-lg font-bold text-gray-900 truncate">{prixInfo.display}</p>
                    <p className={`text-xs font-medium mt-0.5 ${
                      prixInfo.type === 'service' 
                        ? 'text-green-600' 
                        : prixInfo.type === 'produit' 
                        ? 'text-orange-600' 
                        : 'text-gray-600'
                    }`}>
                      {prixInfo.type === 'service' ? 'Prix fixe' : 
                       prixInfo.type === 'produit' ? 'Prix au kg' : 'Prix'}
                    </p>
                  </div>
                </div>

                {/* Total */}
                <div className={`flex items-center gap-3 p-3 rounded-xl sm:rounded-2xl border transition-all duration-200 ${
                  montantInfo.type === 'service' 
                    ? 'bg-purple-50/50 border-purple-200/50 hover:border-purple-300/50' 
                    : montantInfo.type === 'produit' 
                    ? 'bg-indigo-50/50 border-indigo-200/50 hover:border-indigo-300/50' 
                    : 'bg-gray-50/50 border-gray-200/50 hover:border-gray-300/50'
                }`}>
                  <div className={`p-2 rounded-lg sm:rounded-xl flex-shrink-0 ${
                    montantInfo.type === 'service' 
                      ? 'bg-purple-100' 
                      : montantInfo.type === 'produit' 
                      ? 'bg-indigo-100' 
                      : 'bg-gray-100'
                  }`}>
                    <DollarSign className={`h-4 w-4 sm:h-5 sm:w-5 ${
                      montantInfo.type === 'service' 
                        ? 'text-purple-600' 
                        : montantInfo.type === 'produit' 
                        ? 'text-indigo-600' 
                        : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base sm:text-lg font-bold text-gray-900 truncate">{montantInfo.display}</p>
                    <p className={`text-xs font-medium mt-0.5 ${
                      montantInfo.type === 'service' 
                        ? 'text-purple-600' 
                        : montantInfo.type === 'produit' 
                        ? 'text-indigo-600' 
                        : 'text-gray-600'
                    }`}>
                      {montantInfo.label}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dates - Version responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-orange-100/30 rounded-xl sm:rounded-2xl border border-orange-200/50">
                  <div className="p-2 bg-orange-100 rounded-lg sm:rounded-xl flex-shrink-0">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-orange-900">{formatDate(commande.date_reception)}</p>
                    <p className="text-xs text-orange-600 mt-0.5">Réception</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-indigo-50 to-indigo-100/30 rounded-xl sm:rounded-2xl border border-indigo-200/50">
                  <div className="p-2 bg-indigo-100 rounded-lg sm:rounded-xl flex-shrink-0">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-indigo-900">{formatDate(commande.date_livraison_prevue)}</p>
                    <p className="text-xs text-indigo-600 mt-0.5">Livraison</p>
                  </div>
                </div>
              </div>

              {/* Actions principales - Version responsive */}
              <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-100/60">
                <Link href={`/dashboard/commandes/${commande.id}`} className="flex-1">
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 h-9 sm:h-11 rounded-lg sm:rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-200 font-medium text-xs sm:text-sm"
                    disabled={loadingId === commande.id}
                  >
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    Détails
                    <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 ml-auto" />
                  </Button>
                </Link>
                
                <Link href={`/dashboard/commandes/${commande.id}/edit`} className="flex-1">
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 h-9 sm:h-11 rounded-lg sm:rounded-xl hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all duration-200 font-medium text-xs sm:text-sm"
                    disabled={loadingId === commande.id}
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    Modifier
                    <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 ml-auto" />
                  </Button>
                </Link>

                <Link href={`/qr/public/${commande.id}`} className="flex-1">
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 h-9 sm:h-11 rounded-lg sm:rounded-xl hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all duration-200 font-medium text-xs sm:text-sm"
                  >
                    <QrCode className="h-3 w-3 sm:h-4 sm:w-4" />
                    QR Code
                    <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 ml-auto" />
                  </Button>
                </Link>
              </div>
            </CardContent>

            {/* Bouton expand pour mobile quand collapsed */}
            {!isExpanded && (
              <div className="sm:hidden p-3 border-t border-gray-100/60">
                <Button
                  variant="ghost"
                  className="w-full gap-2 text-xs"
                  onClick={() => toggleCardExpansion(commande.id)}
                >
                  <ChevronDown className="h-3 w-3" />
                  Voir plus de détails
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// Composant de chargement responsive
export function CommandesTableSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4 p-2 sm:p-4 md:p-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="border-gray-200/60 backdrop-blur-sm bg-white/95">
          <CardHeader className="pb-3 sm:pb-4 border-b border-gray-100/60">
            <div className="flex justify-between items-start">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl" />
                  <div className="space-y-1.5 sm:space-y-2">
                    <Skeleton className="h-5 sm:h-6 w-24 sm:w-32 rounded-lg" />
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-24 rounded" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-6 sm:h-8 w-16 sm:w-24 rounded-lg sm:rounded-xl" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-5 pt-3 sm:pt-5">
            <Skeleton className="h-12 sm:h-16 w-full rounded-xl sm:rounded-2xl" />
            <Skeleton className="h-12 sm:h-16 w-full rounded-xl sm:rounded-2xl" />
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Skeleton className="h-16 sm:h-20 rounded-xl sm:rounded-2xl" />
              <Skeleton className="h-16 sm:h-20 rounded-xl sm:rounded-2xl" />
              <Skeleton className="h-16 sm:h-20 rounded-xl sm:rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Skeleton className="h-12 sm:h-16 rounded-xl sm:rounded-2xl" />
              <Skeleton className="h-12 sm:h-16 rounded-xl sm:rounded-2xl" />
            </div>
            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
              <Skeleton className="h-9 sm:h-11 flex-1 rounded-lg sm:rounded-xl" />
              <Skeleton className="h-9 sm:h-11 flex-1 rounded-lg sm:rounded-xl" />
              <Skeleton className="h-9 sm:h-11 flex-1 rounded-lg sm:rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}