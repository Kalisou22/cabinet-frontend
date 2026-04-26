import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/formatters';

const UsersPage = () => {
  const navigate = useNavigate();
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    admin: 0,
    agent: 0,
    actif: 0,
    inactif: 0,
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadUsers();
  }, [isAdmin, navigate]);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, filterRole]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      const userList = data || [];
      setUsers(userList);

      const adminCount = userList.filter(u => u.role === 'ADMIN').length;
      const agentCount = userList.filter(u => u.role === 'AGENT').length;
      const actifCount = userList.filter(u => u.active).length;
      const inactifCount = userList.filter(u => !u.active).length;

      setStats({
        total: userList.length,
        admin: adminCount,
        agent: agentCount,
        actif: actifCount,
        inactif: inactifCount,
      });
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      alert('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole.toUpperCase());
    }

    setFilteredUsers(filtered);
  };

  const handleToggleStatus = async (user) => {
    if (user.id === currentUser?.id) {
      alert('Vous ne pouvez pas désactiver votre propre compte');
      return;
    }

    try {
      await userService.toggleStatus(user.id);
      await loadUsers();
      alert(`✅ Utilisateur ${user.active ? 'désactivé' : 'activé'} avec succès`);
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.response?.data?.message || 'Erreur lors du changement de statut');
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    if (userToDelete.id === currentUser?.id) {
      alert('Vous ne pouvez pas supprimer votre propre compte');
      setShowDeleteModal(false);
      setUserToDelete(null);
      return;
    }

    try {
      await userService.delete(userToDelete.id);
      await loadUsers();
      alert('✅ Utilisateur supprimé avec succès');
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'ADMIN') {
      return { label: '👑 Administrateur', color: 'badge-danger' };
    }
    return { label: '👤 Agent', color: 'badge-info' };
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="mt-4 text-text-secondary">Chargement des utilisateurs...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 Utilisateurs</h1>
          <p className="page-subtitle">Gestion des comptes utilisateurs</p>
        </div>
        <button onClick={() => navigate('/users/new')} className="btn-primary">
          + Nouvel utilisateur
        </button>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4 text-center">
          <p className="stat-label">Total</p>
          <p className="stat-value text-2xl">{stats.total}</p>
        </div>
        <div className="card p-4 text-center bg-danger-light/20">
          <p className="stat-label">Administrateurs</p>
          <p className="stat-value text-2xl text-danger">{stats.admin}</p>
        </div>
        <div className="card p-4 text-center bg-info-light/20">
          <p className="stat-label">Agents</p>
          <p className="stat-value text-2xl text-info-dark">{stats.agent}</p>
        </div>
        <div className="card p-4 text-center bg-success-light/20">
          <p className="stat-label">Actifs</p>
          <p className="stat-value text-2xl text-success">{stats.actif}</p>
        </div>
        <div className="card p-4 text-center bg-warning-light/20">
          <p className="stat-label">Inactifs</p>
          <p className="stat-value text-2xl text-warning-dark">{stats.inactif}</p>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="🔍 Rechercher par nom d'utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-danger"
              >
                ✕
              </button>
            )}
          </div>
          <div className="w-48">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="input"
            >
              <option value="all">Tous les rôles</option>
              <option value="ADMIN">Administrateurs</option>
              <option value="AGENT">Agents</option>
            </select>
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterRole('all');
            }}
            className="btn-outline"
          >
            Effacer
          </button>
        </div>
      </div>

      {/* Tableau des utilisateurs */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nom d'utilisateur</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Créé le</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-text-secondary">
                    <div className="empty-state-icon">👥</div>
                    <p className="empty-state-title">Aucun utilisateur</p>
                    <p className="empty-state-description">
                      Commencez par créer un nouvel utilisateur
                    </p>
                    <button
                      onClick={() => navigate('/users/new')}
                      className="btn-primary mt-4"
                    >
                      + Nouvel utilisateur
                    </button>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleBadge = getRoleBadge(user.role);
                  const isCurrentUser = user.id === currentUser?.id;

                  return (
                    <tr key={user.id} className={!user.active ? 'opacity-60' : ''}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${user.role === 'ADMIN' ? 'bg-danger' : 'bg-success'}`}>
                            {user.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{user.username}</p>
                            {isCurrentUser && (
                              <span className="text-xs text-text-muted">(Vous)</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${roleBadge.color}`}>
                          {roleBadge.label}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.active ? 'badge-success' : 'badge-neutral'}`}>
                          {user.active ? '✅ Actif' : '⏸ Inactif'}
                        </span>
                      </td>
                      <td className="text-sm text-text-muted">
                        {formatDateTime(user.createdAt)}
                      </td>
                      <td className="text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => navigate(`/users/${user.id}`)}
                            className="btn-icon btn-sm"
                            title="Voir détails"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => navigate(`/users/${user.id}/edit`)}
                            className="btn-icon btn-sm"
                            title="Modifier"
                            disabled={isCurrentUser && user.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN' && u.active).length === 1}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`btn-icon btn-sm ${user.active ? 'text-warning-dark' : 'text-success'}`}
                            title={user.active ? 'Désactiver' : 'Activer'}
                            disabled={isCurrentUser}
                          >
                            {user.active ? '🔒' : '🔓'}
                          </button>
                          <button
                            onClick={() => { setUserToDelete(user); setShowDeleteModal(true); }}
                            className="btn-icon btn-sm text-danger hover:bg-danger-light"
                            title="Supprimer"
                            disabled={isCurrentUser}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal suppression */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-header">⚠️ Confirmer la suppression</h3>
            <p className="modal-body">
              Êtes-vous sûr de vouloir supprimer l'utilisateur <span className="font-medium">"{userToDelete?.username}"</span> ?
            </p>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="btn-outline">
                Annuler
              </button>
              <button onClick={handleDelete} className="btn-danger">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;