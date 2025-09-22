import { Database } from './database.types';
import { User } from './user';

export type Organization = Database['public']['Tables']['organizations']['Row'];
export type OrganizationInsert = Database['public']['Tables']['organizations']['Insert'];
export type OrganizationUpdate = Database['public']['Tables']['organizations']['Update'];

export interface OrganizationWithUsers extends Organization {
  users: User[];
}

export interface OrganizationFilters {
  subscription_status?: SubscriptionStatus;
  created_after?: string;
  created_before?: string;
  search?: string;
}

export interface OrganizationsResponse {
  organizations: OrganizationWithUsers[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrganizationFormData {
  name: string;
  subdomain: string;
  subscription_status: SubscriptionStatus;
  subscription_end_date?: string;
}

export interface OrganizationAPIError {
  code: string;
  message: string;
  details?: string;
}

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EXPIRED: 'expired',
  SUSPENDED: 'suspended'
} as const;

export type SubscriptionStatus = typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS];

export interface OrganizationStats {
  total: number;
  active: number;
  inactive: number;
  expired: number;
  suspended: number;
  total_users: number;
  total_clients: number;
  total_commandes: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    clients: number;
    commandes: number;
    users: number;
    storage: string;
  };
}

// Helper functions
export function getSubscriptionStatusDisplayName(status: SubscriptionStatus): string {
  const names: Record<SubscriptionStatus, string> = {
    active: 'Actif',
    inactive: 'Inactif',
    expired: 'Expiré',
    suspended: 'Suspendu'
  };
  return names[status];
}

export function getSubscriptionStatusColor(status: SubscriptionStatus): string {
  const colors: Record<SubscriptionStatus, string> = {
    active: 'text-green-800 bg-green-100',
    inactive: 'text-gray-800 bg-gray-100',
    expired: 'text-red-800 bg-red-100',
    suspended: 'text-yellow-800 bg-yellow-100'
  };
  return colors[status];
}

export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === 'active';
}

export function getDaysUntilExpiration(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function validateSubdomain(subdomain: string): boolean {
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
  return subdomainRegex.test(subdomain) && subdomain.length >= 3 && subdomain.length <= 63;
}

export function getOrganizationPlan(organization: Organization): SubscriptionPlan {
  // Implémentation basique - à adapter avec vos plans réels
  const plans: SubscriptionPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      currency: 'EUR',
      interval: 'month',
      features: ['100 clients', '500 commandes/mois', '2 utilisateurs'],
      limits: { clients: 100, commandes: 500, users: 2, storage: '5GB' }
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 79,
      currency: 'EUR',
      interval: 'month',
      features: ['Clients illimités', 'Commandes illimitées', '5 utilisateurs'],
      limits: { clients: 0, commandes: 0, users: 5, storage: '20GB' }
    }
  ];

  return plans[0]; // Retourne le plan starter par défaut
}