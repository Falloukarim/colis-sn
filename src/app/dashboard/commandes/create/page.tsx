// src/app/dashboard/commandes/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Loader2, 
  Search, 
  User,
  Calendar,
  FileText,
  Check,
  X,
  Package,
  Truck,
  Scale,
  Hash,
  DollarSign,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { createCommande, createMultipleCommandes } from '@/actions/commande-actions';
import { getClients } from '@/actions/client-actions';
import { getPrixKg } from '@/actions/prix-actions';
import { Client } from '@/types/database.types';

interface SelectedClient {
  id: string;
  nom: string;
  telephone: string;
  email?: string | null;
}

interface PrixKg {
  id: string;
  nom: string;
  prix: number;
  description?: string;
  is_default?: boolean;
  type: 'produit' | 'service';
}

export default function CreateCommandePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [prixOptions, setPrixOptions] = useState<PrixKg[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [prixLoading, setPrixLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClients, setSelectedClients] = useState<SelectedClient[]>([]);
  const [openClientsMobile, setOpenClientsMobile] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    date_reception: new Date().toISOString().split('T')[0],
    date_livraison_prevue: '',
    type: 'produit' as 'produit' | 'service',
    selected_prix_id: '',
    prix_kg: '',
    quantite: '',
    poids: ''
  });

  // Charger clients et prix
  useEffect(() => {
    const fetchData = async () => {
      try {
        setClientsLoading(true);
        setPrixLoading(true);

        // Charger les clients
        const { clients, error } = await getClients();
        if (error) {
          toast.error('Erreur', { description: error });
        } else {
          setClients(clients);
        }

        // Charger les prix prédéfinis
        const prixResult = await getPrixKg();
        if (prixResult.success) {
          setPrixOptions(prixResult.prix);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erreur', { description: 'Erreur lors du chargement des données' });
      } finally {
        setClientsLoading(false);
        setPrixLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtrage clients
  const filteredClients = clients.filter(client =>
    client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.telephone.includes(searchTerm) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtrer les prix selon le type
  const filteredPrixOptions = prixOptions.filter(prix => 
    prix.type === formData.type
  );

  // Sélection client
  const toggleClientSelection = (client: Client) => {
    setSelectedClients(prev => {
      const isSelected = prev.some(c => c.id === client.id);
      if (isSelected) {
        return prev.filter(c => c.id !== client.id);
      } else {
        return [...prev, {
          id: client.id,
          nom: client.nom,
          telephone: client.telephone,
          email: client.email
        }];
      }
    });
  };

  const removeClient = (clientId: string) => {
    setSelectedClients(prev => prev.filter(c => c.id !== clientId));
  };

  // Gestion du type de commande
  const handleTypeChange = (type: 'produit' | 'service') => {
    setFormData(prev => ({
      ...prev,
      type,
      selected_prix_id: '',
      prix_kg: '',
      quantite: '',
      poids: ''
    }));
  };

  // Sélection d'un prix prédéfini
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

  // Prix personnalisé
  const handleCustomPrixChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      selected_prix_id: 'custom',
      prix_kg: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedClients.length === 0 || !formData.description) {
      toast.error('Erreur', { 
        description: 'Veuillez sélectionner au moins un client et renseigner la description' 
      });
      return;
    }

    // Validation adaptée : le prix est obligatoire, mais le poids/quantité est optionnel à la création
    if (!formData.prix_kg) {
      toast.error('Erreur', { 
        description: 'Le prix est obligatoire pour créer la commande' 
      });
      return;
    }

    setLoading(true);
    try {
      // Utiliser la nouvelle fonction pour créer plusieurs commandes
      const result = await createMultipleCommandes(
        selectedClients.map(client => client.id),
        new FormData(e.currentTarget as HTMLFormElement)
      );

      if (result.success) {
        toast.success('Succès', { 
          description: `${result.createdCount} commande(s) créée(s) avec statut "En Cours". Vous pourrez compléter les informations dans la page d'édition.` 
        });
        router.push('/dashboard/commandes');
      } else {
        toast.error('Erreur', { 
          description: result.error || 'Erreur lors de la création des commandes'
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Erreur', { description: 'Une erreur inattendue est survenue' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Calcul du montant estimé (seulement si toutes les données sont présentes)
  const calculateMontant = () => {
    if (!formData.prix_kg) return 0;
    
    const prix = parseFloat(formData.prix_kg);
    
    if (formData.type === 'service' && formData.quantite) {
      return prix * parseInt(formData.quantite);
    } else if (formData.type === 'produit' && formData.poids) {
      return prix * parseFloat(formData.poids);
    }
    
    return 0;
  };

  const montantEstime = calculateMontant();
  const hasCompleteData = formData.prix_kg && (
    (formData.type === 'service' && formData.quantite) || 
    (formData.type === 'produit' && formData.poids)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 border border-white/20 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-3 mb-4">
            <Link href="/dashboard/commandes">
              <Button variant="outline" size="icon" className="rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Nouvelle Commande
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Créer une ou plusieurs commandes pour vos clients
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Badge variant="secondary" className="px-3 py-1 text-sm">
                {selectedClients.length} client(s)
              </Badge>
              <Badge className={`px-3 py-1 text-sm ${
                formData.type === 'service' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {formData.type === 'service' ? 'Service' : 'Produit'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-3">
          
          {/* Clients */}
          <Card className="lg:col-span-1 border-0 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-blue-600" />
                Sélection des Clients
              </CardTitle>
              <CardDescription>
                Choisissez un ou plusieurs clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border-2 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Clients sélectionnés */}
              {selectedClients.length > 0 && (
                <div className="space-y-2">
                  <Label>Clients sélectionnés :</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedClients.map(client => (
                      <Badge key={client.id} variant="secondary" className="px-3 py-1.5">
                        {client.nom}
                        <button
                          onClick={() => removeClient(client.id)}
                          className="ml-2 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Liste clients */}
              <div className="border rounded-lg max-h-80 overflow-y-auto">
                {clientsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Chargement...</span>
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Aucun client trouvé</p>
                    <Link href="/dashboard/clients/create" className="text-blue-600 hover:underline text-sm">
                      Créer un nouveau client
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredClients.map(client => {
                      const isSelected = selectedClients.some(c => c.id === client.id);
                      return (
                        <label
                          key={client.id}
                          className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                            isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                              isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                            }`}>
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{client.nom}</div>
                              <div className="text-sm text-gray-500 truncate">
                                {client.telephone} {client.email && `• ${client.email}`}
                              </div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleClientSelection(client)}
                            className="sr-only"
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Configuration de la commande */}
          <Card className="lg:col-span-2 border-0 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-green-600" />
                Configuration de la Commande
              </CardTitle>
              <CardDescription>
                Définissez le type et les détails de la commande
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Type de commande */}
                <div className="space-y-4">
                  <Label className="text-base">Type de commande *</Label>
                  <RadioGroup 
                    value={formData.type} 
                    onValueChange={(value: string) => handleTypeChange(value as 'produit' | 'service')}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="produit" id="produit" className="sr-only" />
                      <Label
                        htmlFor="produit"
                        className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.type === 'produit'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center ${
                            formData.type === 'produit' ? 'bg-green-500 border-green-500' : 'border-gray-300'
                          }`}>
                            {formData.type === 'produit' && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <Package className="h-5 w-5 text-green-600" />
                          <span className="font-semibold">Produit</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 ml-9">
                          Vendu au poids (kg) - Ex: riz, sucre, café, etc.
                        </p>
                      </Label>
                    </div>

                    <div>
                      <RadioGroupItem value="service" id="service" className="sr-only" />
                      <Label
                        htmlFor="service"
                        className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.type === 'service'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center ${
                            formData.type === 'service' ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                          }`}>
                            {formData.type === 'service' && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <Truck className="h-5 w-5 text-blue-600" />
                          <span className="font-semibold">Service</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 ml-9">
                          Prix fixe - Ex: livraison, transport, express, etc.
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description {formData.type === 'service' ? 'du service' : 'du produit'} *
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder={
                      formData.type === 'service' 
                        ? 'Ex: Livraison express Chine, Transport Dakar, Service CBM...' 
                        : 'Ex: Riz basmati, Sucre en poudre, Café arabica...'
                    }
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    className="resize-none rounded-lg border-2 focus:border-green-500"
                  />
                </div>

                {/* Information sur le processus */}
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-sm">
                    <strong>Processus de création :</strong> La commande sera créée avec le statut "En Cours". 
                    Vous pourrez ensuite compléter les informations manquantes (poids/quantité) dans la page d'édition 
                    avant de la marquer comme "Disponible".
                  </AlertDescription>
                </Alert>

                {/* Prix prédéfinis */}
                {filteredPrixOptions.length > 0 && (
                  <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Label className="flex items-center gap-2 text-blue-800 font-semibold">
                      {formData.type === 'service' ? 'Services prédéfinis' : 'Prix prédéfinis'}
                      <Badge variant="outline" className="bg-white text-blue-700">
                        {filteredPrixOptions.length} disponible(s)
                      </Badge>
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {filteredPrixOptions.map((prix) => {
                        const isSelected = formData.selected_prix_id === prix.id;
                        return (
                          <Button
                            key={prix.id}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePrixSelection(prix.id)}
                            className={`text-xs rounded-full h-9 px-3 transition-all ${
                              isSelected 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : formData.type === 'service' 
                                  ? 'border-blue-200 text-blue-700 bg-white hover:bg-blue-50'
                                  : 'border-green-200 text-green-700 bg-white hover:bg-green-50'
                            } ${prix.is_default ? 'border-2 border-yellow-400' : ''}`}
                          >
                            <div className="flex items-center gap-1">
                              {prix.is_default && (
                                <span className="text-yellow-500">★</span>
                              )}
                              <span>{prix.nom}</span>
                              <span className="font-bold ml-1">{prix.prix} XOF</span>
                              {formData.type === 'service' && (
                                <span className="text-xs opacity-75">(fixe)</span>
                              )}
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Prix et quantité/poids */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Prix */}
                  <div className="space-y-2">
                    <Label htmlFor="prix_kg" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      {formData.type === 'service' ? 'Prix unitaire (XOF) *' : 'Prix au kg (XOF) *'}
                    </Label>
                    <Input
                      id="prix_kg"
                      name="prix_kg"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={formData.type === 'service' ? "50000" : "1000"}
                      value={formData.prix_kg}
                      onChange={(e) => handleCustomPrixChange(e.target.value)}
                      className="rounded-lg border-2 focus:border-green-500"
                      required
                    />
                    <p className="text-xs text-gray-600">
                      Le prix est obligatoire pour créer la commande
                    </p>
                  </div>

                  {/* Quantité ou Poids (optionnel à la création) */}
                  <div className="space-y-2">
                    <Label htmlFor={formData.type === 'service' ? 'quantite' : 'poids'} className="flex items-center gap-2">
                      {formData.type === 'service' ? (
                        <Hash className="h-4 w-4" />
                      ) : (
                        <Scale className="h-4 w-4" />
                      )}
                      {formData.type === 'service' ? 'Quantité' : 'Poids (kg)'}
                      <Badge variant="outline" className="bg-gray-100 text-gray-700 text-xs">
                        Optionnel
                      </Badge>
                    </Label>
                    <Input
                      id={formData.type === 'service' ? 'quantite' : 'poids'}
                      name={formData.type === 'service' ? 'quantite' : 'poids'}
                      type="number"
                      step={formData.type === 'service' ? "1" : "0.01"}
                      min="0"
                      placeholder={formData.type === 'service' ? "2 (optionnel)" : "5.00 (optionnel)"}
                      value={formData.type === 'service' ? formData.quantite : formData.poids}
                      onChange={handleInputChange}
                      className="rounded-lg border-2 focus:border-green-500"
                    />
                    <p className="text-xs text-gray-600">
                      {formData.type === 'service' 
                        ? 'La quantité pourra être renseignée plus tard'
                        : 'Le poids pourra être renseigné après pesage'
                      }
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_reception" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date de réception *
                    </Label>
                    <Input
                      id="date_reception"
                      name="date_reception"
                      type="date"
                      value={formData.date_reception}
                      onChange={handleInputChange}
                      required
                      className="rounded-lg border-2 focus:border-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_livraison_prevue" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date de livraison prévue
                    </Label>
                    <Input
                      id="date_livraison_prevue"
                      name="date_livraison_prevue"
                      type="date"
                      value={formData.date_livraison_prevue}
                      onChange={handleInputChange}
                      min={formData.date_reception}
                      className="rounded-lg border-2 focus:border-green-500"
                    />
                  </div>
                </div>

                {/* Résumé et calcul */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 space-y-3 border">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Résumé:</span>
                    <Badge variant="secondary" className="px-3 py-1">
                      {formData.type === 'service' ? 'Service' : 'Produit'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Clients:</span>
                      <div className="font-medium">{selectedClients.length}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <div className="font-medium">
                        {formData.type === 'service' ? 'Service' : 'Produit'}
                      </div>
                    </div>
                  </div>

                  {hasCompleteData ? (
                    <div className="bg-white rounded p-3 border">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Montant estimé par commande:</span>
                        <span className="text-lg font-bold text-green-600">
                          {montantEstime.toLocaleString('fr-FR')} XOF
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formData.type === 'service' 
                          ? `${formData.quantite} × ${parseFloat(formData.prix_kg).toLocaleString('fr-FR')} XOF`
                          : `${formData.poids} kg × ${parseFloat(formData.prix_kg).toLocaleString('fr-FR')} XOF/kg`
                        }
                      </div>
                    </div>
                  ) : formData.prix_kg ? (
                    <div className="bg-amber-50 rounded p-3 border border-amber-200">
                      <div className="flex items-center gap-2 text-amber-800">
                        <Info className="h-4 w-4" />
                        <div className="text-sm">
                          <div className="font-semibold">Informations incomplètes</div>
                          <div>
                            {formData.type === 'service' 
                              ? 'Ajoutez la quantité pour calculer le montant total'
                              : 'Le poids sera renseigné après pesage'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Boutons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading || selectedClients.length === 0 || !formData.description || !formData.prix_kg}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                    size="lg"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Créer {selectedClients.length > 1 ? `${selectedClients.length} commandes` : 'la commande'}
                  </Button>
                  <Link href="/dashboard/commandes" className="flex-1">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      size="lg"
                    >
                      Annuler
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Footer note */}
        <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500 px-4">
          💡 Astuce : Le poids/quantité peut être renseigné ultérieurement dans la page d'édition de chaque commande
        </div>
      </div>
    </div>
  );
}