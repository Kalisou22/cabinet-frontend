import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import { inventoryService } from '../../services/inventoryService';
import { reminderService } from '../../services/reminderService';
import { transactionService } from '../../services/transactionService';
import { clientService } from '../../services/clientService';
import { formatCurrency, formatDateLong } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/common/StatCard';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isMounted = useRef(true);
  const intervalRef = useRef(null);

  const [stats, setStats] = useState({
    solde: 0,
    totalMatin: 0,
    totalSoir: 0,
    resultat: 0,
    totalClients: 0,
    clientsAvecDette: 0,
    clientsAvecAvance: 0,
    totalDebt: 0,
    totalAdvances: 0,
    hasOpenInventory: false,
    inventorySession: null,
  });
  const [pendingReminders, setPendingReminders] = useState(0);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [topDebtors, setTopDebtors] = useState([]);

  const loadDashboardData = useCallback(async () => {
    // Éviter les appels si le composant est démonté
    if (!isMounted.current) return;

    try {
      setError(null);

      const data = await dashboardService.getStats();

      if (!isMounted.current) return;
      setStats(data);

      // Charger les rappels en attente
      try {
        const reminders = await reminderService.getPending();
        if (isMounted.current) setPendingReminders(reminders?.length || 0);
      } catch (err) {
        console.error('Erreur chargement rappels:', err);
        if (isMounted.current) setPendingReminders(0);
      }

      // Charger les clients et leurs soldes
      try {
        const clients = await clientService.getAll();
        if (!isMounted.current) return;

        // Calculer les top 5 clients endettés
        const debtors = [];
        let clientsAvecAvance = 0;
        let totalAdvances = 0;
        let clientsAvecDette = 0;
        let totalDebt = 0;

        for (const client of clients) {
          try {
            const solde = await transactionService.getClientSolde(client.id);
            if (solde > 0) {
              clientsAvecAvance++;
              totalAdvances += solde;
            } else if (solde < 0) {
              clientsAvecDette++;
              totalDebt += Math.abs(solde);
              debtors.push({ ...client, solde });
            }
          } catch (err) {}
        }

        if (isMounted.current) {
          setTopDebtors(debtors.sort((a, b) => a.solde - b.solde).slice(0, 5));
          setStats(prev => ({
            ...prev,
            clientsAvecAvance,
            totalAdvances,
            clientsAvecDette,
            totalDebt,
          }));
        }
      } catch (err) {
        console.error('Erreur chargement clients:', err);
      }

      // Charger l'inventaire
      if (data.hasOpenInventory && data.inventorySession?.id) {
        try {
          const lines = await inventoryService.getLinesBySession(data.inventorySession.id);
          if (isMounted.current) setPlatforms(lines || []);
        } catch (err) {
          if (isMounted.current) setPlatforms([]);
        }
      } else {
        if (isMounted.current) setPlatforms([]);
      }

      if (isMounted.current) setLastUpdate(new Date());
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      // Gestion spéciale pour les erreurs 401 (token expiré)
      if (err.response?.status === 401) {
        // Token expiré, déconnexion silencieuse
        logout();
        navigate('/login');
        return;
      }
      if (isMounted.current) setError('Impossible de charger les données');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    isMounted.current = true;

    // Chargement initial
    loadDashboardData();

    // Mise en place de l'intervalle
    intervalRef.current = setInterval(() => {
      if (isMounted.current) {
        loadDashboardData();
      }
    }, 30000);

    // Nettoyage
    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [loadDashboardData]);

  if (loading && !stats.totalClients) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="mt-4 text-text-secondary">Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❌</div>
        <h3 className="empty-state-title">{error}</h3>
        <p className="empty-state-description">Vérifiez votre connexion et réessayez</p>
        <button onClick={loadDashboardData} className="btn-primary mt-4">
          🔄 Réessayer
        </button>
      </div>
    );
  }

  const today = new Date();
  const expositionGlobale = (stats.totalDebt || 0) - (stats.totalAdvances || 0);
  const estExcedentDettes = expositionGlobale > 0;

  return (
    <div className="animate-fade-in space-y-6">
      {/* En-tête */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Bonjour, {user?.username || 'Utilisateur'} 👋
          </h1>
          <p className="page-subtitle">{formatDateLong(today)}</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingReminders > 0 && (
            <button
              onClick={() => navigate('/reminders')}
              className="btn-warning btn-sm flex items-center gap-2"
            >
              🔔 {pendingReminders} rappel{pendingReminders > 1 ? 's' : ''} en attente
            </button>
          )}
          <p className="text-xs text-text-muted hidden sm:block">
            Mis à jour à {lastUpdate.toLocaleTimeString('fr-FR')}
          </p>
          <button onClick={loadDashboardData} className="btn-outline btn-sm">
            <span className="mr-2">🔄</span> Actualiser
          </button>
        </div>
      </div>

      {/* Alerte inventaire */}
      {!stats.hasOpenInventory ? (
        <div className="alert alert-warning">
          <span className="text-3xl">🌅</span>
          <div className="flex-1">
            <p className="font-semibold text-base">Caisse non ouverte aujourd'hui</p>
            <p className="text-sm opacity-80">Ouvrez la caisse pour commencer la journée</p>
          </div>
          <button onClick={() => navigate('/inventory/open')} className="btn-primary">
            Ouvrir la caisse
          </button>
        </div>
      ) : (
        <div className="alert alert-success">
          <span className="text-3xl">✅</span>
          <div className="flex-1">
            <p className="font-semibold text-base">Caisse ouverte</p>
            <p className="text-sm opacity-80">N'oubliez pas de fermer la caisse en fin de journée</p>
          </div>
          <button
            onClick={() => navigate(`/inventory/session/${stats.inventorySession?.id}/close`)}
            className="btn-primary"
          >
            🌙 Fermer la caisse
          </button>
        </div>
      )}

      {/* SECTION 1 : CAPITAL DU JOUR */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-display font-semibold text-text-primary">💰 Capital du jour</h2>
          <span className="badge badge-info text-[10px]">Source unique de vérité</span>
        </div>
        <div className="grid-stats">
          <StatCard
            title="Capital matin"
            value={formatCurrency(stats.totalMatin || 0)}
            icon="🌅"
            color="neutral"
            onClick={() => navigate('/inventory')}
          />
          <StatCard
            title="Capital soir"
            value={stats.hasOpenInventory ? 'En attente' : formatCurrency(stats.totalSoir || 0)}
            icon="🌙"
            color="neutral"
            onClick={() => navigate('/inventory')}
          />
          <StatCard
            title="Résultat du jour"
            value={stats.hasOpenInventory ? '—' : formatCurrency(stats.resultat || 0)}
            icon={(stats.resultat || 0) >= 0 ? '📈' : '📉'}
            color={stats.hasOpenInventory ? 'neutral' : ((stats.resultat || 0) >= 0 ? 'success' : 'danger')}
            onClick={() => navigate('/inventory')}
          />
        </div>
      </section>

      {/* SECTION 2 : CLIENTS - DETTES ET AVANCES */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-text-primary">👥 Situation des clients</h2>
          <button
            onClick={() => navigate('/clients')}
            className="text-sm text-info-dark hover:text-info font-medium"
          >
            Voir tous les clients →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-5">
            <p className="stat-label">Total clients</p>
            <p className="stat-value">{stats.totalClients || 0}</p>
          </div>
          <div className="card p-5 bg-warning-light/30">
            <p className="stat-label flex items-center gap-1">
              <span>⚠️ Dettes clients</span>
              <span className="text-xs text-text-muted">(client doit au cabinet)</span>
            </p>
            <p className="stat-value text-warning-dark">{formatCurrency(stats.totalDebt || 0)}</p>
            <p className="text-xs text-text-secondary mt-1">
              {stats.clientsAvecDette || 0} client{(stats.clientsAvecDette || 0) > 1 ? 's' : ''} concerné{(stats.clientsAvecDette || 0) > 1 ? 's' : ''}
            </p>
          </div>
          <div className="card p-5 bg-info-light/30">
            <p className="stat-label flex items-center gap-1">
              <span>💰 Avances clients</span>
              <span className="text-xs text-text-muted">(cabinet doit au client)</span>
            </p>
            <p className="stat-value text-info-dark">{formatCurrency(stats.totalAdvances || 0)}</p>
            <p className="text-xs text-text-secondary mt-1">
              {stats.clientsAvecAvance || 0} client{(stats.clientsAvecAvance || 0) > 1 ? 's' : ''} concerné{(stats.clientsAvecAvance || 0) > 1 ? 's' : ''}
            </p>
          </div>
          <div className={`card p-5 ${estExcedentDettes ? 'bg-danger-light/20' : 'bg-success-light/20'}`}>
            <p className="stat-label">Exposition nette</p>
            <p className={`stat-value ${estExcedentDettes ? 'text-danger' : 'text-success'}`}>
              {formatCurrency(Math.abs(expositionGlobale))}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              {estExcedentDettes ? '📉 Plus de dettes que d\'avances' : '📈 Plus d\'avances que de dettes'}
            </p>
          </div>
        </div>

        {/* Explication du calcul */}
        <div className="card bg-gray-50 mt-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">📊 Comprendre les chiffres</h3>
          <div className="text-xs text-text-secondary space-y-2">
            <p>
              <span className="font-medium text-warning-dark">⚠️ DETTE</span> = Le client a reçu plus que ce qu'il a déposé.
              <br />→ Formule: <strong>Total des retraits - Total des dépôts</strong> (quand le résultat est négatif)
            </p>
            <p>
              <span className="font-medium text-info-dark">💰 AVANCE</span> = Le client a déposé plus que ce qu'il a retiré.
              <br />→ Formule: <strong>Total des dépôts - Total des retraits</strong> (quand le résultat est positif)
            </p>
            <p className="pt-1 border-t border-gray-200 mt-1">
              📐 <strong>Formule générale:</strong> Solde client = Somme des DÉPÔTS - Somme des RETRAITS
              <br />• Solde <strong>positif</strong> = AVANCE (cabinet doit au client)
              <br />• Solde <strong>négatif</strong> = DETTE (client doit au cabinet)
            </p>
          </div>
        </div>

        {/* Top 5 clients endettés */}
        {topDebtors.length > 0 && (
          <div className="card mt-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span>⚠️ Clients les plus endettés</span>
              <button
                onClick={() => navigate('/reminders/new')}
                className="text-xs text-info-dark hover:text-info"
              >
                Créer un rappel →
              </button>
            </h3>
            <div className="space-y-2">
              {topDebtors.map(client => (
                <div
                  key={client.id}
                  className="flex justify-between items-center p-2 bg-warning-light/20 rounded cursor-pointer hover:bg-warning-light/40"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <div>
                    <p className="font-medium text-text-primary">{client.nom}</p>
                    <p className="text-xs text-text-muted">{client.telephone}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-warning-dark">{formatCurrency(Math.abs(client.solde))}</p>
                    <p className="text-xs text-text-muted">à rembourser</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions rapides */}
        <div className="flex gap-3 mt-4 flex-wrap">
          <button
            onClick={() => navigate('/transactions/new')}
            className="btn-outline btn-sm flex items-center gap-2"
          >
            💸 Nouvelle transaction
          </button>
          <button
            onClick={() => navigate('/reminders/new')}
            className="btn-outline btn-sm flex items-center gap-2"
          >
            🔔 Nouveau rappel
          </button>
          <button
            onClick={() => navigate('/clients/new')}
            className="btn-outline btn-sm flex items-center gap-2"
          >
            👤 Nouveau client
          </button>
        </div>
      </section>

      {/* SECTION 3 : ACTIONS RAPIDES */}
      <section>
        <h2 className="text-lg font-display font-semibold text-text-primary mb-4">⚡ Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={() => stats.hasOpenInventory
              ? navigate(`/inventory/session/${stats.inventorySession?.id}/close`)
              : navigate('/inventory/open')
            }
            className="card p-4 text-left hover:shadow-hover hover:scale-[1.02] transition-all group"
          >
            <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">
              {stats.hasOpenInventory ? '🌙' : '🌅'}
            </span>
            <span className="font-medium text-text-primary">
              {stats.hasOpenInventory ? 'Fermer caisse' : 'Ouvrir caisse'}
            </span>
          </button>

          <button
            onClick={() => navigate('/clients')}
            className="card p-4 text-left hover:shadow-hover hover:scale-[1.02] transition-all group"
          >
            <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">👥</span>
            <span className="font-medium text-text-primary">Liste clients</span>
          </button>

          <button
            onClick={() => navigate('/transactions')}
            className="card p-4 text-left hover:shadow-hover hover:scale-[1.02] transition-all group"
          >
            <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">📊</span>
            <span className="font-medium text-text-primary">Historique</span>
          </button>

          <button
            onClick={() => navigate('/reminders')}
            className="card p-4 text-left hover:shadow-hover hover:scale-[1.02] transition-all group"
          >
            <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">🔔</span>
            <span className="font-medium text-text-primary">Rappels</span>
            {pendingReminders > 0 && (
              <span className="badge badge-danger mt-1">{pendingReminders}</span>
            )}
          </button>

          <button
            onClick={() => navigate('/cash-operations')}
            className="card p-4 text-left hover:shadow-hover hover:scale-[1.02] transition-all group"
          >
            <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">💰</span>
            <span className="font-medium text-text-primary">Caisse</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;