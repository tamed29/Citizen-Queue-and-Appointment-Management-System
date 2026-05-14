import React from 'react';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user } = useAuth();

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
