import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reminderService } from '../../services/reminderService';
import { clientService } from '../../services/clientService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { transactionService } from '../../services/transactionService';

const RemindersPage = () => {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [filteredReminders, setFilteredReminders] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientSoldes, setClientSoldes] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClient, setFilterClient] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    done: 0,
    today: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reminders, filterStatus, filterClient]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [remindersData, clientsData, pendingData, todayData] = await Promise.all([
        reminderService.getAll(),
        clientService.getAll(),
        reminderService.getPending(),
        reminderService.getToday(),
      ]);

      setReminders(remindersData || []);
      setClients(clientsData || []);

      // Charger les soldes des clients
      const soldesMap = {};
      await Promise.all(
        clientsData.map(async (client) => {
          try {
            const solde = await transactionService.getClientSolde(client.id);
            soldesMap[client.id] = solde;
          } catch (err) {
            soldesMap[client.id] = 0;
          }
        })
      );
      setClientSoldes(soldesMap);

      setStats({
        total: remindersData?.length || 0,
        pending: pendingData?.length || 0,
        done: remindersData?.filter(r => r.status === 'DONE').length || 0,
        today: todayData?.length || 0,
      });
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reminders];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus.toUpperCase());
    }

    if (filterClient) {
      filtered = filtered.filter(r => r.clientId === parseInt(filterClient));
    }

    setFilteredReminders(filtered);
  };

  const handleMarkAsDone = async (id) => {
    try {
      await reminderService.markAsDone(id);
      await loadData();
      alert('✅ Rappel marqué comme traité');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce rappel ?')) return;
    try {
      await reminderService.delete(id);
      await loadData();
      alert('✅ Rappel supprimé');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'PENDING') {
      return { label: '⏳ En attente', color: 'badge-warning', description: 'Rappel à envoyer' };
    }
    return { label: '✅ Traité', color: 'badge-success', description: 'Rappel envoyé ou résolu' };
  };

  const getClientSituation = (clientId) => {
    const solde = clientSoldes[clientId] || 0;
    if (solde < 0) {
      return { text: `Dette: ${formatCurrency(Math.abs(solde))}`, color: 'text-warning-dark', icon: '⚠️' };
    }
    if (solde > 0) {
      return { text: `Avance: ${formatCurrency(solde)}`, color: 'text-info-dark', icon: '💰' };
    }
    return { text: 'Solde à jour', color: 'text-success', icon: '✅' };
  };

  const getUrgencyClass = (dateRappel) => {
    const today = new Date().toISOString().split('T')[0];
    if (dateRappel === today) return 'border-l-4 border-warning';
    if (dateRappel < today) return 'border-l-4 border-danger';
    return '';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="mt-4 text-text-secondary">Chargement des rappels...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔔 Rappels de paiement</h1>
          <p className="page-subtitle">Gérez les rappels pour les dettes clients</p>
        </div>
        <button
          onClick={() => navigate('/reminders/new')}
          className="btn-primary"
        >
          + Nouveau rappel
        </button>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-stat">
          <p className="stat-label">Total rappels</p>
          <p className="stat-value">{stats.total}</p>
        </div>
        <div className="card-stat">
          <p className="stat-label">En attente</p>
          <p className="stat-value text-warning-dark">{stats.pending}</p>
          <p className="text-xs text-text-secondary">À traiter</p>
        </div>
        <div className="card-stat">
          <p className="stat-label">Traités</p>
          <p className="stat-value text-success">{stats.done}</p>
          <p className="text-xs text-text-secondary">Rappels envoyés</p>
        </div>
        <div className="card-stat">
          <p className="stat-label">Aujourd'hui</p>
          <p className="stat-value text-info-dark">{stats.today}</p>
          <p className="text-xs text-text-secondary">Rappels du jour</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-secondary mb-1">Statut</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input"
            >
              <option value="all">📋 Tous les rappels</option>
              <option value="PENDING">⏳ En attente uniquement</option>
              <option value="DONE">✅ Traités uniquement</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-secondary mb-1">Client</label>
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="input"
            >
              <option value="">👥 Tous les clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterStatus('all');
                setFilterClient('');
              }}
              className="btn-outline"
            >
              🧹 Effacer les filtres
            </button>
          </div>
        </div>
      </div>

      {/* Liste des rappels */}
      <div className="space-y-3">
        {filteredReminders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <p className="empty-state-title">Aucun rappel</p>
            <p className="empty-state-description">
              Créez un rappel pour suivre les échéances de paiement de vos clients
            </p>
            <button
              onClick={() => navigate('/reminders/new')}
              className="btn-primary mt-4"
            >
              + Nouveau rappel
            </button>
          </div>
        ) : (
          filteredReminders.map((reminder) => {
            const status = getStatusBadge(reminder.status);
            const isOverdue = reminder.dateRappel < new Date().toISOString().split('T')[0] && reminder.status === 'PENDING';
            const situation = getClientSituation(reminder.clientId);

            return (
              <div
                key={reminder.id}
                className={`card p-4 hover:shadow-md transition-all ${getUrgencyClass(reminder.dateRappel)}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-text-primary text-lg">
                        {reminder.clientNom}
                      </h3>
                      <span className={`badge ${status.color}`} title={status.description}>
                        {status.label}
                      </span>
                      {isOverdue && (
                        <span className="badge badge-danger" title="Date dépassée">
                          ⚠️ En retard
                        </span>
                      )}
                      <span className={`text-xs ${situation.color}`} title="Situation financière">
                        {situation.icon} {situation.text}
                      </span>
                    </div>
                    <p className="text-text-secondary mt-2 line-clamp-2">{reminder.message}</p>
                    <div className="flex gap-4 mt-3 text-sm text-text-muted">
                      <span>📅 Échéance: {formatDate(reminder.dateRappel)}</span>
                      {reminder.reminderTime && <span>⏰ {reminder.reminderTime}</span>}
                      <span>👤 Créé par {reminder.username || '—'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {reminder.status === 'PENDING' && (
                      <button
                        onClick={() => handleMarkAsDone(reminder.id)}
                        className="btn-success btn-sm"
                        title="Marquer comme traité"
                      >
                        ✅ Traité
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/reminders/${reminder.id}`)}
                      className="btn-outline btn-sm"
                      title="Voir détails"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => navigate(`/reminders/${reminder.id}/edit`)}
                      className="btn-outline btn-sm"
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(reminder.id)}
                      className="btn-icon btn-sm text-danger hover:bg-danger-light"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RemindersPage;