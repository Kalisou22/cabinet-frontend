import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inventoryService } from '../../services/inventoryService';
import { platformService } from '../../services/platformService';
import { formatCurrency } from '../../utils/formatters';

const InventoryEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [session, setSession] = useState(null);
  const [lines, setLines] = useState([]);
  const [availablePlatforms, setAvailablePlatforms] = useState([]);
  const [selectedPlatformId, setSelectedPlatformId] = useState('');
  const [customMontant, setCustomMontant] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const totalPlateformes = lines.reduce((sum, p) => sum + (parseFloat(p.montantMatin) || 0), 0);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionData, linesData, platformsData] = await Promise.all([
        inventoryService.getSessionById(id),
        inventoryService.getLinesBySession(id),
        platformService.getAll(true),
      ]);
      setSession(sessionData);
      setLines(linesData || []);
      setAvailablePlatforms(platformsData || []);
    } catch (error) {
      console.error('Erreur chargement:', error);
      alert('Erreur lors du chargement de la session');
      navigate('/inventory');
    } finally {
      setLoading(false);
    }
  };

  const updateLineMontant = (lineId, value) => {
    const newValue = parseFloat(value);
    if (isNaN(newValue)) return;
    if (newValue < 0) return;
    setLines(lines.map(p =>
      p.id === lineId ? { ...p, montantMatin: newValue || 0 } : p
    ));
  };

  const removeLine = async (lineId) => {
    if (!confirm('Supprimer cette plateforme de la session ?')) return;
    try {
      await inventoryService.deleteLine(lineId);
      setLines(lines.filter(p => p.id !== lineId));
      alert('✅ Plateforme supprimée');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const addPlatform = async () => {
    if (!selectedPlatformId) {
      alert('Veuillez sélectionner une plateforme');
      return;
    }

    const platform = availablePlatforms.find(p => p.id === parseInt(selectedPlatformId));
    if (!platform) return;

    if (lines.some(p => p.platformName === platform.name)) {
      alert('Cette plateforme est déjà dans la session');
      return;
    }

    const montant = parseFloat(customMontant);
    if (isNaN(montant) || montant < 0) {
      alert('Veuillez saisir un montant valide (0 ou plus)');
      return;
    }

    try {
      const newLine = await inventoryService.addLine({
        sessionId: parseInt(id),
        platformName: platform.name,
        montantMatin: montant,
      });
      setLines([...lines, newLine]);
      setSelectedPlatformId('');
      setCustomMontant('');
      alert('✅ Plateforme ajoutée');
    } catch (error) {
      console.error('Erreur ajout:', error);
      alert(error.response?.data?.message || 'Erreur lors de l\'ajout');
    }
  };

  const handleSave = async () => {
    const invalidLines = lines.filter(line => line.montantMatin < 0);
    if (invalidLines.length > 0) {
      alert('Les montants ne peuvent pas être négatifs');
      return;
    }

    try {
      setSaving(true);
      for (const line of lines) {
        await inventoryService.updateLine(line.id, {
          sessionId: parseInt(id),
          platformName: line.platformName,
          montantMatin: line.montantMatin,
        });
      }
      alert('✅ Modifications enregistrées avec succès !');
      navigate('/inventory');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="mt-4 text-text-secondary">Chargement de la session...</p>
      </div>
    );
  }

  if (session?.status === 'CLOSED') {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔒</div>
        <h3 className="empty-state-title">Session fermée</h3>
        <p className="empty-state-description">
          Cette session est déjà fermée et ne peut plus être modifiée.
          Vous pouvez uniquement consulter ses détails.
        </p>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => navigate(`/inventory/session/${session.id}`)}
            className="btn-outline"
          >
            👁️ Voir les détails
          </button>
          <button
            onClick={() => navigate('/inventory')}
            className="btn-primary"
          >
            ← Retour à l'inventaire
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">✏️ Modifier la session</h1>
          <p className="page-subtitle">
            {session?.date && new Date(session.date).toLocaleDateString('fr-FR', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>
        <button onClick={() => navigate('/inventory')} className="btn-outline">
          ← Retour
        </button>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-text-primary mb-4">📱 Plateformes de la session</h2>

        {lines.length === 0 ? (
          <p className="text-text-secondary text-center py-4">Aucune plateforme</p>
        ) : (
          <div className="space-y-3 mb-6">
            {lines.map((line) => (
              <div key={line.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-48 font-medium text-text-primary">{line.platformName}</div>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={line.montantMatin}
                    onChange={(e) => updateLineMontant(line.id, e.target.value)}
                    className="input pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">FG</span>
                </div>
                <button
                  onClick={() => removeLine(line.id)}
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
            <label className="block text-sm font-medium text-text-secondary mb-1">Ajouter une plateforme</label>
            <select
              value={selectedPlatformId}
              onChange={(e) => setSelectedPlatformId(e.target.value)}
              className="input"
            >
              <option value="">Sélectionner</option>
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
        <h3 className="text-lg font-semibold mb-4">📊 Total capital matin</h3>
        <div className="flex justify-between text-xl font-bold">
          <span>TOTAL</span>
          <span className="font-mono">{formatCurrency(totalPlateformes)}</span>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => navigate('/inventory')} className="btn-outline" type="button">
          Annuler
        </button>
        <button onClick={handleSave} disabled={saving} className="btn-primary btn-lg" type="button">
          {saving ? 'Enregistrement...' : '💾 Enregistrer les modifications'}
        </button>
      </div>
    </div>
  );
};

export default InventoryEditPage;