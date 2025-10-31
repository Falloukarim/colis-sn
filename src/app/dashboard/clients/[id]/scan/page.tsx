'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner'; 
import { 
  ArrowLeft, 
  CheckCircle, 
  Package, 
  Truck, 
  User, 
  DollarSign, 
  Scale, 
  Hash, 
  Calendar,
  Scan,
  Camera,
  CameraOff,
  Zap,
  Shield,
  Clock,
  BadgeCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { updateCommandeStatus, getCommandeById } from '@/actions/commande-actions';
import { isService } from '@/lib/utils/commande';
import { cn } from '@/lib/utils';

export default function ScanPage() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [commandeInfo, setCommandeInfo] = useState<any>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [scanCount, setScanCount] = useState(0);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    const initializeCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            } 
          });
          setCameraEnabled(true);
          // Cleanup stream when component unmounts
          return () => {
            stream.getTracks().forEach(track => track.stop());
          };
        } else {
          setError("Votre appareil ne supporte pas la lecture de QR codes");
        }
      } catch (err) {
        setError("Accès à la caméra refusé. Veuillez autoriser l'accès à la caméra.");
        setCameraEnabled(false);
      }
    };

    initializeCamera();
  }, []);

  const handleScan = async (result: string) => {
    const now = Date.now();
    // Anti-spam: empêcher les scans trop rapprochés (500ms)
    if (now - lastScanTime < 500) return;
    
    if (result && result !== scanResult && !loading && !success) {
      setLastScanTime(now);
      setScanResult(result);
      setLoading(true);
      setError('');
      setCommandeInfo(null);
      setScanCount(prev => prev + 1);

      try {
        // Animation de scan réussi
        const commandeId = extractCommandeId(result);
        
        const { commande, error: fetchError } = await getCommandeById(commandeId);

        if (fetchError || !commande) {
          setError('QR code invalide. Aucune commande trouvée.');
          setLoading(false);
          return;
        }

        setCommandeInfo(commande);

        if (commande.statut !== 'disponible') {
          const statutMessages = {
            'en_cours': 'en cours de traitement',
            'remis': 'déjà remise',
            'disponible': 'disponible'
          };
          
          setError(`La commande n'est pas disponible. Statut: ${statutMessages[commande.statut as keyof typeof statutMessages] || commande.statut}`);
          setLoading(false);
          return;
        }

        const updateResult = await updateCommandeStatus(commandeId, 'remis');

        if (updateResult.success) {
          setSuccess(true);
          setTimeout(() => {
            router.push(`/dashboard/commandes/${commandeId}`);
          }, 3000);
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

  const extractCommandeId = (result: string): string => {
    if (result.includes('/qr/public/')) {
      const parts = result.split('/qr/public/');
      return parts[1]?.split('?')[0] || result;
    }
    return result;
  };

  const handleError = (err: any) => {
    console.error('QR Scanner error:', err);
    setError('Erreur du scanner QR. Veuillez réessayer.');
  };

  const toggleCamera = () => {
    setCameraActive(!cameraActive);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Non spécifiée';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isServiceCommande = commandeInfo ? isService(commandeInfo.description) : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 safe-area-padding">
      {/* Header Sticky avec Glass Effect */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 safe-area-top">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 py-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.back()} 
              className="rounded-xl hover:bg-gray-100/80 transition-all duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Scanner QR Code
              </h1>
              <p className="text-gray-600 text-sm truncate">
                Scannez pour marquer une commande comme remise
              </p>
            </div>

            {/* Indicateurs */}
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                cameraEnabled 
                  ? "bg-green-100 text-green-700 border border-green-200" 
                  : "bg-red-100 text-red-700 border border-red-200"
              )}>
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full animate-pulse",
                  cameraEnabled ? "bg-green-500" : "bg-red-500"
                )} />
                {cameraEnabled ? "Caméra active" : "Caméra inactive"}
              </div>
              
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-xs font-medium">
                <Scan className="h-3 w-3" />
                {scanCount}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Alertes Animées */}
        {error && (
          <div className="animate-in slide-in-from-top duration-500">
            <Card className="border-red-200/80 bg-red-50/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-red-800">{error}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setError('')}
                    className="text-red-600 hover:text-red-800 hover:bg-red-100"
                  >
                    ×
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {success && commandeInfo && (
          <div className="animate-in slide-in-from-top duration-500">
            <Card className="border-green-200/80 bg-green-50/80 backdrop-blur-sm shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900 text-lg">
                      ✅ Commande #{commandeInfo.numero_commande} remise !
                    </h3>
                    <p className="text-green-700 mt-1">
                      La commande a été marquée comme remise avec succès.
                    </p>
                    <Progress value={100} className="mt-3 h-1 bg-green-200" />
                    <p className="text-green-600 text-sm mt-2">
                      Redirection dans 3 secondes...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Scanner Section */}
        {!success && cameraEnabled && (
          <div className="space-y-4">
            {/* Contrôles Camera */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Zap className="h-4 w-4 text-yellow-500" />
                Scanner automatique activé
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleCamera}
                className="rounded-full gap-2"
              >
                {cameraActive ? (
                  <>
                    <CameraOff className="h-4 w-4" />
                    Désactiver
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    Activer
                  </>
                )}
              </Button>
            </div>

            {/* Scanner avec Design Premium */}
            <Card className="border-0 shadow-2xl shadow-blue-500/10 backdrop-blur-sm bg-white/90 overflow-hidden">
              <CardHeader className="pb-4 border-b border-gray-100">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Scan className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div>Scanner QR Code</div>
                    <CardDescription className="text-base">
                      Positionnez le QR code dans le cadre de scan
                    </CardDescription>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="relative bg-black rounded-b-lg overflow-hidden">
                  {cameraActive ? (
                    <>
                      <Scanner
                        onScan={(results) => {
                          if (results && results.length > 0) {
                            handleScan(results[0].rawValue);
                          }
                        }}
                        onError={handleError}
                        constraints={{ 
                          facingMode: 'environment',
                          aspectRatio: 1 
                        }}
                        styles={{
                          container: {
                            width: '100%',
                            height: '400px',
                            position: 'relative'
                          },
                          video: {
                            objectFit: 'cover',
                            filter: 'contrast(1.1) brightness(1.1)'
                          }
                        }}
                      />

                      {/* Overlay de Chargement */}
                      {loading && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                          <div className="text-white text-center space-y-4">
                            <div className="relative">
                              <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
                              <CheckCircle className="w-8 h-8 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <div>
                              <p className="text-lg font-semibold">Validation en cours</p>
                              <p className="text-sm opacity-80 mt-1">Traitement de la commande...</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cadre de Visée Animé */}
                      {!loading && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="relative w-64 h-64">
                            {/* Cadre principal */}
                            <div className="absolute inset-0 border-2 border-white/80 rounded-xl shadow-2xl"></div>
                            
                            {/* Coins animés */}
                            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-blue-400 rounded-tl-lg animate-pulse"></div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-blue-400 rounded-tr-lg animate-pulse"></div>
                            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-blue-400 rounded-bl-lg animate-pulse"></div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-blue-400 rounded-br-lg animate-pulse"></div>
                            
                            {/* Ligne de scan animée */}
                            <div className="absolute left-2 right-2 h-0.5 bg-blue-400/60 rounded-full animate-scan"></div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-96 flex items-center justify-center bg-gray-900">
                      <div className="text-center text-white space-y-3">
                        <CameraOff className="h-12 w-12 mx-auto text-gray-400" />
                        <p className="text-lg font-semibold">Caméra désactivée</p>
                        <Button onClick={toggleCamera} className="gap-2">
                          <Camera className="h-4 w-4" />
                          Activer la caméra
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Statistiques en temps réel */}
                <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 border-t border-gray-100">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span>Scan sécurisé</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span>Scans: {scanCount}</span>
                      <span>•</span>
                      <span>{new Date().toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Informations de la Commande Scannée */}
        {commandeInfo && (
          <div className="animate-in slide-in-from-bottom duration-500">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      {isServiceCommande ? (
                        <div className="p-2 bg-blue-100 rounded-xl">
                          <Truck className="h-6 w-6 text-blue-600" />
                        </div>
                      ) : (
                        <div className="p-2 bg-green-100 rounded-xl">
                          <Package className="h-6 w-6 text-green-600" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          Commande #{commandeInfo.numero_commande}
                          <Badge className={cn(
                            "text-xs font-semibold",
                            isServiceCommande 
                              ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                              : 'bg-green-100 text-green-800 border border-green-200'
                          )}>
                            {isServiceCommande ? '📦 Service' : '⚖️ Produit'}
                          </Badge>
                        </div>
                        <CardDescription>
                          Scannée à {new Date().toLocaleTimeString('fr-FR')}
                        </CardDescription>
                      </div>
                    </CardTitle>
                  </div>
                  <Badge className={cn(
                    "text-xs font-semibold px-3 py-1.5",
                    commandeInfo.statut === 'disponible' ? 'bg-green-100 text-green-800 border border-green-200' :
                    commandeInfo.statut === 'remis' ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                    'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  )}>
                    {commandeInfo.statut === 'disponible' ? '✅ Disponible' :
                     commandeInfo.statut === 'remis' ? '📦 Remise' :
                     '⏳ En cours'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Grid d'informations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Informations Client */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100/30 rounded-xl border border-blue-200/50">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900">
                          {commandeInfo.clients?.nom || 'Client inconnu'}
                        </p>
                        <p className="text-sm text-blue-600">Client</p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100/30 rounded-xl border border-gray-200/50">
                      <p className="text-sm text-gray-700 font-medium">{commandeInfo.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Description</p>
                    </div>
                  </div>

                  {/* Détails Financiers */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Poids/Quantité */}
                      <div className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border",
                        isServiceCommande 
                          ? "bg-blue-50 border-blue-200/50" 
                          : "bg-green-50 border-green-200/50"
                      )}>
                        <div className={cn(
                          "p-2 rounded-lg",
                          isServiceCommande ? "bg-blue-100" : "bg-green-100"
                        )}>
                          {isServiceCommande ? (
                            <Hash className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Scale className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-lg">
                            {isServiceCommande 
                              ? (commandeInfo.quantite || 0)
                              : `${commandeInfo.poids || 0} kg`
                            }
                          </p>
                          <p className={cn(
                            "text-xs font-medium",
                            isServiceCommande ? "text-blue-600" : "text-green-600"
                          )}>
                            {isServiceCommande ? 'Quantité' : 'Poids'}
                          </p>
                        </div>
                      </div>

                      {/* Prix Unitaire */}
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-amber-100/30 rounded-xl border border-amber-200/50">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <DollarSign className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">
                            {commandeInfo.prix_kg ? `${commandeInfo.prix_kg.toLocaleString('fr-FR')}` : '-'}
                          </p>
                          <p className="text-xs text-amber-600 font-medium">XOF</p>
                        </div>
                      </div>
                    </div>

                    {/* Montant Total */}
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100/30 rounded-xl border border-purple-200/50">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <BadgeCheck className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-purple-600 font-medium">Montant Total</p>
                        <p className="font-bold text-xl text-purple-900">
                          {commandeInfo.montant_total ? `${commandeInfo.montant_total.toLocaleString('fr-FR')} XOF` : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100/30 rounded-xl border border-gray-200/50">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatDate(commandeInfo.date_reception)}</p>
                      <p className="text-xs text-gray-600">Date de réception</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100/30 rounded-xl border border-gray-200/50">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Clock className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatDate(commandeInfo.date_livraison_prevue)}</p>
                      <p className="text-xs text-gray-600">Livraison prévue</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Instructions et Guide */}
        {!success && (
          <Card className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-blue-200/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { step: 1, text: "Positionnez le QR code dans le cadre de scan", icon: "🎯" },
                  { step: 2, text: "Maintenez stable jusqu'à la confirmation audio", icon: "📱" },
                  { step: 3, text: "La commande sera automatiquement marquée remise", icon: "✅" }
                ].map((item) => (
                  <div key={item.step} className="text-center group">
                    <div className="w-12 h-12 bg-white border-2 border-blue-200 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200 shadow-sm">
                      <span className="text-lg">{item.icon}</span>
                    </div>
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2">
                      {item.step}
                    </div>
                    <p className="text-sm text-blue-700 font-medium leading-tight">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Styles CSS pour l'animation de scan */}
      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }
        .safe-area-padding {
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>
  );
}