// src/app/dashboard/commandes/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Package, 
  Scale, 
  DollarSign,
  User,
  Truck,
  CheckCircle,
  Clock,
  Calendar,
  Mail,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getCommandeById } from '@/actions/commande-actions';
import { CommandActions } from '@/components/commandes/CommandActions';
import { QuickActions } from '@/components/commandes/QuickActions';
import { 
  isService, 
  calculateMontantTotal,
  getStatutConfig,
  formatCommandeData 
} from '@/lib/utils/commande';

interface CommandeDetailPageProps {
  params: Promise<{ id: string }>;
}

// Définir les étapes avec les icônes localement
const STATUT_STEPS = [
  { value: 'en_cours' as const, label: 'En Cours', icon: Clock, description: 'En traitement' },
  { value: 'disponible' as const, label: 'Disponible', icon: Package, description: 'Prête au retrait' },
  { value: 'remis' as const, label: 'Remis', icon: CheckCircle, description: 'Livrée' }
];

export default async function CommandeDetailPage({
  params: resolvedParams
}: CommandeDetailPageProps) {
  const { id } = await resolvedParams;

  const { commande, error } = await getCommandeById(id);

  if (error || !commande) {
    notFound();
  }

  // Formater les données de la commande
  const formattedCommande = formatCommandeData(commande);
  const statutConfig = getStatutConfig(commande.statut);

  // Calculer la progression manuellement
  const currentStatutIndex = STATUT_STEPS.findIndex(step => step.value === commande.statut);
  const progressValue = ((currentStatutIndex + 1) / STATUT_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 border border-white/20 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Link href="/dashboard/commandes">
                <Button variant="outline" size="icon" className="rounded-full">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Détails de la Commande
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Commande #{commande.numero_commande || commande.id.slice(0, 8)}
                  {formattedCommande.isService && (
                    <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                      Service
                    </Badge>
                  )}
                </p>
              </div>
            </div>

            <CommandActions 
              commandeId={commande.id} 
              hasQrCode={!!commande.qr_code} 
            />
          </div>

          {/* Progression */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm text-gray-600 gap-1">
              <span>Progression de la commande</span>
              <span>{currentStatutIndex + 1}/{STATUT_STEPS.length} étapes</span>
            </div>
            <Progress value={progressValue} className="h-2" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {STATUT_STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = commande.statut === step.value;
                const isCompleted = index <= currentStatutIndex;

                return (
                  <div
                    key={step.value}
                    className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border-2 transition-all duration-200 ${
                      isActive 
                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                        : isCompleted
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                      isActive 
                        ? 'bg-blue-500 text-white' 
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      <StepIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-xs sm:text-sm ${
                        isActive ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-gray-700'
                      }`}>
                        {step.label}
                      </div>
                      <div className="text-xs text-gray-500 hidden sm:block">
                        {step.description}
                      </div>
                    </div>
                    {isCompleted && (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 hidden sm:block" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Layout principal */}
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Carte Informations générales */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Informations Générales
                  {formattedCommande.isService && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Service
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">Statut</span>
                      <Badge className={`text-xs sm:text-sm ${statutConfig.color}`}>
                        {statutConfig.icon} {statutConfig.label}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">Numéro</span>
                      <span className="font-mono font-bold text-blue-600 text-sm sm:text-base">
                        {commande.numero_commande || 'N/A'}
                      </span>
                    </div>

                    {commande.poids && (
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                        <span className="font-medium text-blue-800 flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                          <Scale className="h-3 w-3 sm:h-4 sm:w-4" /> 
                          {formattedCommande.isService ? 'Poids (optionnel)' : 'Poids'}
                        </span>
                        <span className="font-bold text-blue-800 text-sm sm:text-base">{commande.poids} kg</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {commande.prix_kg && (
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                        <span className="font-medium text-green-800 flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" /> 
                          {formattedCommande.isService ? 'Prix du service' : 'Prix au kg'}
                        </span>
                        <span className="font-bold text-green-800 text-sm sm:text-base">
                          {formattedCommande.displayPrix}
                        </span>
                      </div>
                    )}

                    {formattedCommande.montantTotal > 0 && (
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg text-white">
                        <span className="font-medium flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" /> Montant total
                        </span>
                        <span className="text-lg sm:text-xl font-bold">{formattedCommande.montantTotal} XOF</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">Créée le</span>
                      <span className="text-sm sm:text-base">
                        {new Date(commande.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {commande.description && (
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-gray-100 rounded-xl">
                    <span className="font-medium text-gray-700 mb-2 block text-sm sm:text-base">Description</span>
                    <p className="text-gray-800 leading-relaxed text-sm sm:text-base">{commande.description}</p>
                    {formattedCommande.isService && (
                      <div className="mt-2 flex items-center gap-2 text-blue-600 text-sm">
                        <Truck className="h-4 w-4" />
                        <span>Commande de service - Le poids n'est pas obligatoire</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Carte Dates importantes */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  Dates Importantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {commande.date_reception && (
                    <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl">
                      <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto mb-2" />
                      <div className="font-semibold text-blue-800 text-sm sm:text-base">Réception</div>
                      <div className="text-xs sm:text-sm text-blue-600">
                        {new Date(commande.date_reception).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  )}

                  {commande.date_livraison_prevue && (
                    <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl">
                      <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600 mx-auto mb-2" />
                      <div className="font-semibold text-amber-800 text-sm sm:text-base">Livraison prévue</div>
                      <div className="text-xs sm:text-sm text-amber-600">
                        {new Date(commande.date_livraison_prevue).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  )}

                  {commande.date_retrait && (
                    <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl">
                      <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mx-auto mb-2" />
                      <div className="font-semibold text-green-800 text-sm sm:text-base">Retrait effectué</div>
                      <div className="text-xs sm:text-sm text-green-600">
                        {new Date(commande.date_retrait).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Carte Client */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  Informations Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-violet-100 rounded-lg">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-purple-900 text-sm sm:text-base">
                      {(commande as any).clients?.nom || 'Client inconnu'}
                    </div>
                    <div className="text-xs sm:text-sm text-purple-700">Client</div>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {(commande as any).clients?.telephone && (
                    <div className="flex items-center gap-2 sm:gap-3 p-2 text-gray-700 text-sm sm:text-base">
                      <Phone className="h-4 w-4 text-blue-500" />
                      <span>{(commande as any).clients.telephone}</span>
                    </div>
                  )}

                  {(commande as any).clients?.whatsapp && (
                    <div className="flex items-center gap-2 sm:gap-3 p-2 text-gray-700 text-sm sm:text-base">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <Phone className="h-3 w-3 text-white" />
                      </div>
                      <span>{(commande as any).clients.whatsapp}</span>
                    </div>
                  )}

                  {(commande as any).clients?.email && (
                    <div className="flex items-center gap-2 sm:gap-3 p-2 text-gray-700 text-sm sm:text-base">
                      <Mail className="h-4 w-4 text-red-500" />
                      <span className="truncate">{(commande as any).clients.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Carte Actions rapides */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  Actions Rapides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuickActions 
                  commandeId={commande.id} 
                  hasQrCode={!!commande.qr_code} 
                />
              </CardContent>
            </Card>

            {/* Carte Statut */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  Statut Actuel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2 sm:space-y-3">
                  <Badge className={`text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 ${statutConfig.color}`}>
                    {statutConfig.icon} {statutConfig.label}
                  </Badge>
                  
                  <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                    {commande.statut === 'en_cours' && (
                      <>
                        <p>🔄 En attente de réception et pesée</p>
                        <p className="text-xs">
                          {formattedCommande.isService 
                            ? 'Service en cours de traitement' 
                            : 'Produit en cours de traitement'
                          }
                        </p>
                      </>
                    )}
                    {commande.statut === 'disponible' && (
                      <>
                        <p>✅ Prête pour retrait</p>
                        <p className="text-xs">Le client peut venir récupérer</p>
                      </>
                    )}
                    {commande.statut === 'remis' && (
                      <>
                        <p>🎉 {formattedCommande.isService ? 'Service terminé' : 'Commande récupérée'}</p>
                        <p className="text-xs">Transaction terminée</p>
                      </>
                    )}
                  </div>

                  {commande.statut === 'remis' && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-800">
                        ✅ Statut défini par scan QR code
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}