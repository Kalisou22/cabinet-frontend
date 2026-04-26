import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService } from '../../services/clientService';
import { transactionService } from '../../services/transactionService';
import { reminderService } from '../../services/reminderService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ClientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [solde, setSolde] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [creatingReminder, setCreatingReminder] = useState(false);

  useEffect(() => {
    loadClientData();
  }, [id]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      const [clientData, clientTransactions, clientSolde, clientReminders] = await Promise.all([
        clientService.getById(id),
        transactionService.getByClientId(id),
        transactionService.getClientSolde(id),
        reminderService.getByClientId(id).catch(() => [])
      ]);
      setClient(clientData);
      setTransactions(clientTransactions || []);
      setSolde(clientSolde || 0);
      setReminders(clientReminders || []);
    } catch (error) {
      console.error('Erreur chargement client:', error);
      alert('Impossible de charger les données du client');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReminder = async () => {
    if (!solde || solde >= 0) {
      alert('Ce client n\'a pas de dette à rappeler');
      return;
    }

    try {
      setCreatingReminder(true);
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      await reminderService.create({
        clientId: parseInt(id),
        message: `🔔 RAPPEL DE PAIEMENT\n\nCher client,\n\nNous vous rappelons que votre dette de ${formatCurrency(Math.abs(solde))} est due.\n\nMerci de régulariser votre situation dans les meilleurs délais.\n\nCordialement.`,
        dateRappel: new Date().toISOString().split('T')[0],
        reminderTime: '09:00',
        userId: user?.id
      });
      alert('✅ Rappel créé avec succès');
      await loadClientData();
      setShowReminderModal(false);
    } catch (error) {
      console.error('Erreur création rappel:', error);
      alert(error.response?.data?.message || 'Erreur lors de la création du rappel');
    } finally {
      setCreatingReminder(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (activeTab === 'all') return true;
    if (activeTab === 'credit') return t.nature === 'CREDIT';
    if (activeTab === 'cash') return t.nature === 'CASH';
    if (activeTab === 'pending') return t.status === 'EN_COURS';
    return true;
  });

  const getStatusBadge = (solde) => {
    if (solde > 0) return {
      label: 'AVANCE',
      color: 'badge-info',
      description: 'Le cabinet doit au client',
      icon: '💰'
    };
    if (solde < 0) return {
      label: 'DETTE',
      color: 'badge-warning',
      description: 'Le client doit au cabinet',
      icon: '⚠️'
    };
    return {
      label: 'À JOUR',
      color: 'badge-success',
      description: 'Solde équilibré',
      icon: '✅'
    };
  };

  // Calcul des totaux
  const totalCredit = transactions
    .filter(t => t.nature === 'CREDIT')
    .reduce((sum, t) => sum + (t.montant || 0), 0);

  const totalRembourse = transactions
    .filter(t => t.nature === 'CREDIT' && t.status === 'REMBOURSE')
    .reduce((sum, t) => sum + (t.montant || 0), 0);

  const resteAPayer = Math.abs(solde);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="mt-4 text-text-secondary">Chargement des données...</p>
      </div>
    );
  }

  if (!client) return null;

  const status = getStatusBadge(solde);

  return (
    <div className="animate-fade-in space-y-6">
      {/* En-tête */}
      <div className="page-header">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => navigate('/clients')} className="btn-outline btn-sm">
            ← Retour
          </button>
          <div>
            <h1 className="page-title flex items-center gap-3 flex-wrap">
              {client.nom}
              <span className={`badge ${status.color}`} title={status.description}>
                {status.icon} {status.label}
              </span>
            </h1>
            <p className="page-subtitle">Client depuis {formatDate(client.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => navigate(`/clients/${id}/edit`)} className="btn-outline">
            ✏️ Modifier
          </button>
          <button onClick={() => navigate(`/transactions/new?clientId=${id}`)} className="btn-primary">
            💸 Nouvelle transaction
          </button>
          {solde < 0 && (
            <button onClick={() => setShowReminderModal(true)} className="btn-warning">
              🔔 Créer un rappel
            </button>
          )}
        </div>
      </div>

      {/* Cartes de situation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="stat-label">Contact</p>
          <p className="text-lg font-medium">{client.telephone}</p>
          <p className="text-text-secondary mt-1">{client.adresse || 'Aucune adresse'}</p>
        </div>
        <div className={`card ${solde < 0 ? 'bg-warning-light' : solde > 0 ? 'bg-info-light' : 'bg-success-light'}`}>
          <p className="stat-label">Solde actuel</p>
          <p className={`stat-value ${solde > 0 ? 'text-info-dark' : solde < 0 ? 'text-warning-dark' : 'text-success'}`}>
            {solde > 0 ? '+' : solde < 0 ? '−' : ''}{formatCurrency(Math.abs(solde))}
          </p>
          <p className="text-xs mt-1">{status.description}</p>
        </div>
        <div className="card">
          <p className="stat-label">Total transactions</p>
          <p className="stat-value">{transactions.length}</p>
          <p className="text-xs text-text-secondary">Dont {transactions.filter(t => t.nature === 'CREDIT').length} crédits</p>
        </div>
        <div className="card">
          <p className="stat-label">Rappels</p>
          <p className="stat-value">{reminders.length}</p>
          <p className="text-xs text-text-secondary">
            {reminders.filter(r => r.status === 'PENDING').length} en attente
          </p>
        </div>
      </div>

      {/* Détail du calcul dette/avance */}
      {solde !== 0 && (
        <div className="card bg-gray-50">
          <h3 className="text-sm font-semibold text-text-primary mb-3">📊 Détail du calcul</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-text-secondary">Total des avances/emprunts</p>
              <p className="font-bold text-info-dark">{formatCurrency(totalCredit)}</p>
            </div>
            <div>
              <p className="text-text-secondary">Total remboursé</p>
              <p className="font-bold text-success">{formatCurrency(totalRembourse)}</p>
            </div>
            <div>
              <p className="text-text-secondary">Reste à {solde < 0 ? 'payer' : 'recuperer'}</p>
              <p className={`font-bold ${solde < 0 ? 'text-warning-dark' : 'text-info-dark'}`}>
                {formatCurrency(resteAPayer)}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-text-secondary">
            <p>📐 Formule: <strong>Avances/Emprunts - Remboursements = {formatCurrency(totalCredit)} - {formatCurrency(totalRembourse)} = {formatCurrency(solde)}</strong></p>
            <p className="mt-1">
              {solde < 0
                ? `👉 Le client doit encore ${formatCurrency(Math.abs(solde))} au cabinet`
                : solde > 0
                  ? `👉 Le cabinet doit ${formatCurrency(solde)} au client`
                  : '👉 Solde équilibré'}
            </p>
          </div>
        </div>
      )}

      {/* Liste des rappels */}
      {reminders.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-text-primary mb-3">🔔 Rappels</h3>
          <div className="space-y-2">
            {reminders.map(reminder => (
              <div key={reminder.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <p className="text-sm">{reminder.message?.substring(0, 100)}...</p>
                  <p className="text-xs text-text-muted mt-1">
                    📅 {formatDate(reminder.dateRappel)}
                    {reminder.reminderTime && ` ⏰ ${reminder.reminderTime}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${reminder.status === 'PENDING' ? 'badge-warning' : 'badge-success'}`}>
                    {reminder.status === 'PENDING' ? '⏳ En attente' : '✅ Traité'}
                  </span>
                  {reminder.status === 'PENDING' && (
                    <button
                      onClick={async () => {
                        if (confirm('Marquer ce rappel comme traité ?')) {
                          await reminderService.markAsDone(reminder.id);
                          await loadClientData();
                        }
                      }}
                      className="btn-icon btn-sm text-success"
                      title="Marquer comme traité"
                    >
                      ✅
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historique des transactions */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-lg font-semibold">Historique des transactions</h2>
          <p className="text-sm text-text-secondary mt-1">
            Seules les transactions de type <strong>CRÉDIT</strong> impactent le solde (dettes/avances)
          </p>
        </div>

        <div className="px-4 pt-4 flex gap-2 border-b border-border/50 flex-wrap">
          {[
            { value: 'all', label: '📋 Toutes', count: transactions.length },
            { value: 'credit', label: '📊 Dettes/Avances', count: transactions.filter(t => t.nature === 'CREDIT').length },
            { value: 'cash', label: '💰 Transactions simples', count: transactions.filter(t => t.nature === 'CASH').length },
            { value: 'pending', label: '⏳ En cours', count: transactions.filter(t => t.status === 'EN_COURS').length },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 text-sm font-medium transition border-b-2 flex items-center gap-2 ${
                activeTab === tab.value
                  ? 'border-success text-success'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Nature</th>
                <th className="text-right">Montant</th>
                <th className="text-right">Reste à payer</th>
                <th>Échéance</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-text-secondary">
                    Aucune transaction trouvée
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => {
                  const isCredit = t.nature === 'CREDIT';
                  return (
                    <tr key={t.id} className={isCredit && t.status === 'EN_COURS' ? 'bg-warning-light/20' : ''}>
                      <td className="whitespace-nowrap">{formatDate(t.createdAt)}</td>
                      <td>
                        <span className={`badge ${t.type === 'DEPOT' ? 'badge-info' : 'badge-warning'}`}>
                          {t.type === 'DEPOT' ? '💰 Remboursement' : '💵 Avance'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isCredit ? 'badge-warning' : 'badge-success'}`}>
                          {isCredit ? '📊 Crédit' : '💰 Cash'}
                        </span>
                      </td>
                      <td className="text-right font-mono font-medium whitespace-nowrap">
                        {formatCurrency(t.montant)}
                      </td>
                      <td className="text-right font-mono whitespace-nowrap">
                        {isCredit && t.resteAPayer > 0 ? (
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal création rappel */}
      {showReminderModal && (
        <div className="modal-overlay" onClick={() => setShowReminderModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-header">🔔 Créer un rappel</h3>
            <p className="modal-body">
              Créer un rappel pour que <strong>{client.nom}</strong> rembourse sa dette de <strong>{formatCurrency(Math.abs(solde))}</strong>.
            </p>
            <div className="modal-footer">
              <button onClick={() => setShowReminderModal(false)} className="btn-outline">
                Annuler
              </button>
              <button
                onClick={handleCreateReminder}
                disabled={creatingReminder}
                className="btn-primary"
              >
                {creatingReminder ? 'Création...' : 'Créer le rappel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Légende */}
      <div className="card bg-gray-50">
        <h3 className="text-sm font-semibold text-text-primary mb-2">📖 Comprendre le solde</h3>
        <div className="text-xs text-text-secondary space-y-1">
          <p>• <span className="text-warning-dark font-medium">DETTE (solde négatif)</span> : Le client doit de l'argent au cabinet</p>
          <p>• <span className="text-info-dark font-medium">AVANCE (solde positif)</span> : Le cabinet doit de l'argent au client</p>
          <p>• <span className="text-success font-medium">À JOUR (solde nul)</span> : Le solde est équilibré</p>
          <p>• Seules les transactions de type <strong>CRÉDIT</strong> affectent le solde</p>
          <p>• <strong>Remboursement</strong> = le client donne de l'argent (réduit la dette)</p>
          <p>• <strong>Avance</strong> = le client reçoit de l'argent (augmente la dette ou crée une avance)</p>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailPage;