// src/app/dashboard/commandes/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
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
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { getCommandeById, updateCommandeStatus } from '@/actions/commande-actions';
import { getPrixKg } from '@/actions/prix-actions';
import { Commande, CommandeStatut } from '@/types/commande';
import { getStatutDisplayName } from '@/types/commande';

interface EditCommandePageProps {
  params: Promise<{ id: string }>;
}

interface FormData {
  poids: string;
  prix_kg: string;
  selected_prix_id: string;
  statut: CommandeStatut;
}

interface PrixKg {
  id: string;
  nom: string;
  prix: number;
  description?: string;
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
  const [prixOptions, setPrixOptions] = useState<PrixKg[]>([]);
  const [formData, setFormData] = useState<FormData>({
    poids: '',
    prix_kg: '',
    selected_prix_id: '',
    statut: 'en_cours'
  });
  const [isClient, setIsClient] = useState(false);
  const [activeSection, setActiveSection] = useState<'pesee' | 'statut'>('pesee');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { id } = await resolvedParams;
      setCommandeId(id);

      try {
        // Charger les prix prédéfinis
        const prixResult = await getPrixKg();
        if (prixResult.success) {
          setPrixOptions(prixResult.prix);
        }

        // Charger la commande
        const { commande, error } = await getCommandeById(id);
        if (error || !commande) {
          toast.error('Erreur', { description: error || 'Commande non trouvée' });
          router.push('/dashboard/commandes');
        } else {
          setCommande(commande);
          setFormData({
            poids: commande.poids?.toString() || '',
            prix_kg: commande.prix_kg?.toString() || '',
            selected_prix_id: '',
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

  const handlePrixSelection = (prixId: string) => {
    const selectedPrix = prixOptions.find(p => p.id === prixId);
    if (selectedPrix) {
      setFormData(prev => ({
        ...prev,
        selected_prix_id: prixId,
        prix_kg: selectedPrix.prix.toString()
      }));
    }
  };

  const handleCustomPrixChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      selected_prix_id: 'custom',
      prix_kg: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandeId) return;
    setLoading(true);

    try {
      const result = await updateCommandeStatus(
        commandeId,
        formData.statut,
        formData.poids ? parseFloat(formData.poids) : undefined,
        formData.prix_kg ? parseFloat(formData.prix_kg) : undefined
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
      [name]: value,
      selected_prix_id: name === 'prix_kg' ? 'custom' : prev.selected_prix_id
    }));
  };

  const handleStatutChange = (newStatut: CommandeStatut) => {
    setFormData(prev => ({
      ...prev,
      statut: newStatut
    }));
  };

  const calculateMontantTotal = () => {
    if (!formData.poids || !formData.prix_kg) return 0;
    return parseFloat(formData.poids) * parseFloat(formData.prix_kg);
  };

  const montantTotal = calculateMontantTotal();
  const progressValue = STATUT_STEPS.findIndex(step => step.value === formData.statut) + 1;
  const progressMax = STATUT_STEPS.length;

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
              </p>
            </div>
            <Badge variant="secondary" className="hidden lg:flex px-3 py-1 text-sm">
              {(commande as any).clients?.nom || 'Client inconnu'}
            </Badge>
          </div>

          {/* Barre de progression - version mobile compacte */}
          <div className="mt-3 lg:mt-6">
            <div className="flex justify-between items-center text-xs lg:text-sm text-gray-600 mb-2">
              <span>Progression</span>
              <span>{progressValue}/{progressMax}</span>
            </div>
            <Progress value={(progressValue / progressMax) * 100} className="h-1 lg:h-2" />
            
            {/* Étapes de statut - version mobile horizontale */}
            {/* Étapes de statut - version mobile horizontale */}
<div className="flex justify-between mt-3 lg:hidden">
  {STATUT_STEPS.map((step, index) => {
    const isActive = formData.statut === step.value;
    const isCompleted = index < STATUT_STEPS.findIndex(s => s.value === formData.statut);
    const StepIcon = step.icon;
    
    return (
      <div key={step.value} className="flex flex-col items-center text-center flex-1">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
          isActive 
            ? 'bg-blue-500 text-white' 
            : isCompleted
            ? 'bg-green-500 text-white'
            : 'bg-gray-200 text-gray-500'
        }`}>
          {/* CORRECTION ICI */}
<StepIcon />        </div>
        <span className={`text-xs font-medium ${
          isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
        }`}>
          {step.label.split(' ')[0]}
        </span>
      </div>
    );
  })}
</div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 pb-8">
        {/* Navigation mobile par sections */}
        <div className="lg:hidden mb-4">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveSection('pesee')}
              className={`flex-1 py-3 text-center font-medium text-sm ${
                activeSection === 'pesee' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500'
              }`}
            >
              📊 Pesée & Prix
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
            {/* Section Pesée - Visible sur mobile selon la navigation */}
            <Card className={`border-0 shadow-lg lg:shadow-xl ${activeSection !== 'pesee' ? 'hidden lg:block' : ''}`}>
              <CardHeader className="pb-3 lg:pb-4">
                <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                  <Scale className="h-5 w-5 text-blue-600" />
                  Informations de Pesée
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 lg:space-y-6">
                  {/* Poids */}
                  <div className="space-y-2">
                    <Label htmlFor="poids" className="flex items-center gap-2 text-blue-800 text-sm lg:text-base">
                      <Scale className="h-4 w-4" />
                      Poids (kg) *
                    </Label>
                    <Input
                      id="poids"
                      name="poids"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.poids}
                      onChange={handleInputChange}
                      className="rounded-lg text-lg font-medium h-12 lg:h-14"
                    />
                  </div>

                  {/* Prix au kg */}
                  <div className="space-y-2">
                    <Label htmlFor="prix_kg" className="flex items-center gap-2 text-blue-800 text-sm lg:text-base">
                      <DollarSign className="h-4 w-4" />
                      Prix au kg (XOF) *
                    </Label>
                    
                    {/* Prix prédéfinis - Version mobile compacte */}
                    {prixOptions.length > 0 && (
                      <div className="mb-3">
                        <Label className="text-sm text-blue-700 mb-2 block">Prix prédéfinis:</Label>
                        <div className="flex flex-wrap gap-1 lg:gap-2">
                          {prixOptions.slice(0, 3).map((prix) => (
                            <Button
                              key={prix.id}
                              type="button"
                              variant={formData.selected_prix_id === prix.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePrixSelection(prix.id)}
                              className={`text-xs lg:text-sm rounded-full h-8 lg:h-9 ${
                                formData.selected_prix_id === prix.id 
                                  ? 'bg-blue-600 text-white' 
                                  : 'border-blue-200 text-blue-700'
                              }`}
                            >
                              {prix.nom} - {prix.prix} XOF
                            </Button>
                          ))}
                          {prixOptions.length > 3 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs rounded-full h-8 border-gray-300"
                            >
                              +{prixOptions.length - 3}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    <Input
                      id="prix_kg"
                      name="prix_kg"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.prix_kg}
                      onChange={(e) => handleCustomPrixChange(e.target.value)}
                      className="rounded-lg text-lg font-medium h-12 lg:h-14"
                    />
                  </div>

                  {/* Calcul du montant total */}
                  {formData.poids && formData.prix_kg && (
                    <div className="p-3 lg:p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm opacity-90">Montant total</div>
                          <div className="text-xl lg:text-2xl font-bold">{montantTotal.toFixed(2)} XOF</div>
                        </div>
                        <div className="text-right text-xs lg:text-sm opacity-90">
                          <div>{formData.poids} kg × {formData.prix_kg} XOF</div>
                          <div>Calcul automatique</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section Statut - Visible sur mobile selon la navigation */}
            <Card className={`border-0 shadow-lg lg:shadow-xl ${activeSection !== 'statut' ? 'hidden lg:block' : ''}`}>
              <CardHeader className="pb-3 lg:pb-4">
                <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Statut de la Commande
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Boutons de statut - Version mobile verticale */}
                  <div className="flex flex-col gap-2 lg:flex-row lg:gap-3 lg:flex-wrap">
                    {STATUT_STEPS.map((step) => {
                      const StepIcon = step.icon;
                      const isActive = formData.statut === step.value;
                      const isDisabled = step.value !== 'en_cours' && (!formData.poids || !formData.prix_kg);
                      
                      return (
                        <Button
                          key={step.value}
                          type="button"
                          variant={isActive ? "default" : "outline"}
                          onClick={() => !isDisabled && handleStatutChange(step.value)}
                          disabled={isDisabled}
                          className={`justify-start lg:flex-1 lg:min-w-[140px] h-12 lg:h-auto lg:py-4 px-3 rounded-xl transition-all duration-200 ${
                            isActive 
                              ? 'shadow-lg' 
                              : ''
                          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-2 lg:gap-2">
                           <StepIcon />
                            <span className="text-sm font-medium">{step.label}</span>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                  
                  <div className="text-center">
                    <Badge variant="secondary" className="px-3 py-1 text-sm">
                      Statut actuel: {getStatutDisplayName(formData.statut)}
                    </Badge>
                    {(!formData.poids || !formData.prix_kg) && formData.statut === 'en_cours' && (
                      <p className="text-sm text-amber-600 mt-2">
                        ⚠️ Renseignez le poids et le prix pour changer le statut
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Boutons d'action - Toujours visibles */}
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
                Enregistrer
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

          {/* Section Informations - Sidebar sur desktop, repliable sur mobile */}
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
          </div>
        </div>
      </div>
    </div>
  );
}