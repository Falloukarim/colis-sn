'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Star, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { getPrixKg, createPrixKg, deletePrixKg } from '@/actions/prix-actions';

interface PrixKg {
  id: string;
  nom: string;
  prix: number;
  description?: string;
  is_default: boolean;
  type?: 'produit' | 'service';
}

export default function PrixSettingsPage() {
  const { toast } = useToast();
  const [prixList, setPrixList] = useState<PrixKg[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prix: '',
    description: '',
    is_default: false,
    type: 'produit' as 'produit' | 'service'
  });

  useEffect(() => {
    loadPrix();
  }, []);

  const loadPrix = async () => {
    const result = await getPrixKg();
    if (result.success) {
      setPrixList(result.prix);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createPrixKg(new FormData(e.currentTarget as HTMLFormElement));
    
    if (result.success) {
      toast({
        title: 'Succès',
        description: 'Prix créé avec succès',
      });
      setFormData({ 
        nom: '', 
        prix: '', 
        description: '', 
        is_default: false,
        type: 'produit' 
      });
      loadPrix();
    } else {
      toast({
        title: 'Erreur',
        description: result.error,
        variant: 'destructive',
      });
    }
    
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce prix ?')) return;

    const result = await deletePrixKg(id);
    if (result.success) {
      toast({
        title: 'Succès',
        description: 'Prix supprimé avec succès',
      });
      loadPrix();
    } else {
      toast({
        title: 'Erreur',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  // Fonction pour détecter le type de prix
  const getPrixType = (prix: PrixKg): 'service' | 'produit' => {
    // Utiliser le champ type s'il existe
    if (prix.type) {
      return prix.type;
    }
    
    // Fallback: détection par nom
    const serviceKeywords = ['livraison', 'service', 'transport', 'shipping', 'expédition', 'acheminement'];
    return serviceKeywords.some(keyword => 
      prix.nom.toLowerCase().includes(keyword.toLowerCase())
    ) ? 'service' : 'produit';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des prix</h1>
        <p className="text-gray-600 mt-1">
          Configurez vos prix prédéfinis pour les produits (au kg) et les services (prix fixes)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ajouter un prix</CardTitle>
            <CardDescription>
              Créez un nouveau prix prédéfini pour vos produits ou services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type de prix</Label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'produit' | 'service' })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="produit">Prix au kg (produits)</option>
                  <option value="service">Prix fixe (services)</option>
                </select>
                <p className="text-sm text-gray-600">
                  {formData.type === 'produit' 
                    ? 'Pour les produits vendus au poids (ex: riz, sucre, etc.)'
                    : 'Pour les services avec prix fixe (ex: livraison, transport, etc.)'
                  }
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nom">
                  {formData.type === 'produit' ? 'Nom du prix' : 'Nom du service'}
                </Label>
                <Input
                  id="nom"
                  name="nom"
                  placeholder={
                    formData.type === 'produit' 
                      ? 'Ex: Standard, Premium, etc.' 
                      : 'Ex: Livraison Chine, Transport Dakar, etc.'
                  }
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prix">
                  {formData.type === 'produit' ? 'Prix (XOF/kg)' : 'Prix fixe (XOF)'}
                </Label>
                <Input
                  id="prix"
                  name="prix"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.prix}
                  onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Description du prix ou du service"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_default"
                  name="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="is_default" className="text-sm font-normal">
                  Définir comme prix par défaut
                </Label>
              </div>

              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {formData.type === 'produit' ? 'Ajouter le prix' : 'Ajouter le service'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prix configurés</CardTitle>
            <CardDescription>
              Liste de tous vos prix prédéfinis et services
            </CardDescription>
          </CardHeader>
          <CardContent>
            {prixList.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Aucun prix configuré
              </p>
            ) : (
              <div className="space-y-3">
                {prixList.map((prix) => {
                  const prixType = getPrixType(prix);
                  return (
                    <div key={prix.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {prix.is_default && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          prixType === 'service' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          {prixType === 'service' ? (
                            <Truck className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Package className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{prix.nom}</p>
                          <p className="text-sm text-gray-600">
                            {prix.prix} XOF
                            {prixType === 'produit' && '/kg'}
                            {prix.description && ` • ${prix.description}`}
                          </p>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                            prixType === 'service' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {prixType === 'service' ? 'Service' : 'Produit'}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(prix.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section d'information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Comment utiliser les prix et services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Prix produits (au kg)
              </h4>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Pour les produits vendus au poids</li>
                <li>• Le poids est obligatoire</li>
                <li>• Le montant = poids × prix/kg</li>
                <li>• Ex: Riz, sucre, café, etc.</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Prix services (fixes)
              </h4>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Pour les services avec prix fixe</li>
                <li>• La quantité est obligatoire</li>
                <li>• Le montant = quantité × prix fixe</li>
                <li>• Ex: Livraison, transport, etc.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}