'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Scale, 
  DollarSign, 
  Calendar,
  User,
  FileText,
  CheckCircle,
  Package,
  Truck,
  Check,
  Hash,
  Star,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { getCommandeById, updateCommandeStatus } from '@/actions/commande-actions';
import { Commande, CommandeStatut } from '@/types/commande';
import { 
  isService, 
  getCommandeSteps,
  calculateMontantTotal,
  getStatutConfig 
} from '@/lib/utils/commande';

interface EditCommandePageProps {
  params: Promise<{ id: string }>;
}

interface FormData {
  poids: string; // Uniquement pour les produits (non-services)
  statut: CommandeStatut;
}

const STATUT_STEPS: { value: CommandeStatut; label: string; icon: React.ComponentType; description: string }[] = [
  { value: 'en_cours', label: 'En Cours', icon: Package, description: 'Commande en traitement' },
  { value: 'disponible', label: 'Disponible', icon: CheckCircle, description: 'Prête à être remise' },
  { value: 'remis', label: 'Remis', icon: Truck, description: 'Commande livrée' }
];

export default function EditCommandePage({ params: resolvedParams }: EditCommandePageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [commande, setCommande] = useState<Commande | null>(null);
  const [commandeId, setCommandeId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    poids: '',
    statut: 'en_cours'
  });
  const [isClient, setIsClient] = useState(false);
  const [activeSection, setActiveSection] = useState<'details' | 'statut'>('details');

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Détection ULTRA SIMPLIFIÉE du type de commande
  const isServiceCommande = useMemo(() => {
    if (!commande) return false;
    
    // RÈGLE SIMPLE : Si la description contient des mots-clés de service, c'est un service
    // Sinon, c'est un produit
    return isService(commande.description);
  }, [commande]);

  // Vérifier si la commande a déjà un poids défini (uniquement pour les produits non-services)
  const hasExistingPoids = useMemo(() => {
    if (!commande || isServiceCommande) return false;
    return commande.poids !== null && commande.poids !== undefined && commande.poids > 0;
  }, [commande, isServiceCommande]);

  // Vérifier si le prix est défini
  const hasExistingPrix = useMemo(() => {
    return commande?.prix_kg !== null && commande?.prix_kg !== undefined;
  }, [commande]);

  // Vérifier si la quantité est définie (pour les services)
  const hasExistingQuantite = useMemo(() => {
    return commande?.quantite !== null && commande?.quantite !== undefined;
  }, [commande]);

  // Vérifier si toutes les données sont complètes
  const hasCompleteData = useMemo(() => {
    if (!commande) return false;
    
    if (isServiceCommande) {
      // Pour les services: prix_kg et quantite doivent être définis
      return hasExistingPrix && hasExistingQuantite;
    } else {
      // Pour les produits: prix_kg et poids doivent être définis
      return hasExistingPrix && hasExistingPoids;
    }
  }, [commande, isServiceCommande, hasExistingPrix, hasExistingQuantite, hasExistingPoids]);

  useEffect(() => {
    const fetchData = async () => {
      const { id } = await resolvedParams;
      setCommandeId(id);

      try {
        // Charger la commande
        const { commande, error } = await getCommandeById(id);
        if (error || !commande) {
          toast.error('Erreur', { description: error || 'Commande non trouvée' });
          router.push('/dashboard/commandes');
        } else {
          setCommande(commande);

          // Pour les produits non-services, initialiser le poids s'il n'est pas déjà défini
          const isServiceByDescription = isService(commande.description);
          const poidsValue = !isServiceByDescription && !commande.poids 
            ? '' 
            : commande.poids?.toString() || '';
          
          setFormData({
            poids: poidsValue,
            statut: commande.statut as CommandeStatut
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erreur', { description: 'Erreur lors du chargement des données' });
      }
    };

    fetchData();
  }, [resolvedParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandeId || !commande) return;
    setLoading(true);

    try {
      // Validation adaptée selon le type
      const validation = validateCommandeUpdateForEdit(
        commande,
        formData.statut,
        isServiceCommande ? undefined : formData.poids, // Uniquement le poids pour les produits non-services
        isServiceCommande,
        hasCompleteData,
        hasExistingPoids
      );

      if (!validation.isValid) {
        validation.errors.forEach(error => {
          toast.error('Erreur', { description: error });
        });
        setLoading(false);
        return;
      }

      let quantiteValue: number | undefined;
      let poidsValue: number | undefined;

      // Pour les services, utiliser la quantité existante ou 1 par défaut
      if (isServiceCommande) {
        quantiteValue = commande.quantite || 1; // Par défaut 1 pour les services
      } else {
        // Pour les produits non-services, utiliser le nouveau poids ou l'existant
        if (formData.poids && !hasExistingPoids) {
          poidsValue = parseFloat(formData.poids);
        } else if (hasExistingPoids) {
          poidsValue = commande.poids || undefined;
        }
      }

      // Utiliser le prix défini à la création (avec gestion de null/undefined)
      // Si pas de prix défini, on ne peut pas mettre à jour vers "disponible"
      const prixKgValue = commande.prix_kg !== null ? commande.prix_kg : undefined;

      const result = await updateCommandeStatus(
        commandeId,
        formData.statut,
        isServiceCommande ? quantiteValue : poidsValue,
        prixKgValue
      );

      if (result.success) {
        toast.success('Succès', { 
          description: 'Commande mise à jour avec succès',
          icon: <Check className="h-4 w-4" />
        });
        router.push(`/dashboard/commandes/${commandeId}`);
      } else {
        toast.error('Erreur', { 
          description: result.error || 'Erreur lors de la mise à jour'
        });
      }
    } catch (error) {
      console.error('Error updating commande:', error);
      toast.error('Erreur', { 
        description: 'Une erreur inattendue est survenue'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatutChange = (newStatut: CommandeStatut) => {
    // Empêcher le statut "remis" depuis l'interface
    if (newStatut === 'remis') {
      toast.error('Action non autorisée', {
        description: 'Le statut "Remis" ne peut être défini que via le scan QR code'
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      statut: newStatut
    }));
  };

  // Calcul du montant total avec gestion des valeurs null/undefined
  const montantTotal = useMemo(() => {
    if (!commande) return 0;

    const prixKg = commande.prix_kg !== null ? commande.prix_kg : 0;
    
    if (isServiceCommande) {
      const quantite = commande.quantite || 1; // Par défaut 1 pour les services
      return calculateMontantTotal({
        ...commande,
        quantite,
        prix_kg: prixKg,
      });
    } else {
      const poids = formData.poids ? parseFloat(formData.poids) : (commande.poids || 0);
      return calculateMontantTotal({
        ...commande,
        poids,
        prix_kg: prixKg,
      });
    }
  }, [commande, formData.poids, isServiceCommande]);

  const { progress, currentIndex } = getCommandeSteps(formData.statut);
  const statutConfig = getStatutConfig(formData.statut);

  // Déterminer si le poids est requis pour le statut "disponible" (uniquement pour les produits non-services)
  const isPoidsRequired = formData.statut === 'disponible' && !isServiceCommande && !hasExistingPoids;

  // Déterminer si le prix est requis pour le statut "disponible"
  const isPrixRequired = formData.statut === 'disponible' && !hasExistingPrix;

  if (!commande || !isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de la commande...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header fixe pour mobile */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-200 lg:relative lg:bg-transparent lg:backdrop-blur-none lg:border-none">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-3 lg:py-8">
          <div className="flex items-center gap-3 lg:gap-4">
            <Link href={`/dashboard/commandes/${commandeId}`}>
              <Button variant="outline" size="icon" className="rounded-full h-10 w-10 lg:h-12 lg:w-12">
                <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                Modifier la Commande
              </h1>
              <p className="text-gray-600 text-sm lg:text-base truncate">
                #{commande.numero_commande}
                {isServiceCommande && (
                  <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                    Service
                  </Badge>
                )}
                {!isServiceCommande && (
                  <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
                    Produit
                  </Badge>
                )}
                {hasCompleteData && (
                  <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
                    Données complètes
                  </Badge>
                )}
              </p>
            </div>
            <Badge variant="secondary" className="hidden lg:flex px-3 py-1 text-sm">
              {(commande as any).clients?.nom || 'Client inconnu'}
            </Badge>
          </div>

          {/* Barre de progression */}
          <div className="mt-3 lg:mt-6">
            <div className="flex justify-between items-center text-xs lg:text-sm text-gray-600 mb-2">
              <span>Progression</span>
              <span>{currentIndex + 1}/{STATUT_STEPS.length}</span>
            </div>
            <Progress value={progress} className="h-1 lg:h-2" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 pb-8">
        {/* Navigation mobile par sections */}
        <div className="lg:hidden mb-4">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveSection('details')}
              className={`flex-1 py-3 text-center font-medium text-sm ${
                activeSection === 'details' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500'
              }`}
            >
              📊 Détails
            </button>
            <button
              onClick={() => setActiveSection('statut')}
              className={`flex-1 py-3 text-center font-medium text-sm ${
                activeSection === 'statut' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500'
              }`}
            >
              📋 Statut
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:gap-8 lg:grid-cols-3">
          {/* Section Édition - Principale sur mobile */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            {/* Section Détails - Visible sur mobile selon la navigation */}
            <Card className={`border-0 shadow-lg lg:shadow-xl ${activeSection !== 'details' ? 'hidden lg:block' : ''}`}>
              <CardHeader className="pb-3 lg:pb-4">
                <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                  {isServiceCommande ? (
                    <Hash className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Scale className="h-5 w-5 text-blue-600" />
                  )}
                  Informations {isServiceCommande ? 'du Service' : 'du Produit'}
                  {isServiceCommande && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Service
                    </Badge>
                  )}
                  {!isServiceCommande && (
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Produit
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {hasCompleteData 
                    ? 'Toutes les données sont complètes. Vous pouvez modifier le statut directement.'
                    : isServiceCommande
                      ? 'Service - Les informations sont définies à la création'
                      : 'Complétez le poids pour marquer comme disponible'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 lg:space-y-6">
                  
                  {/* Alert pour données manquantes */}
                  {!hasCompleteData && (
                    <Alert className="bg-amber-50 border-amber-200">
                      <Info className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        <strong>Informations manquantes</strong> - Cette commande n'a pas de prix défini. 
                        {isServiceCommande 
                          ? ' Les services nécessitent un prix et une quantité.' 
                          : ' Les produits nécessitent un prix et un poids.'
                        }
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Alert pour données complètes */}
                  {hasCompleteData && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>Données complètes</strong> - Toutes les informations sont renseignées. 
                        Vous pouvez modifier le statut directement.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Saisie du poids uniquement pour les produits non-services sans poids existant */}
                  {!isServiceCommande && !hasExistingPoids && (
                    <div className="space-y-2">
                      <Label htmlFor="poids" className="flex items-center gap-2 text-blue-800 text-sm lg:text-base">
                        <Scale className="h-4 w-4" />
                        Poids (kg)
                        {isPoidsRequired && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-700 text-xs">
                            Obligatoire
                          </Badge>
                        )}
                      </Label>
                      <Input
                        id="poids"
                        name="poids"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="5.00"
                        value={formData.poids}
                        onChange={handleInputChange}
                        className="rounded-lg text-lg font-medium h-12 lg:h-14"
                        required={isPoidsRequired}
                      />
                      {isPoidsRequired && !formData.poids && (
                        <p className="text-sm text-amber-600">
                          ⚠️ Le poids est obligatoire pour marquer comme disponible
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        Ex: 5.25 kg, 10.50 kg, etc.
                      </p>
                    </div>
                  )}

                  {/* Affichage des données existantes */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <Label className="text-green-800 font-semibold text-sm mb-3 block">
                      📋 Informations définies à la création
                    </Label>
                    <div className="space-y-2 text-sm">
                      {/* Prix */}
                      {hasExistingPrix ? (
                        <div className="flex justify-between items-center">
                          <span className="text-green-700">
                            {isServiceCommande ? 'Prix unitaire:' : 'Prix au kg:'}
                          </span>
                          <span className="font-semibold bg-white px-2 py-1 rounded">
                            {commande.prix_kg} XOF
                            {isServiceCommande ? ' (fixe)' : '/kg'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="text-amber-700">Prix:</span>
                          <span className="font-semibold bg-amber-100 px-2 py-1 rounded text-amber-800">
                            Non défini
                          </span>
                        </div>
                      )}

                      {/* Quantité pour les services */}
                      {isServiceCommande && (
                        <div className="flex justify-between items-center">
                          <span className="text-green-700">Quantité:</span>
                          <span className="font-semibold bg-white px-2 py-1 rounded">
                            {hasExistingQuantite ? commande.quantite : '1 (par défaut)'}
                          </span>
                        </div>
                      )}

                      {/* Poids pour les produits non-services (s'il existe déjà) */}
                      {!isServiceCommande && hasExistingPoids && (
                        <div className="flex justify-between items-center">
                          <span className="text-green-700">Poids:</span>
                          <span className="font-semibold bg-white px-2 py-1 rounded">
                            {commande.poids} kg
                          </span>
                        </div>
                      )}

                      {/* Montant total calculé */}
                      {commande.montant_total !== undefined && commande.montant_total !== null && (
                        <div className="flex justify-between items-center border-t border-green-200 pt-2 mt-2">
                          <span className="text-green-800 font-semibold">Total:</span>
                          <span className="font-bold text-green-800 bg-white px-2 py-1 rounded">
                            {commande.montant_total.toLocaleString('fr-FR')} XOF
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      ✅ Ces données ont été définies lors de la création de la commande
                    </p>
                  </div>

                  {/* Calcul du montant total */}
                  {hasExistingPrix && (
                    <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white shadow-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm opacity-90">Montant total estimé</div>
                          <div className="text-2xl lg:text-3xl font-bold">{montantTotal.toLocaleString('fr-FR')} XOF</div>
                        </div>
                        <div className="text-right text-xs lg:text-sm opacity-90">
                          {isServiceCommande ? (
                            <div className="space-y-1">
                              <div>
                                {hasExistingQuantite ? commande.quantite : 1} × 
                                {commande.prix_kg} XOF
                              </div>
                              <div className="text-xs">Quantité × Prix unitaire</div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div>
                                {(formData.poids ? parseFloat(formData.poids) : (commande.poids || 0))} kg × 
                                {commande.prix_kg} XOF/kg
                              </div>
                              <div className="text-xs">Poids × Prix au kg</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className={`border-0 shadow-lg lg:shadow-xl ${activeSection !== 'statut' ? 'hidden lg:block' : ''}`}>
              <CardHeader className="pb-3 lg:pb-4">
                <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Statut de la Commande
                </CardTitle>
                <CardDescription>
                  {hasCompleteData 
                    ? 'Toutes les données sont complètes. Vous pouvez modifier le statut.'
                    : isServiceCommande
                      ? 'Service - Modifiez le statut directement'
                      : 'Complétez le poids pour marquer comme disponible'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Boutons de statut */}
                  <div className="flex flex-col gap-2 lg:flex-row lg:gap-3 lg:flex-wrap">
                    {STATUT_STEPS.map((step) => {
                      const StepIcon = step.icon;
                      const isActive = formData.statut === step.value;
                      const isRemis = step.value === 'remis';
                      
                      // Validation : pour "disponible", le poids est requis uniquement pour les produits non-services sans poids existant
                      let isDisabled = false;
                      if (step.value === 'disponible' && !hasCompleteData) {
                        if (!isServiceCommande && !hasExistingPoids && !formData.poids) {
                          isDisabled = true;
                        }
                      }
                      
                      return (
                        <Button
                          key={step.value}
                          type="button"
                          variant={isActive ? "default" : "outline"}
                          onClick={() => !isDisabled && handleStatutChange(step.value)}
                          disabled={isDisabled || isRemis}
                          className={`justify-start lg:flex-1 lg:min-w-[140px] h-12 lg:h-auto lg:py-4 px-3 rounded-xl transition-all duration-200 ${
                            isActive 
                              ? 'shadow-lg bg-green-600 hover:bg-green-700' 
                              : isRemis
                              ? 'opacity-50 cursor-not-allowed bg-gray-100'
                              : isDisabled
                              ? 'opacity-50 cursor-not-allowed bg-gray-100'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 lg:gap-2">
                            <StepIcon />
                            <span className="text-sm font-medium">
                              {step.label}
                              {isRemis && ' (Scan QR)'}
                              {isDisabled && ' (Poids manquant)'}
                            </span>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                  
                  <div className="text-center space-y-2">
                    <Badge className={`px-3 py-1 text-sm ${statutConfig.color}`}>
                      {statutConfig.icon} {statutConfig.label}
                    </Badge>
                    
                    {!hasCompleteData && formData.statut === 'en_cours' && !isServiceCommande && (
                      <Alert className="bg-amber-50 border-amber-200">
                        <Info className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                          <strong>Poids manquant</strong> - Complétez le poids pour pouvoir marquer la commande comme disponible.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {hasCompleteData && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          <strong>Prêt à être marqué comme disponible</strong> - Toutes les données sont complètes.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {formData.statut === 'remis' && (
                      <Alert className="bg-blue-50 border-blue-200">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          Ce statut ne peut être défini que via le scan QR code
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 pt-4 sticky bottom-4 bg-white/80 backdrop-blur-lg p-3 rounded-xl lg:relative lg:bg-transparent lg:backdrop-blur-none lg:p-0">
              <Button
                type="submit"
                disabled={loading}
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg py-3 lg:py-4 text-lg rounded-xl order-2 sm:order-1"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Save className="h-5 w-5 mr-2" />
                )}
                Enregistrer les modifications
              </Button>
              
              <Link href={`/dashboard/commandes/${commandeId}`} className="order-1 sm:order-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full sm:w-auto rounded-xl py-3 lg:py-4 text-lg border-2"
                  size="lg"
                >
                  Annuler
                </Button>
              </Link>
            </div>
          </div>

          {/* Section Informations */}
          <div className="lg:space-y-6">
            <Card className="border-0 shadow-lg lg:shadow-xl">
              <CardHeader className="pb-3 lg:pb-4">
                <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                  <FileText className="h-5 w-5 text-green-600" />
                  Détails de la Commande
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 lg:space-y-6">
                {/* Carte Client */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl p-3 lg:p-4">
                  <div className="flex items-center gap-3 mb-2 lg:mb-3">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm lg:text-base">
                        {(commande as any).clients?.nom || 'Client inconnu'}
                      </div>
                      <div className="text-xs lg:text-sm text-gray-600">Client</div>
                    </div>
                  </div>
                  {(commande as any).clients?.telephone && (
                    <div className="text-xs lg:text-sm text-gray-600 flex items-center gap-1">
                      📞 {(commande as any).clients.telephone}
                    </div>
                  )}
                </div>

                {/* Informations générales */}
                <div className="space-y-3 lg:space-y-4">
                  <div>
                    <Label className="text-gray-700 flex items-center gap-2 mb-2 text-sm lg:text-base">
                      <FileText className="h-4 w-4" />
                      Description
                    </Label>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-800">
                      {commande.description || 'Aucune description fournie'}
                      {isServiceCommande && (
                        <div className="mt-2 flex items-center gap-2 text-blue-600 text-xs">
                          <Hash className="h-3 w-3" />
                          <span>Commande de service</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 lg:gap-4">
                    <div>
                      <Label className="text-gray-700 text-xs lg:text-sm mb-1 block">Réception</Label>
                      <div className="text-sm font-medium text-gray-900">
                        {commande.date_reception 
                          ? new Date(commande.date_reception).toLocaleDateString('fr-FR')
                          : 'Non spécifiée'
                        }
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-700 text-xs lg:text-sm mb-1 block">Livraison</Label>
                      <div className="text-sm font-medium text-gray-900">
                        {commande.date_livraison_prevue 
                          ? new Date(commande.date_livraison_prevue).toLocaleDateString('fr-FR')
                          : 'Non spécifiée'
                        }
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-700 text-xs lg:text-sm mb-1 block">N° Commande</Label>
                    <div className="font-mono bg-gradient-to-r from-gray-900 to-black text-white px-3 py-2 rounded-lg text-sm font-bold text-center">
                      {commande.numero_commande}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Information sur les services */}
            {isServiceCommande && (
              <Card className="border-0 shadow-lg lg:shadow-xl bg-blue-50 border-blue-200">
                <CardHeader className="pb-3 lg:pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg lg:text-xl text-blue-800">
                    <Hash className="h-5 w-5" />
                    Information Service
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-blue-700">
                    <p className="font-semibold">✅ Pour les services :</p>
                    <ul className="space-y-1 ml-4">
                      <li>• <strong>Prix fixe défini à la création</strong></li>
                      <li>• <strong>Quantité définie à la création</strong></li>
                      <li>• <strong>Pas de modification des prix/quantité</strong></li>
                      <li>• <strong>Pas de poids nécessaire</strong></li>
                      <li>• <strong>Statut modifiable directement</strong></li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Information sur les produits non-services */}
            {!isServiceCommande && (
              <Card className="border-0 shadow-lg lg:shadow-xl bg-green-50 border-green-200">
                <CardHeader className="pb-3 lg:pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg lg:text-xl text-green-800">
                    <Scale className="h-5 w-5" />
                    Information Produit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-green-700">
                    <p className="font-semibold">📦 Pour les produits :</p>
                    <ul className="space-y-1 ml-4">
                      <li>• <strong>Prix au kg défini à la création</strong></li>
                      <li>• <strong>Poids à renseigner après pesage</strong></li>
                      <li>• <strong>Montant = poids × prix au kg</strong></li>
                      {!hasExistingPoids && (
                        <li>• <strong className="text-amber-700">Poids requis pour "Disponible"</strong></li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function validateCommandeUpdateForEdit(
  commande: Commande,
  newStatus: string,
  poids?: string,
  isServiceCommande: boolean = false,
  hasCompleteData: boolean = false,
  hasExistingPoids: boolean = false
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (newStatus === 'disponible') {
    // Vérifier si le prix est défini
    if (commande.prix_kg === null || commande.prix_kg === undefined) {
      errors.push('Le prix est obligatoire pour marquer comme disponible');
    }

    // Pour les produits non-services, vérifier si le poids est défini (soit existant, soit nouveau)
    if (!isServiceCommande && !hasExistingPoids && !poids) {
      errors.push('Le poids est obligatoire pour marquer comme disponible');
    }

    // Validation du nouveau poids si fourni
    if (poids) {
      const poidsValue = parseFloat(poids);
      if (poidsValue <= 0) {
        errors.push('Le poids doit être supérieur à 0');
      }
    }
  }

  // Empêcher le statut "remis" depuis l'interface
  if (newStatus === 'remis') {
    errors.push('Le statut "Remis" ne peut être défini que via le scan QR code');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}