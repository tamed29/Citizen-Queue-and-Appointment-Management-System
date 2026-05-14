import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(phone, password);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid phone or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 56px)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="mono" style={{ fontSize: '22px', fontWeight: 500, color: 'var(--accent-2)', marginBottom: '6px' }}>
            CQAMS
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-3)' }}>
            Sign in to your account
          </div>
        </div>

        <div className="card" style={{ padding: '28px' }}>
          {error && <div className="error-box" style={{ marginBottom: '20px' }}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="field">
              <label className="label">Phone Number</label>
              <input 
                type="tel" 
                className="input" 
                placeholder="0911..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label className="label">Password</label>
              <input 
                type="password" 
                className="input" 
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-lg btn-full"
              disabled={loading}
              style={{ marginTop: '4px' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <hr className="divider" style={{ margin: '24px 0' }} />

          <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-3)' }}>
            Don't have an account? {' '}
            <Link to="/register" style={{ color: 'var(--accent-2)', textDecoration: 'none', fontWeight: 500 }}>
              Register
            </Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link to="/admin" style={{ color: 'var(--text-4)', fontSize: '11px', textDecoration: 'none' }}>
            Staff or Admin? <span style={{ color: 'var(--text-3)' }}>Portal Access</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
