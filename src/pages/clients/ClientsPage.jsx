import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientService } from '../../services/clientService';
import { transactionService } from '../../services/transactionService';
import { reminderService } from '../../services/reminderService';
import { formatCurrency } from '../../utils/formatters';

const ClientsPage = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [clientSoldes, setClientSoldes] = useState({});
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [pendingReminders, setPendingReminders] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    avecDette: 0,
    avecAvance: 0,
    totalDette: 0,
    totalAvance: 0,
  });

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterStatus, clients, clientSoldes]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await clientService.getAll();
      setClients(data);

      const soldesMap = {};
      const remindersMap = {};
      let totalDette = 0;
      let totalAvance = 0;
      let avecDette = 0;
      let avecAvance = 0;

      await Promise.all(
        data.map(async (client) => {
          try {
            const solde = await transactionService.getClientSolde(client.id);
            soldesMap[client.id] = solde;

            // Charger les rappels en attente
            const reminders = await reminderService.getByClientId(client.id);
            const pendingCount = reminders?.filter(r => r.status === 'PENDING').length || 0;
            remindersMap[client.id] = pendingCount;

            if (solde < 0) {
              totalDette += Math.abs(solde);
              avecDette++;
            } else if (solde > 0) {
              totalAvance += solde;
              avecAvance++;
            }
          } catch (err) {
            soldesMap[client.id] = 0;
            remindersMap[client.id] = 0;
          }
        })
      );

      setClientSoldes(soldesMap);
      setPendingReminders(remindersMap);
      setStats({
        total: data.length,
        avecDette,
        avecAvance,
        totalDette,
        totalAvance,
      });
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clients];

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(client =>
        client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.telephone.includes(searchTerm)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(client => {
        const solde = clientSoldes[client.id] || 0;
        if (filterStatus === 'debt') return solde < 0;
        if (filterStatus === 'advance') return solde > 0;
        if (filterStatus === 'ok') return solde === 0;
        return true;
      });
    }

    setFilteredClients(filtered);
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;

    const solde = clientSoldes[clientToDelete.id] || 0;
    if (solde !== 0) {
      alert(`⚠️ Impossible de supprimer ce client car il a un solde de ${formatCurrency(Math.abs(solde))} (${solde > 0 ? 'avance' : 'dette'}).\nRéglez d'abord sa situation.`);
      setShowDeleteModal(false);
      setClientToDelete(null);
      return;
    }

    try {
      await clientService.delete(clientToDelete.id);
      setClients(clients.filter(c => c.id !== clientToDelete.id));
      setShowDeleteModal(false);
      setClientToDelete(null);
    } catch (error) {
      console.error('Erreur suppression client:', error);
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const getClientStatus = (solde) => {
    if (solde > 0) return {
      label: 'AVANCE',
      color: 'badge-info',
      textColor: 'text-info-dark',
      description: 'Le cabinet doit au client',
      icon: '💰'
    };
    if (solde < 0) return {
      label: 'DETTE',
      color: 'badge-warning',
      textColor: 'text-warning-dark',
      description: 'Le client doit au cabinet',
      icon: '⚠️'
    };
    return {
      label: 'À JOUR',
      color: 'badge-success',
      textColor: 'text-success-dark',
      description: 'Solde équilibré',
      icon: '✅'
    };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="mt-4 text-text-secondary">Chargement des clients...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 Clients</h1>
          <p className="page-subtitle">Suivi des dettes et avances clients</p>
        </div>
        <button onClick={() => navigate('/clients/new')} className="btn-primary">
          + Nouveau client
        </button>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="stat-label">Total clients</p>
          <p className="stat-value">{stats.total}</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">Clients avec dette</p>
          <p className="stat-value text-warning-dark">{stats.avecDette}</p>
          <p className="text-xs text-text-secondary mt-1">{formatCurrency(stats.totalDette)}</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">Clients avec avance</p>
          <p className="stat-value text-info-dark">{stats.avecAvance}</p>
          <p className="text-xs text-text-secondary mt-1">{formatCurrency(stats.totalAvance)}</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">Exposition nette</p>
          <p className={`stat-value ${stats.totalDette >= stats.totalAvance ? 'text-warning-dark' : 'text-info-dark'}`}>
            {formatCurrency(Math.abs(stats.totalDette - stats.totalAvance))}
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="🔍 Rechercher par nom, téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
              autoFocus
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-danger"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus('all')}
              className={`btn-sm ${filterStatus === 'all' ? 'btn-primary' : 'btn-outline'}`}
            >
              📋 Tous ({stats.total})
            </button>
            <button
              onClick={() => setFilterStatus('debt')}
              className={`btn-sm ${filterStatus === 'debt' ? 'btn-primary' : 'btn-outline'}`}
            >
              ⚠️ Dettes ({stats.avecDette})
            </button>
            <button
              onClick={() => setFilterStatus('advance')}
              className={`btn-sm ${filterStatus === 'advance' ? 'btn-primary' : 'btn-outline'}`}
            >
              🤝 Avances ({stats.avecAvance})
            </button>
            <button
              onClick={() => setFilterStatus('ok')}
              className={`btn-sm ${filterStatus === 'ok' ? 'btn-primary' : 'btn-outline'}`}
            >
              ✅ À jour ({stats.total - stats.avecDette - stats.avecAvance})
            </button>
          </div>
        </div>
      </div>

      {/* Liste des clients */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Téléphone</th>
                <th className="text-right">Solde</th>
                <th>Statut</th>
                <th>Rappels</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <div className="empty-state-icon">👥</div>
                    <p className="empty-state-title">Aucun client trouvé</p>
                    <p className="empty-state-description">
                      {searchTerm || filterStatus !== 'all'
                        ? 'Aucun résultat ne correspond à vos filtres'
                        : 'Commencez par ajouter un nouveau client'}
                    </p>
                    {(searchTerm || filterStatus !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setFilterStatus('all');
                        }}
                        className="btn-outline btn-sm mt-4"
                      >
                        Effacer les filtres
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const solde = clientSoldes[client.id] || 0;
                  const status = getClientStatus(solde);
                  const pendingReminderCount = pendingReminders[client.id] || 0;

                  return (
                    <tr key={client.id} className={solde < 0 ? 'bg-warning-light/10' : ''}>
                      <td>
                        <div>
                          <p className="font-medium text-text-primary">{client.nom}</p>
                          <p className="text-xs text-text-secondary">{client.adresse || '—'}</p>
                        </div>
                      </td>
                      <td className="font-mono">{client.telephone}</td>
                      <td className="text-right">
                        <span className={`font-mono font-bold ${status.textColor}`}>
                          {solde > 0 ? '+' : solde < 0 ? '−' : ''}{formatCurrency(Math.abs(solde))}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${status.color}`} title={status.description}>
                          {status.icon} {status.label}
                        </span>
                      </td>
                      <td className="text-center">
                        {pendingReminderCount > 0 && (
                          <button
                            onClick={() => navigate('/reminders')}
                            className="badge badge-warning"
                            title={`${pendingReminderCount} rappel(s) en attente`}
                          >
                            🔔 {pendingReminderCount}
                          </button>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => navigate(`/clients/${client.id}`)}
                            className="btn-icon btn-sm"
                            title="Voir détails"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => navigate(`/clients/${client.id}/edit`)}
                            className="btn-icon btn-sm"
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => navigate(`/transactions/new?clientId=${client.id}`)}
                            className="btn-icon btn-sm"
                            title="Nouvelle transaction"
                          >
                            💸
                          </button>
                          <button
                            onClick={() => { setClientToDelete(client); setShowDeleteModal(true); }}
                            className="btn-icon btn-sm text-danger hover:bg-danger-light"
                            title="Supprimer"
                            disabled={solde !== 0}
                          >
                            🗑️
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

      {/* Résumé */}
      {filteredClients.length > 0 && (
        <div className="text-sm text-text-secondary text-right">
          {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} affiché{filteredClients.length > 1 ? 's' : ''}
          {searchTerm && ` pour "${searchTerm}"`}
        </div>
      )}

      {/* Modal suppression */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-header">⚠️ Confirmer la suppression</h3>
            <p className="modal-body">
              Êtes-vous sûr de vouloir supprimer le client <span className="font-medium">"{clientToDelete?.nom}"</span> ?
            </p>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="btn-outline">
                Annuler
              </button>
              <button onClick={handleDelete} className="btn-danger">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;