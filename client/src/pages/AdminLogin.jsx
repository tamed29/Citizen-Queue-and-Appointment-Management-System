import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { adminLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await adminLogin(username, password);
      if (data.role === 'ADMIN') navigate('/admin');
      else navigate('/staff');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(circle at 0% 0%, #1a1a2e 0%, #080810 100%)',
      padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            display: 'inline-block', 
            width: '48px', 
            height: '48px', 
            background: 'var(--accent)', 
            borderRadius: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <i className="ti ti-shield-lock" style={{ fontSize: '24px', color: '#fff' }}></i>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-1)' }}>Admin & Staff Portal</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '4px' }}>Secure access for CQAMS personnel</p>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit}>
            {error && <div className="error-box" style={{ marginBottom: '20px' }}>{error}</div>}
            
            <div className="field" style={{ marginBottom: '16px' }}>
              <label className="label">Email Address</label>
              <input 
                type="email"
                className="input"
                placeholder="Enter your registered email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="field" style={{ marginBottom: '24px' }}>
              <label className="label">Password</label>
              <input 
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-lg btn-full"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link to="/login" style={{ color: 'var(--text-3)', fontSize: '12px', textDecoration: 'none' }}>
            Looking for Citizen Login? <span style={{ color: 'var(--accent)' }}>Go here</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
