import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reminderService } from '../../services/reminderService';
import { formatDate, formatDateTime } from '../../utils/formatters';

const ReminderDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [reminder, setReminder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminder();
  }, [id]);

  const loadReminder = async () => {
    try {
      setLoading(true);
      const data = await reminderService.getById(id);
      setReminder(data);
    } catch (error) {
      console.error('Erreur chargement:', error);
      alert('Erreur lors du chargement du rappel');
      navigate('/reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDone = async () => {
    try {
      await reminderService.markAsDone(id);
      await loadReminder();
      alert('✅ Rappel marqué comme fait');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer ce rappel ?')) return;
    try {
      await reminderService.delete(id);
      alert('✅ Rappel supprimé');
      navigate('/reminders');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!reminder) return null;

  const isOverdue = reminder.dateRappel < new Date().toISOString().split('T')[0] && reminder.status === 'PENDING';

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔔 Détail du rappel</h1>
          <p className="page-subtitle">
            {reminder.clientNom} - {formatDate(reminder.dateRappel)}
          </p>
        </div>
        <button onClick={() => navigate('/reminders')} className="btn-outline">
          ← Retour
        </button>
      </div>

      <div className="card space-y-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">{reminder.clientNom}</h2>
            <p className="text-text-secondary">{reminder.clientTelephone}</p>
          </div>
          <div className="flex gap-2">
            {reminder.status === 'PENDING' && (
              <button onClick={handleMarkAsDone} className="btn-success">
                ✅ Marquer comme fait
              </button>
            )}
            <button onClick={() => navigate(`/reminders/${id}/edit`)} className="btn-outline">
              ✏️ Modifier
            </button>
            <button onClick={handleDelete} className="btn-danger">
              🗑️ Supprimer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="stat-label">Statut</p>
            <p className={`text-lg font-semibold ${reminder.status === 'PENDING' ? 'text-warning-dark' : 'text-success'}`}>
              {reminder.status === 'PENDING' ? '⏳ En attente' : '✅ Fait'}
            </p>
          </div>
          <div>
            <p className="stat-label">Date de rappel</p>
            <p className={`text-lg font-semibold ${isOverdue ? 'text-danger' : ''}`}>
              {formatDate(reminder.dateRappel)}
              {isOverdue && <span className="text-sm ml-2">(En retard)</span>}
            </p>
          </div>
          <div>
            <p className="stat-label">Heure</p>
            <p className="text-lg font-semibold">{reminder.reminderTime || '—'}</p>
          </div>
          <div>
            <p className="stat-label">Créé par</p>
            <p className="text-lg font-semibold">{reminder.username || '—'}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="stat-label mb-2">📝 Message</p>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-text-primary whitespace-pre-wrap">{reminder.message}</p>
          </div>
        </div>

        <div className="border-t pt-4 text-sm text-text-muted">
          <p>Créé le : {formatDateTime(reminder.createdAt)}</p>
          <p>Modifié le : {formatDateTime(reminder.updatedAt)}</p>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => navigate(`/clients/${reminder.clientId}`)}
          className="btn-outline"
        >
          👤 Voir la fiche client
        </button>
      </div>
    </div>
  );
};

export default ReminderDetailPage;