// src/lib/utils/commande.ts

import { Commande } from '@/types/database.types';

/**
 * Détecte si une commande est un service basé sur sa description
 */
export function isService(description: string | null | undefined): boolean {
  if (!description) return false;
  
  const descriptionLower = description.toLowerCase();
  
  // Mots-clés pour les services
  const serviceKeywords = [
    // Technologie et électronique
    'iphone', 'samsung', 'technologie', 'électronique', 'mobile', 'telephone', 'smartphone',
    'tablette', 'ordinateur', 'laptop', 'pc', 'macbook', 'ipad', 'android',
    'apple', 'huawei', 'xiaomi', 'oppo', 'vivo', 'oneplus', 'google pixel',
    
    // Services généraux
    'livraison', 'service', 'transport', 'shipping', 'expédition', 'acheminement',
    'express', 'logistique', 'installation', 'réparation', 'maintenance', 'dépannage',
    'nettoyage', 'lavage', 'entretien', 'réparation', 'sav', 'après-vente',
    
    // Services spécifiques
    'coursier', 'messagerie', 'colis', 'packaging', 'emballage', 'manutention',
    'montage', 'assemblage', 'configuration', 'paramétrage', 'formation',
    
    // Autres services
    'consultation', 'conseil', 'audit', 'expertise', 'diagnostic', 'devis'
  ];
  
  return serviceKeywords.some(keyword => 
    descriptionLower.includes(keyword.toLowerCase())
  );
}

/**
 * Retourne le libellé d'affichage pour le prix selon le type de commande
 */
export function getPrixDisplay(commande: Commande): string {
  if (isService(commande.description)) {
    return `${commande.prix_kg || 0} XOF (service)`;
  }
  return `${commande.prix_kg || 0} XOF/kg`;
}

/**
 * Calcule le montant total d'une commande selon son type
 */
export function calculateMontantTotal(commande: Commande): number {
  if (isService(commande.description)) {
    // Pour les services, montant = quantité × prix fixe
    return (commande.quantite || 0) * (commande.prix_kg || 0);
  } else {
    // Pour les produits, montant = poids × prix/kg
    return (commande.poids || 0) * (commande.prix_kg || 0);
  }
}

/**
 * Vérifie si une commande peut être marquée comme disponible
 */
export function canMarkAsDisponible(commande: Commande, quantite?: string, prixKg?: string): {
  canProceed: boolean;
  reason?: string;
} {
  const isServiceCommande = isService(commande.description);

  if (!isServiceCommande) {
    // Pour les produits, poids et prix sont obligatoires
    if (!quantite || !prixKg) {
      return {
        canProceed: false,
        reason: 'Le poids et le prix sont obligatoires pour les produits'
      };
    }

    const quantiteValue = parseFloat(quantite);
    const prixKgValue = parseFloat(prixKg);

    if (quantiteValue <= 0 || prixKgValue <= 0) {
      return {
        canProceed: false,
        reason: 'Le poids et le prix doivent être supérieurs à 0'
      };
    }
  } else {
    // Pour les services, quantité et prix sont obligatoires
    if (!quantite || !prixKg) {
      return {
        canProceed: false,
        reason: 'La quantité et le prix sont obligatoires pour les services'
      };
    }

    const quantiteValue = parseInt(quantite);
    const prixKgValue = parseFloat(prixKg);

    if (quantiteValue <= 0) {
      return {
        canProceed: false,
        reason: 'La quantité doit être supérieure à 0'
      };
    }
    if (prixKgValue <= 0) {
      return {
        canProceed: false,
        reason: 'Le prix doit être supérieur à 0'
      };
    }
  }

  return { canProceed: true };
}


/**
 * Génère un résumé de commande pour les notifications
 */
export function generateCommandeSummary(commande: Commande & { clients?: any }): {
  title: string;
  message: string;
  montant: number;
} {
  const isServiceCommande = isService(commande.description);
  const montantTotal = calculateMontantTotal(commande);
  const clientNom = commande.clients?.nom || 'Client';

  let title = '';
  let message = '';

  if (isServiceCommande) {
    title = `Service disponible - ${clientNom}`;
    message = `Votre service "${commande.description}" est maintenant disponible. ` +
              `Quantité: ${commande.quantite}, ` +
              `Prix: ${commande.prix_kg} XOF, ` +
              `Total: ${montantTotal} XOF. ` +
              `Présentez votre QR code pour le retrait.`;
  } else {
    title = `Commande disponible - ${clientNom}`;
    message = `Votre commande est maintenant disponible. ` +
              `Poids: ${commande.poids} kg, ` +
              `Prix: ${commande.prix_kg} XOF/kg, ` +
              `Total: ${montantTotal} XOF. ` +
              `Présentez votre QR code pour le retrait.`;
  }

  return {
    title,
    message,
    montant: montantTotal
  };
}


/**
 * Valide les données d'une commande avant mise à jour
 */
export function validateCommandeUpdate(
  commande: Commande,
  newStatus: string,
  quantite?: string,
  prixKg?: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const isServiceCommande = isService(commande.description);

  if (newStatus === 'disponible') {
    if (!isServiceCommande) {
      // Validation pour les produits
      if (!quantite) {
        errors.push('Le poids est obligatoire pour les produits');
      }
      if (!prixKg) {
        errors.push('Le prix est obligatoire pour les produits');
      }

      if (quantite && prixKg) {
        const quantiteValue = parseFloat(quantite);
        const prixKgValue = parseFloat(prixKg);

        if (quantiteValue <= 0) {
          errors.push('Le poids doit être supérieur à 0');
        }
        if (prixKgValue <= 0) {
          errors.push('Le prix doit être supérieur à 0');
        }
      }
    } else {
      // Validation pour les services
      if (!quantite) {
        errors.push('La quantité est obligatoire pour les services');
      }
      if (!prixKg) {
        errors.push('Le prix est obligatoire pour les services');
      }

      if (quantite && prixKg) {
        const quantiteValue = parseInt(quantite);
        const prixKgValue = parseFloat(prixKg);

        if (quantiteValue <= 0) {
          errors.push('La quantité doit être supérieure à 0');
        }
        if (prixKgValue <= 0) {
          errors.push('Le prix doit être supérieur à 0');
        }
      }
    }
  }

  // Empêcher le statut "remis" depuis l'interface
  if (newStatus === 'remis') {
    errors.push('Le statut "Remis" ne peut être défini que via le scan QR code');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}


/**
 * Formate les données de commande pour l'affichage
 */
export function formatCommandeData(commande: Commande & { clients?: any }) {
  const isServiceCommande = isService(commande.description);
  const montantTotal = calculateMontantTotal(commande);

  return {
    ...commande,
    isService: isServiceCommande,
    montantTotal,
    displayPrix: getPrixDisplay(commande),
    displayType: isServiceCommande ? 'Service' : 'Produit',
    typeColor: isServiceCommande ? 'blue' : 'green',
    typeIcon: isServiceCommande ? '🚚' : '📦'
  };
}

/**
 * Obtient la configuration de statut pour l'affichage
 */
export function getStatutConfig(statut: string) {
  const configs = {
    en_cours: {
      label: 'En Cours',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '🔄',
      description: 'En traitement'
    },
    disponible: {
      label: 'Disponible',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '✅',
      description: 'Prête au retrait'
    },
    remis: {
      label: 'Remis',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: '🎉',
      description: 'Livrée'
    }
  };

  return configs[statut as keyof typeof configs] || configs.en_cours;
}

/**
 * Vérifie si une commande peut être modifiée
 */
export function canEditCommande(commande: Commande): boolean {
  // Empêcher l'édition des commandes remises
  return commande.statut !== 'remis';
}

/**
 * Génère les étapes de progression pour une commande
 */
export function getCommandeSteps(statut: string) {
  const steps = [
    { value: 'en_cours', label: 'En Cours', description: 'Commande en traitement' },
    { value: 'disponible', label: 'Disponible', description: 'Prête à être remise' },
    { value: 'remis', label: 'Remis', description: 'Commande livrée' }
  ];

  const currentIndex = steps.findIndex(step => step.value === statut);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  return {
    steps,
    currentIndex,
    progress,
    isCompleted: statut === 'remis'
  };
}