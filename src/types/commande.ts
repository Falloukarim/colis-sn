import { Database } from './database.types';
import { Client } from './client';

// Type de base généré par Supabase
export type CommandeBase = Database['public']['Tables']['commandes']['Row'];

// Type étendu avec les relations - NE PAS redéfinir les champs existants
export interface Commande extends CommandeBase {
  clients?: Client;
  client_nom?: string;
  // Ne pas redéfinir les champs qui existent déjà dans CommandeBase
  // Ils hériteront automatiquement du type correct
}

export type CommandeInsert = Database['public']['Tables']['commandes']['Insert'];
export type CommandeUpdate = Database['public']['Tables']['commandes']['Update'];

export interface CommandeWithClient extends Commande {
  client: Client;
}

export interface CommandeFilters {
  statut?: CommandeStatut;
  client_id?: string;
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;
  search?: string;
}

export interface CommandesResponse {
  commandes: CommandeWithClient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CommandeFormData {
  client_id: string;
  statut: CommandeStatut;
  poids?: number;
  prix_kg?: number;
}

export interface CommandeStatusUpdate {
  statut: CommandeStatut;
  poids?: number;
  prix_kg?: number;
}

export interface CommandeAPIError {
  code: string;
  message: string;
  details?: string;
}

export const COMMANDE_STATUT = {
  EN_COURS: 'en_cours',
  DISPONIBLE: 'disponible',
  REMIS: 'remis'
} as const;

export type CommandeStatut = typeof COMMANDE_STATUT[keyof typeof COMMANDE_STATUT];

export interface CommandeStats {
  total: number;
  en_cours: number;
  disponibles: number;
  remises: number;
  montant_total: number;
  moyenne_montant: number;
  moyenne_poids: number;
}

export interface DailyStats {
  date: string;
  commandes_count: number;
  montant_total: number;
}

// Helper functions
export function getStatutDisplayName(statut: CommandeStatut): string {
  const names: Record<CommandeStatut, string> = {
    en_cours: 'En cours',
    disponible: 'Disponible',
    remis: 'Remis'
  };
  return names[statut];
}

export function getStatutColor(statut: CommandeStatut): string {
  const colors: Record<CommandeStatut, string> = {
    en_cours: 'text-yellow-800 bg-yellow-100',
    disponible: 'text-green-800 bg-green-100',
    remis: 'text-blue-800 bg-blue-100'
  };
  return colors[statut];
}

export function calculateMontantTotal(commande: Commande): number {
  if (!commande.poids || !commande.prix_kg) return 0;
  return Math.round(commande.poids * commande.prix_kg * 100) / 100;
}

export function isValidStatutTransition(
  currentStatut: CommandeStatut,
  newStatut: CommandeStatut
): boolean {
  const allowedTransitions: Record<CommandeStatut, CommandeStatut[]> = {
    en_cours: ['disponible', 'remis'],
    disponible: ['remis'],
    remis: []
  };

  return allowedTransitions[currentStatut].includes(newStatut);
}

export function canUpdateToStatut(
  commande: Commande,
  newStatut: CommandeStatut
): { allowed: boolean; reason?: string } {
  if (!isValidStatutTransition(commande.statut as CommandeStatut, newStatut)) {
    return {
      allowed: false,
      reason: `Transition non autorisée de ${commande.statut} à ${newStatut}`
    };
  }

  if (newStatut === 'disponible' || newStatut === 'remis') {
    if (!commande.poids || commande.poids <= 0) {
      return { allowed: false, reason: 'Le poids est requis' };
    }
    if (!commande.prix_kg || commande.prix_kg <= 0) {
      return { allowed: false, reason: 'Le prix au kg est requis' };
    }
  }

  return { allowed: true };
}

export function formatCommandeId(id: string): string {
  return `CMD-${id.slice(0, 8).toUpperCase()}`;
}