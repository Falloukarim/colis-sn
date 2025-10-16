// src/components/commandes/QuickActions.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Edit, QrCode, Share2, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface QuickActionsProps {
  commandeId: string;
  hasQrCode: boolean;
}

export function QuickActions({ commandeId, hasQrCode }: QuickActionsProps) {
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
        console.log('Partage annulé');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Copié', { description: 'Lien copié dans le presse-papier' });
    }
  };

  return (
    <div className="space-y-3">
      <Button 
        variant="outline" 
        className="w-full justify-start gap-2"
        onClick={() => router.push(`/dashboard/commandes/${commandeId}/edit`)}
      >
        <Edit className="h-4 w-4" />
        Modifier la commande
      </Button>
      
      {hasQrCode && (
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          onClick={() => window.open(`/dashboard/qr/${commandeId}`, '_blank')}
        >
          <QrCode className="h-4 w-4" />
          Voir QR Code
        </Button>
      )}
      
      <Button 
        variant="outline" 
        className="w-full justify-start gap-2"
        onClick={handleShare}
      >
        <Share2 className="h-4 w-4" />
        Partager
      </Button>
      
      <Button 
        variant="outline" 
        className="w-full justify-start gap-2"
        onClick={handlePrint}
      >
        <Printer className="h-4 w-4" />
        Imprimer
      </Button>
    </div>
  );
}