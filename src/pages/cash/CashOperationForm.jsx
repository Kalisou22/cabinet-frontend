import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cashOperationService } from '../../services/cashOperationService';
import { categoryService } from '../../services/categoryService';
import { useAuth } from '../../context/AuthContext';

const CashOperationForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    categoryId: '',
    type: 'ENTREE',
    montant: '',
    description: '',
  });
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await categoryService.getAll();
      console.log('Catégories chargées:', data);
      setCategories(data || []);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      console.error('Détails:', error.response?.status, error.response?.data);
      alert('Erreur lors du chargement des catégories. Vérifiez la console.');
    } finally {
      setLoadingCategories(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.categoryId) newErrors.categoryId = 'La catégorie est obligatoire';
    if (!formData.montant || parseFloat(formData.montant) <= 0) newErrors.montant = 'Montant invalide';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      await cashOperationService.create({
        categoryId: parseInt(formData.categoryId),
        type: formData.type,
        montant: parseFloat(formData.montant),
        description: formData.description,
        userId: user?.id,
      });
      alert('✅ Opération créée avec succès');
      navigate('/cash-operations');
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const formatMontant = (montant) => {
    if (!montant) return '0';
    return new Intl.NumberFormat('fr-FR').format(montant);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nouvelle opération de caisse</h1>
          <p className="page-subtitle">Enregistrer une entrée ou sortie d'argent</p>
        </div>
        <button onClick={() => navigate('/cash-operations')} className="btn-outline">
          ← Retour
        </button>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type d'opération */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type d'opération
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition ${
                formData.type === 'ENTREE' ? 'bg-success-light border-success' : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="type"
                  value="ENTREE"
                  checked={formData.type === 'ENTREE'}
                  onChange={handleChange}
                  className="mr-2"
                />
                <div>
                  <span className="font-medium text-success">📈 Entrée d'argent</span>
                  <p className="text-xs text-text-secondary">Ajouter de l'argent en caisse</p>
                </div>
              </label>
              <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition ${
                formData.type === 'SORTIE' ? 'bg-danger-light border-danger' : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="type"
                  value="SORTIE"
                  checked={formData.type === 'SORTIE'}
                  onChange={handleChange}
                  className="mr-2"
                />
                <div>
                  <span className="font-medium text-danger">📉 Sortie d'argent</span>
                  <p className="text-xs text-text-secondary">Retirer de l'argent de la caisse</p>
                </div>
              </label>
            </div>
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie <span className="text-red-500">*</span>
            </label>
            {loadingCategories ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-success rounded-full animate-spin"></div>
                <span className="text-text-muted text-sm">Chargement des catégories...</span>
              </div>
            ) : (
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className={`input ${errors.categoryId ? 'border-red-500' : ''}`}
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
          </div>

          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant (FG) <span className="text-red-500">*</span>
            </label>
            <input
              name="montant"
              type="number"
              min="0"
              step="1000"
              value={formData.montant}
              onChange={handleChange}
              className={`input text-lg ${errors.montant ? 'border-red-500' : ''}`}
              placeholder="Ex: 50000"
              autoFocus
            />
            {formData.montant && (
              <p className="mt-1 text-sm text-text-secondary">
                {formatMontant(formData.montant)} FG
              </p>
            )}
            {errors.montant && <p className="mt-1 text-sm text-red-600">{errors.montant}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 text-xs">(optionnel)</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="input"
              placeholder="Détails de l'opération..."
            />
          </div>

          {/* Résumé */}
          <div className={`rounded-2xl p-5 ${
            formData.type === 'ENTREE' ? 'bg-gradient-to-r from-success-light to-success-light/50 border border-success/20' :
            'bg-gradient-to-r from-danger-light to-danger-light/50 border border-danger/20'
          }`}>
            <p className="font-semibold mb-2">
              {formData.type === 'ENTREE' ? '📈 Entrée prévue' : '📉 Sortie prévue'}
            </p>
            <p className={`text-3xl font-bold font-mono ${
              formData.type === 'ENTREE' ? 'text-success-dark' : 'text-danger-dark'
            }`}>
              {formData.type === 'ENTREE' ? '+' : '−'} {formatMontant(formData.montant || 0)} FG
            </p>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/cash-operations')}
              className="btn-outline"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || loadingCategories}
              className={`btn-primary btn-lg ${
                formData.type === 'SORTIE' ? '!bg-danger hover:!bg-danger-dark' : ''
              }`}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Enregistrement...
                </span>
              ) : (
                formData.type === 'ENTREE' ? '📈 Enregistrer l\'entrée' : '📉 Enregistrer la sortie'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CashOperationForm;