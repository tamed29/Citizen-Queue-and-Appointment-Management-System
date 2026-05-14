import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const navStyle = {
    height: '56px',
    backgroundColor: 'var(--bg-2)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  };

  const innerStyle = {
    maxWidth: '1160px',
    margin: '0 auto',
    padding: '0 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%'
  };

  const logoStyle = {
    fontFamily: "'DM Mono', monospace",
    fontSize: '15px',
    fontWeight: 500,
    color: 'var(--accent-2)',
    letterSpacing: '0.05em',
    textDecoration: 'none'
  };

  const linkStyle = (path) => ({
    fontSize: '13px',
    color: location.pathname === path ? 'var(--accent-2)' : 'var(--text-2)',
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
    transition: 'color 0.15s ease',
    textDecoration: 'none',
  });

  const mobileDropdownStyle = {
    position: 'absolute',
    top: '56px',
    left: 0,
    right: 0,
    backgroundColor: 'var(--bg-2)',
    borderBottom: '1px solid var(--border)',
    display: mobileMenuOpen ? 'flex' : 'none',
    flexDirection: 'column',
    zIndex: 99,
  };

  const mobileLinkStyle = (path) => ({
    padding: '14px 20px',
    fontSize: '15px',
    color: location.pathname === path ? 'var(--accent-2)' : 'var(--text-1)',
    textDecoration: 'none',
    borderBottom: '1px solid var(--border)'
  });

  return (
    <nav style={navStyle}>
      <div style={innerStyle}>
        <div>
          <Link to={user ? "/home" : "/"} style={logoStyle} onClick={() => setMobileMenuOpen(false)}>CQAMS</Link>
        </div>

        {/* Desktop Menu */}
        <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {!user && (
            <>
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}

          {user?.role === 'CITIZEN' && (
            <>
              <Link to="/queue/take" style={linkStyle('/queue/take')}>Take Queue</Link>
              <Link to="/tickets" style={linkStyle('/tickets')}>My Tickets</Link>
              <Link to="/appointments" style={linkStyle('/appointments')}>Appointments</Link>
              <Link to="/queue/track" style={linkStyle('/queue/track')}>Track</Link>
              <span style={{ color: 'var(--text-4)', fontSize: '13px' }}>•</span>
              <span style={{ color: 'var(--text-3)', fontSize: '13px' }}>{user.name}</span>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">Logout</button>
            </>
          )}

          {user?.role === 'STAFF' && (
            <>
              <Link to="/staff" style={linkStyle('/staff')}>Dashboard</Link>
              <span style={{ color: 'var(--text-4)', fontSize: '13px' }}>•</span>
              <span style={{ color: 'var(--text-3)', fontSize: '13px' }}>{user.name}</span>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">Logout</button>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <>
              <Link to="/admin" style={linkStyle('/admin')}>Admin</Link>
              <Link to="/staff" style={linkStyle('/staff')}>Staff View</Link>
              <span style={{ color: 'var(--text-4)', fontSize: '13px' }}>•</span>
              <span style={{ color: 'var(--text-3)', fontSize: '13px' }}>{user.name}</span>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">Logout</button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="nav-mobile-menu" 
          style={{ background: 'none', border: 'none', color: 'var(--text-1)', fontSize: '24px', cursor: 'pointer' }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <i className={`ti ${mobileMenuOpen ? 'ti-x' : 'ti-menu-2'}`}></i>
        </button>
      </div>

      {/* Mobile Dropdown */}
      <div style={mobileDropdownStyle}>
        {!user ? (
          <>
            <Link to="/login" style={mobileLinkStyle('/login')} onClick={() => setMobileMenuOpen(false)}>Login</Link>
            <Link to="/register" style={mobileLinkStyle('/register')} onClick={() => setMobileMenuOpen(false)}>Register</Link>
          </>
        ) : (
          <>
            {user.role === 'CITIZEN' && (
              <>
                <Link to="/queue/take" style={mobileLinkStyle('/queue/take')} onClick={() => setMobileMenuOpen(false)}>Take Queue</Link>
                <Link to="/tickets" style={mobileLinkStyle('/tickets')} onClick={() => setMobileMenuOpen(false)}>My Tickets</Link>
                <Link to="/appointments" style={mobileLinkStyle('/appointments')} onClick={() => setMobileMenuOpen(false)}>Appointments</Link>
                <Link to="/queue/track" style={mobileLinkStyle('/queue/track')} onClick={() => setMobileMenuOpen(false)}>Track Queue</Link>
              </>
            )}
            {user.role === 'STAFF' && (
              <Link to="/staff" style={mobileLinkStyle('/staff')} onClick={() => setMobileMenuOpen(false)}>Staff Dashboard</Link>
            )}
            {user.role === 'ADMIN' && (
              <>
                <Link to="/admin" style={mobileLinkStyle('/admin')} onClick={() => setMobileMenuOpen(false)}>Admin Panel</Link>
                <Link to="/staff" style={mobileLinkStyle('/staff')} onClick={() => setMobileMenuOpen(false)}>Staff Portal</Link>
              </>
            )}
            <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>{user.name}</span>
              <button onClick={handleLogout} className="btn btn-danger btn-sm">Logout</button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
