import { Database } from './database.types';
import { Organization } from './organization';

export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type InvitationInsert = Omit<Invitation, 'id' | 'created_at' | 'updated_at'>;
export type InvitationUpdate = Partial<Omit<Invitation, 'id' | 'created_at' | 'updated_at'>>;
export interface UserWithOrganization extends User {
  organization: Organization;
}

export interface UserFilters {
  role?: UserRole;
  is_active?: boolean;
  created_after?: string;
  created_before?: string;
  search?: string;
}

export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: UserRole;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invited_by: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  organizations?: Organization;
  inviter?: User;
}



export interface UsersResponse {
  users: UserWithOrganization[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserFormData {
  email: string;
  role: UserRole;
  organization_id: string;
}

export interface UserInviteData {
  email: string;
  role: UserRole;
}

export interface UserAPIError {
  code: string;
  message: string;
  details?: string;
}

export const USER_ROLE = {
  SUPERADMIN: 'superadmin',
  OWNER: 'owner',
  MANAGER: 'manager'
} as const;

export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE];


export interface UserStats {
  total: number;
  owners: number;
  managers: number;
  agents: number;
  active: number;
  invited: number;
}

// Helper functions
export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    owner: 'Propriétaire',
    manager: 'Manager',
    superadmin: 'Developpeur'
  };
  return names[role];
}

export function getRoleColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    owner: 'text-purple-800 bg-purple-100',
    manager: 'text-blue-800 bg-blue-100',
    superadmin: 'text-green-800 bg-green-100'
  };
  return colors[role];
}

export function canUserManageRoles(userRole: UserRole, targetRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    owner: 3,
    manager: 2,
    superadmin: 1
  };

  return roleHierarchy[userRole] > roleHierarchy[targetRole];
}

export function getUserInitials(user: User): string {
  return user.email
    .split('@')[0]
    .split('.')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function isUserActive(user: User): boolean {
  // Vérifie si l'utilisateur s'est connecté dans les 30 derniers jours
  // Cette logique peut être adaptée selon les besoins
  return true; // Implémentation temporaire
}

export function validateUserEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function getUserPermissions(role: UserRole): {
  canManageUsers: boolean;
  canManageClients: boolean;
  canManageCommandes: boolean;
  canManageSettings: boolean;
  canAccessAdmin: boolean;
} {
  return {
    canManageUsers: role === 'owner',
    canManageClients: true,
    canManageCommandes: true,
    canManageSettings: role === 'owner' || role === 'manager',
    canAccessAdmin: role === 'owner'
  };
}