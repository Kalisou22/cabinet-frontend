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
  const [filters, setFilters] = useState({ clientId: '', type: '', status: '' });

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
      // Ne garder que les transactions CREDIT (cœur du système)
      const creditTransactions = (transactionsData || []).filter(t => t.nature === 'CREDIT');
      setTransactions(creditTransactions);
      setFilteredTransactions(creditTransactions);
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
        <p className="mt-4 text-text-secondary">Chargement des transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Suivi des dettes et avances</h1>
          <p className="page-subtitle">
            Historique des mouvements financiers des clients
          </p>
        </div>
        <button onClick={() => navigate('/transactions/new')} className="btn-primary">
          + Nouvelle opération
        </button>
      </div>

      {/* Filtres */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.clientId}
            onChange={(e) => setFilters(prev => ({ ...prev, clientId: e.target.value }))}
            className="input w-64"
          >
            <option value="">Tous les clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="input w-48"
          >
            <option value="">Tous types</option>
            <option value="DEPOT">💰 Dépôt (client confie de l'argent)</option>
            <option value="RETRAIT">💸 Virement (client reçoit de l'argent)</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="input w-48"
          >
            <option value="">Tous statuts</option>
            <option value="EN_COURS">⏳ En cours (dette non soldée)</option>
            <option value="REMBOURSE">✅ Remboursé (dette soldée)</option>
          </select>
          <button
            onClick={() => setFilters({ clientId: '', type: '', status: '' })}
            className="btn-outline"
          >
            Effacer
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Type</th>
                <th className="text-right">Montant</th>
                <th className="text-right">Reste à payer</th>
                <th>Échéance</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-text-secondary">
                    <div className="empty-state-icon">📭</div>
                    <p className="empty-state-title">Aucune transaction</p>
                    <p className="empty-state-description">
                      Commencez par créer une opération de dépôt ou virement
                    </p>
                    <button
                      onClick={() => navigate('/transactions/new')}
                      className="btn-primary mt-4"
                    >
                      + Nouvelle opération
                    </button>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className={t.status === 'EN_COURS' ? 'bg-warning-light/20' : ''}>
                    <td className="whitespace-nowrap">{formatDate(t.createdAt)}</td>
                    <td className="font-medium">{t.clientNom || getClientName(t.clientId)}</td>
                    <td>
                      <span className={`badge ${t.type === 'DEPOT' ? 'badge-success' : 'badge-warning'}`}>
                        {t.type === 'DEPOT' ? '💰 Dépôt' : '💸 Virement'}
                      </span>
                    </td>
                    <td className="text-right font-mono font-medium">
                      {formatCurrency(t.montant)}
                    </td>
                    <td className="text-right font-mono">
                      {t.resteAPayer > 0 ? (
                        <span className="text-warning-dark">{formatCurrency(t.resteAPayer)}</span>
                      ) : '—'}
                    </td>
                    <td className="whitespace-nowrap">{t.dueDate ? formatDate(t.dueDate) : '—'}</td>
                    <td>
                      <span className={`badge ${t.status === 'REMBOURSE' ? 'badge-success' : 'badge-warning'}`}>
                        {t.status === 'REMBOURSE' ? '✅ Remboursé' : '⏳ En cours'}
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