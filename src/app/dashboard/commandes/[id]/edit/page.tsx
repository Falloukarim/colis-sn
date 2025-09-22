'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
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

export default function EditCommandePage({ params: resolvedParams }: EditCommandePageProps) {
  const router = useRouter();
  const { toast } = useToast();
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
          toast({
            title: 'Erreur',
            description: error || 'Commande non trouvée',
            variant: 'destructive',
          });
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
        toast({
          title: 'Erreur',
          description: 'Erreur lors du chargement des données',
          variant: 'destructive',
        });
      }
    };

    fetchData();
  }, [resolvedParams, router, toast]);

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
        toast({
          title: 'Succès',
          description: 'Commande mise à jour avec succès',
        });
        router.push(`/dashboard/commandes/${commandeId}`);
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Erreur lors de la mise à jour',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating commande:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue est survenue',
        variant: 'destructive',
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

  if (!commande) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const montantTotal = formData.poids && formData.prix_kg 
    ? (parseFloat(formData.poids) * parseFloat(formData.prix_kg)).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/commandes/${commandeId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Modifier la commande</h1>
          <p className="text-gray-600 mt-1">
            Mettre à jour les informations de la commande #{commande.numero_commande}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations de pesée</CardTitle>
            <CardDescription>
              Renseignez le poids et sélectionnez le prix au kg
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="poids">Poids (kg)</Label>
                <Input
                  id="poids"
                  name="poids"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.poids}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prix_kg">Prix au kg (XOF)</Label>
                
                {/* Sélecteur de prix prédéfinis */}
                {prixOptions.length > 0 && (
                  <div className="mb-3">
                    <Label className="text-sm text-gray-600 mb-2 block">Prix prédéfinis:</Label>
                    <Select value={formData.selected_prix_id} onValueChange={handlePrixSelection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un prix" />
                      </SelectTrigger>
                      <SelectContent>
                        {prixOptions.map((prix) => (
                          <SelectItem key={prix.id} value={prix.id}>
                            {prix.nom} - {prix.prix} XOF/kg
                            {prix.description && ` (${prix.description})`}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Prix personnalisé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Champ de prix personnalisé */}
                <Input
                  id="prix_kg"
                  name="prix_kg"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.prix_kg}
                  onChange={(e) => handleCustomPrixChange(e.target.value)}
                  className={formData.selected_prix_id !== 'custom' && formData.selected_prix_id ? 'bg-gray-100' : ''}
                  disabled={formData.selected_prix_id !== 'custom' && formData.selected_prix_id !== ''}
                />
              </div>

              {formData.poids && formData.prix_kg && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800">Montant total:</h4>
                  <p className="text-2xl font-bold text-blue-800">
                    {montantTotal} XOF
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    {formData.poids} kg × {formData.prix_kg} XOF/kg
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Statut</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant={formData.statut === 'en_cours' ? 'default' : 'outline'}
                    onClick={() => handleStatutChange('en_cours')}
                  >
                    En cours
                  </Button>
                  <Button
                    type="button"
                    variant={formData.statut === 'disponible' ? 'default' : 'outline'}
                    onClick={() => handleStatutChange('disponible')}
                    disabled={!formData.poids || !formData.prix_kg}
                  >
                    Disponible
                  </Button>
                  <Button
                    type="button"
                    variant={formData.statut === 'remis' ? 'default' : 'outline'}
                    onClick={() => handleStatutChange('remis')}
                    disabled={!formData.poids || !formData.prix_kg}
                  >
                    Remis
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Statut actuel: {getStatutDisplayName(formData.statut)}
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Enregistrer les modifications
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations de la commande</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Client:</Label>
              <p className="font-semibold">{(commande as any).clients?.nom || 'Client inconnu'}</p>
            </div>

            <div>
              <Label>Description:</Label>
              <p>{commande.description || 'Aucune description'}</p>
            </div>

            <div>
              <Label>Numéro de commande:</Label>
              <p className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                {commande.numero_commande}
              </p>
            </div>

            {commande.date_reception && (
              <div>
                <Label>Date de réception:</Label>
                <p>{new Date(commande.date_reception).toLocaleDateString('fr-FR')}</p>
              </div>
            )}

            {commande.date_livraison_prevue && (
              <div>
                <Label>Livraison prévue:</Label>
                <p>{new Date(commande.date_livraison_prevue).toLocaleDateString('fr-FR')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}