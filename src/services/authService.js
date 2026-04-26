import axiosInstance from '../api/axios';

export const authService = {
  /**
   * Authentification de l'utilisateur
   */
  login: async (username, password) => {
    try {
      console.log('Tentative de connexion avec:', username);

      // ✅ CORRIGÉ : /v1/auth/login
      const response = await axiosInstance.post('/v1/auth/login', {
        username,
        password,
      });

      console.log('Réponse login:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur détaillée:', error);
      throw error;
    }
  },
};