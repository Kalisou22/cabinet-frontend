import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';

const MainLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMenuClick = () => setMobileMenuOpen(true);
  const handleMenuClose = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={handleMenuClick} />

      {/* Overlay mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={handleMenuClose}
        />
      )}

      <Sidebar
        isMobileOpen={mobileMenuOpen}
        onMobileClose={handleMenuClose}
      />

      {/* Contenu principal - optimisé */}
      <main className="lg:ml-64 pt-16">
        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;