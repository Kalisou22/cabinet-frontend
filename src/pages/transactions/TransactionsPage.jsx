import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionService } from '../../services/transactionService';
import { clientService } from '../../services/clientService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const TransactionsPage = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ clientId: '', type: '', nature: '', status: '' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, clientsData] = await Promise.all([
        transactionService.getAll(),
        clientService.getActiveClients(),
      ]);
      setTransactions(transactionsData || []);
      setFilteredTransactions(transactionsData || []);
      setClients(clientsData);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];
    if (filters.clientId) filtered = filtered.filter(t => t.clientId === parseInt(filters.clientId));
    if (filters.type) filtered = filtered.filter(t => t.type === filters.type);
    if (filters.nature) filtered = filtered.filter(t => t.nature === filters.nature);
    if (filters.status) filtered = filtered.filter(t => t.status === filters.status);
    setFilteredTransactions(filtered);
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.nom : 'Inconnu';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="mt-4">Chargement des transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📊 Transactions</h1>
          <p className="text-gray-500 text-sm">Historique complet des opérations</p>
        </div>
        <button onClick={() => navigate('/transactions/new')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          + Nouvelle opération
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.clientId}
            onChange={(e) => setFilters(prev => ({ ...prev, clientId: e.target.value }))}
            className="px-3 py-2 border rounded-lg w-64"
          >
            <option value="">Tous les clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="px-3 py-2 border rounded-lg w-40"
          >
            <option value="">Tous types</option>
            <option value="DEPOT">💰 Dépôt</option>
            <option value="RETRAIT">💸 Retrait</option>
          </select>
          <select
            value={filters.nature}
            onChange={(e) => setFilters(prev => ({ ...prev, nature: e.target.value }))}
            className="px-3 py-2 border rounded-lg w-40"
          >
            <option value="">Toutes natures</option>
            <option value="CASH">💰 Cash</option>
            <option value="CREDIT">📊 Crédit</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border rounded-lg w-40"
          >
            <option value="">Tous statuts</option>
            <option value="EN_COURS">⏳ En cours</option>
            <option value="REMBOURSE">✅ Remboursé</option>
          </select>
          <button
            onClick={() => setFilters({ clientId: '', type: '', nature: '', status: '' })}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Effacer
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Client</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Nature</th>
                <th className="text-right py-3 px-4">Montant</th>
                <th className="text-right py-3 px-4">Reste à payer</th>
                <th className="text-left py-3 px-4">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-500">
                    Aucune transaction trouvée
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                    <td className="py-3 px-4 font-medium">{tx.clientNom || getClientName(tx.clientId)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${tx.type === 'DEPOT' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {tx.type === 'DEPOT' ? '💰 Dépôt' : '💸 Retrait'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${tx.nature === 'CREDIT' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {tx.nature === 'CREDIT' ? '📊 Crédit' : '💰 Cash'}
                      </span>
                      {tx.type === 'RETRAIT' && tx.nature === 'CREDIT' && (
                        <span className="ml-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">Avance</span>
                      )}
                      {tx.type === 'DEPOT' && tx.nature === 'CREDIT' && (
                        <span className="ml-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Remboursement</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(tx.montant)}</td>
                    <td className="py-3 px-4 text-right font-mono">
                      {tx.nature === 'CREDIT' && tx.resteAPayer > 0 ? (
                        <span className="text-orange-600">{formatCurrency(tx.resteAPayer)}</span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${tx.status === 'REMBOURSE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {tx.status === 'REMBOURSE' ? '✅ Remboursé' : '⏳ En cours'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;