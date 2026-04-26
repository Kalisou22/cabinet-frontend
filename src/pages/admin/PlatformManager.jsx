import React, { useState, useEffect } from 'react';
import { platformService } from '../../services/platformService';
import { useAuth } from '../../context/AuthContext';

const PlatformManager = () => {
  const { isAdmin } = useAuth();
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState(null);
  const [formData, setFormData] = useState({ name: '', displayOrder: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadPlatforms = async () => {
    try {
      setLoading(true);
      const data = await platformService.getAll(false);
      setPlatforms(data);
    } catch (error) {
      console.error('Erreur chargement plateformes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert('Le nom est obligatoire');
      return;
    }

    try {
      setSaving(true);
      await platformService.create(formData);
      await loadPlatforms();
      setShowAddModal(false);
      setFormData({ name: '', displayOrder: 0 });
    } catch (error) {
      console.error('Erreur création:', error);
      alert(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.name.trim()) {
      alert('Le nom est obligatoire');
      return;
    }

    try {
      setSaving(true);
      await platformService.update(currentPlatform.id, formData);
      await loadPlatforms();
      setShowEditModal(false);
      setCurrentPlatform(null);
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      alert(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (platform) => {
    try {
      await platformService.toggleStatus(platform.id);
      await loadPlatforms();
    } catch (error) {
      console.error('Erreur toggle:', error);
    }
  };

  const openEditModal = (platform) => {
    setCurrentPlatform(platform);
    setFormData({
      name: platform.name,
      displayOrder: platform.displayOrder || 0,
    });
    setShowEditModal(true);
  };

  if (!isAdmin) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔐</div>
        <h3 className="empty-state-title">Accès réservé</h3>
        <p className="empty-state-description">Seul l'administrateur peut gérer les plateformes</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📱 Gestion des plateformes</h1>
          <p className="page-subtitle">Configurer les plateformes disponibles pour l'inventaire</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          + Nouvelle plateforme
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Ordre d'affichage</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {platforms.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-text-secondary">
                    Aucune plateforme configurée
                  </td>
                </tr>
              ) : (
                platforms.map((platform) => (
                  <tr key={platform.id}>
                    <td className="font-medium">{platform.name}</td>
                    <td>{platform.displayOrder || 0}</td>
                    <td>
                      <button
                        onClick={() => handleToggleStatus(platform)}
                        className={`badge ${platform.isActive ? 'badge-success' : 'badge-neutral'}`}
                      >
                        {platform.isActive ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(platform)}
                          className="btn-icon btn-sm"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajout */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-header">Nouvelle plateforme</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Ex: WorldRemit"
                />
              </div>
              <div>
                <label className="label">Ordre d'affichage</label>
                <input
                  type="number"
                  min="0"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAddModal(false)} className="btn-outline">
                Annuler
              </button>
              <button onClick={handleCreate} disabled={saving} className="btn-primary">
                {saving ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Édition */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-header">Modifier la plateforme</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Ordre d'affichage</label>
                <input
                  type="number"
                  min="0"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowEditModal(false)} className="btn-outline">
                Annuler
              </button>
              <button onClick={handleUpdate} disabled={saving} className="btn-primary">
                {saving ? 'Mise à jour...' : 'Mettre à jour'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformManager;