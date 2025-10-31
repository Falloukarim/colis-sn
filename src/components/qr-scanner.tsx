// src/components/qr-scanner.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, RotateCw, Camera } from 'lucide-react';
import { validateQRCode } from '@/actions/scanner-actions';
import { useToast } from '@/components/ui/use-toast';
import { Commande } from '@/types/database.types';

interface QRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (commande: Commande) => void;
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

  // Réinitialiser complètement l'état du scanner
  const resetScannerState = () => {
    isProcessing.current = false;
    setScanResult(null);
    setError(null);
    setIsScanning(false);
    setIsCaptured(false);
    setScanProgress(0);
  };

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
      
      // S'assurer que l'ancien scanner est bien arrêté
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (e) {
          // Ignorer les erreurs d'arrêt
        }
      }
      
      scannerRef.current = new Html5Qrcode('qr-scanner-container');
      
      await scannerRef.current.start(
        cameraId,
        { 
          fps: 10,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            return { 
              width: Math.min(viewfinderWidth, viewfinderHeight) * 0.8, 
              height: Math.min(viewfinderWidth, viewfinderHeight) * 0.8 
            };
          },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        async (decodedText: string) => {
          if (!isProcessing.current) {
            isProcessing.current = true;
            
            // Animation de capture
            for (let i = 0; i <= 100; i += 25) {
              setScanProgress(i);
              await new Promise(resolve => setTimeout(resolve, 20));
            }
            
            setIsCaptured(true);
            await handleScanSuccess(decodedText);
          }
        },
        (errorMessage: string) => {
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

  // Arrêter proprement le scanner
  const stopScanner = async () => {
    if (!scannerRef.current) return;
    
    try {
      const isScannerRunning = scannerRef.current.getState() && 
        scannerRef.current.getState() === 'SCANNING';
      
      if (isScannerRunning) {
        await scannerRef.current.stop();
      }
      
      // Nettoyer le conteneur
      const container = document.getElementById('qr-scanner-container');
      if (container) {
        container.innerHTML = '';
      }
    } catch (err) {
      console.warn("Avertissement lors de l'arrêt:", err);
    } finally {
      scannerRef.current = null;
      setIsScanning(false);
      setIsCaptured(false);
      setScanProgress(0);
    }
  };

  // Réinitialiser complètement le scanner
  const resetScanner = async () => {
    await stopScanner();
    resetScannerState();
    
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

  // Scan réussi - CORRECTION IMPORTANTE : Toujours arrêter le scanner après scan
  const handleScanSuccess = async (decodedText: string) => {
    try {
      setScanResult(decodedText);
      
      const { success, error, commande } = await validateQRCode(decodedText);
      
      // CORRECTION : Arrêter le scanner dans TOUS les cas
      await stopScanner();
      
      if (success && commande) {
        // Passer la commande au parent
        onScanSuccess(commande);
        
        // Réinitialiser l'état pour la prochaine utilisation
        resetScannerState();
        
        // Fermer le dialog
        setTimeout(() => {
          onOpenChange(false);
        }, 300);
      } else {
        // Afficher l'erreur
        toast({
          title: 'Erreur',
          description: error || 'Erreur de validation',
          variant: 'destructive',
        });
        
        setError(error || 'Erreur de validation');
        
        // NE PAS redémarrer automatiquement
      }
    } catch (error) {
      console.error("Erreur:", error);
      
      // S'assurer que le scanner est arrêté même en cas d'erreur
      await stopScanner();
      setError("Échec de la validation");
      
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la validation',
        variant: 'destructive',
      });
    } finally {
      // S'assurer que le flag de traitement est réinitialisé
      isProcessing.current = false;
    }
  };

  // Gérer l'ouverture/fermeture du dialog
  const handleOpenChange = async (open: boolean) => {
    if (!open) {
      // Fermeture : arrêter le scanner et réinitialiser
      await stopScanner();
      resetScannerState();
    } else {
      // Ouverture : réinitialiser l'état
      resetScannerState();
    }
    
    onOpenChange(open);
  };

  // Initialisation quand le dialog s'ouvre
  useEffect(() => {
    let isMounted = true;
    let scannerInitialized = false;

    const setupScanner = async () => {
      if (open && !scannerInitialized) {
        try {
          scannerInitialized = true;
          resetScannerState();
          
          const cameras = await initScanner();
          if (isMounted && cameras.length > 0) {
            const backCamera = cameras.find(cam => 
              cam.label.toLowerCase().includes('back') || 
              cam.label.toLowerCase().includes('rear') ||
              cam.label.toLowerCase().includes('arrière')
            ) || cameras[0];
            
            setActiveCameraId(backCamera.id);
            await startScanner(backCamera.id);
          }
        } catch (err) {
          console.error('Erreur initialisation scanner:', err);
          if (isMounted) {
            setError("Impossible d'accéder à la caméra");
          }
        }
      }
    };

    if (open) {
      setupScanner();
    }

    return () => {
      isMounted = false;
      if (!open) {
        // Nettoyer à la fermeture
        stopScanner();
        scannerInitialized = false;
      }
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-center">Scanner QR Code</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6">
          {/* Scanner container */}
          <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-border bg-black">
            <div id="qr-scanner-container" className="w-full h-full" />

            {/* Cadre de guidage */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`border-2 ${isCaptured ? 'border-green-500' : 'border-white/50'} rounded-lg w-64 h-64 relative transition-all duration-300`}>
                
                {/* Ligne de balayage */}
                <div 
                  className="absolute left-0 right-0 h-0.5 bg-green-400"
                  style={{ 
                    top: `${scanProgress}%`,
                    opacity: isScanning ? 0.8 : 0,
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

            {/* Indicateur de statut */}
            {!isScanning && !error && open && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Initialisation...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-center p-4">
                  <X className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">{error}</p>
                  <p className="text-xs mt-2">Cliquez sur "Redémarrer" pour réessayer</p>
                </div>
              </div>
            )}
          </div>

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
                {error ? 'Réessayer' : 'Redémarrer'}
              </Button>

              {availableCameras.length > 1 && isScanning && (
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
              {error 
                ? "Une erreur s'est produite. Cliquez sur 'Réessayer' pour scanner à nouveau."
                : isScanning 
                  ? "Centrez le QR code dans le cadre pour scanner" 
                  : "Initialisation du scanner..."}
            </p>
          </div>

          {/* Messages d'état */}
          {scanResult && !error && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
              <Check className="h-4 w-4" />
              QR code détecté - Traitement en cours...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}