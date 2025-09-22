'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface DownloadQRButtonProps {
  qrCode: string;
  filename: string;
}

export default function DownloadQRButton({ qrCode, filename }: DownloadQRButtonProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button onClick={handleDownload} className="flex items-center gap-2">
      <Download className="h-4 w-4" />
      Télécharger QR Code
    </Button>
  );
}