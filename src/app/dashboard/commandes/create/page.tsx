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
  X
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { createCommande } from '@/actions/commande-actions';
import { getClients } from '@/actions/client-actions';
import { Client } from '@/types/database.types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SelectedClient {
  id: string;
  nom: string;
  telephone: string;
  email?: string | null;  

}

export default function CreateCommandePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClients, setSelectedClients] = useState<SelectedClient[]>([]);
  const [openClientsMobile, setOpenClientsMobile] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    date_reception: new Date().toISOString().split('T')[0],
    date_livraison_prevue: ''
  });

  // Charger clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setClientsLoading(true);
        const { clients, error } = await getClients();
        if (error) {
          toast.error('Erreur', { description: error });
        } else {
          setClients(clients);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast.error('Erreur', { description: 'Erreur lors du chargement des clients' });
      } finally {
        setClientsLoading(false);
      }
    };
    fetchClients();
  }, []);

  // Filtrage
  const filteredClients = clients.filter(client =>
    client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.telephone.includes(searchTerm) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Soumission formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedClients.length === 0 || !formData.description) {
      toast.error('Erreur', { 
        description: 'Veuillez sélectionner au moins un client et renseigner la description' 
      });
      return;
    }

    setLoading(true);
    try {
      const promises = selectedClients.map(client => {
        const formDataToSend = new FormData();
        formDataToSend.append('client_id', client.id);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('date_reception', formData.date_reception);
        if (formData.date_livraison_prevue) {
          formDataToSend.append('date_livraison_prevue', formData.date_livraison_prevue);
        }
        return createCommande(formDataToSend);
      });

      const results = await Promise.all(promises);
      const allSuccess = results.every(result => result.success);

      if (allSuccess) {
        toast.success('Succès', { description: `${selectedClients.length} commande(s) créée(s)` });
        router.push('/dashboard/commandes');
      } else {
        const errorCount = results.filter(r => !r.success).length;
        toast.error('Erreur partielle', { 
          description: `${results.length - errorCount} ok, ${errorCount} erreurs` 
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

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
            <Badge variant="secondary" className="px-3 py-1 text-sm w-fit mx-auto sm:mx-0">
              {selectedClients.length} client(s)
            </Badge>
          </div>
        </div>

        {/* Contenu */}
        <div className="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-3">
          
          {/* Clients */}
          <Card className="lg:col-span-2 border-0 shadow-xl">
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

              {/* Liste collapsible sur mobile */}
              <div className="lg:block hidden border rounded-lg max-h-80 overflow-y-auto">
                {clientsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Chargement...</span>
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Aucun client trouvé</p>
                    <Link href="/dashboard/clients/create" className="text-blue-600 hover:underline">
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
                          className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
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

              {/* Version mobile collapsible */}
              <Collapsible open={openClientsMobile} onOpenChange={setOpenClientsMobile} className="lg:hidden">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full">
                    {openClientsMobile ? "Masquer la liste" : "Afficher les clients"}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 border rounded-lg max-h-64 overflow-y-auto">
                  {clientsLoading ? (
                    <div className="flex items-center justify-center p-6">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="text-center p-6 text-gray-500">
                      Aucun client trouvé
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredClients.map(client => {
                        const isSelected = selectedClients.some(c => c.id === client.id);
                        return (
                          <label
                            key={client.id}
                            className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 ${
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
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* Commande */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-green-600" />
                Détails de la Commande
              </CardTitle>
              <CardDescription>
                Informations générales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description du produit *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Décrivez le produit..."
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    className="resize-none rounded-lg border-2 focus:border-green-500"
                  />
                </div>

                {/* Dates */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_reception">Date de réception *</Label>
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
                    <Label htmlFor="date_livraison_prevue">Date de livraison prévue</Label>
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

                {/* Résumé */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Clients sélectionnés:</span>
                    <span className="font-medium">{selectedClients.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date de réception:</span>
                    <span className="font-medium">
                      {new Date(formData.date_reception).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading || selectedClients.length === 0 || !formData.description}
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
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Footer note */}
        <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500 px-4">
          💡 Astuce : Vous pouvez sélectionner plusieurs clients pour créer des commandes groupées
        </div>
      </div>
    </div>
  );
}
