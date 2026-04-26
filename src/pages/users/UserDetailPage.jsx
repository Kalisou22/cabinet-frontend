import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/formatters';

const UserDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const data = await userService.getById(id);
      setUser(data);
    } catch (error) {
      console.error('Erreur chargement:', error);
      alert('Erreur lors du chargement');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) {
      alert('Veuillez saisir un nouveau mot de passe');
      return;
    }
    if (newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setChangingPassword(true);
      await userService.changePassword(id, newPassword);
      alert('✅ Mot de passe modifié avec succès');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.response?.data?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setChangingPassword(false);
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'ADMIN') {
      return { label: 'Administrateur', color: 'badge-danger', icon: '👑' };
    }
    return { label: 'Agent', color: 'badge-info', icon: '👤' };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) return null;

  const roleBadge = getRoleBadge(user.role);
  const isCurrentUser = user.id === currentUser?.id;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/users')} className="btn-outline btn-sm">
            ← Retour
          </button>
          <div>
            <h1 className="page-title flex items-center gap-3">
              {roleBadge.icon} {user.username}
              {isCurrentUser && <span className="badge badge-info">Vous</span>}
            </h1>
            <p className="page-subtitle">Détail du compte utilisateur</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/users/${id}/edit`)} className="btn-outline">
            ✏️ Modifier
          </button>
          <button onClick={() => setShowPasswordModal(true)} className="btn-outline">
            🔑 Changer mot de passe
          </button>
        </div>
      </div>

      <div className="card space-y-6">
        {/* En-tête avec avatar */}
        <div className="flex items-center gap-4 pb-4 border-b">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl text-white font-bold ${user.role === 'ADMIN' ? 'bg-danger' : 'bg-success'}`}>
            {user.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-primary">{user.username}</h2>
            <span className={`badge ${roleBadge.color} mt-1`}>
              {roleBadge.label}
            </span>
            <span className={`badge ml-2 ${user.active ? 'badge-success' : 'badge-neutral'}`}>
              {user.active ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>

        {/* Informations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="stat-label">Nom d'utilisateur</p>
            <p className="text-lg font-mono">{user.username}</p>
          </div>
          <div>
            <p className="stat-label">Rôle</p>
            <p className="text-lg">{roleBadge.label}</p>
          </div>
          <div>
            <p className="stat-label">Statut</p>
            <p className={`text-lg ${user.active ? 'text-success' : 'text-text-muted'}`}>
              {user.active ? 'Actif' : 'Inactif'}
            </p>
          </div>
          <div>
            <p className="stat-label">ID utilisateur</p>
            <p className="text-lg font-mono text-text-muted">#{user.id}</p>
          </div>
          <div>
            <p className="stat-label">Date de création</p>
            <p className="text-lg">{formatDateTime(user.createdAt)}</p>
          </div>
          <div>
            <p className="stat-label">Dernière modification</p>
            <p className="text-lg">{formatDateTime(user.updatedAt)}</p>
          </div>
        </div>

        {/* Permissions */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">🔐 Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {user.role === 'ADMIN' ? (
              <>
                <div className="flex items-center gap-2 text-success">✅ Gestion des utilisateurs</div>
                <div className="flex items-center gap-2 text-success">✅ Gestion des plateformes</div>
                <div className="flex items-center gap-2 text-success">✅ Gestion des clients</div>
                <div className="flex items-center gap-2 text-success">✅ Gestion des transactions</div>
                <div className="flex items-center gap-2 text-success">✅ Gestion des rappels</div>
                <div className="flex items-center gap-2 text-success">✅ Gestion de la caisse</div>
                <div className="flex items-center gap-2 text-success">✅ Gestion de l'inventaire</div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-success">✅ Gestion des clients</div>
                <div className="flex items-center gap-2 text-success">✅ Gestion des transactions</div>
                <div className="flex items-center gap-2 text-success">✅ Gestion des rappels</div>
                <div className="flex items-center gap-2 text-success">✅ Gestion de la caisse</div>
                <div className="flex items-center gap-2 text-success">✅ Gestion de l'inventaire</div>
                <div className="flex items-center gap-2 text-text-muted">❌ Gestion des utilisateurs</div>
                <div className="flex items-center gap-2 text-text-muted">❌ Gestion des plateformes</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal changement mot de passe */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-header">🔑 Changer le mot de passe</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="modal-footer mt-4">
              <button onClick={() => setShowPasswordModal(false)} className="btn-outline">
                Annuler
              </button>
              <button onClick={handleChangePassword} disabled={changingPassword} className="btn-primary">
                {changingPassword ? 'Modification...' : 'Modifier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetailPage;