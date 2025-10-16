// src/components/commandes/CommandActions.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Edit, QrCode, Share2, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CommandActionsProps {
  commandeId: string;
  hasQrCode: boolean;
}

export function CommandActions({ commandeId, hasQrCode }: CommandActionsProps) {
  const router = useRouter();

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
      toast.success('Impression', { description: 'Prêt pour impression' });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Commande #${commandeId}`,
          text: `Détails de la commande ${commandeId}`,
          url: window.location.href,
        });
        toast.success('Partagé', { description: 'Lien partagé avec succès' });
      } catch (error) {
        // L'utilisateur a annulé le partage
        console.log('Partage annulé');
      }
    } else {
      // Fallback pour les navigateurs qui ne supportent pas l'API Share
      navigator.clipboard.writeText(window.location.href);
      toast.success('Copié', { description: 'Lien copié dans le presse-papier' });
    }
  };

  const handleExportPDF = () => {
    toast.info('Fonctionnalité à venir', { 
      description: 'Export PDF bientôt disponible' 
    });
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button 
        onClick={() => router.push(`/dashboard/commandes/${commandeId}/edit`)}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      >
        <Edit className="h-4 w-4" />
        Modifier
      </Button>
      
      {hasQrCode && (
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => window.open(`/dashboard/qr/${commandeId}`, '_blank')}
        >
          <QrCode className="h-4 w-4" />
          QR Code
        </Button>
      )}
      
      <Button 
        variant="outline" 
        className="flex items-center gap-2"
        onClick={handlePrint}
      >
        <Printer className="h-4 w-4" />
        Imprimer
      </Button>
      
      <Button 
        variant="outline" 
        className="flex items-center gap-2"
        onClick={handleShare}
      >
        <Share2 className="h-4 w-4" />
        Partager
      </Button>
      
      <Button 
        variant="outline" 
        className="flex items-center gap-2"
        onClick={handleExportPDF}
      >
        <Download className="h-4 w-4" />
        PDF
      </Button>
    </div>
  );
}