'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner'; // ✅ correction ici
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateCommandeStatus, getCommandeById } from '@/actions/commande-actions';

export default function ScanPage() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [commandeInfo, setCommandeInfo] = useState<any>(null);

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true }).catch(() => {
        setError("Accès à la caméra refusé. Veuillez autoriser l'accès à la caméra.");
      });
    } else {
      setError("Votre appareil ne supporte pas la lecture de QR codes");
    }
  }, []);

  const handleScan = async (result: string) => {
    if (result && result !== scanResult) {
      setScanResult(result);
      setLoading(true);
      setError('');

      try {
        const { commande } = await getCommandeById(result);

        if (!commande) {
          setError('QR code invalide. Aucune commande trouvée.');
          setLoading(false);
          return;
        }

        setCommandeInfo(commande);

        if (commande.statut !== 'disponible') {
          setError(`La commande n'est pas disponible. Statut: ${commande.statut}`);
          setLoading(false);
          return;
        }

        const updateResult = await updateCommandeStatus(result, 'remis');

        if (updateResult.success) {
          setSuccess(true);
          setTimeout(() => {
            router.push(`/commandes/${result}`);
          }, 2000);
        } else {
          setError(updateResult.error || 'Erreur lors de la mise à jour de la commande');
        }
      } catch (err) {
        setError('Erreur lors de la lecture du QR code');
        console.error('Scan error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleError = (err: any) => {
    console.error('QR Scanner error:', err);
    setError('Erreur du scanner QR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Scanner QR Code</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Commande marquée comme remise avec succès !
        </div>
      )}

      {commandeInfo && (
        <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded-md">
          <h3 className="font-semibold">Commande #{commandeInfo.id.slice(0, 8)}</h3>
          <p>Client: {commandeInfo.client?.nom}</p>
          <p>Montant: {commandeInfo.montant_total} xof</p>
        </div>
      )}

      <div className="relative">
        {!success && (
          <Scanner
            onScan={(results) => {
              if (results && results.length > 0) {
                handleScan(results[0].rawValue);
              }
            }}
            onError={handleError}
            constraints={{ facingMode: 'environment' }}
          />
        )}

        {loading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
              <p>Traitement en cours...</p>
            </div>
          </div>
        )}
      </div>

      {scanResult && (
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">QR code scanné :</p>
          <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
            {scanResult}
          </p>
        </div>
      )}
    </div>
  );
}
