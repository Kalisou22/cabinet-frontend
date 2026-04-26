import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '../../services/inventoryService';
import { platformService } from '../../services/platformService';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';

const InventoryOpenPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessionId, setSessionId] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [availablePlatforms, setAvailablePlatforms] = useState([]);
  const [selectedPlatformId, setSelectedPlatformId] = useState('');
  const [customMontant, setCustomMontant] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const totalPlateformes = platforms.reduce((sum, p) => sum + (parseFloat(p.montantMatin) || 0), 0);

  useEffect(() => {
    initPage();
  }, []);

  const initPage = async () => {
    setLoading(true);

    try {
      // Charger les plateformes disponibles
      const platformsData = await platformService.getAll(true);
      setAvailablePlatforms(platformsData || []);

      // Vérifier et créer la session
      await checkAndCreateSession();
    } catch (error) {
      console.error('Erreur initialisation:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndCreateSession = async () => {
    const today = new Date().toISOString().split('T')[0];

    try {
      // 1. Vérifier s'il existe une session ouverte
      const openSessions = await inventoryService.getOpenSessions();
      if (openSessions && openSessions.length > 0) {
        const openSession = openSessions[0];
        alert(`⚠️ Une session est déjà ouverte pour le ${openSession.date}. Redirection vers la modification.`);
        navigate(`/inventory/session/${openSession.id}/edit`);
        return false;
      }

      // 2. Vérifier s'il existe une session pour aujourd'hui (même fermée)
      let existingSession = null;
      try {
        existingSession = await inventoryService.getSessionByDate(today);
      } catch (e) {
        // Pas de session, c'est normal
      }

      if (existingSession) {
        if (existingSession.status === 'OPEN') {
          alert(`⚠️ Une session est déjà ouverte pour aujourd'hui. Redirection vers la modification.`);
          navigate(`/inventory/session/${existingSession.id}/edit`);
          return false;
        } else {
          alert(`⚠️ Une session fermée existe pour aujourd'hui.\nRésultat: ${formatCurrency(existingSession.resultat || 0)}\n\nVeuillez la réinitialiser depuis l'inventaire.`);
          navigate('/inventory');
          return false;
        }
      }

      // 3. Créer la nouvelle session
      const session = await inventoryService.createSession({
        date: today,
        status: 'OPEN',
        userId: user?.id,
      });

      if (session && session.id) {
        setSessionId(session.id);
        return true;
      } else {
        throw new Error('Session créée sans ID');
      }

    } catch (error) {
      console.error('Erreur création session:', error);
      const errorMsg = error.response?.data?.message || error.message;

      // Gestion spécifique des erreurs
      if (errorMsg.includes('already exists') || errorMsg.includes('Duplicate entry')) {
        alert('⚠️ Une session existe déjà pour aujourd\'hui. Redirection vers l\'inventaire.');
        navigate('/inventory');
      } else if (errorMsg.includes('closed session')) {
        alert('⚠️ Une session fermée existe. Veuillez la réinitialiser.');
        navigate('/inventory');
      } else {
        alert(`❌ ${errorMsg}`);
        navigate('/inventory');
      }
      return false;
    }
  };

  const addPlatform = () => {
    if (!selectedPlatformId) {
      alert('Veuillez sélectionner une plateforme');
      return;
    }

    const platform = availablePlatforms.find(p => p.id === parseInt(selectedPlatformId));
    if (!platform) return;

    if (platforms.some(p => p.platformId === platform.id)) {
      alert('Cette plateforme est déjà ajoutée');
      return;
    }

    const montant = parseFloat(customMontant) || 0;

    setPlatforms([...platforms, {
      id: Date.now(),
      platformId: platform.id,
      platformName: platform.name,
      montantMatin: montant,
    }]);

    setSelectedPlatformId('');
    setCustomMontant('');
  };

  const updatePlatformMontant = (platformId, value) => {
    const newValue = parseFloat(value);
    if (isNaN(newValue)) return;
    if (newValue < 0) return;
    setPlatforms(platforms.map(p =>
      p.id === platformId ? { ...p, montantMatin: newValue || 0 } : p
    ));
  };

  const removePlatform = (platformId) => {
    setPlatforms(platforms.filter(p => p.id !== platformId));
  };

  const handleSave = async () => {
    if (!sessionId) {
      alert('Session non créée, veuillez réessayer');
      navigate('/inventory');
      return;
    }

    if (platforms.length === 0) {
      alert('Veuillez ajouter au moins une plateforme');
      return;
    }

    try {
      setSaving(true);

      for (const platform of platforms) {
        await inventoryService.addLine({
          sessionId: parseInt(sessionId),
          platformName: platform.platformName,
          montantMatin: parseFloat(platform.montantMatin) || 0,
        });
      }

      alert('✅ Ouverture de caisse enregistrée avec succès !');
      navigate('/inventory');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert(`❌ Erreur: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="mt-4 text-text-secondary">Vérification de la session...</p>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h3 className="empty-state-title">Impossible d'ouvrir la caisse</h3>
        <p className="empty-state-description">
          Une session existe déjà ou une erreur est survenue.
          <br />Veuillez vérifier l'inventaire.
        </p>
        <button onClick={() => navigate('/inventory')} className="btn-primary mt-4">
          ← Retour à l'inventaire
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🌅 Ouverture de caisse</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>
        <button onClick={() => navigate('/inventory')} className="btn-outline">
          ← Retour
        </button>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-text-primary mb-4">📱 Plateformes de transfert</h2>
        <p className="text-sm text-text-secondary mb-4">
          Saisissez les montants disponibles sur chaque plateforme ce matin
        </p>

        {platforms.length > 0 && (
          <div className="space-y-3 mb-6">
            {platforms.map((platform) => (
              <div key={platform.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-48 font-medium text-text-primary">{platform.platformName}</div>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={platform.montantMatin}
                    onChange={(e) => updatePlatformMontant(platform.id, e.target.value)}
                    className="input pr-16"
                    placeholder="Montant"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">FG</span>
                </div>
                <button
                  onClick={() => removePlatform(platform.id)}
                  className="btn-icon text-danger hover:bg-danger-light"
                  type="button"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-4 p-4 bg-gray-50 rounded-xl flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-text-secondary mb-1">Plateforme</label>
            <select
              value={selectedPlatformId}
              onChange={(e) => setSelectedPlatformId(e.target.value)}
              className="input"
            >
              <option value="">Sélectionner une plateforme</option>
              {availablePlatforms.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-text-secondary mb-1">Montant (FG)</label>
            <input
              type="number"
              min="0"
              step="1000"
              value={customMontant}
              onChange={(e) => setCustomMontant(e.target.value)}
              className="input"
              placeholder="0"
            />
          </div>
          <button onClick={addPlatform} className="btn-primary" disabled={!selectedPlatformId} type="button">
            + Ajouter
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-success to-success-dark rounded-2xl shadow-lg p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">📊 Résumé du matin</h3>
        <div className="space-y-2">
          {platforms.map((platform) => (
            <div key={platform.id} className="flex justify-between text-white/90">
              <span>{platform.platformName}</span>
              <span className="font-mono">{formatCurrency(platform.montantMatin)}</span>
            </div>
          ))}
          <div className="border-t border-white/30 my-3"></div>
          <div className="flex justify-between text-lg font-bold">
            <span>TOTAL CAPITAL MATIN</span>
            <span className="font-mono">{formatCurrency(totalPlateformes)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || platforms.length === 0}
          className="btn-primary btn-lg"
          type="button"
        >
          {saving ? 'Enregistrement...' : '✅ Valider l\'ouverture'}
        </button>
      </div>
    </div>
  );
};

export default InventoryOpenPage;