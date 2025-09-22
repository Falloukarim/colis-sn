import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, QrCode, Phone, Mail, Calendar, Package, Scale, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCommandeById } from '@/actions/commande-actions';
import { getStatutDisplayName, getStatutColor, calculateMontantTotal, CommandeStatut } from '@/types/commande';

interface CommandeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CommandeDetailPage({
  params: resolvedParams
}: CommandeDetailPageProps) {
  const { id } = await resolvedParams; // on récupère l'id

  const { commande, error } = await getCommandeById(id);

  if (error || !commande) {
    notFound();
  }

  const montantTotal = calculateMontantTotal(commande);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/commandes">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Détails de la commande</h1>
          <p className="text-gray-600 mt-1">
            Informations complètes sur la commande #{commande.numero_commande || commande.id.slice(0, 8)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations de la commande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Statut:</span>
                <Badge className={getStatutColor(commande.statut as CommandeStatut)}>
                  {getStatutDisplayName(commande.statut as CommandeStatut)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Numéro:</span>
                <span>{commande.numero_commande || 'Non spécifié'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Description:</span>
                <span className="text-right">{commande.description || 'Aucune description'}</span>
              </div>

              {commande.poids && (
                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center gap-2">
                    <Scale className="h-4 w-4" /> Poids:
                  </span>
                  <span>{commande.poids} kg</span>
                </div>
              )}

              {commande.prix_kg && (
                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center gap-2">
                    <Euro className="h-4 w-4" /> Prix au kg:
                  </span>
                  <span>{commande.prix_kg} XOF/kg</span>
                </div>
              )}

              {montantTotal > 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center gap-2">
                    <Euro className="h-4 w-4" /> Montant total:
                  </span>
                  <span className="text-lg font-bold">{montantTotal} xof</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {commande.date_reception && (
                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Date de réception:
                  </span>
                  <span>{new Date(commande.date_reception).toLocaleDateString('fr-FR')}</span>
                </div>
              )}

              {commande.date_livraison_prevue && (
                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Livraison prévue:
                  </span>
                  <span>{new Date(commande.date_livraison_prevue).toLocaleDateString('fr-FR')}</span>
                </div>
              )}

              {commande.date_retrait && (
                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Date de retrait:
                  </span>
                  <span>{new Date(commande.date_retrait).toLocaleDateString('fr-FR')}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="font-medium">Créée le:</span>
                <span>{new Date(commande.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Actions et informations client */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/dashboard/commandes/${commande.id}/edit`} className="w-full">
                <Button className="w-full flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Modifier
                </Button>
              </Link>
              
{commande.qr_code && (
<Link href={`/dashboard/qr/${commande.id}`} target="_blank">
    <Button variant="outline" className="w-full flex items-center gap-2">
      <QrCode className="h-4 w-4" />
      Voir QR Code
    </Button>
  </Link>
)}
            </CardContent>
          </Card>

          {/* Informations client */}
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="font-medium">Nom:</span>
                <p className="font-semibold">{(commande as any).clients?.nom || 'Client inconnu'}</p>
              </div>

              {(commande as any).clients?.telephone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{(commande as any).clients.telephone}</span>
                </div>
              )}

              {(commande as any).clients?.whatsapp && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-500" />
                  <span>WhatsApp: {(commande as any).clients.whatsapp}</span>
                </div>
              )}

              {(commande as any).clients?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span>{(commande as any).clients.email}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statut et actions */}
          <Card>
            <CardHeader>
              <CardTitle>Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Badge className={`text-lg px-4 py-2 ${getStatutColor(commande.statut as CommandeStatut)}`}>
                  {getStatutDisplayName(commande.statut as CommandeStatut)}
                </Badge>
                <p className="text-sm text-gray-500 mt-2">
                  {commande.statut === 'en_cours' && 'En attente de réception et pesée'}
                  {commande.statut === 'disponible' && 'Prête pour retrait par le client'}
                  {commande.statut === 'remis' && 'Commandé récupérée par le client'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}