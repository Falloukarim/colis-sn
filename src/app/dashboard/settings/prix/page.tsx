'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Star } from 'lucide-react';
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
}

export default function PrixSettingsPage() {
  const { toast } = useToast();
  const [prixList, setPrixList] = useState<PrixKg[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prix: '',
    description: '',
    is_default: false
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
      setFormData({ nom: '', prix: '', description: '', is_default: false });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des prix au kg</h1>
        <p className="text-gray-600 mt-1">
          Configurez vos prix prédéfinis pour faciliter la création de commandes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ajouter un prix</CardTitle>
            <CardDescription>
              Créez un nouveau prix prédéfini pour vos commandes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom du prix</Label>
                <Input
                  id="nom"
                  name="nom"
                  placeholder="Ex: Standard, Premium, etc."
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prix">Prix (XOF/kg)</Label>
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
                  placeholder="Description du prix"
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
                Ajouter le prix
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prix configurés</CardTitle>
            <CardDescription>
              Liste de tous vos prix prédéfinis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {prixList.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Aucun prix configuré
              </p>
            ) : (
              <div className="space-y-3">
                {prixList.map((prix) => (
                  <div key={prix.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {prix.is_default && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                      <div>
                        <p className="font-semibold">{prix.nom}</p>
                        <p className="text-sm text-gray-600">
                          {prix.prix} XOF/kg
                          {prix.description && ` • ${prix.description}`}
                        </p>
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}