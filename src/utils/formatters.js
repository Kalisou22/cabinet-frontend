/**
 * Formater un montant en Franc Guinéen (FG)
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0 FG';

  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return `${formatted} FG`;
};

/**
 * Formater une date en français (court)
 */
export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Formater une date avec jour de la semaine (long)
 */
export const formatDateLong = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Formater une date avec heure
 */
export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Obtenir la classe CSS selon le statut
 */
export const getStatusBadge = (status) => {
  const badges = {
    EN_COURS: 'badge-warning',
    REMBOURSE: 'badge-success',
    OPEN: 'badge-warning',
    CLOSED: 'badge-success',
    PENDING: 'badge-warning',
    DONE: 'badge-success',
    ACTIF: 'badge-success',
    INACTIF: 'badge-neutral',
    ENTREE: 'badge-success',
    SORTIE: 'badge-danger',
    DEPOT: 'badge-info',
    RETRAIT: 'badge-warning',
  };
  return badges[status] || 'badge-neutral';
};

/**
 * Traduire les statuts en français
 */
export const translateStatus = (status) => {
  const translations = {
    EN_COURS: 'En cours',
    REMBOURSE: 'Remboursé',
    OPEN: 'Ouvert',
    CLOSED: 'Fermé',
    PENDING: 'En attente',
    DONE: 'Terminé',
    ACTIF: 'Actif',
    INACTIF: 'Inactif',
    DEPOT: 'Dépôt',
    RETRAIT: 'Retrait',
    ENTREE: 'Entrée',
    SORTIE: 'Sortie',
    CASH: 'Cash',
    CREDIT: 'Crédit',
  };
  return translations[status] || status;
};