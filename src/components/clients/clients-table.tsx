// src/components/clients/clients-table.tsx (ou le fichier correspondant)
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MessageSquare, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Client } from '@/types/database.types';

interface ClientsCardListProps {
  clients: Client[];
}

export default function ClientsCardList({ clients }: ClientsCardListProps) {
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDelete = (clientId: string) => {
    setLoadingId(clientId);
    // Appel API de suppression ici
    toast({
      title: 'Client supprimé',
      description: `Le client ${clientId} a été supprimé.`,
    });
    setLoadingId(null);
  };

  if (!clients || clients.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg">Aucun client trouvé</div>
        <p className="text-gray-500 mt-2">Commencez par ajouter votre premier client</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {clients.map((client) => (
        <div
          key={client.id}
          className="bg-white rounded-lg shadow p-4 flex flex-col justify-between"
        >
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900">{client.nom}</h3>
            <p className="text-gray-500 text-sm">
              Ajouté le {new Date(client.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="space-y-1 text-gray-700 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{client.telephone}</span>
            </div>
            {client.whatsapp && (
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-400" />
                <span>{client.whatsapp}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-400" />
                <span>{client.email}</span>
              </div>
            )}
            {client.adresse && (
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 flex-shrink-0 mt-0.5">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-xs line-clamp-2">{client.adresse}</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Link href={`/dashboard/clients/${client.id}`}>
              <Button size="sm" variant="outline">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/dashboard/clients/${client.id}/edit`}>
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}