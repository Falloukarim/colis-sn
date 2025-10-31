// clients-card-list.tsx (version pro)
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Calendar, 
  Plus, 
  Users, 
  Loader2,
  ChevronRight,
  Settings,
  User,
  FileText,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Client } from '@/types/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ClientsCardListProps {
  clients: Client[];
  searchQuery?: string;
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
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center">
            <Building className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery ? 'Aucun client trouvé' : 'Aucun client'}
          </h3>
          <p className="text-gray-500 mb-8">
            {searchQuery 
              ? 'Aucun résultat ne correspond à votre recherche.' 
              : 'Commencez par créer votre première fiche client.'
            }
          </p>
          <Link href="/dashboard/clients/create">
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg hover:shadow-xl transition-all">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau client
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
          className="group hover:shadow-2xl transition-all duration-300 border border-gray-200/80 hover:border-blue-200/80 overflow-hidden bg-white/50 backdrop-blur-sm"
        >
          <CardHeader className="pb-4 bg-gradient-to-r from-gray-50/50 to-blue-50/30 border-b border-gray-100">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors text-lg leading-tight">
                    {client.nom}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {new Date(client.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-700 border-0 shadow-sm">
                Client
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pb-4 pt-6">
            <div className="space-y-3">
              {/* Téléphone */}
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50/80 to-blue-100/30 rounded-xl border border-blue-100/50">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Phone className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">{client.telephone}</span>
                  <span className="text-xs text-gray-500">Téléphone</span>
                </div>
              </div>
              
              {/* WhatsApp */}
              {client.whatsapp && (
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50/80 to-green-100/30 rounded-xl border border-green-100/50">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900 block">{client.whatsapp}</span>
                    <span className="text-xs text-gray-500">WhatsApp</span>
                  </div>
                </div>
              )}
              
              {/* Email */}
              {client.email && (
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50/80 to-purple-100/30 rounded-xl border border-purple-100/50">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900 block truncate">{client.email}</span>
                    <span className="text-xs text-gray-500">Email</span>
                  </div>
                </div>
              )}
              
              {/* Adresse */}
              {client.adresse && (
                <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-orange-50/80 to-orange-100/30 rounded-xl border border-orange-100/50">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm mt-0.5">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900 line-clamp-2 leading-relaxed">
                      {client.adresse}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">Adresse</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="pt-4 border-t border-gray-100/80 bg-gray-50/30">
            <div className="flex gap-3 w-full">
              {/* Bouton Détails */}
              <Link href={`/dashboard/clients/${client.id}`} className="flex-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2 h-10 bg-white/80 backdrop-blur-sm border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group/btn"
                  disabled={loadingId === client.id}
                >
                  {loadingId === client.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <FileText className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
                      <span>Détails</span>
                    </>
                  )}
                </Button>
              </Link>
              
              {/* Bouton Modifier */}
              <Link href={`/dashboard/clients/${client.id}/edit`} className="flex-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2 h-10 bg-white/80 backdrop-blur-sm border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group/btn"
                  disabled={loadingId === client.id}
                >
                  <Settings className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
                  <span>Modifier</span>
                </Button>
              </Link>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

// Composant de chargement amélioré
export function ClientsCardListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="border-gray-200/80 bg-white/50 backdrop-blur-sm">
          <CardHeader className="pb-4 bg-gradient-to-r from-gray-50/50 to-blue-50/30 border-b border-gray-100">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pb-4 pt-6">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-3/4 rounded-xl" />
          </CardContent>
          <CardFooter className="pt-4 border-t border-gray-100/80 bg-gray-50/30">
            <div className="flex gap-3 w-full">
              <Skeleton className="h-10 flex-1 rounded-lg" />
              <Skeleton className="h-10 flex-1 rounded-lg" />
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}