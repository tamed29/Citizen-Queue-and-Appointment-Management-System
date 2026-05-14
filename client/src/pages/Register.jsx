import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    isPriority: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex' }}>
      {/* Left Column - Hidden on Mobile */}
      <div className="register-left" style={{ 
        width: '40%', 
        background: 'var(--bg-3)', 
        borderRight: '1px solid var(--border)', 
        padding: '52px 40px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center' 
      }}>
        <div className="mono" style={{ fontSize: '18px', fontWeight: 500, color: 'var(--accent-2)', marginBottom: '6px' }}>
          CQAMS
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.65, marginBottom: '40px' }}>
          Community Queue & Appointment Management System — Arba Minch, Ethiopia
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {[
            { title: 'Remote queue tickets', desc: 'Get a number before leaving home' },
            { title: 'Appointment booking', desc: 'Schedule at CBE, Ethio Telecom, Hospital' },
            { title: 'Live queue tracking', desc: 'See your position update in real time' },
            { title: 'Priority access', desc: 'Elderly, disabled, pregnant always served first' }
          ].map((feature, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ 
                width: '34px', 
                height: '34px', 
                background: 'var(--accent-dim)', 
                borderRadius: 'var(--radius)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--accent-2)',
                fontSize: '14px',
                flexShrink: 0
              }}>
                ✓
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)', marginBottom: '3px' }}>{feature.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{feature.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column */}
      <div style={{ flex: 1, padding: '52px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.3px', marginBottom: '4px' }}>Create your account</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '28px' }}>Join CQAMS and skip the queue forever</div>

          {error && <div className="error-box" style={{ marginBottom: '20px' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="grid-2" style={{ gap: '12px', marginBottom: '16px' }}>
              <div className="field">
                <label className="label">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  className="input" 
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="field">
                <label className="label">Phone Number</label>
                <input 
                  type="tel" 
                  name="phone"
                  className="input" 
                  placeholder="0911..."
                  value={formData.phone}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>

            <div className="field" style={{ marginBottom: '16px' }}>
              <label className="label">Email (Optional)</label>
              <input 
                type="email" 
                name="email"
                className="input" 
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="field" style={{ marginBottom: '20px' }}>
              <label className="label">Password</label>
              <input 
                type="password" 
                name="password"
                className="input" 
                placeholder="Choose a strong password"
                value={formData.password}
                onChange={handleChange}
                required 
              />
            </div>

            <div 
              onClick={() => setFormData(prev => ({ ...prev, isPriority: !prev.isPriority }))}
              style={{ 
                background: 'rgba(99,102,241,0.07)', 
                border: '1px solid rgba(99,102,241,0.18)', 
                borderRadius: 'var(--radius)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                marginBottom: '18px'
              }}
            >
              <div style={{ 
                width: '18px', 
                height: '18px', 
                border: '1.5px solid rgba(99,102,241,0.45)', 
                borderRadius: '4px',
                background: formData.isPriority ? 'var(--accent)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '10px'
              }}>
                {formData.isPriority && '✓'}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)' }}>I need priority access</div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Elderly, disabled, or pregnant persons only</div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-lg btn-full"
              disabled={loading}
              style={{ marginBottom: '20px' }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-3)' }}>
              Already have an account? {' '}
              <Link to="/login" style={{ color: 'var(--accent-2)', textDecoration: 'none', fontWeight: 500 }}>
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>

      <style jsx="true">{`
        @media (max-width: 768px) {
          .register-left { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Register;
