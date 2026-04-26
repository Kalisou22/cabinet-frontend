import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'AGENT',
    active: true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const user = await userService.getById(id);
      setFormData({
        username: user.username || '',
        password: '',
        confirmPassword: '',
        role: user.role || 'AGENT',
        active: user.active !== undefined ? user.active : true,
      });
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
      alert('Impossible de charger l\'utilisateur');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est obligatoire';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
    }

    if (!isEditMode) {
      if (!formData.password) {
        newErrors.password = 'Le mot de passe est obligatoire';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    } else if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!formData.role) {
      newErrors.role = 'Le rôle est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);

      const data = {
        username: formData.username,
        role: formData.role,
        active: formData.active,
      };

      if (formData.password) {
        data.password = formData.password;
      }

      if (isEditMode) {
        await userService.update(id, data);
        alert('✅ Utilisateur modifié avec succès');
      } else {
        await userService.create(data);
        alert('✅ Utilisateur créé avec succès');
      }

      navigate('/users');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      if (error.response?.status === 409) {
        setErrors({ username: 'Ce nom d\'utilisateur existe déjà' });
      } else {
        alert(error.response?.data?.message || 'Erreur lors de la sauvegarde');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? '✏️ Modifier l\'utilisateur' : '👤 Nouvel utilisateur'}
        </h1>
        <button onClick={() => navigate('/users')} className="btn-outline">
          ← Retour
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom d'utilisateur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom d'utilisateur <span className="text-red-500">*</span>
            </label>
            <input
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              disabled={isEditMode && formData.username === 'admin'}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              } ${isEditMode && formData.username === 'admin' ? 'bg-gray-100' : ''}`}
              placeholder="Ex: agentdupont"
              autoFocus
            />
            {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe {!isEditMode && <span className="text-red-500">*</span>}
              {isEditMode && <span className="text-gray-400 text-xs ml-2">(laisser vide pour ne pas modifier)</span>}
            </label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          {/* Confirmation mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
          </div>

          {/* Rôle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rôle <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition ${
                formData.role === 'ADMIN' ? 'bg-danger-light border-danger' : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="ADMIN"
                  checked={formData.role === 'ADMIN'}
                  onChange={handleChange}
                  className="mr-2"
                />
                <div>
                  <span className="font-medium">👑 Administrateur</span>
                  <p className="text-xs text-text-secondary">Accès total</p>
                </div>
              </label>
              <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition ${
                formData.role === 'AGENT' ? 'bg-info-light border-info' : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="AGENT"
                  checked={formData.role === 'AGENT'}
                  onChange={handleChange}
                  className="mr-2"
                />
                <div>
                  <span className="font-medium">👤 Agent</span>
                  <p className="text-xs text-text-secondary">Accès limité</p>
                </div>
              </label>
            </div>
            {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
          </div>

          {/* Statut actif */}
          <div className="flex items-center">
            <input
              name="active"
              type="checkbox"
              checked={formData.active}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Compte actif
            </label>
          </div>

          {/* Informations complémentaires */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Note sur les rôles :</strong>
              <br />• <strong>Administrateur</strong> : Accès complet à toutes les fonctionnalités
              <br />• <strong>Agent</strong> : Accès limité (clients, transactions, rappels, caisse, inventaire)
            </p>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => navigate('/users')} className="btn-outline">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Enregistrement...' : (isEditMode ? '💾 Mettre à jour' : '➕ Créer l\'utilisateur')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;