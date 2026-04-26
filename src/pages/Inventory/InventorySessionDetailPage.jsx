import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inventoryService } from '../../services/inventoryService';
import { formatCurrency, formatDateLong } from '../../utils/formatters';

const InventorySessionDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [session, setSession] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setLines(linesData || []);
    } catch (error) {
      console.error('Erreur chargement:', error);
      alert('Erreur lors du chargement de la session');
      navigate('/inventory');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="mt-4 text-text-secondary">Chargement des détails...</p>
      </div>
    );
  }

  if (!session) return null;

  const totalMatin = lines.reduce((sum, line) => sum + (line.montantMatin || 0), 0);
  const totalSoir = lines.reduce((sum, line) => sum + (line.montantSoir || 0), 0);
  const resultat = totalSoir - totalMatin;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Détail de la session</h1>
          <p className="page-subtitle">{formatDateLong(session.date)}</p>
        </div>
        <button onClick={() => navigate('/inventory')} className="btn-outline">
          ← Retour
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="stat-label">Statut</p>
          <p className={`text-lg font-semibold ${session.status === 'CLOSED' ? 'text-success' : 'text-warning-dark'}`}>
            {session.status === 'CLOSED' ? '✅ Fermé' : '🟡 Ouvert'}
          </p>
        </div>
        <div className="card">
          <p className="stat-label">Ouvert par</p>
          <p className="text-lg font-semibold">{session.username || '—'}</p>
        </div>
        <div className="card">
          <p className="stat-label">Fermé le</p>
          <p className="text-lg font-semibold">
            {session.updatedAt ? new Date(session.updatedAt).toLocaleString('fr-FR') : '—'}
          </p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-text-primary mb-4">📱 Détail par plateforme</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">Plateforme</th>
                <th className="text-right py-3 px-4">Matin (FG)</th>
                <th className="text-right py-3 px-4">Soir (FG)</th>
                <th className="text-right py-3 px-4">Différence</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const diff = (line.montantSoir || 0) - (line.montantMatin || 0);
                return (
                  <tr key={line.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">{line.platformName}</td>
                    <td className="text-right py-3 px-4 font-mono">{formatCurrency(line.montantMatin)}</td>
                    <td className="text-right py-3 px-4 font-mono">{formatCurrency(line.montantSoir)}</td>
                    <td className={`text-right py-3 px-4 font-mono font-medium ${diff > 0 ? 'text-success' : diff < 0 ? 'text-danger' : ''}`}>
                      {diff > 0 ? '+' : diff < 0 ? '−' : ''}{formatCurrency(Math.abs(diff))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="py-3 px-4 font-bold">TOTAL</td>
                <td className="text-right py-3 px-4 font-bold font-mono">{formatCurrency(totalMatin)}</td>
                <td className="text-right py-3 px-4 font-bold font-mono">{formatCurrency(totalSoir)}</td>
                <td className={`text-right py-3 px-4 font-bold font-mono ${resultat > 0 ? 'text-success' : resultat < 0 ? 'text-danger' : ''}`}>
                  {resultat > 0 ? '+' : resultat < 0 ? '−' : ''}{formatCurrency(Math.abs(resultat))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className={`rounded-2xl shadow-lg p-6 text-white ${
        resultat > 0 ? 'bg-gradient-to-r from-success to-success-dark' :
        resultat < 0 ? 'bg-gradient-to-r from-danger to-danger-dark' :
        'bg-gradient-to-r from-gray-500 to-gray-600'
      }`}>
        <h3 className="text-lg font-semibold mb-4">📊 Résultat de la journée</h3>
        <div className="flex justify-between text-2xl font-bold">
          <span>{resultat > 0 ? '📈 GAIN' : resultat < 0 ? '📉 PERTE' : '⚖️ ÉQUILIBRE'}</span>
          <span className="font-mono">
            {resultat > 0 ? '+' : resultat < 0 ? '−' : ''} {formatCurrency(Math.abs(resultat))}
          </span>
        </div>
      </div>

      {/* ✅ Affichage de la justification si elle existe */}
      {session.justification && (
        <div className="card">
          <h3 className="text-lg font-semibold text-text-primary mb-2">📝 Justification</h3>
          <p className="text-text-secondary">{session.justification}</p>
        </div>
      )}
    </div>
  );
};

export default InventorySessionDetailPage;