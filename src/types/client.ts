import { Database } from './database.types';

export type Client = Database['public']['Tables']['clients']['Row'];
export type ClientInsert = Database['public']['Tables']['clients']['Insert'];
export type ClientUpdate = Database['public']['Tables']['clients']['Update'];

export interface ClientWithStats extends Client {
  commandes_count: number;
  commandes_en_cours: number;
  commandes_disponibles: number;
  commandes_remises: number;
  total_montant: number;
}

export interface ClientFilters {
  search?: string;
  statut?: 'actif' | 'inactif';
  created_after?: string;
  created_before?: string;
  has_email?: boolean;
  has_whatsapp?: boolean;
}

export interface ClientsResponse {
  clients: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClientFormData {
  nom: string;
  telephone: string;
  whatsapp?: string;
  email?: string;
}

export interface ClientAPIError {
  code: string;
  message: string;
  details?: string;
}

export const CLIENT_STATUS = {
  ACTIVE: 'actif',
  INACTIVE: 'inactif'
} as const;

export type ClientStatus = typeof CLIENT_STATUS[keyof typeof CLIENT_STATUS];

export interface ClientActivity {
  date: string;
  commandes_count: number;
  montant_total: number;
}

export interface ClientStats {
  total: number;
  with_email: number;
  with_whatsapp: number;
  active: number;
  new_this_month: number;
  average_commandes: number;
}

// Helper functions
export function isClientActive(client: Client): boolean {
  // Un client est considéré actif s'il a eu au moins une commande dans les 30 derniers jours
  // Cette logique peut être adaptée selon les besoins métier
  return true; // Implémentation temporaire
}

export function getClientInitials(client: Client): string {
  return client.nom
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatClientPhone(phone: string): string {
  // Formatage basique du numéro de téléphone
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  return phone;
}

export function validateClientEmail(email?: string): boolean {
  if (!email) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateClientPhone(phone: string): boolean {
  const phoneRegex = /^(\+\d{1,3})?[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}$/;
  return phoneRegex.test(phone);
}