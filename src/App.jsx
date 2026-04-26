import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicRoute from './components/common/PublicRoute';
import LoginPage from './pages/auth/LoginPage';
import MainLayout from './layouts/MainLayout';
import ClientsPage from './pages/clients/ClientsPage';
import ClientForm from './pages/clients/ClientForm';
import ClientDetailPage from './pages/clients/ClientDetailPage';
import TransactionsPage from './pages/transactions/TransactionsPage';
import TransactionForm from './pages/transactions/TransactionForm';
import CashOperationsPage from './pages/cash/CashOperationsPage';
import CashOperationForm from './pages/cash/CashOperationForm';
import InventorySessionPage from './pages/inventory/InventorySessionPage';
import InventoryOpenPage from './pages/inventory/InventoryOpenPage';
import InventoryClosePage from './pages/inventory/InventoryClosePage';
import InventoryEditPage from './pages/inventory/InventoryEditPage';
import InventorySessionDetailPage from './pages/inventory/InventorySessionDetailPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import PlatformManager from './pages/admin/PlatformManager';
// ✅ IMPORT DES RAPPELS
import RemindersPage from './pages/reminders/RemindersPage';
import ReminderForm from './pages/reminders/ReminderForm';
import ReminderDetailPage from './pages/reminders/ReminderDetailPage';
// ✅ IMPORT DES UTILISATEURS
import UsersPage from './pages/users/UsersPage';
import UserForm from './pages/users/UserForm';
import UserDetailPage from './pages/users/UserDetailPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Route publique - Login */}
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />

          {/* Routes protégées - Layout principal */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Clients */}
            <Route path="clients" element={<ClientsPage />} />
            <Route path="clients/new" element={<ClientForm />} />
            <Route path="clients/:id" element={<ClientDetailPage />} />
            <Route path="clients/:id/edit" element={<ClientForm />} />

            {/* Transactions */}
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="transactions/new" element={<TransactionForm />} />

            {/* Caisse */}
            <Route path="cash-operations" element={<CashOperationsPage />} />
            <Route path="cash-operations/new" element={<CashOperationForm />} />

            {/* Inventaire journalier */}
            <Route path="inventory" element={<InventorySessionPage />} />
            <Route path="inventory/open" element={<InventoryOpenPage />} />
            <Route path="inventory/session/:id/close" element={<InventoryClosePage />} />
            <Route path="inventory/session/:id/edit" element={<InventoryEditPage />} />
            <Route path="inventory/session/:id" element={<InventorySessionDetailPage />} />

            {/* RAPPELS */}
            <Route path="reminders" element={<RemindersPage />} />
            <Route path="reminders/new" element={<ReminderForm />} />
            <Route path="reminders/:id" element={<ReminderDetailPage />} />
            <Route path="reminders/:id/edit" element={<ReminderForm />} />

            {/* ✅ UTILISATEURS */}
            <Route path="users" element={<UsersPage />} />
            <Route path="users/new" element={<UserForm />} />
            <Route path="users/:id" element={<UserDetailPage />} />
            <Route path="users/:id/edit" element={<UserForm />} />

            {/* Admin - Gestion des plateformes */}
            <Route path="admin/platforms" element={<PlatformManager />} />
          </Route>

          {/* Route 404 - Redirection vers login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;