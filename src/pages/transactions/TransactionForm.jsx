import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { transactionService } from '../../services/transactionService';
import { clientService } from '../../services/clientService';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';

const TransactionForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    clientId: searchParams.get('clientId') || '',
    type: 'RETRAIT', // RETRAIT = virement, DEPOT = dépôt/remboursement
    montant: '',
    dueDate: '',
    description: '',
  });
  const [clients, setClients] = useState([]);
  const [clientSolde, setClientSolde] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (formData.clientId) {
      loadClientSolde();
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

  const loadClientSolde = async () => {
    try {
      const solde = await transactionService.getClientSolde(formData.clientId);
      setClientSolde(solde);
    } catch (error) {
      console.error('Erreur chargement solde:', error);
      setClientSolde(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.clientId) newErrors.clientId = 'Le client est obligatoire';
    if (!formData.montant || parseFloat(formData.montant) <= 0) newErrors.montant = 'Montant invalide';
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
      const montant = parseFloat(formData.montant);

      // ✅ CORRECTION : Déterminer le statut en fonction du type
      // DEPOT (remboursement) = REMBOURSE
      // RETRAIT (virement) = EN_COURS (car dette créée)
      const status = formData.type === 'DEPOT' ? 'REMBOURSE' : 'EN_COURS';

      const data = {
        clientId: parseInt(formData.clientId),
        type: formData.type,
        nature: 'CREDIT',
        montant: montant,
        userId: user?.id,
        dueDate: formData.dueDate || null,
        description: formData.description,
        status: status
      };

      await transactionService.create(data);

      const nouveauSolde = (clientSolde || 0) - (formData.type === 'RETRAIT' ? montant : -montant);
      const message = formData.type === 'DEPOT'
        ? `✅ Remboursement enregistré !\nNouveau solde: ${formatCurrency(Math.abs(nouveauSolde))} ${nouveauSolde >= 0 ? '(AVANCE)' : '(DETTE)'}`
        : `✅ Virement effectué !\nNouveau solde: ${formatCurrency(Math.abs(nouveauSolde))} ${nouveauSolde >= 0 ? '(AVANCE)' : '(DETTE)'}`;

      alert(message);

      navigate(`/clients/${formData.clientId}`);
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.response?.data?.message || 'Erreur lors de l\'opération');
    } finally {
      setSaving(false);
    }
  };

  const getSoldeInfo = () => {
    if (clientSolde === null) return null;
    if (clientSolde > 0) {
      return {
        text: `💰 Avance disponible: ${formatCurrency(clientSolde)}`,
        color: 'text-info-dark',
        bg: 'bg-info-light'
      };
    }
    if (clientSolde < 0) {
      return {
        text: `⚠️ Dette actuelle: ${formatCurrency(Math.abs(clientSolde))}`,
        color: 'text-warning-dark',
        bg: 'bg-warning-light'
      };
    }
    return {
      text: '✅ Solde à zéro',
      color: 'text-success',
      bg: 'bg-success-light'
    };
  };

  const soldeInfo = getSoldeInfo();

  const getNouveauSolde = () => {
    if (clientSolde === null || !formData.montant) return null;
    const montant = parseFloat(formData.montant);
    if (isNaN(montant)) return null;
    return formData.type === 'RETRAIT' ? clientSolde - montant : clientSolde + montant;
  };

  const nouveauSolde = getNouveauSolde();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          {formData.type === 'RETRAIT' ? '💸 Virement / Retrait' : '💰 Remboursement'}
        </h1>
        <button onClick={() => navigate(-1)} className="btn-outline">
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
              className={`w-full px-3 py-2 border rounded-lg ${errors.clientId ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Sélectionner un client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nom} - {c.telephone}
                </option>
              ))}
            </select>
            {errors.clientId && <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>}

            {soldeInfo && (
              <div className={`mt-3 p-3 rounded-lg ${soldeInfo.bg}`}>
                <p className={`text-sm font-medium ${soldeInfo.color}`}>
                  📊 Situation actuelle : {soldeInfo.text}
                </p>
              </div>
            )}
          </div>

          {/* Type d'opération */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d'opération <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition ${
                formData.type === 'RETRAIT' ? 'bg-warning-light border-warning' : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="type"
                  value="RETRAIT"
                  checked={formData.type === 'RETRAIT'}
                  onChange={handleChange}
                  className="mr-2"
                />
                <div>
                  <span className="font-medium">💸 Virement / Retrait</span>
                  <p className="text-xs text-text-secondary">Le client reçoit de l'argent (crée ou augmente la dette)</p>
                </div>
              </label>
              <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition ${
                formData.type === 'DEPOT' ? 'bg-success-light border-success' : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="type"
                  value="DEPOT"
                  checked={formData.type === 'DEPOT'}
                  onChange={handleChange}
                  className="mr-2"
                />
                <div>
                  <span className="font-medium">💰 Remboursement</span>
                  <p className="text-xs text-text-secondary">Le client rembourse (réduit ou annule la dette)</p>
                </div>
              </label>
            </div>
          </div>

          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant (Franc Guinéen) <span className="text-red-500">*</span>
            </label>
            <input
              name="montant"
              type="number"
              min="0"
              step="1000"
              value={formData.montant}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg text-lg ${errors.montant ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Ex: 50000"
              autoFocus
            />
            {errors.montant && <p className="mt-1 text-sm text-red-600">{errors.montant}</p>}
          </div>

          {/* Date d'échéance (optionnelle) - uniquement pour les virements */}
          {formData.type === 'RETRAIT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📅 Date d'échéance <span className="text-gray-400 text-xs">(optionnel)</span>
              </label>
              <input
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-text-secondary mt-1">
                Date limite pour le remboursement de cette avance
              </p>
            </div>
          )}

          {/* Impact sur le solde */}
          {clientSolde !== null && formData.montant && (
            <div className={`p-4 rounded-lg ${formData.type === 'RETRAIT' ? 'bg-warning-light' : 'bg-success-light'}`}>
              <p className="font-medium">
                {formData.type === 'RETRAIT' ? '📉 Impact du virement' : '📈 Impact du remboursement'}
              </p>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Solde actuel :</span>
                  <span className={`font-medium ${clientSolde > 0 ? 'text-info-dark' : clientSolde < 0 ? 'text-warning-dark' : ''}`}>
                    {clientSolde > 0 ? '+' : clientSolde < 0 ? '−' : ''}{formatCurrency(Math.abs(clientSolde))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Opération :</span>
                  <span className={formData.type === 'RETRAIT' ? 'text-warning-dark' : 'text-success'}>
                    {formData.type === 'RETRAIT' ? '−' : '+'}{formatCurrency(parseFloat(formData.montant) || 0)}
                  </span>
                </div>
                <div className="border-t pt-1 mt-1">
                  <div className="flex justify-between font-bold">
                    <span>Nouveau solde :</span>
                    <span className={nouveauSolde > 0 ? 'text-info-dark' : nouveauSolde < 0 ? 'text-warning-dark' : 'text-success'}>
                      {nouveauSolde > 0 ? '+' : nouveauSolde < 0 ? '−' : ''}{formatCurrency(Math.abs(nouveauSolde))}
                    </span>
                  </div>
                  <p className="text-xs mt-1">
                    {nouveauSolde > 0
                      ? `💰 Le client dispose d'une avance de ${formatCurrency(nouveauSolde)}`
                      : nouveauSolde < 0
                        ? `⚠️ Le client a une dette de ${formatCurrency(Math.abs(nouveauSolde))}`
                        : '✅ Solde à zéro'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📝 Motif / Référence</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Ex: Virement pour achats à Conakry..."
            />
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => navigate(-1)} className="btn-outline">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="btn-primary px-6">
              {saving ? 'Traitement...' : (formData.type === 'RETRAIT' ? '💸 Effectuer le virement' : '💰 Enregistrer le remboursement')}
            </button>
          </div>
        </form>
      </div>

      {/* Rappel des règles */}
      <div className="card bg-gray-50 text-center">
        <p className="text-sm text-text-secondary">
          💡 <strong>Rappel</strong> :
          <br />• <strong>Virement</strong> = vous envoyez de l'argent au client (sa dette augmente)
          <br />• <strong>Remboursement</strong> = le client vous rembourse (sa dette diminue)
        </p>
      </div>
    </div>
  );
};

export default TransactionForm;