import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import DownloadQRButton from '@/components/DownloadQRButtons';

interface PublicQRCodePageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicQRCodePage({ params: resolvedParams }: PublicQRCodePageProps) {
  const { id } = await resolvedParams;
  
  try {
    // Utilisez fetch directement avec l'API REST Supabase
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/commandes?id=eq.${id}&select=*`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        next: { revalidate: 60 }
      }
    );

    if (!response.ok) {
      notFound();
    }

    const data = await response.json();
    const commande = data[0];

    if (!commande || !commande.qr_code) {
      notFound();
    }

    // Récupérer les infos client si nécessaire
    let clientName = 'Client';
    try {
      const clientResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/clients?id=eq.${commande.client_id}&select=nom`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          },
        }
      );
      
      if (clientResponse.ok) {
        const clientData = await clientResponse.json();
        clientName = clientData[0]?.nom || 'Client';
      }
    } catch (clientError) {
      console.error('Error fetching client:', clientError);
    }

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
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
              <p className="font-semibold text-lg">{clientName}</p>
              <p className="text-sm text-gray-600">
                {commande.description || 'Commande'}
              </p>
              
              {commande.poids && commande.prix_kg && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-blue-800 font-semibold">
                    {"Montant à prevoir lors du retrait "} = {commande.poids * commande.prix_kg} XOF
                  </p>
                </div>
              )}

              {commande.statut === 'disponible' && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-green-800 font-semibold">✅ Prête pour retrait</p>
                </div>
              )}

              {commande.statut === 'remis' && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-gray-800 font-semibold">📦 Déjà retirée</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <DownloadQRButton
                qrCode={commande.qr_code}
                filename={`qr-commande-${commande.numero_commande || commande.id.slice(0, 8)}.png`}
              />
              
              <div className="text-center text-sm text-gray-500">
                <p>Présentez vous avec ce Qr lors du retrait </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );

  } catch (error) {
    console.error('Error in public QR page:', error);
    notFound();
  }
}