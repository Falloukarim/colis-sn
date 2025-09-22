export interface PaymentStats {
  today: { total: number; count: number };
  week: { total: number; count: number };
  month: { total: number; count: number };
  total: number;
  totalCount: number;
  recentTransactions: {
    id: string;
    client_nom: string;
    montant_total: number;
    poids: number;
    prix_kg: number;
    date_retrait: string;
  }[];
  monthlyPerformance: { month: string; total: number; count: number }[];
  averageTransaction: number;
  bestDay: { date: string; total: number };
  transactionsToday: number;
}