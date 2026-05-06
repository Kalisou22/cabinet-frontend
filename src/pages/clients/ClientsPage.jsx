import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientService } from '../../services/clientService';
import { transactionService } from '../../services/transactionService';
import { formatCurrency } from '../../utils/formatters';

const ClientsPage = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const summaries = await clientService.getSummary();
      setClients(summaries || []);
    } catch (error) {
      console.error('Erreur chargement summary, fallback vers getAll:', error);
      // ✅ Fallback : charger tous les clients et calculer localement
      try {
        const clientsData = await clientService.getAll();
        const summariesLocal = await Promise.all(clientsData.map(async (client) => {
          try {
            const balance = await transactionService.getClientSolde(client.id);
            return {
              clientId: client.id,
              clientName: client.nom,
              clientPhone: client.telephone,
              balance: balance,
              debt: balance < 0 ? Math.abs(balance) : 0,
              hasDebt: balance < 0,
              hasAdvance: balance > 0,
            };
          } catch (err) {
            return {
              clientId: client.id,
              clientName: client.nom,
              clientPhone: client.telephone,
              balance: 0,
              debt: 0,
              hasDebt: false,
              hasAdvance: false,
            };
          }
        }));
        setClients(summariesLocal);
      } catch (fallbackError) {
        console.error('Fallback également en erreur:', fallbackError);
        setClients([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchSearch = client.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        client.clientPhone?.includes(searchTerm);
    if (!matchSearch) return false;
    if (filterStatus === 'debt') return client.hasDebt;
    if (filterStatus === 'advance') return client.hasAdvance;
    if (filterStatus === 'ok') return !client.hasDebt && !client.hasAdvance;
    return true;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="mt-4">Chargement des clients...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">👥 Clients</h1>
          <p className="text-gray-500 text-sm">{clients.length} client(s) au total</p>
        </div>
        <button onClick={() => navigate('/clients/new')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          + Nouveau client
        </button>
      </div>

      {/* Recherche et filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="🔍 Rechercher par nom ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg pl-10"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilterStatus('all')} className={`px-3 py-2 rounded-lg ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            Tous
          </button>
          <button onClick={() => setFilterStatus('debt')} className={`px-3 py-2 rounded-lg ${filterStatus === 'debt' ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
            ⚠️ Endettés
          </button>
          <button onClick={() => setFilterStatus('advance')} className={`px-3 py-2 rounded-lg ${filterStatus === 'advance' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            💰 Avances
          </button>
          <button onClick={() => setFilterStatus('ok')} className={`px-3 py-2 rounded-lg ${filterStatus === 'ok' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            ✅ À jour
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">Client</th>
                <th className="text-left py-3 px-4">Téléphone</th>
                <th className="text-right py-3 px-4">Solde / Dette</th>
                <th className="text-left py-3 px-4">Statut</th>
                <th className="text-center py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-500">
                    Aucun client trouvé
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const hasDebt = client.balance < 0;
                  const displayAmount = hasDebt ? Math.abs(client.balance) : client.balance;

                  return (
                    <tr key={client.clientId} className="border-t hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{client.clientName}</td>
                      <td className="py-3 px-4">{client.clientPhone}</td>
                      <td className="py-3 px-4 text-right font-mono">
                        {client.balance !== 0 ? (
                          <span className={hasDebt ? 'text-red-600 font-bold' : 'text-green-600'}>
                            {hasDebt ? `- ${formatCurrency(displayAmount)}` : `+ ${formatCurrency(displayAmount)}`}
                          </span>
                        ) : (
                          <span className="text-gray-400">0 FG</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {hasDebt && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">⚠️ Endetté</span>}
                        {client.hasAdvance && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">💰 Avance</span>}
                        {!hasDebt && !client.hasAdvance && <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">✅ À jour</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => navigate(`/clients/${client.clientId}`)}
                            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                            title="Voir détails"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => navigate(`/transactions/new?clientId=${client.clientId}`)}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                            title="Nouvelle transaction"
                          >
                            💸
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;