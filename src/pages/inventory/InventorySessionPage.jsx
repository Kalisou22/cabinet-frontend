import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '../../services/inventoryService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const InventorySessionPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [stats, setStats] = useState({
    totalJours: 0,
    totalGains: 0,
    totalPertes: 0,
    soldeNet: 0,
  });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getAllSessions();
      const sortedData = (data || []).sort((a, b) => new Date(b.date) - new Date(a.date));
      setSessions(sortedData);
      calculateStats(sortedData);
    } catch (error) {
      console.error('Erreur chargement sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    if (data.length === 0) {
      setStats({ totalJours: 0, totalGains: 0, totalPertes: 0, soldeNet: 0 });
      return;
    }

    let gains = 0;
    let pertes = 0;
    data.forEach(session => {
      if (session.resultat > 0) gains += session.resultat;
      else if (session.resultat < 0) pertes += Math.abs(session.resultat);
    });
    setStats({
      totalJours: data.length,
      totalGains: gains,
      totalPertes: pertes,
      soldeNet: gains - pertes,
    });
  };

  const handleOpenSession = async () => {
    const today = new Date().toISOString().split('T')[0];

    try {
      const openSessions = await inventoryService.getOpenSessions();

      if (openSessions && openSessions.length > 0) {
        const openSession = openSessions[0];
        alert(`⚠️ Une session est déjà ouverte pour le ${formatDate(openSession.date)}.\n\nVeuillez la fermer avant d'en ouvrir une nouvelle.`);
        navigate(`/inventory/session/${openSession.id}/edit`);
        return;
      }

      const refreshedSessions = await inventoryService.getAllSessions();
      const existingSession = refreshedSessions.find(s => s.date === today);

      if (existingSession) {
        if (existingSession.status === 'CLOSED') {
          alert(`⚠️ Une session fermée existe pour aujourd'hui.\nRésultat: ${formatCurrency(existingSession.resultat || 0)}\n\nVeuillez utiliser le bouton "Réinitialiser" pour la supprimer.`);
        } else if (existingSession.status === 'OPEN') {
          navigate(`/inventory/session/${existingSession.id}/edit`);
        }
      } else {
        navigate('/inventory/open');
      }
    } catch (error) {
      console.error('Erreur vérification session:', error);
      navigate('/inventory/open');
    }
  };

  const handleEditSession = (session) => {
    if (session.status === 'OPEN') {
      navigate(`/inventory/session/${session.id}/edit`);
    } else {
      alert('Cette session est déjà fermée et ne peut plus être modifiée.');
    }
  };

  const handleViewDetails = (sessionId) => {
    navigate(`/inventory/session/${sessionId}`);
  };

  const handleCloseSession = (sessionId) => {
    navigate(`/inventory/session/${sessionId}/close`);
  };

  // ✅ CORRIGÉ : Gère correctement la suppression d'une session fermée
  const handleResetToday = async () => {
    const today = new Date().toISOString().split('T')[0];

    if (!confirm(`⚠️ RÉINITIALISATION COMPLÈTE\n\nVous allez supprimer définitivement la session du ${today}.\n\nCette action est IRRÉVERSIBLE.\n\nConfirmez-vous ?`)) {
      return;
    }

    try {
      setResetting(true);

      const allSessions = await inventoryService.getAllSessions();
      const session = allSessions.find(s => s.date === today);

      if (!session) {
        alert(`Aucune session trouvée pour le ${today}`);
        await loadSessions();
        return;
      }

      // ✅ CORRIGÉ : Pour une session fermée, on fait un hard delete direct
      // Le backend va supprimer la session et ses lignes en cascade
      await inventoryService.deleteSession(session.id);

      alert(`✅ Session du ${today} supprimée avec succès !\n\nVous pouvez maintenant en créer une nouvelle.`);
      await loadSessions();

    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      if (error.response?.status === 409 || error.response?.data?.message?.includes('closed')) {
        // Si erreur de session fermée, on essaie un hard delete forcé
        try {
          const allSessions = await inventoryService.getAllSessions();
          const session = allSessions.find(s => s.date === today);
          if (session) {
            await inventoryService.deleteSession(session.id);
            alert(`✅ Session du ${today} supprimée avec succès !`);
            await loadSessions();
          }
        } catch (retryError) {
          alert(`❌ Erreur: Impossible de supprimer la session. Veuillez contacter l'administrateur.`);
        }
      } else {
        alert(`❌ Erreur: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="mt-4 text-text-secondary">Chargement de l'inventaire...</p>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const closedTodaySession = sessions.find(s => s.date === today && s.status === 'CLOSED');
  const openSession = sessions.find(s => s.status === 'OPEN');
  const hasOpenSession = !!openSession;
  const hasClosedTodaySession = !!closedTodaySession;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 Inventaire Journalier</h1>
          <p className="page-subtitle flex items-center gap-2">
            Capital du cabinet
            <span className="badge badge-info text-[10px]">Source unique de vérité</span>
          </p>
        </div>
        <button onClick={handleOpenSession} className="btn-primary">
          <span className="mr-2">🌅</span> Ouverture du jour
        </button>
      </div>

      {/* BANDEAU SESSION FERMÉE AUJOURD'HUI */}
      {hasClosedTodaySession && (
        <div className="bg-warning-light border border-warning/30 rounded-2xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-warning-dark text-lg">Session fermée aujourd'hui</h3>
                <p className="text-sm text-text-secondary">
                  Une session est déjà fermée pour le {new Date(today).toLocaleDateString('fr-FR')}.
                  <br />Résultat: <span className="font-bold">{formatCurrency(closedTodaySession.resultat || 0)}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleResetToday}
              disabled={resetting}
              className="btn-danger flex items-center gap-2 px-5 py-2.5"
            >
              {resetting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Suppression...
                </>
              ) : (
                <>🗑️ Réinitialiser aujourd'hui</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* BANDEAU SESSION OUVERTE */}
      {hasOpenSession && (
        <div className="bg-success-light border border-success/30 rounded-2xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌅</span>
              <div>
                <h3 className="font-semibold text-success-dark text-lg">Session ouverte</h3>
                <p className="text-sm text-text-secondary">
                  Une session est ouverte pour le {formatDate(openSession.date)}.
                  <br />Vous pouvez modifier les montants ou fermer la caisse.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEditSession(openSession)}
                className="btn-outline flex items-center gap-2"
              >
                ✏️ Modifier
              </button>
              <button
                onClick={() => handleCloseSession(openSession.id)}
                className="btn-primary flex items-center gap-2"
              >
                🌙 Fermer la caisse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-stat">
          <p className="stat-label">Jours enregistrés</p>
          <p className="stat-value">{stats.totalJours}</p>
        </div>
        <div className="card-stat">
          <p className="stat-label">Total des gains</p>
          <p className="stat-value text-success">{formatCurrency(stats.totalGains)}</p>
        </div>
        <div className="card-stat">
          <p className="stat-label">Total des pertes</p>
          <p className="stat-value text-danger">{formatCurrency(stats.totalPertes)}</p>
        </div>
        <div className="card-stat">
          <p className="stat-label">Solde net</p>
          <p className={`stat-value ${stats.soldeNet >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatCurrency(stats.soldeNet)}
          </p>
        </div>
      </div>

      {/* Tableau des sessions */}
      <div className="card p-0 overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="text-right">Capital Matin</th>
                <th className="text-right">Capital Soir</th>
                <th className="text-right">Résultat</th>
                <th className="text-center">Statut</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <div className="empty-state-icon">📭</div>
                    <p className="empty-state-title">Aucune session d'inventaire</p>
                    <p className="empty-state-description">Commencez par ouvrir la caisse aujourd'hui</p>
                    <button
                      onClick={() => navigate('/inventory/open')}
                      className="btn-primary mt-4"
                    >
                      🌅 Ouvrir la caisse
                    </button>
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="font-medium">{formatDate(session.date)}</td>
                    <td className="text-right font-mono">
                      {session.status === 'OPEN' ? '—' : formatCurrency(session.totalMatin || 0)}
                    </td>
                    <td className="text-right font-mono">
                      {session.status === 'OPEN' ? '—' : formatCurrency(session.totalSoir || 0)}
                    </td>
                    <td className="text-right font-mono">
                      {session.status === 'OPEN' ? (
                        <span className="text-text-muted">En cours</span>
                      ) : (
                        <span className={`font-medium ${session.resultat >= 0 ? 'text-success' : 'text-danger'}`}>
                          {session.resultat >= 0 ? '+' : '−'} {formatCurrency(Math.abs(session.resultat))}
                        </span>
                      )}
                    </td>
                    <td className="text-center">
                      <span className={`badge ${session.status === 'OPEN' ? 'badge-warning' : 'badge-success'}`}>
                        {session.status === 'OPEN' ? 'Ouvert' : 'Fermé'}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {session.status === 'OPEN' ? (
                          <>
                            <button
                              onClick={() => handleEditSession(session)}
                              className="btn-icon btn-sm"
                              title="Modifier"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleCloseSession(session.id)}
                              className="btn-icon btn-sm text-success"
                              title="Fermer"
                            >
                              🌙
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleViewDetails(session.id)}
                              className="btn-icon btn-sm"
                              title="Voir détails"
                            >
                              👁️
                            </button>
                            {session.date === today && (
                              <button
                                onClick={() => handleResetToday()}
                                disabled={resetting}
                                className="btn-icon btn-sm text-danger"
                                title="Réinitialiser"
                              >
                                🗑️
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
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

export default InventorySessionPage;