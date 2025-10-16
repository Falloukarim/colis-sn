export interface Organization {
  id: string;
  name: string;
  subdomain: string;
  subscription_status: 'active' | 'inactive' | 'expired' | 'suspended';
  subscription_end_date: string | null;
  created_at: string;
  updated_at: string;
  address?: string | null;
  phone?: string | null;
}

export interface User {
  id: string;
  email: string;
  organization_id: string;
  role: 'owner' | 'manager' | 'agent';
  created_at: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
}

export interface PrixKg {
  id: string;
  organization_id: string;
  nom: string;
  prix: number;
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  organization_id: string;
  nom: string;
  telephone: string;
  whatsapp: string | null;
  email: string | null;
  adresse: string | null; 
  created_at: string;
}

export interface Commande {
  id: string;
  organization_id: string;
  client_id: string;
  statut: 'en_cours' | 'disponible' | 'remis';
  poids: number | null;
  prix_kg: number | null;
  montant_total: number | null;
  qr_code: string | null;
  numero_commande: string;
  date_retrait: string | null;
  date_reception: string | null;
  created_at: string;
  updated_at: string;
  scanned_by?: string | null;
  scanned_at?: string | null;
  date_livraison_prevue?: string | null;
  description?: string | null;
}

export interface Notification {
  id: string;
  commande_id: string;
  type: 'sms' | 'whatsapp' | 'email';
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
  message?: string | null;
}

// Ajoutez l'interface Invitation
export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: 'manager' | 'agent';
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invited_by: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      organizations: {
        Row: Organization;
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Organization, 'id' | 'created_at' | 'updated_at'>>;
      };
      clients: {
        Row: Client;
        Insert: Omit<Client, 'id' | 'created_at'>;
        Update: Partial<Omit<Client, 'id' | 'created_at'>>;
      };
      commandes: {
        Row: Commande;
        Insert: Omit<Commande, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Commande, 'id' | 'created_at' | 'updated_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>;
      };
      // Ajoutez la table invitations
      invitations: {
        Row: Invitation;
        Insert: Omit<Invitation, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Invitation, 'id' | 'created_at' | 'updated_at'>>;
      };
         prix_kg: {
        Row: PrixKg;
        Insert: Omit<PrixKg, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PrixKg, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
    Views: {};
    Functions: {};
  };
};