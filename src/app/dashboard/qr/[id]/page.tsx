import { notFound } from 'next/navigation';
import { getCommandeById } from '@/actions/commande-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import DownloadQrButton from '@/components/DownloadQrButton';

interface QRCodePageProps {
  params: Promise<{ id: string }>;
}

export default async function QRCodePage({ params: resolvedParams }: QRCodePageProps) {
  const { id } = await resolvedParams;
  const { commande, error } = await getCommandeById(id);

  if (error || !commande || !commande.qr_code) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>QR Code de la Commande</CardTitle>
          <CardDescription>
            Code de retrait pour la commande #{commande.numero_commande || commande.id.slice(0, 8)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg border">
              <Image
                src={commande.qr_code}
                alt={`QR Code pour la commande ${commande.numero_commande}`}
                width={256}
                height={256}
                className="w-64 h-64"
              />
            </div>
          </div>

          {/* Informations */}
          <div className="space-y-2 text-center">
            <p className="font-semibold">{(commande as any).clients?.nom || 'Client inconnu'}</p>
            <p className="text-sm text-gray-600">
              {commande.description || 'Aucune description'}
            </p>
            {commande.poids && commande.prix_kg && (
              <p className="text-sm">
                {"montant à prevoir lors du retrait "}= {commande.poids * commande.prix_kg}xof
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <DownloadQrButton
              qrCode={commande.qr_code}
              filename={`qr-commande-${commande.numero_commande || commande.id.slice(0, 8)}.png`}
            />

            <Link href={`/dashboard/commandes/${commande.id}`}>
              <Button variant="outline" className="w-full flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour à la commande
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
