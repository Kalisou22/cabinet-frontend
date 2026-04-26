import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { reminderService } from '../../services/reminderService';
import { clientService } from '../../services/clientService';
import { useAuth } from '../../context/AuthContext';
import { transactionService } from '../../services/transactionService';
import { formatCurrency } from '../../utils/formatters';

const ReminderForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    clientId: searchParams.get('clientId') || '',
    message: '',
    dateRappel: new Date().toISOString().split('T')[0],
    reminderTime: '09:00',
    status: 'PENDING',
  });
  const [clients, setClients] = useState([]);
  const [clientDebt, setClientDebt] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClients();
    if (isEditMode) {
      loadReminder();
    }
  }, [id]);

  useEffect(() => {
    if (formData.clientId) {
      loadClientDebt();
    }
  }, [formData.clientId]);

  const loadClients = async () => {
    try {
      const data = await clientService.getActiveClients();
      setClients(data);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  };

  const loadReminder = async () => {
    try {
      setLoading(true);
      const reminder = await reminderService.getById(id);
      setFormData({
        clientId: reminder.clientId || '',
        message: reminder.message || '',
        dateRappel: reminder.dateRappel || new Date().toISOString().split('T')[0],
        reminderTime: reminder.reminderTime || '09:00',
        status: reminder.status || 'PENDING',
      });
    } catch (error) {
      console.error('Erreur chargement rappel:', error);
      alert('Impossible de charger le rappel');
      navigate('/reminders');
    } finally {
      setLoading(false);
    }
  };

  const loadClientDebt = async () => {
    try {
      const solde = await transactionService.getClientSolde(formData.clientId);
      setClientDebt(solde);
    } catch (error) {
      console.error('Erreur chargement dette:', error);
      setClientDebt(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.clientId) newErrors.clientId = 'Le client est obligatoire';
    if (!formData.message.trim()) newErrors.message = 'Le message est obligatoire';
    if (!formData.dateRappel) newErrors.dateRappel = 'La date est obligatoire';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      const data = {
        ...formData,
        clientId: parseInt(formData.clientId),
        userId: user?.id,
      };

      if (isEditMode) {
        await reminderService.update(id, data);
        alert('✅ Rappel modifié avec succès');
      } else {
        await reminderService.create(data);
        alert('✅ Rappel créé avec succès');
      }
      navigate('/reminders');
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const getDebtInfo = () => {
    if (clientDebt === null) return null;
    if (clientDebt < 0) {
      return {
        text: `⚠️ Dette actuelle: ${formatCurrency(Math.abs(clientDebt))}`,
        color: 'text-warning-dark',
        bg: 'bg-warning-light',
        label: 'Client endetté'
      };
    }
    if (clientDebt > 0) {
      return {
        text: `💰 Avance actuelle: ${formatCurrency(clientDebt)}`,
        color: 'text-info-dark',
        bg: 'bg-info-light',
        label: 'Client en avance'
      };
    }
    return {
      text: '✅ Solde à jour',
      color: 'text-success',
      bg: 'bg-success-light',
      label: 'Client à jour'
    };
  };

  const debtInfo = getDebtInfo();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? '✏️ Modifier le rappel' : '🔔 Nouveau rappel de paiement'}
        </h1>
        <button onClick={() => navigate('/reminders')} className="btn-outline">
          ← Retour
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client <span className="text-red-500">*</span>
            </label>
            <select
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              disabled={isEditMode}
              className={`w-full px-3 py-2 border rounded-lg ${errors.clientId ? 'border-red-500' : 'border-gray-300'} ${isEditMode ? 'bg-gray-100' : ''}`}
            >
              <option value="">Sélectionner un client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.nom} - {c.telephone}</option>
              ))}
            </select>
            {errors.clientId && <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>}

            {/* Situation financière du client */}
            {debtInfo && (
              <div className={`mt-3 p-3 rounded-lg ${debtInfo.bg}`}>
                <p className={`text-sm font-medium ${debtInfo.color}`}>
                  📊 {debtInfo.text}
                </p>
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message du rappel <span className="text-red-500">*</span>
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="3"
              className={`w-full px-3 py-2 border rounded-lg ${errors.message ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Ex: Madame, Monsieur, nous vous rappelons que votre échéance du ..."
            />
            {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
          </div>

          {/* Date et heure */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📅 Date du rappel <span className="text-red-500">*</span>
              </label>
              <input
                name="dateRappel"
                type="date"
                value={formData.dateRappel}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg ${errors.dateRappel ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.dateRappel && <p className="mt-1 text-sm text-red-600">{errors.dateRappel}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ⏰ Heure (optionnel)
              </label>
              <input
                name="reminderTime"
                type="time"
                value={formData.reminderTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* Statut (modification uniquement) */}
          {isEditMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="PENDING">⏳ En attente - Rappel à envoyer</option>
                <option value="DONE">✅ Fait - Rappel traité</option>
              </select>
            </div>
          )}

          {/* Messages suggérés - seulement si dette */}
          {clientDebt !== null && clientDebt < 0 && (
            <div className="bg-warning-light rounded-lg p-4">
              <p className="text-sm font-medium text-warning-dark mb-2">💡 Modèles de messages :</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, message: `📢 RAPPEL DE PAIEMENT\n\nCher client,\n\nNous vous rappelons que votre dette de ${formatCurrency(Math.abs(clientDebt))} arrive à échéance le ${formData.dateRappel}.\n\nMerci de bien vouloir régulariser votre situation avant cette date.\n\nCordialement.` }))}
                  className="text-sm text-warning-dark hover:underline block text-left w-full p-2 bg-white rounded"
                >
                  📝 Rappel standard
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, message: `⚠️ URGENT - DERNIER RAPPEL\n\nCher client,\n\nVotre dette de ${formatCurrency(Math.abs(clientDebt))} est en souffrance.\n\nNous vous prions de régulariser votre situation dans les plus brefs délais.\n\nCordialement.` }))}
                  className="text-sm text-warning-dark hover:underline block text-left w-full p-2 bg-white rounded"
                >
                  ⚠️ Relance urgente
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, message: `🤝 ÉCHÉANCE PROCHAINE\n\nBonjour,\n\nUne échéance de ${formatCurrency(Math.abs(clientDebt))} est prévue pour le ${formData.dateRappel}.\n\nN'hésitez pas à nous contacter pour toute question.\n\nCordialement.` }))}
                  className="text-sm text-warning-dark hover:underline block text-left w-full p-2 bg-white rounded"
                >
                  📅 Rappel d'échéance
                </button>
              </div>
            </div>
          )}

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => navigate('/reminders')} className="btn-outline">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Enregistrement...' : (isEditMode ? '💾 Mettre à jour' : '📨 Créer le rappel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReminderForm;