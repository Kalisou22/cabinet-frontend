import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inventoryService } from '../../services/inventoryService';
import { formatCurrency } from '../../utils/formatters';

const InventoryClosePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [session, setSession] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justification, setJustification] = useState('');

  useEffect(() => {
    loadSessionData();
  }, [id]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      const [sessionData, linesData] = await Promise.all([
        inventoryService.getSessionById(id),
        inventoryService.getLinesBySession(id),
      ]);
      setSession(sessionData);
      setLines(linesData.map(line => ({
        ...line,
        montantSoir: line.montantSoir !== null ? line.montantSoir : '',
      })));
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
    setLines(lines.map(line =>
      line.id === lineId ? { ...line, montantSoir: value } : line
    ));
  };

  const calculateTotalMatin = () => {
    return lines.reduce((sum, line) => sum + (parseFloat(line.montantMatin) || 0), 0);
  };

  const calculateTotalSoir = () => {
    return lines.reduce((sum, line) => sum + (parseFloat(line.montantSoir) || 0), 0);
  };

  const handleClose = async () => {
    // Vérifier que tous les montants sont saisis
    const emptyFields = lines.filter(line => {
      const val = line.montantSoir;
      return val === '' || val === null || val === undefined;
    });

    if (emptyFields.length > 0) {
      alert(`Veuillez saisir le montant du soir pour : ${emptyFields.map(l => l.platformName).join(', ')}`);
      return;
    }

    const totalMatin = calculateTotalMatin();
    const totalSoir = calculateTotalSoir();
    const difference = totalSoir - totalMatin;

    if (difference !== 0 && !justification.trim()) {
      alert('Veuillez fournir une justification pour la différence');
      return;
    }

    try {
      setSaving(true);

      // Mettre à jour chaque ligne avec le montant du soir
      for (const line of lines) {
        await inventoryService.updateLine(line.id, {
          sessionId: parseInt(id),
          platformName: line.platformName,
          montantMatin: line.montantMatin,
          montantSoir: parseFloat(line.montantSoir) || 0,
        });
      }

      // Fermer la session avec justification
      await inventoryService.closeSession(id, justification);

      alert('✅ Caisse fermée avec succès !');
      navigate('/inventory');
    } catch (error) {
      console.error('Erreur fermeture:', error);
      alert(error.response?.data?.message || 'Erreur lors de la fermeture');
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

  const totalMatin = calculateTotalMatin();
  const totalSoir = calculateTotalSoir();
  const difference = totalSoir - totalMatin;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🌙 Fermeture de caisse</h1>
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

      {/* Rappel du matin */}
      <div className="bg-info-light border border-info/30 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-info-dark mb-4">📊 Capital distribué ce matin</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {lines.map((line) => (
            <div key={line.id} className="bg-white rounded-xl p-4 shadow-md">
              <p className="text-sm text-text-secondary">{line.platformName}</p>
              <p className="text-xl font-bold font-mono text-text-primary">{formatCurrency(line.montantMatin)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right">
          <span className="text-info-dark font-bold">Total matin : {formatCurrency(totalMatin)}</span>
        </div>
      </div>

      {/* Saisie des montants du soir */}
      <div className="card">
        <h2 className="text-lg font-semibold text-text-primary mb-4">💰 Capital restant (soir)</h2>
        <div className="space-y-4">
          {lines.map((line) => (
            <div key={line.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
              <div className="w-48">
                <span className="font-medium text-text-primary">{line.platformName}</span>
              </div>
              <div className="flex-1 relative">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={line.montantSoir}
                  onChange={(e) => updateLineMontant(line.id, e.target.value)}
                  className="input pr-16"
                  placeholder="Montant actuel"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">FG</span>
              </div>
              <div className="w-32 text-right text-sm text-text-secondary">
                Matin: {formatCurrency(line.montantMatin)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Résultat du jour */}
      <div className={`rounded-2xl shadow-lg p-6 text-white ${
        difference > 0 ? 'bg-gradient-to-r from-success to-success-dark' :
        difference < 0 ? 'bg-gradient-to-r from-danger to-danger-dark' :
        'bg-gradient-to-r from-gray-500 to-gray-600'
      }`}>
        <h3 className="text-lg font-semibold mb-4">📊 Résultat du jour</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Total capital matin :</span>
            <span className="font-bold font-mono">{formatCurrency(totalMatin)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total capital soir :</span>
            <span className="font-bold font-mono">{formatCurrency(totalSoir)}</span>
          </div>
          <div className="border-t border-white/30 my-3"></div>
          <div className="flex justify-between text-xl font-bold">
            <span>{difference > 0 ? '📈 GAIN' : difference < 0 ? '📉 PERTE' : '⚖️ ÉQUILIBRE'} :</span>
            <span className="font-mono">
              {difference > 0 ? '+' : difference < 0 ? '−' : ''} {formatCurrency(Math.abs(difference))}
            </span>
          </div>
        </div>
      </div>

      {/* Justification */}
      {difference !== 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-text-primary mb-4">📝 Justification de la différence</h3>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows="3"
            className="input"
            placeholder="Ex: Transfert envoyé - Frais: 50 000 FG..."
          />
          {difference !== 0 && !justification.trim() && (
            <p className="text-sm text-danger mt-2">Une justification est requise</p>
          )}
        </div>
      )}

      {/* Bouton de fermeture */}
      <div className="flex justify-end">
        <button
          onClick={handleClose}
          disabled={saving || (difference !== 0 && !justification.trim())}
          className="btn-primary btn-lg"
          type="button"
        >
          {saving ? 'Fermeture en cours...' : '🔒 Clôturer la journée'}
        </button>
      </div>
    </div>
  );
};

export default InventoryClosePage;