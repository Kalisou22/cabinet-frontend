import axiosInstance from '../api/axios';

const BASE_URL = '/v1/users';

export const userService = {
  /**
   * Récupérer tous les utilisateurs
   */
  getAll: async () => {
    const response = await axiosInstance.get(BASE_URL);
    return response.data;
  },

  /**
   * Récupérer un utilisateur par son ID
   */
  getById: async (id) => {
    if (!id) throw new Error('ID utilisateur requis');
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Créer un nouvel utilisateur
   */
  create: async (data) => {
    if (!data.username) throw new Error('Le nom d\'utilisateur est obligatoire');
    if (!data.password) throw new Error('Le mot de passe est obligatoire');
    if (!data.role) throw new Error('Le rôle est obligatoire');

    const payload = {
      username: data.username,
      password: data.password,
      role: data.role,
      active: data.active !== undefined ? data.active : true
    };

    const response = await axiosInstance.post(BASE_URL, payload);
    return response.data;
  },

  /**
   * Mettre à jour un utilisateur
   */
  update: async (id, data) => {
    if (!id) throw new Error('ID utilisateur requis');

    const payload = {};
    if (data.username !== undefined) payload.username = data.username;
    if (data.password !== undefined && data.password !== '') payload.password = data.password;
    if (data.role !== undefined) payload.role = data.role;
    if (data.active !== undefined) payload.active = data.active;

    const response = await axiosInstance.put(`${BASE_URL}/${id}`, payload);
    return response.data;
  },

  /**
   * Changer le mot de passe d'un utilisateur
   * Utilise l'endpoint PUT existant avec uniquement le champ password
   */
  changePassword: async (id, newPassword) => {
    if (!id) throw new Error('ID utilisateur requis');
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    }

    const response = await axiosInstance.put(`${BASE_URL}/${id}`, {
      password: newPassword
    });
    return response.data;
  },

  /**
   * Activer/Désactiver un utilisateur
   * Récupère d'abord l'utilisateur puis inverse son statut actif
   */
  toggleStatus: async (id) => {
    if (!id) throw new Error('ID utilisateur requis');

    // Récupérer l'utilisateur directement via axios
    const userResponse = await axiosInstance.get(`${BASE_URL}/${id}`);
    const user = userResponse.data;

    // Inverser et mettre à jour le statut
    const updateResponse = await axiosInstance.put(`${BASE_URL}/${id}`, {
      active: !user.active
    });
    return updateResponse.data;
  },

  /**
   * Supprimer un utilisateur (soft delete)
   */
  delete: async (id) => {
    if (!id) throw new Error('ID utilisateur requis');
    await axiosInstance.delete(`${BASE_URL}/${id}`);
  },
};

export default userService;