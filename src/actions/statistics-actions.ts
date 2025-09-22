'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function getPaymentStats() {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Non autorisé');
    }

    // Récupérer l'organization_id de l'utilisateur
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      throw new Error('Organisation non trouvée');
    }

    // Récupérer toutes les commandes remises
    const { data: commandes, error } = await supabase
      .from('commandes')
      .select(`
        *,
        clients:client_id (nom)
      `)
      .eq('organization_id', userData.organization_id)
      .eq('statut', 'remis')
      .order('date_retrait', { ascending: false });

    if (error) {
      console.error('Error fetching commands:', error);
      throw new Error('Erreur lors de la récupération des données');
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calcul des statistiques
    const stats = {
      today: { total: 0, count: 0 },
      week: { total: 0, count: 0 },
      month: { total: 0, count: 0 },
      total: 0,
      totalCount: commandes?.length || 0,
      recentTransactions: [] as any[],
      monthlyPerformance: [] as { month: string; total: number; count: number }[],
      averageTransaction: 0,
      bestDay: { date: '', total: 0 },
      transactionsToday: 0
    };

    if (commandes && commandes.length > 0) {
      // Calcul des totaux
      commandes.forEach(commande => {
        const montant = commande.montant_total || (commande.poids && commande.prix_kg ? commande.poids * commande.prix_kg : 0);
        const dateRetrait = new Date(commande.date_retrait);

        // Aujourd'hui
        if (dateRetrait >= todayStart) {
          stats.today.total += montant;
          stats.today.count++;
          stats.transactionsToday++;
        }

        // Cette semaine
        if (dateRetrait >= weekStart) {
          stats.week.total += montant;
          stats.week.count++;
        }

        // Ce mois
        if (dateRetrait >= monthStart) {
          stats.month.total += montant;
          stats.month.count++;
        }

        stats.total += montant;
      });

      // Transactions récentes (10 dernières)
      stats.recentTransactions = commandes.slice(0, 10).map(commande => ({
        id: commande.id,
        client_nom: commande.clients?.nom || 'Client inconnu',
        montant_total: commande.montant_total || (commande.poids && commande.prix_kg ? commande.poids * commande.prix_kg : 0),
        poids: commande.poids,
        prix_kg: commande.prix_kg,
        date_retrait: commande.date_retrait
      }));

      // Performance mensuelle
      const monthlyMap = new Map();
      commandes.forEach(commande => {
        const date = new Date(commande.date_retrait);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const key = `${year}-${month.toString().padStart(2, '0')}`;
        
        const montant = commande.montant_total || (commande.poids && commande.prix_kg ? commande.poids * commande.prix_kg : 0);
        
        if (!monthlyMap.has(key)) {
          monthlyMap.set(key, { total: 0, count: 0 });
        }
        
        monthlyMap.get(key).total += montant;
        monthlyMap.get(key).count++;
      });

      stats.monthlyPerformance = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month: month.split('-')[1],
          total: data.total,
          count: data.count
        }))
        .sort((a, b) => parseInt(b.month) - parseInt(a.month))
        .slice(0, 6);

      // Moyenne par transaction
      stats.averageTransaction = stats.totalCount > 0 ? Math.round(stats.total / stats.totalCount) : 0;

      // Meilleur jour
      const dailyMap = new Map();
      commandes.forEach(commande => {
        const date = new Date(commande.date_retrait).toISOString().split('T')[0];
        const montant = commande.montant_total || (commande.poids && commande.prix_kg ? commande.poids * commande.prix_kg : 0);
        
        if (!dailyMap.has(date)) {
          dailyMap.set(date, 0);
        }
        
        dailyMap.set(date, dailyMap.get(date) + montant);
      });

      let bestDayTotal = 0;
      let bestDayDate = '';
      dailyMap.forEach((total, date) => {
        if (total > bestDayTotal) {
          bestDayTotal = total;
          bestDayDate = date;
        }
      });

      stats.bestDay = { date: bestDayDate, total: bestDayTotal };
    }

    return stats;

  } catch (error) {
    console.error('Error in getPaymentStats:', error);
    // Retourner des valeurs par défaut en cas d'erreur
    return {
      today: { total: 0, count: 0 },
      week: { total: 0, count: 0 },
      month: { total: 0, count: 0 },
      total: 0,
      totalCount: 0,
      recentTransactions: [],
      monthlyPerformance: [],
      averageTransaction: 0,
      bestDay: { date: '', total: 0 },
      transactionsToday: 0
    };
  }
}

export async function searchPayments(query: string) {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non autorisé');

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) throw new Error('Organisation non trouvée');

    // 1. D'abord, chercher les clients qui matchent
    const { data: matchingClients } = await supabase
      .from('clients')
      .select('id')
      .eq('organization_id', userData.organization_id)
      .ilike('nom', `%${query}%`);

    const clientIds = matchingClients?.map(client => client.id) || [];

    // 2. Ensuite, chercher les commandes
    const { data: commandes, error } = await supabase
      .from('commandes')
      .select(`
        *,
        clients:client_id (nom, telephone)
      `)
      .eq('organization_id', userData.organization_id)
      .eq('statut', 'remis')
      .or(`description.ilike.%${query}%,numero_commande.ilike.%${query}%${clientIds.length > 0 ? ',client_id.in.(' + clientIds.join(',') + ')' : ''}`)
      .order('date_retrait', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return commandes?.map(commande => ({
      id: commande.id,
      client_nom: commande.clients?.nom || 'Client inconnu',
      montant_total: commande.montant_total || (commande.poids && commande.prix_kg ? commande.poids * commande.prix_kg : 0),
      poids: commande.poids,
      prix_kg: commande.prix_kg,
      date_retrait: commande.date_retrait,
      description: commande.description,
      numero_commande: commande.numero_commande
    })) || [];

  } catch (error) {
    console.error('Error searching payments:', error);
    return [];
  }
}

export async function getAllPayments() {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non autorisé');

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) throw new Error('Organisation non trouvée');

    const { data: commandes, error } = await supabase
      .from('commandes')
      .select(`
        *,
        clients:client_id (nom, telephone)
      `)
      .eq('organization_id', userData.organization_id)
      .eq('statut', 'remis')
      .order('date_retrait', { ascending: false });

    if (error) throw error;

    return commandes?.map(commande => ({
      id: commande.id,
      client_nom: commande.clients?.nom || 'Client inconnu',
      montant_total: commande.montant_total || (commande.poids && commande.prix_kg ? commande.poids * commande.prix_kg : 0),
      poids: commande.poids,
      prix_kg: commande.prix_kg,
      date_retrait: commande.date_retrait,
      description: commande.description,
      numero_commande: commande.numero_commande
    })) || [];

  } catch (error) {
    console.error('Error getting all payments:', error);
    return [];
  }
}