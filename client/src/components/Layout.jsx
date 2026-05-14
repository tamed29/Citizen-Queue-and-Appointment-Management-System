import React from 'react';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Admin/staff pages have their own full-page layouts — skip shared chrome
  const isAdminRoute = location.pathname.startsWith('/super-admin') || location.pathname.startsWith('/staff');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main>
        {children}
      </main>
      {user && user.role === 'CITIZEN' && <BottomNav />}
    </>
  );
};

export default Layout;
