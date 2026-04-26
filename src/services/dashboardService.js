import axiosInstance from '../api/axios';
import { clientService } from './clientService';
import { transactionService } from './transactionService';
import { cashOperationService } from './cashOperationService';
import { inventoryService } from './inventoryService';

export const dashboardService = {
  /**
   * Récupérer toutes les statistiques du dashboard
   */
  getStats: async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(now.setHours(23, 59, 59, 999)).toISOString();

    try {
      const [
        cashSummaryMonth,
        cashSummaryToday,
        clients,
        openInventory,
      ] = await Promise.all([
        cashOperationService.getSummary(startOfMonth, endOfMonth),
        cashOperationService.getSummary(startOfDay, endOfDay),
        clientService.getAll(),
        inventoryService.getOpenSessions().catch(() => []),
      ]);

      // ✅ Calcul des dettes et avances à partir du SOLDE de chaque client
      let totalDebt = 0;
      let totalAdvances = 0;
      let clientsAvecDette = 0;
      let clientsAvecAvance = 0;
      let pendingCount = 0;

      for (const client of clients) {
        try {
          const solde = await transactionService.getClientSolde(client.id);

          if (solde < 0) {
            totalDebt += Math.abs(solde);
            clientsAvecDette++;
            pendingCount++;
          } else if (solde > 0) {
            totalAdvances += solde;
            clientsAvecAvance++;
          }
        } catch (err) {
          console.error(`Erreur calcul solde client ${client.id}:`, err);
        }
      }

      const today = new Date().toISOString().split('T')[0];
      const todayInventory = openInventory?.find(s => s.date === today);

      return {
        solde: cashSummaryMonth?.solde || 0,
        entreesMois: cashSummaryMonth?.totalEntrees || 0,
        sortiesMois: cashSummaryMonth?.totalSorties || 0,
        entreesJour: cashSummaryToday?.totalEntrees || 0,
        sortiesJour: cashSummaryToday?.totalSorties || 0,
        totalClients: clients?.length || 0,
        clientsAvecDette,
        clientsAvecAvance,
        totalDebt,
        totalAdvances,
        pendingCount,
        recentTransactions: [],
        hasOpenInventory: !!todayInventory,
        inventorySession: todayInventory || null,
        operationCount: cashSummaryMonth?.operationCount || 0,
      };
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      throw error;
    }
  },

  getRecentTransactions: async (limit = 5) => {
    const response = await transactionService.getPaginated(0, limit, 'createdAt,desc');
    return response.content || [];
  },

  getQuickSummary: async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const summary = await cashOperationService.getSummary(startOfMonth, endOfMonth);

    // Compter les clients avec dette
    const clients = await clientService.getAll();
    let pendingCount = 0;
    for (const client of clients) {
      try {
        const solde = await transactionService.getClientSolde(client.id);
        if (solde < 0) pendingCount++;
      } catch (err) {}
    }

    return {
      solde: summary?.solde || 0,
      pendingCount,
    };
  },
};