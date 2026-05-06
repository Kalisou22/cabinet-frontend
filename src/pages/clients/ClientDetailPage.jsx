import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService } from '../../services/clientService';
import { transactionService } from '../../services/transactionService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ClientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClientData();
  }, [id]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      const [clientData, transactionsData, soldeData] = await Promise.all([
        clientService.getById(id),
        transactionService.getByClientId(id),
        transactionService.getClientSolde(id),
      ]);
      setClient(clientData);
      setTransactions(transactionsData || []);
      setBalance(soldeData || 0);
    } catch (error) {
      console.error('Erreur chargement:', error);
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const hasDebt = balance < 0;
  const displayBalance = hasDebt ? Math.abs(balance) : balance;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <button onClick={() => navigate('/clients')} className="text-blue-600 hover:underline mb-2 inline-block">
            ← Retour à la liste
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{client.nom}</h1>
          <p className="text-gray-500">{client.telephone}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/clients/${id}/edit`)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
            ✏️ Modifier
          </button>
          <button onClick={() => navigate(`/transactions/new?clientId=${id}`)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            💸 Nouvelle transaction
          </button>
        </div>
      </div>

      {/* Cartes situation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">💰 Solde actuel</p>
          <p className={`text-2xl font-bold ${hasDebt ? 'text-red-600' : balance > 0 ? 'text-green-600' : 'text-gray-600'}`}>
            {hasDebt ? `- ${formatCurrency(displayBalance)}` : `+ ${formatCurrency(displayBalance)}`}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {hasDebt ? 'Le client a une dette' : balance > 0 ? 'Le client a une avance' : 'Solde à zéro'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">📊 Nombre de transactions</p>
          <p className="text-2xl font-bold">{transactions.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">📅 Date d'inscription</p>
          <p className="text-lg font-medium">{formatDate(client.createdAt)}</p>
        </div>
      </div>

      {/* Adresse */}
      {client.adresse && (
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">📍 Adresse</p>
          <p className="text-gray-800">{client.adresse}</p>
        </div>
      )}

      {/* Historique transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">📋 Historique des transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Nature</th>
                <th className="text-right py-3 px-4">Montant</th>
                <th className="text-left py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-500">
                    Aucune transaction
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4">{formatDate(tx.createdAt)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${tx.type === 'DEPOT' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {tx.type === 'DEPOT' ? '💰 Dépôt' : '💸 Retrait'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${tx.nature === 'CREDIT' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {tx.nature === 'CREDIT' ? '📊 Crédit' : '💰 Cash'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(tx.montant)}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{tx.description || '—'}</td>
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

export default ClientDetailPage;