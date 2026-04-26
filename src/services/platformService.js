import axiosInstance from '../api/axios';

const BASE_URL = '/v1/platforms';

export const platformService = {
  // Récupérer toutes les plateformes
  getAll: async (activeOnly = true) => {
    const response = await axiosInstance.get(BASE_URL, {
      params: { activeOnly }
    });
    return response.data;
  },

  // Récupérer une plateforme par ID
  getById: async (id) => {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  // Créer une nouvelle plateforme (ADMIN uniquement)
  create: async (data) => {
    const response = await axiosInstance.post(BASE_URL, data);
    return response.data;
  },

  // Mettre à jour une plateforme (ADMIN uniquement)
  update: async (id, data) => {
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  // Activer/Désactiver une plateforme (ADMIN uniquement)
  toggleStatus: async (id) => {
    const response = await axiosInstance.patch(`${BASE_URL}/${id}/toggle`);
    return response.data;
  },

  // Supprimer une plateforme (ADMIN uniquement)
  delete: async (id) => {
    const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return response.data;
  },
};