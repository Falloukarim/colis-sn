'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Edit, Trash2, Package, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Commande } from '@/types/database.types';
import { useElegantToast } from '@/hooks/use-elegant-toast'; // hook de toast moderne
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CommandesTableProps {
  commandes: Commande[];
}

export default function CommandesTable({ commandes }: CommandesTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const toast = useElegantToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copié', 'Numéro de commande copié dans le presse-papier');
    } catch {
      toast.error('Erreur', 'Impossible de copier le numéro de commande');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_cours':
        return <Badge variant="secondary">En cours</Badge>;
      case 'disponible':
        return <Badge variant="default">Disponible</Badge>;
      case 'remis':
        return <Badge variant="outline">Remis</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (commandes.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p>Aucune commande trouvée</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Commande</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Poids (kg)</TableHead>
              <TableHead>Prix (XOF/kg)</TableHead>
              <TableHead>Total (XOF)</TableHead>
              <TableHead>Date réception</TableHead>
              <TableHead>Date livraison</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commandes.map((commande) => (
              <TableRow key={commande.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm bg-blue-50 px-2 py-1 rounded">
                      {commande.numero_commande}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(commande.numero_commande)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{(commande as any).client_nom || 'Client inconnu'}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {(commande as any).description || '-'}
                </TableCell>
                <TableCell>{getStatusBadge(commande.statut)}</TableCell>
                <TableCell>{commande.poids || '-'}</TableCell>
                <TableCell>{commande.prix_kg ? `${commande.prix_kg} XOF` : '-'}</TableCell>
                <TableCell>
                  {commande.poids && commande.prix_kg
                    ? `${(commande.poids * commande.prix_kg).toFixed(2)} XOF`
                    : '-'}
                </TableCell>
                <TableCell>{formatDate(commande.date_reception)}</TableCell>
                <TableCell>{formatDate(commande.date_livraison_prevue)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-1"
                    >
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/commandes/${commande.id}`}
                          className="flex items-center gap-2 px-3 py-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900"
                        >
                          <Eye className="h-5 w-5 text-blue-600" />
                          Détails
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/commandes/${commande.id}/edit`}
                          className="flex items-center gap-2 px-3 py-2 rounded hover:bg-green-50 dark:hover:bg-green-900"
                        >
                          <Edit className="h-5 w-5 text-green-600" />
                          Modifier
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <div className="space-y-4 md:hidden">
        {commandes.map((commande) => (
          <Card key={commande.id} className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="font-mono bg-blue-50 px-2 py-1 rounded">
                  {commande.numero_commande}
                </span>
                {getStatusBadge(commande.statut)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>Client :</strong> {(commande as any).client_nom || 'Client inconnu'}
              </p>
              <p>
                <strong>Description :</strong> {(commande as any).description || '-'}
              </p>
              <p>
                <strong>Poids :</strong> {commande.poids || '-'} kg
              </p>
              <p>
                <strong>Prix :</strong> {commande.prix_kg ? `${commande.prix_kg} XOF/kg` : '-'}
              </p>
              <p>
                <strong>Total :</strong>{' '}
                {commande.poids && commande.prix_kg
                  ? ` ${(commande.poids * commande.prix_kg).toFixed(2)} XOF`
                  : '-'}
              </p>
              <p>
                <strong>Réception :</strong> {formatDate(commande.date_reception)}
              </p>
              <p>
                <strong>Livraison prévue :</strong> {formatDate(commande.date_livraison_prevue)}
              </p>

              <div className="flex gap-2 pt-2">
                <Link href={`/dashboard/commandes/${commande.id}`}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex items-center gap-1 hover:bg-blue-50 dark:hover:bg-blue-900"
                  >
                    <Eye className="h-4 w-4 text-blue-600" /> Détails
                  </Button>
                </Link>
                <Link href={`/dashboard/commandes/${commande.id}/edit`}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex items-center gap-1 hover:bg-green-50 dark:hover:bg-green-900"
                  >
                    <Edit className="h-4 w-4 text-green-600" /> Modifier
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
