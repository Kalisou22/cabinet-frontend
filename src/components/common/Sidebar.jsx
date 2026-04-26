import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { formatCurrency } from '../../utils/formatters';

const Sidebar = ({ isMobileOpen, onMobileClose }) => {
  const { isAdmin, logout } = useAuth();
  const [quickStats, setQuickStats] = useState({ solde: 0, pendingCount: 0 });
  const [pendingReminders, setPendingReminders] = useState(0);

  const menuItems = [
    { path: '/dashboard', label: 'Tableau de bord', icon: '📊' },
    { path: '/inventory', label: 'Inventaire', icon: '📦' },
    { path: '/clients', label: 'Clients', icon: '👥' },
    { path: '/reminders', label: 'Rappels', icon: '🔔' },
    { path: '/transactions', label: 'Transactions', icon: '💸' },
    { path: '/cash-operations', label: 'Caisse', icon: '💰' },
  ];

  // Menu administrateur
  if (isAdmin) {
    menuItems.push(
      { path: '/admin/platforms', label: 'Plateformes', icon: '📱' },
      { path: '/users', label: 'Utilisateurs', icon: '👤' },
      { path: '/categories', label: 'Catégories', icon: '📁' }
    );
  }

  useEffect(() => {
    loadQuickStats();
    loadPendingReminders();
    const interval = setInterval(() => {
      loadQuickStats();
      loadPendingReminders();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadQuickStats = async () => {
    try {
      const stats = await dashboardService.getQuickSummary();
      setQuickStats(stats);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const loadPendingReminders = async () => {
    try {
      const { reminderService } = await import('../../services/reminderService');
      const pending = await reminderService.getPending();
      setPendingReminders(pending?.length || 0);
    } catch (error) {
      console.error('Erreur chargement rappels:', error);
    }
  };

  const sidebarContent = (
    <>
      {/* En-tête Sidebar */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-danger"></span>
            <span className="w-2 h-2 rounded-full bg-warning"></span>
            <span className="w-2 h-2 rounded-full bg-success"></span>
          </div>
          <span className="text-xl font-display font-bold bg-gradient-to-r from-success to-danger bg-clip-text text-transparent">
            MAMTA
          </span>
        </div>
      </div>

      {/* Capital rapide */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-success-light to-warning-light/50 rounded-2xl p-4 border border-success/20">
          <p className="text-xs text-text-secondary mb-1">Capital disponible</p>
          <p className={`text-xl font-display font-bold font-mono ${quickStats.solde >= 0 ? 'text-success-dark' : 'text-danger'}`}>
            {formatCurrency(quickStats.solde)}
          </p>
          {quickStats.pendingCount > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <span className="w-2 h-2 bg-warning rounded-full"></span>
              <span className="text-xs text-text-secondary">
                {quickStats.pendingCount} dette{quickStats.pendingCount > 1 ? 's' : ''} en attente
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs text-text-muted px-4 py-2 font-medium">NAVIGATION</p>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onMobileClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-gray-100 hover:text-text-primary transition-all duration-200 ${
                isActive ? 'bg-success-light text-success font-medium' : ''
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.path === '/reminders' && pendingReminders > 0 && (
              <span className="badge badge-warning">{pendingReminders}</span>
            )}
            {item.path === '/transactions' && quickStats.pendingCount > 0 && (
              <span className="badge badge-warning">{quickStats.pendingCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-gray-100 hover:text-text-primary transition-all duration-200 w-full text-left"
        >
          <span className="text-xl">🚪</span>
          <span>Déconnexion</span>
        </button>
        <div className="flex items-center justify-center gap-1 mt-4 text-xs text-text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-danger"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
          <span className="ml-2">v1.0.0</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Version desktop - sidebar fixe visible */}
      <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-screen w-64 bg-surface border-r border-border/50 z-40">
        {sidebarContent}
      </aside>

      {/* Version mobile - drawer coulissant */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-surface z-50 transform transition-transform duration-300 lg:hidden shadow-hover ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;