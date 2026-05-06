import axiosInstance from '../api/axios';

export const dashboardService = {
  getStats: async () => {
    try {
      const response = await axiosInstance.get('/v1/dashboard/stats');
      return response.data;
    } catch (error) {
      console.warn('Dashboard stats non disponible, utilisation fallback');
      try {
        const [cashSummary, clients] = await Promise.all([
          axiosInstance.get('/v1/cash-operations/summary?start=' + new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString() + '&end=' + new Date().toISOString()),
          axiosInstance.get('/v1/clients')
        ]);
        return {
          totalCashBalance: cashSummary.data?.solde || 0,
          totalDebt: 0,
          totalAdvances: 0,
          totalClients: clients.data?.length || 0,
          clientsWithDebt: 0,
          clientsWithAdvance: 0,
          pendingDebtsCount: 0,
          monthlyTransactionCount: cashSummary.data?.operationCount || 0,
        };
      } catch (fallbackError) {
        return {
          totalCashBalance: 0,
          totalDebt: 0,
          totalAdvances: 0,
          totalClients: 0,
          clientsWithDebt: 0,
          clientsWithAdvance: 0,
          pendingDebtsCount: 0,
          monthlyTransactionCount: 0,
        };
      }
    }
  },

  getRecentTransactions: async (limit = 10) => {
    try {
      const response = await axiosInstance.get('/v1/dashboard/recent-transactions', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.warn('Recent transactions non disponible, utilisation fallback');
      try {
        const response = await axiosInstance.get('/v1/transactions/paginated', {
          params: { page: 0, size: limit, sort: 'createdAt,desc' }
        });
        return response.data?.content || [];
      } catch (fallbackError) {
        return [];
      }
    }
  },

  // ✅ AJOUTÉ pour Sidebar.jsx
  getQuickSummary: async () => {
    try {
      const stats = await dashboardService.getStats();
      return {
        solde: stats.totalCashBalance || 0,
        pendingCount: stats.clientsWithDebt || 0
      };
    } catch (error) {
      return { solde: 0, pendingCount: 0 };
    }
  },
};