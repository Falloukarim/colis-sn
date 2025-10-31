import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import DownloadQRButton from '@/components/DownloadQRButtons';
import { isService } from '@/lib/utils/commande';

interface PublicQRCodePageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicQRCodePage({ params: resolvedParams }: PublicQRCodePageProps) {
  const { id } = await resolvedParams;
  
  try {
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

    if (!response.ok) notFound();

    const data = await response.json();
    const commande = data[0];

    if (!commande || !commande.qr_code) notFound();

    // Récupération du client avec gestion d'erreur
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

    // Calculs intelligents selon le type
    const isServiceCommande = isService(commande.description);
    
    let montantTotal = 0;
    let detailsMontant = '';
    let badgeConfig = {
      bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
      text: 'text-white',
      icon: '📦',
      label: 'Service'
    };

    if (isServiceCommande) {
      montantTotal = (commande.quantite || 0) * (commande.prix_kg || 0);
      detailsMontant = `${commande.quantite || 0} unités × ${commande.prix_kg || 0} XOF`;
    } else {
      montantTotal = (commande.poids || 0) * (commande.prix_kg || 0);
      detailsMontant = `${commande.poids || 0}kg × ${commande.prix_kg || 0} XOF/kg`;
      badgeConfig = {
        bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
        text: 'text-white',
        icon: '⚖️',
        label: 'Produit'
      };
    }

    // Configuration des statuts avec couleurs harmonieuses
    const statusConfig = {
      disponible: {
        bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
        border: 'border-l-4 border-l-green-500',
        icon: '✅',
        text: 'text-green-800',
        message: 'Prête pour retrait'
      },
      remis: {
        bg: 'bg-gradient-to-r from-gray-50 to-slate-50',
        border: 'border-l-4 border-l-gray-400',
        icon: '📦',
        text: 'text-gray-700',
        message: 'Commande retirée'
      },
      en_cours: {
        bg: 'bg-gradient-to-r from-amber-50 to-orange-50',
        border: 'border-l-4 border-l-amber-500',
        icon: '⏳',
        text: 'text-amber-800',
        message: 'En cours de traitement'
      }
    };

    const status = statusConfig[commande.statut as keyof typeof statusConfig] || statusConfig.en_cours;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 md:p-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {/* Header Sticky avec Backdrop Blur */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/60 pt-[env(safe-area-inset-top)]">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Sécurisé</span>
            </div>
            <div className="text-xs text-gray-500">
              {new Date().toLocaleDateString('fr-FR')}
            </div>
          </div>
        </header>

        {/* Carte Principale */}
        <Card className="w-full max-w-md mx-auto mt-16 mb-8 border-0 shadow-2xl shadow-blue-500/10 backdrop-blur-sm bg-white/90">
          <CardHeader className="text-center pb-4 space-y-3">
            <div className="flex justify-center mb-2">
              <div className={`px-4 py-2 rounded-2xl ${badgeConfig.bg} ${badgeConfig.text} shadow-lg shadow-black/10 backdrop-blur-sm`}>
                <span className="flex items-center space-x-2 text-sm font-semibold">
                  <span>{badgeConfig.icon}</span>
                  <span>{badgeConfig.label}</span>
                </span>
              </div>
            </div>
            
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              QR Code Commande
            </CardTitle>
            <CardDescription className="text-base text-gray-600 leading-relaxed">
              Présentez ce code pour retirer votre commande en toute sécurité
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Carte QR Code avec effet de profondeur */}
            <div className="flex justify-center">
              <div className="bg-white p-6 rounded-2xl shadow-2xl shadow-blue-500/20 border border-gray-100 backdrop-blur-sm transform transition-transform duration-300">
                <div className="relative">
                  <Image
                    src={commande.qr_code}
                    alt={`QR Code pour la commande ${commande.numero_commande}`}
                    width={280}
                    height={280}
                    className="w-full max-w-[280px] h-auto rounded-xl"
                    priority
                  />
                  {/* Overlay de sécurité */}
                  <div className="absolute inset-0 rounded-xl border-2 border-blue-200/50 pointer-events-none"></div>
                </div>
              </div>
            </div>

            {/* Informations Client */}
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-r from-white to-gray-50/80 p-5 rounded-2xl border border-gray-200/60 shadow-sm">
                <p className="font-bold text-xl text-gray-900 mb-1">{clientName}</p>
                <p className="text-gray-600 leading-relaxed">
                  {commande.description || 'Commande sans description'}
                </p>
              </div>
              
              {/* Carte Montant avec gradient élégant */}
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-5 rounded-2xl border border-blue-200/50 shadow-sm">
                <p className="text-blue-800 font-semibold text-sm mb-2">
                  {detailsMontant}
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-blue-900 font-bold text-2xl">
                    {montantTotal.toLocaleString('fr-FR')} XOF
                  </span>
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                </div>
              </div>

              {/* Statut avec indicateur visuel */}
              <div className={`p-5 rounded-2xl ${status.bg} ${status.border} shadow-sm backdrop-blur-sm`}>
                <p className={`font-semibold flex items-center justify-center space-x-2 ${status.text}`}>
                  <span className="text-lg">{status.icon}</span>
                  <span>{status.message}</span>
                </p>
              </div>
            </div>

            {/* Actions avec boutons accessibles */}
            <div className="space-y-4">
              <DownloadQRButton
                qrCode={commande.qr_code}
                filename={`qr-commande-${commande.numero_commande || commande.id.slice(0, 8)}.png`}
              />
              
              {/* Informations contextuelles */}
              <div className="text-center space-y-3">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 p-4 rounded-xl border border-gray-200/60">
                  <p className="text-gray-700 text-sm font-medium">
                    Présentez-vous avec ce QR code lors du retrait
                  </p>
                  <div className="flex items-center justify-center space-x-3 mt-3 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>Sécurisé</span>
                    </span>
                    <span>•</span>
                    <span>N° {commande.numero_commande}</span>
                  </div>
                </div>
                
                {/* Micro-indicateur de sécurité */}
                <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Communication sécurisée • {new Date().getFullYear()}</span>
                </div>
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