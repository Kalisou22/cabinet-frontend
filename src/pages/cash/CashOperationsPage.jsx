import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cashOperationService } from '../../services/cashOperationService';
import { reminderService } from '../../services/reminderService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import StatCard from '../../components/common/StatCard';

const CashOperationsPage = () => {
  const navigate = useNavigate();
  const [operations, setOperations] = useState([]);
  const [summary, setSummary] = useState({ totalEntrees: 0, totalSorties: 0, solde: 0 });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [pendingReminders, setPendingReminders] = useState(0);

  useEffect(() => {
    loadData();
    loadReminders();
  }, [period]);

  const loadReminders = async () => {
    try {
      const reminders = await reminderService.getPending();
      setPendingReminders(reminders?.length || 0);
    } catch (error) {
      console.error('Erreur chargement rappels:', error);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let start, end;
    if (period === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
    } else if (period === 'week') {
      const dayOfWeek = now.getDay() || 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek + 1);
      start = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0).toISOString();
      end = new Date().toISOString();
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0).toISOString();
      end = new Date().toISOString();
    }
    return { start, end };
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange();
      const [ops, sum] = await Promise.all([
        cashOperationService.getByPeriod(start, end),
        cashOperationService.getSummary(start, end),
      ]);
      setOperations(ops || []);
      setSummary(sum || { totalEntrees: 0, totalSorties: 0, solde: 0 });
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return "Aujourd'hui";
      case 'week': return 'Cette semaine';
      case 'month': return 'Ce mois';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="mt-4 text-text-secondary">Chargement des opérations...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">💰 Caisse</h1>
          <p className="page-subtitle">Gestion des entrées et sorties d'argent • {getPeriodLabel()}</p>
        </div>
        <div className="flex gap-2">
          {pendingReminders > 0 && (
            <button
              onClick={() => navigate('/reminders')}
              className="btn-outline flex items-center gap-2"
            >
              🔔 {pendingReminders} rappel{pendingReminders > 1 ? 's' : ''}
            </button>
          )}
          <button onClick={() => navigate('/cash-operations/new')} className="btn-primary">
            + Nouvelle opération
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          title="Total Entrées"
          value={formatCurrency(summary.totalEntrees)}
          icon="📈"
          color="success"
        />
        <StatCard
          title="Total Sorties"
          value={formatCurrency(summary.totalSorties)}
          icon="📉"
          color="danger"
        />
        <StatCard
          title="Solde"
          value={formatCurrency(summary.solde)}
          icon="💰"
          color={summary.solde >= 0 ? 'success' : 'danger'}
        />
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium text-text-secondary">Période :</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input w-auto min-w-[150px]"
          >
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
          <span className="text-sm text-text-muted">
            {operations.length} opération{operations.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Catégorie</th>
                <th>Type</th>
                <th className="text-right">Montant</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {operations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <div className="empty-state-icon">💰</div>
                    <p className="empty-state-title">Aucune opération</p>
                    <p className="empty-state-description">
                      Commencez par ajouter une entrée ou sortie d'argent
                    </p>
                    <button
                      onClick={() => navigate('/cash-operations/new')}
                      className="btn-primary mt-4"
                    >
                      + Nouvelle opération
                    </button>
                  </td>
                </tr>
              ) : (
                operations.map((op) => (
                  <tr key={op.id}>
                    <td className="whitespace-nowrap">{formatDateTime(op.createdAt)}</td>
                    <td>{op.categoryName || '—'}</td>
                    <td>
                      <span className={`badge ${op.type === 'ENTREE' ? 'badge-success' : 'badge-danger'}`}>
                        {op.type === 'ENTREE' ? '📈 Entrée' : '📉 Sortie'}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className={`font-mono font-semibold ${op.type === 'ENTREE' ? 'text-success' : 'text-danger'}`}>
                        {op.type === 'ENTREE' ? '+' : '−'} {formatCurrency(op.montant)}
                      </span>
                    </td>
                    <td className="max-w-xs truncate">{op.description || '—'}</td>
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

export default CashOperationsPage;