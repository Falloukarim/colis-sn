'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, RotateCw, Camera, Scan, CameraOff } from 'lucide-react';
import { validateQRCode } from '@/actions/scanner-actions';
import { useToast } from '@/components/ui/use-toast';

interface QRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: () => void;
}

type Html5QrcodeError = Error & {
  message: string;
  type?: number;
};

export default function QRScanner({ open, onOpenChange, onScanSuccess }: QRScannerProps) {
  const { toast } = useToast();
  const scannerRef = useRef<any>(null);
  const isProcessing = useRef(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string, label: string }>>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCaptured, setIsCaptured] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Initialisation du scanner
  const initScanner = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const cameras = await Html5Qrcode.getCameras();
      if (cameras.length === 0) throw new Error('Aucune caméra disponible');
      
      setAvailableCameras(cameras);
      return cameras;
    } catch (err) {
      const error = err as Html5QrcodeError;
      setError(error.message || "Erreur d'accès à la caméra");
      throw error;
    }
  };

  // Démarrer le scanner
  const startScanner = async (cameraId: string) => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      
      scannerRef.current = new Html5Qrcode('qr-scanner-container');
      
      await scannerRef.current.start(
        cameraId,
        { 
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            return { 
              width: Math.min(viewfinderWidth, viewfinderHeight) * 0.7, 
              height: Math.min(viewfinderWidth, viewfinderHeight) * 0.7 
            };
          },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        async (decodedText: string) => {
          if (!isProcessing.current) {
            isProcessing.current = true;
            
            // Animation de capture
            for (let i = 0; i <= 100; i += 20) {
              setScanProgress(i);
              await new Promise(resolve => setTimeout(resolve, 30));
            }
            
            setIsCaptured(true);
            await handleScanSuccess(decodedText);
          }
        },
        () => {
          setScanProgress(0);
        }
      );
      
      setIsScanning(true);
      setError(null);
    } catch (err) {
      const error = err as Html5QrcodeError;
      setError(error.message || 'Échec du démarrage du scanner');
      setIsScanning(false);
    }
  };

  // Arrêter proprement
  const stopScanner = async () => {
    if (!scannerRef.current) return;
    
    try {
      await scannerRef.current.stop();
      await scannerRef.current.clear();
    } catch (err) {
      console.error("Erreur arrêt:", err);
    } finally {
      scannerRef.current = null;
      setIsScanning(false);
      setIsCaptured(false);
      setScanProgress(0);
    }
  };

  const resetScanner = async () => {
    await stopScanner();
    isProcessing.current = false;
    setScanResult(null);
    setError(null);
    
    if (activeCameraId) {
      await startScanner(activeCameraId);
    }
  };

  const switchCamera = async () => {
    if (availableCameras.length < 2) return;
    
    const currentIndex = availableCameras.findIndex(cam => cam.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCameraId = availableCameras[nextIndex].id;
    
    setActiveCameraId(nextCameraId);
    await resetScanner();
  };

  // Scan réussi
  const handleScanSuccess = async (decodedText: string) => {
    try {
      setScanResult(decodedText);
      
      const { success, error, commande } = await validateQRCode(decodedText);
      
      if (success && commande) {
        toast({
          title: 'Succès',
          description: `Commande #${commande.numero_commande} marquée comme remise`,
        });
        
        onScanSuccess();
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      } else {
        toast({
          title: 'Erreur',
          description: error || 'Erreur de validation',
          variant: 'destructive',
        });
        setTimeout(() => {
          resetScanner();
        }, 1000);
      }
    } catch (error) {
      console.error("Erreur:", error);
      setError("Échec de la validation");
      setTimeout(() => {
        resetScanner();
      }, 1000);
    }
  };

  // Initialisation
  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      if (open) {
        try {
          const cameras = await initScanner();
          if (isMounted && cameras.length > 0) {
            const backCamera = cameras.find(cam => 
              cam.label.toLowerCase().includes('back') || 
              cam.label.toLowerCase().includes('rear')
            ) || cameras[0];
            
            setActiveCameraId(backCamera.id);
            await startScanner(backCamera.id);
          }
        } catch (err) {
          console.error('Erreur init:', err);
        }
      }
    };

    setup();

    return () => {
      isMounted = false;
      if (!open) {
        stopScanner();
      }
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        stopScanner();
      }
    }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-center">Scanner QR Code</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6">
          {/* Scanner container */}
          <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-border bg-black">
            <div id="qr-scanner-container" className="w-full h-full" />

            {/* Cadre de guidage minimaliste */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`border-2 ${isCaptured ? 'border-green-500' : 'border-white/50'} rounded-lg w-64 h-64 relative transition-all duration-300`}>
                
                {/* Ligne de balayage horizontale discrète */}
                <div 
                  className="absolute left-0 right-0 h-0.5 bg-green-400"
                  style={{ 
                    top: `${scanProgress}%`,
                    opacity: 0.8,
                    transition: 'top 0.1s ease'
                  }}
                />
                
                {/* Animation de capture */}
                {isCaptured && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-green-500 rounded-full p-2 animate-pulse">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Indicateur de progression */}
            {scanProgress > 0 && scanProgress < 100 && (
              <div className="absolute top-3 left-3 bg-black/80 text-white px-2 py-1 rounded text-xs">
                {scanProgress}%
              </div>
            )}
          </div>

          {/* Boutons de contrôle */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Button 
                onClick={resetScanner} 
                variant="outline" 
                className="flex-1 gap-2" 
                disabled={isProcessing.current}
                size="sm"
              >
                <RotateCw className={`h-4 w-4 ${isProcessing.current ? 'animate-spin' : ''}`} />
                Redémarrer
              </Button>

              {availableCameras.length > 1 && (
                <Button 
                  onClick={switchCamera} 
                  variant="outline" 
                  className="flex-1 gap-2" 
                  disabled={isProcessing.current}
                  size="sm"
                >
                  <Camera className="h-4 w-4" />
                  Changer
                </Button>
              )}
            </div>

            {/* Instructions */}
            <p className="text-center text-sm text-muted-foreground">
              Centrez le QR code dans le cadre pour scanner
            </p>
          </div>

          {/* Messages d'état */}
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm flex items-center gap-2">
              <X className="h-4 w-4" />
              {error}
            </div>
          )}

          {scanResult && !error && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
              <Check className="h-4 w-4" />
              QR code détecté
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}