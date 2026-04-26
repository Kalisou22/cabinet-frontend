import axiosInstance from '../api/axios';

const BASE_URL = '/v1/reminders';

export const reminderService = {
  /**
   * Récupérer tous les rappels
   * @param {string} status - Optionnel: 'PENDING' ou 'DONE'
   */
  getAll: async (status = null) => {
    const params = status ? { status } : {};
    const response = await axiosInstance.get(BASE_URL, { params });
    return response.data;
  },

  /**
   * Récupérer un rappel par son ID
   * @param {number} id - ID du rappel
   */
  getById: async (id) => {
    if (!id) throw new Error('ID du rappel requis');
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Créer un nouveau rappel
   * @param {object} data - { clientId, message, dateRappel, reminderTime, userId }
   */
  create: async (data) => {
    if (!data.clientId) throw new Error('Le client est obligatoire');
    if (!data.message) throw new Error('Le message est obligatoire');
    if (!data.dateRappel) throw new Error('La date de rappel est obligatoire');
    if (!data.userId) throw new Error('L\'utilisateur est obligatoire');

    const response = await axiosInstance.post(BASE_URL, data);
    return response.data;
  },

  /**
   * Modifier un rappel existant
   * @param {number} id - ID du rappel
   * @param {object} data - Données à modifier
   */
  update: async (id, data) => {
    if (!id) throw new Error('ID du rappel requis');
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Marquer un rappel comme fait (DONE)
   * @param {number} id - ID du rappel
   */
  markAsDone: async (id) => {
    if (!id) throw new Error('ID du rappel requis');
    const response = await axiosInstance.patch(`${BASE_URL}/${id}/done`);
    return response.data;
  },

  /**
   * Récupérer tous les rappels en attente (PENDING)
   */
  getPending: async () => {
    const response = await axiosInstance.get(`${BASE_URL}/pending`);
    return response.data;
  },

  /**
   * Récupérer les rappels du jour
   */
  getToday: async () => {
    const response = await axiosInstance.get(`${BASE_URL}/today`);
    return response.data;
  },

  /**
   * Récupérer les rappels par date
   * @param {string} date - Format YYYY-MM-DD
   */
  getByDate: async (date) => {
    if (!date) throw new Error('La date est obligatoire');
    const response = await axiosInstance.get(`${BASE_URL}/date/${date}`);
    return response.data;
  },

  /**
   * Récupérer tous les rappels d'un client spécifique
   * @param {number} clientId - ID du client
   */
  getByClientId: async (clientId) => {
    if (!clientId) throw new Error('L\'ID du client est obligatoire');
    const response = await axiosInstance.get(`${BASE_URL}/client/${clientId}`);
    return response.data;
  },

  /**
   * Récupérer les rappels en attente d'un client
   * @param {number} clientId - ID du client
   */
  getPendingByClientId: async (clientId) => {
    if (!clientId) throw new Error('L\'ID du client est obligatoire');
    const allReminders = await reminderService.getByClientId(clientId);
    return allReminders.filter(r => r.status === 'PENDING');
  },

  /**
   * Compter les rappels en attente pour un client
   * @param {number} clientId - ID du client
   */
  countPendingByClientId: async (clientId) => {
    if (!clientId) return 0;
    const pending = await reminderService.getPendingByClientId(clientId);
    return pending.length;
  },

  /**
   * Compter tous les rappels en attente
   */
  countAllPending: async () => {
    const pending = await reminderService.getPending();
    return pending.length;
  },

  /**
   * Créer un rappel automatique pour une dette
   * @param {number} clientId - ID du client
   * @param {number} montantDette - Montant de la dette
   * @param {number} userId - ID de l'utilisateur
   */
  createAutomaticReminder: async (clientId, montantDette, userId) => {
    if (!clientId) throw new Error('Client requis');
    if (!montantDette || montantDette <= 0) throw new Error('Montant de dette invalide');

    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 7); // Rappel dans 7 jours par défaut

    const reminderData = {
      clientId: parseInt(clientId),
      message: `📢 RAPPEL DE PAIEMENT\n\nVotre dette de ${new Intl.NumberFormat('fr-FR').format(montantDette)} FG arrive à échéance.\nMerci de régulariser votre situation avant le ${dueDate.toLocaleDateString('fr-FR')}.\n\nCordialement.`,
      dateRappel: dueDate.toISOString().split('T')[0],
      reminderTime: '09:00',
      userId: parseInt(userId),
      status: 'PENDING'
    };

    const response = await axiosInstance.post(BASE_URL, reminderData);
    return response.data;
  },

  /**
   * Supprimer un rappel
   * @param {number} id - ID du rappel
   */
  delete: async (id) => {
    if (!id) throw new Error('ID du rappel requis');
    const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Supprimer tous les rappels d'un client
   * @param {number} clientId - ID du client
   */
  deleteByClientId: async (clientId) => {
    if (!clientId) throw new Error('L\'ID du client est obligatoire');
    const reminders = await reminderService.getByClientId(clientId);
    const deletePromises = reminders.map(reminder => reminderService.delete(reminder.id));
    await Promise.all(deletePromises);
    return { deleted: reminders.length };
  },
};

export default reminderService;