import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { transactionService } from '../../services/transactionService';
import { clientService } from '../../services/clientService';
import { platformService } from '../../services/platformService';
import { useAuth } from '../../context/AuthContext';

const TransactionForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    clientId: searchParams.get('clientId') || '',
    accountId: '',
    type: 'RETRAIT',
    nature: 'CASH',
    montant: '',
    description: '',
  });
  const [clients, setClients] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientBalance, setClientBalance] = useState(null);

  // Messages métier dynamiques
  const isAvance = formData.type === 'RETRAIT' && formData.nature === 'CREDIT';
  const isRemboursement = formData.type === 'DEPOT' && formData.nature === 'CREDIT';
  const isRetraitNormal = formData.type === 'RETRAIT' && formData.nature === 'CASH';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.clientId) {
      loadClientBalance();
    }
  }, [formData.clientId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsData, accountsData] = await Promise.all([
        clientService.getActiveClients(),
        platformService.getAll(true),
      ]);
      setClients(clientsData || []);
      setAccounts(accountsData || []);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClientBalance = async () => {
    try {
      const balance = await transactionService.getClientSolde(formData.clientId);
      setClientBalance(balance);
    } catch (error) {
      setClientBalance(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.clientId) newErrors.clientId = 'Le client est obligatoire';
    if (!formData.accountId) newErrors.accountId = 'Le compte est obligatoire';
    const montant = parseFloat(formData.montant);
    if (isNaN(montant) || montant <= 0) newErrors.montant = 'Montant invalide';
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

    // ✅ Vérification solde suffisant pour retrait cash
    if (isRetraitNormal && clientBalance !== null && clientBalance < parseFloat(formData.montant)) {
      alert(`❌ Solde insuffisant !\nSolde actuel: ${clientBalance.toLocaleString()} FG\nMontant demandé: ${parseFloat(formData.montant).toLocaleString()} FG`);
      return;
    }

    // ✅ Confirmation pour avance (création dette)
    if (isAvance) {
      const confirm = window.confirm(
        '⚠️ ATTENTION : Cette opération va créer une dette pour le client.\n\n' +
        'Le client devra rembourser ce montant ultérieurement.\n\n' +
        'Confirmez-vous ?'
      );
      if (!confirm) return;
    }

    try {
      setSaving(true);

      const data = {
        clientId: parseInt(formData.clientId),
        accountId: parseInt(formData.accountId),
        type: formData.type,
        nature: formData.nature,
        montant: parseFloat(formData.montant),
        description: formData.description,
        userId: user?.id,
      };

      await transactionService.create(data);

      let message = '✅ Opération effectuée avec succès !';
      if (isAvance) message = '✅ Avance enregistrée ! Le client a maintenant une dette.';
      if (isRemboursement) message = '✅ Remboursement enregistré ! La dette a été réduite.';

      alert(message);
      navigate(`/clients/${formData.clientId}`);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Erreur lors de l\'opération';
      alert(`❌ ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="mt-4">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          {isAvance ? '💸 Avance (création de dette)' : isRemboursement ? '💰 Remboursement de dette' : '💸 Nouvelle opération'}
        </h1>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
          ← Retour
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Message métier dynamique */}
          {isAvance && (
            <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-4">
              <p className="text-yellow-800 font-medium flex items-center gap-2">
                ⚠️ Cette opération va créer une dette pour le client
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Le client devra rembourser ce montant ultérieurement via un dépôt (nature = CREDIT).
              </p>
            </div>
          )}

          {isRemboursement && (
            <div className="bg-green-50 border border-green-400 rounded-lg p-4">
              <p className="text-green-800 font-medium flex items-center gap-2">
                ✅ Cette opération est un remboursement de dette
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Le montant sera déduit de la dette du client.
              </p>
            </div>
          )}

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
          </div>

          {/* Compte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compte / Plateforme <span className="text-red-500">*</span>
            </label>
            <select
              name="accountId"
              value={formData.accountId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg ${errors.accountId ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Sélectionner un compte</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
            {errors.accountId && <p className="mt-1 text-sm text-red-600">{errors.accountId}</p>}
          </div>

          {/* Type et Nature */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="RETRAIT">💸 Avance / Virement (client reçoit)</option>
                <option value="DEPOT">💰 Remboursement / Dépôt (client donne)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.type === 'RETRAIT' ? 'Le client reçoit de l\'argent' : 'Le client donne de l\'argent'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nature *</label>
              <select
                name="nature"
                value={formData.nature}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="CASH">💰 Espèces (Cash)</option>
                <option value="CREDIT">📊 Crédit (impacte la dette)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.nature === 'CREDIT' ? 'Impacte le solde dette du client' : 'Transaction simple sans impact dette'}
              </p>
            </div>
          </div>

          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant (FG) <span className="text-red-500">*</span>
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

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📝 Motif / Référence</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Ex: Virement pour achats..."
            />
          </div>

          {/* Situation client */}
          {clientBalance !== null && clientBalance !== 0 && (
            <div className={`p-3 rounded-lg ${clientBalance < 0 ? 'bg-orange-50' : 'bg-blue-50'}`}>
              <p className={`text-sm font-medium ${clientBalance < 0 ? 'text-orange-700' : 'text-blue-700'}`}>
                📊 Situation actuelle : {clientBalance < 0 ? `Dette de ${Math.abs(clientBalance).toLocaleString()} FG` : `Avance de ${clientBalance.toLocaleString()} FG`}
              </p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Traitement...' : (isAvance ? '💸 Accorder l\'avance' : isRemboursement ? '💰 Enregistrer le remboursement' : '✅ Valider l\'opération')}
            </button>
          </div>
        </form>
      </div>

      {/* Légende métier */}
      <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-600">
        💡 <strong>Comprendre les opérations :</strong>
        <br />• <strong>Avance + Crédit</strong> = Vous donnez de l'argent au client (créé une dette)
        <br />• <strong>Remboursement + Crédit</strong> = Le client rembourse (réduit la dette)
        <br />• <strong>Cash</strong> = Transaction simple sans impact sur la dette
      </div>
    </div>
  );
};

export default TransactionForm;