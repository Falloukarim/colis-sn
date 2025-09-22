import { supabase } from '@/lib/supabase/client';

export interface BillingPlan {
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

export const PLANS: BillingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Jusqu\'à 100 clients',
      '500 commandes/mois',
      '2 utilisateurs',
      'Support email',
      'Notifications SMS'
    ],
    limits: {
      clients: 100,
      commandes: 500,
      users: 2,
      storage: '5GB'
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Clients illimités',
      'Commandes illimitées',
      '5 utilisateurs',
      'Support prioritaire',
      'Notifications SMS + WhatsApp',
      'Rapports avancés'
    ],
    limits: {
      clients: 0, // 0 = illimité
      commandes: 0,
      users: 5,
      storage: '20GB'
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Clients illimités',
      'Commandes illimitées',
      'Utilisateurs illimités',
      'Support 24/7',
      'Tous les canaux de notification',
      'API complète',
      'Personnalisation'
    ],
    limits: {
      clients: 0,
      commandes: 0,
      users: 0,
      storage: '100GB'
    }
  }
];

export async function checkOrganizationLimits(organizationId: string): Promise<{
  canCreateClient: boolean;
  canCreateCommande: boolean;
  canAddUser: boolean;
  limits: {
    clients: { current: number; max: number };
    commandes: { current: number; max: number };
    users: { current: number; max: number };
  };
}> {
  try {
    // Récupérer le plan de l'organisation
    const { data: organization } = await supabase
      .from('organizations')
      .select('subscription_plan')
      .eq('id', organizationId)
      .single();

    const plan = PLANS.find(p => p.id === organization?.subscription_plan) || PLANS[0];

    // Compter les ressources actuelles
    const [{ count: clientsCount }, { count: commandesCount }, { count: usersCount }] = await Promise.all([
      supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId),
      supabase
        .from('commandes')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', new Date().toISOString().split('T')[0]), // Ce mois-ci
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
    ]);

    const limits = {
      clients: {
        current: clientsCount || 0,
        max: plan.limits.clients
      },
      commandes: {
        current: commandesCount || 0,
        max: plan.limits.commandes
      },
      users: {
        current: usersCount || 0,
        max: plan.limits.users
      }
    };

    return {
      canCreateClient: plan.limits.clients === 0 || (clientsCount || 0) < plan.limits.clients,
      canCreateCommande: plan.limits.commandes === 0 || (commandesCount || 0) < plan.limits.commandes,
      canAddUser: plan.limits.users === 0 || (usersCount || 0) < plan.limits.users,
      limits
    };
  } catch (error) {
    console.error('Error checking organization limits:', error);
    // En cas d'erreur, on retourne des limites par défaut restrictives
    return {
      canCreateClient: false,
      canCreateCommande: false,
      canAddUser: false,
      limits: {
        clients: { current: 0, max: 0 },
        commandes: { current: 0, max: 0 },
        users: { current: 0, max: 0 }
      }
    };
  }
}

export function calculateMontant(poids: number, prixKg: number): number {
  return Math.round(poids * prixKg * 100) / 100; // Arrondi à 2 décimales
}

export async function sendSubscriptionAlert(organizationId: string, message: string): Promise<void> {
  try {
    // Récupérer les owners de l'organisation
    const { data: owners } = await supabase
      .from('users')
      .select('email')
      .eq('organization_id', organizationId)
      .eq('role', 'owner');

    if (owners && owners.length > 0) {
      // Envoyer un email d'alerte (à implémenter avec votre service d'email)
      console.log('Subscription alert:', { organizationId, message, recipients: owners.map(o => o.email) });
      
      // Ici vous intégrerez votre service d'email
      // await sendEmail(owners.map(o => o.email), 'Alerte Abonnement', message);
    }
  } catch (error) {
    console.error('Error sending subscription alert:', error);
  }
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency
  }).format(amount);
}