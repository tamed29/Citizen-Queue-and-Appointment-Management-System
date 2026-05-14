import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    { label: 'Home', icon: 'ti-home', path: '/' },
    { label: 'Queue', icon: 'ti-ticket', path: '/queue/take' },
    { label: 'Book', icon: 'ti-calendar', path: '/appointments' },
    { label: 'Me', icon: 'ti-user', path: '/tickets' }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <NavLink 
          key={item.path}
          to={item.path} 
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <i className={`ti ${item.icon}`}></i>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
