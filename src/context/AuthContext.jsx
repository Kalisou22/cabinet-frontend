import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Erreur parsing user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      console.log('=== TENTATIVE DE CONNEXION ===');
      console.log('Username:', username);

      const response = await authService.login(username, password);
      console.log('=== RÉPONSE BACKEND ===', response);

      const { token, userId, username: userName, role } = response;

      const userData = {
        id: userId,
        username: userName,
        role
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      console.log('=== CONNEXION RÉUSSIE ===');
      return { success: true };

    } catch (error) {
      console.error('=== ERREUR LOGIN ===');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.message);
      console.error('Code:', error.code);

      // Si le backend est inaccessible (Network Error)
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        return {
          success: false,
          error: 'Impossible de contacter le serveur. Vérifiez que le backend est lancé sur http://localhost:8080'
        };
      }

      // Si erreur 401 (Unauthorized)
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Nom d\'utilisateur ou mot de passe incorrect'
        };
      }

      // Si erreur 403 (Forbidden)
      if (error.response?.status === 403) {
        return {
          success: false,
          error: 'Accès refusé. Vérifiez vos permissions.'
        };
      }

      // Si erreur 404 (Not Found)
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Endpoint non trouvé. Vérifiez l\'URL de l\'API.'
        };
      }

      // Si erreur 500 (Internal Server Error)
      if (error.response?.status === 500) {
        return {
          success: false,
          error: 'Erreur serveur. Vérifiez les logs du backend.'
        };
      }

      // Autres erreurs
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Erreur de connexion au serveur';

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const logout = () => {
    console.log('=== DÉCONNEXION ===');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isAgent: user?.role === 'AGENT',
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;