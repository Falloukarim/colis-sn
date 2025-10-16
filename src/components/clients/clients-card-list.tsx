// clients-card-list.tsx (version corrigée)
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MessageSquare, Eye, Edit, MapPin, Calendar, Plus, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Client } from '@/types/client'; // ← Changé pour importer depuis client.ts
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ClientsCardListProps {
  clients: Client[];
  searchQuery?: string; // ← Ajouté ici
}

export default function ClientsCardList({ clients, searchQuery = '' }: ClientsCardListProps) {
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDelete = async (clientId: string, clientName: string) => {
    setLoadingId(clientId);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: '✅ Client supprimé',
        description: `${clientName} a été supprimé avec succès.`,
      });
    } catch (error) {
      toast({
        title: '❌ Erreur',
        description: 'Une erreur est survenue lors de la suppression.',
        variant: 'destructive',
      });
    } finally {
      setLoadingId(null);
    }
  };

  if (!clients || clients.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery ? 'Aucun client trouvé' : 'Aucun client'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery ? 'Aucun résultat pour votre recherche.' : 'Commencez par ajouter votre premier client.'}
          </p>
          <Link href="/dashboard/clients/create">
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un client
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
      {clients.map((client) => (
        <Card 
          key={client.id} 
          className="group hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-100 overflow-hidden"
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-lg">
                  {client.nom}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    Ajouté le {new Date(client.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Client
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pb-3">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div className="p-1.5 bg-blue-100 rounded-md">
                  <Phone className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <span className="text-sm font-medium">{client.telephone}</span>
              </div>
              
              {client.whatsapp && (
                <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                  <div className="p-1.5 bg-green-100 rounded-md">
                    <MessageSquare className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium">{client.whatsapp}</span>
                </div>
              )}
              
              {client.email && (
                <div className="flex items-center gap-3 p-2 bg-purple-50 rounded-lg">
                  <div className="p-1.5 bg-purple-100 rounded-md">
                    <Mail className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium truncate">{client.email}</span>
                </div>
              )}
              
              {client.adresse && (
                <div className="flex items-start gap-3 p-2 bg-orange-50 rounded-lg">
                  <div className="p-1.5 bg-orange-100 rounded-md mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-orange-600" />
                  </div>
                  <span className="text-sm text-gray-700 line-clamp-2">{client.adresse}</span>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="pt-3 border-t border-gray-100">
            <div className="flex justify-end gap-2 w-full">
              <Link href={`/dashboard/clients/${client.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full gap-2" disabled={loadingId === client.id}>
                  {loadingId === client.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                  Voir
                </Button>
              </Link>
              
              <Link href={`/dashboard/clients/${client.id}/edit`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full gap-2" disabled={loadingId === client.id}>
                  <Edit className="h-3.5 w-3.5" />
                  Modifier
                </Button>
              </Link>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

// Composant de chargement pour le skeleton
export function ClientsCardListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="border-gray-100">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pb-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-3/4" />
          </CardContent>
          <CardFooter>
            <div className="flex gap-2 w-full">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}