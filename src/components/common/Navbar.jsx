import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [pendingReminders, setPendingReminders] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const today = new Date();

  useEffect(() => {
    loadPendingReminders();
    const interval = setInterval(loadPendingReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadPendingReminders = async () => {
    try {
      const { reminderService } = await import('../../services/reminderService');
      const pending = await reminderService.getPending();
      setPendingReminders(pending?.length || 0);
    } catch (error) {
      console.error('Erreur chargement rappels:', error);
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (pendingReminders > 0) {
      navigate('/reminders');
      setShowNotifications(false);
    }
  };

  return (
    <header className="topbar">
      {/* Menu hamburger (mobile) */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="btn-icon lg:hidden"
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Date */}
        <div className="hidden sm:block text-sm text-text-secondary">
          {today.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </div>
      </div>

      {/* Actions droite */}
      <div className="flex items-center gap-2">
        {/* Notification avec badge de rappels */}
        <button
          onClick={handleNotificationClick}
          className="btn-icon relative"
        >
          <span className="text-xl">🔔</span>
          {pendingReminders > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-xs rounded-full flex items-center justify-center">
              {pendingReminders > 9 ? '9+' : pendingReminders}
            </span>
          )}
        </button>

        {/* Profil utilisateur */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-medium ${
              user?.role === 'ADMIN' ? 'bg-danger' : 'bg-success'
            }`}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-text-primary">{user?.username}</p>
              <p className="text-xs text-text-secondary">
                {user?.role === 'ADMIN' ? 'Administrateur' : 'Agent'}
              </p>
            </div>
            <svg className="w-4 h-4 text-text-secondary hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Menu déroulant utilisateur */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="py-2">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-text-primary">{user?.username}</p>
                  <p className="text-xs text-text-secondary">{user?.role === 'ADMIN' ? 'Administrateur' : 'Agent'}</p>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/dashboard');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-gray-50"
                >
                  📊 Tableau de bord
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/reminders');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-gray-50"
                >
                  🔔 Rappels {pendingReminders > 0 && `(${pendingReminders})`}
                </button>
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/users');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-gray-50"
                  >
                    👥 Utilisateurs
                  </button>
                )}
                <hr className="my-1" />
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-red-50"
                >
                  🚪 Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;