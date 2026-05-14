import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [identifier, setIdentifier] = useState(''); // Can be email or phone
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
      const user = await login(identifier, password);
      
      // Role-based routing
      if (user.role === 'SUPER_ADMIN') {
        navigate('/super-admin/dashboard');
      } else if (user.role === 'STAFF_ADMIN') {
        navigate('/staff/dashboard');
      } else {
        navigate('/home');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="brand-logo">CQAMS</div>
          <h1 className="login-title">Unified Access Portal</h1>
          <p className="login-subtitle">Sign in to manage your queue or appointments</p>
        </div>

        <div className="card login-card">
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
              <i className="ti ti-alert-circle"></i> {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label">Login ID</label>
              <div className="input-with-icon">
                <i className="ti ti-user"></i>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Email or Phone Number"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
              <p className="field-help">Use email for admin/staff, phone for citizens.</p>
            </div>

            <div className="field">
              <label className="label">Password</label>
              <div className="input-with-icon">
                <i className="ti ti-lock"></i>
                <input 
                  type="password" 
                  className="input" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-lg btn-full"
              disabled={loading}
              style={{ marginTop: '10px' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <LoadingSpinner size="18px" color="#fff" /> Authenticating...
                </span>
              ) : 'Sign In to System'}
            </button>
          </form>

          <div className="login-footer">
            <p>Don't have an account? <Link to="/register">Register now</Link></p>
          </div>
        </div>

        <div className="system-notice">
          <p>© 2024 Arba Minch Customer Queue Management System</p>
          <p style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-4)' }}>Secure Multi-Tenant Environment v3.0</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-1);
          padding: 24px;
        }
        .login-container {
          width: 100%;
          max-width: 440px;
        }
        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .brand-logo {
          font-family: var(--font-mono);
          font-size: 24px;
          font-weight: 700;
          color: var(--accent-2);
          letter-spacing: -1px;
          margin-bottom: 12px;
        }
        .login-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-1);
          letter-spacing: -0.5px;
        }
        .login-subtitle {
          font-size: 14px;
          color: var(--text-3);
          margin-top: 6px;
        }
        .login-card {
          padding: 40px !important;
          border-radius: 20px !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2) !important;
        }
        .field-help {
          font-size: 11px;
          color: var(--text-4);
          margin-top: 6px;
        }
        .input-with-icon {
          position: relative;
        }
        .input-with-icon i {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-4);
          font-size: 18px;
        }
        .input-with-icon .input {
          padding-left: 44px;
        }
        .login-footer {
          margin-top: 32px;
          text-align: center;
          font-size: 14px;
          color: var(--text-3);
        }
        .login-footer a {
          color: var(--accent-2);
          font-weight: 600;
          text-decoration: none;
        }
        .system-notice {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: var(--text-3);
          opacity: 0.8;
        }
        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .alert-danger {
          background: var(--danger-dim);
          color: var(--danger);
          border: 1px solid rgba(220, 38, 38, 0.2);
        }
      `}} />
    </div>
  );
};

const LoadingSpinner = ({ size = '24px', color = 'var(--accent)' }) => (
  <div style={{
    width: size,
    height: size,
    border: `2px solid ${color}`,
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  }} />
);

export default Login;
