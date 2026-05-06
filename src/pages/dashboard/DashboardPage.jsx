import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import { clientService } from '../../services/clientService';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCashBalance: 0,
    totalDebt: 0,
    totalAdvances: 0,
    totalClients: 0,
    clientsWithDebt: 0,
    clientsWithAdvance: 0,
    pendingDebtsCount: 0,
    monthlyTransactionCount: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [topDebtors, setTopDebtors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, transactionsData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentTransactions(10),
      ]);

      setStats(statsData || {});
      setRecentTransactions(transactionsData || []);

      // Top 5 clients endettés (optionnel, si endpoint existe)
      try {
        const clientsSummary = await clientService.getSummary();
        const debtors = (clientsSummary || [])
          .filter(c => c.balance < 0)
          .sort((a, b) => a.balance - b.balance)
          .slice(0, 5);
        setTopDebtors(debtors);
      } catch (e) {
        console.warn('getSummary non disponible');
        setTopDebtors([]);
      }

    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button onClick={loadDashboard} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📊 Tableau de bord</h1>
          <p className="text-gray-500 text-sm">Bonjour, {user?.username || 'Utilisateur'} 👋</p>
        </div>
        <button onClick={loadDashboard} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
          🔄 Actualiser
        </button>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">💰 Solde caisse</p>
          <p className={`text-2xl font-bold ${stats.totalCashBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(stats.totalCashBalance || 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">⚠️ Total dettes clients</p>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalDebt || 0)}</p>
          <p className="text-xs text-gray-500">{stats.clientsWithDebt || 0} client(s)</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">💰 Total avances clients</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalAdvances || 0)}</p>
          <p className="text-xs text-gray-500">{stats.clientsWithAdvance || 0} client(s)</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">👥 Nombre de clients</p>
          <p className="text-2xl font-bold text-gray-800">{stats.totalClients || 0}</p>
        </div>
      </div>

      {/* Top 5 clients endettés */}
      {topDebtors.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">⚠️ Top 5 clients endettés</h2>
          </div>
          <div className="divide-y">
            {topDebtors.map((client, index) => (
              <div key={client.clientId} className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/clients/${client.clientId}`)}>
                <div>
                  <p className="font-medium">{client.clientName}</p>
                  <p className="text-sm text-gray-500">{client.clientPhone}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">{formatCurrency(Math.abs(client.balance))}</p>
                  <p className="text-xs text-gray-500">à rembourser</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions récentes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">📋 Dernières transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Client</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-right py-3 px-4">Montant</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-gray-500">
                    Aucune transaction récente
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => (
                  <tr key={tx.id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4">{new Date(tx.transactionDate || tx.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="py-3 px-4 font-medium">{tx.clientName}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${tx.type === 'DEPOT' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {tx.type === 'DEPOT' ? '💰 Dépôt' : '💸 Retrait'} / {tx.nature === 'CREDIT' ? 'Crédit' : 'Cash'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(tx.amount || tx.montant)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t text-right">
          <button onClick={() => navigate('/transactions')} className="text-blue-600 hover:underline">
            Voir toutes les transactions →
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;