import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

const Landing = () => {
  const [stats, setStats] = useState(null);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, centersRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/centers')
        ]);
        setStats(statsRes.data);
        setCenters(centersRes.data.slice(0, 3));
      } catch (err) {
        console.error('Error fetching landing data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="page-full" style={{ overflowX: 'hidden' }}>
      {/* Hero Section */}
      <section style={{ 
        padding: '120px 28px 100px', 
        position: 'relative',
        textAlign: 'center',
        background: 'radial-gradient(circle at 50% -20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)'
      }}>
        <div style={{ 
          display: 'inline-flex', 
          padding: '6px 14px', 
          background: 'var(--accent-dim)', 
          borderRadius: '100px',
          color: 'var(--accent-2)',
          fontSize: '12px',
          fontWeight: 600,
          marginBottom: '32px',
          border: '1px solid rgba(99, 102, 241, 0.2)'
        }}>
          CQAMS Platform — Arba Minch, Ethiopia
        </div>
        
        <h1 style={{ 
          fontSize: 'clamp(40px, 8vw, 64px)', 
          fontWeight: 600, 
          letterSpacing: '-0.03em', 
          lineHeight: 1.05, 
          marginBottom: '24px',
          maxWidth: '900px',
          margin: '0 auto 24px'
        }}>
          Skip the queue.<br />
          <span style={{ 
            background: 'linear-gradient(to right, #818cf8, #6366f1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Save your time.</span>
        </h1>
        
        <p style={{ 
          fontSize: '18px', 
          color: 'var(--text-2)', 
          maxWidth: '600px', 
          margin: '0 auto 40px',
          lineHeight: 1.6
        }}>
          The first digital queue and appointment system for Arba Minch. Join virtual queues at CBE, Ethio Telecom, and Hospitals from your phone.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link to="/register" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }}>Get Started — It's Free</Link>
          <Link to="/login" className="btn btn-ghost" style={{ padding: '14px 32px', fontSize: '16px', border: '1px solid var(--border)' }}>Sign In to Account</Link>
        </div>

        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '24px', opacity: 0.6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--success)' }}><polyline points="20 6 9 17 4 12"/></svg>
            No Waiting
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--success)' }}><polyline points="20 6 9 17 4 12"/></svg>
            Real-time Tracking
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--success)' }}><polyline points="20 6 9 17 4 12"/></svg>
            Instant Booking
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '80px 28px', maxWidth: '1160px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '12px' }}>Everything you need to be efficient</h2>
          <p style={{ color: 'var(--text-3)' }}>Designed for citizens and administrators who value their time.</p>
        </div>

        <div className="grid-3">
          <div className="card" style={{ padding: '32px' }}>
            <div style={{ width: '48px', height: '48px', background: 'var(--accent-dim)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: 'var(--accent-2)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Remote Queuing</h3>
            <p style={{ color: 'var(--text-2)', fontSize: '14px', lineHeight: 1.6 }}>Take your ticket from home or while traveling. No need to stand in physical lines for hours.</p>
          </div>

          <div className="card" style={{ padding: '32px' }}>
            <div style={{ width: '48px', height: '48px', background: 'var(--success-dim)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: 'var(--success)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Smart Appointments</h3>
            <p style={{ color: 'var(--text-2)', fontSize: '14px', lineHeight: 1.6 }}>Book specific time slots for complex services like bank loans or telecom contracts.</p>
          </div>

          <div className="card" style={{ padding: '32px' }}>
            <div style={{ width: '48px', height: '48px', background: 'var(--info-dim)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: 'var(--info)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Secure & Fair</h3>
            <p style={{ color: 'var(--text-2)', fontSize: '14px', lineHeight: 1.6 }}>Advanced algorithms ensure the queue is fair for everyone. No jumping lines or bribery.</p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section style={{ padding: '100px 28px', background: 'var(--bg-2)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--accent-2)', fontWeight: 600, fontSize: '14px', marginBottom: '16px' }}>THE PROCESS</div>
            <h2 style={{ fontSize: '36px', fontWeight: 600, marginBottom: '32px', lineHeight: 1.1 }}>Join the queue in seconds.</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ width: '32px', height: '32px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>1</div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>Find your Center</div>
                  <p style={{ color: 'var(--text-3)', fontSize: '14px' }}>Search for the nearest CBE, Ethio Telecom or Hospital.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ width: '32px', height: '32px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>2</div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>Take a Ticket</div>
                  <p style={{ color: 'var(--text-3)', fontSize: '14px' }}>Get your virtual ticket number and estimated wait time.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ width: '32px', height: '32px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>3</div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>Track Live</div>
                  <p style={{ color: 'var(--text-3)', fontSize: '14px' }}>Watch your position change in real-time on your dashboard.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: '0', overflow: 'hidden', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-3)' }}>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>📱</div>
              <div style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px' }}>Live Dashboard</div>
              <p style={{ color: 'var(--text-3)' }}>Real-time queue tracking directly from your browser.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Centers List */}
      <section style={{ padding: '100px 28px', maxWidth: '1160px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '8px' }}>Active Centers</h2>
            <p style={{ color: 'var(--text-3)' }}>Visit any of our registered centers today.</p>
          </div>
          <Link to="/register" style={{ color: 'var(--accent-2)', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>View all 42 centers →</Link>
        </div>

        <div className="grid-3">
          {centers.map(center => (
            <div key={center.id} className="card-interactive" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ 
                  padding: '4px 10px', 
                  borderRadius: '6px', 
                  fontSize: '11px', 
                  fontWeight: 600, 
                  background: center.type === 'Bank' ? 'var(--info-dim)' : 'var(--success-dim)',
                  color: center.type === 'Bank' ? 'var(--info)' : 'var(--success)',
                  textTransform: 'uppercase'
                }}>
                  {center.type}
                </div>
                <div style={{ color: 'var(--success)', fontSize: '11px', fontWeight: 600 }}>● ONLINE</div>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>{center.name}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '20px' }}>{center.location}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '4px', background: 'var(--border)', borderRadius: '2px' }}>
                  <div style={{ width: '45%', height: '100%', background: 'var(--accent)', borderRadius: '2px' }}></div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>Medium Traffic</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '120px 28px', textAlign: 'center', background: 'linear-gradient(to bottom, transparent, rgba(99, 102, 241, 0.05))' }}>
        <h2 style={{ fontSize: '40px', fontWeight: 600, marginBottom: '16px' }}>Ready to save your first hour?</h2>
        <p style={{ color: 'var(--text-2)', maxWidth: '500px', margin: '0 auto 40px', fontSize: '18px' }}>Join thousands of citizens in Arba Minch who are already skipping the wait.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <Link to="/register" className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '18px' }}>Create Account Now</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '60px 28px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", color: 'var(--accent-2)', marginBottom: '24px', fontSize: '18px' }}>CQAMS</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '32px' }}>
          <a href="#" style={{ color: 'var(--text-3)', fontSize: '14px', textDecoration: 'none' }}>About</a>
          <a href="#" style={{ color: 'var(--text-3)', fontSize: '14px', textDecoration: 'none' }}>Partners</a>
          <a href="#" style={{ color: 'var(--text-3)', fontSize: '14px', textDecoration: 'none' }}>Privacy</a>
          <a href="#" style={{ color: 'var(--text-3)', fontSize: '14px', textDecoration: 'none' }}>Support</a>
        </div>
        <div style={{ color: 'var(--text-4)', fontSize: '12px' }}>© 2026 Citizen Queue and Appointment Management System. Arba Minch, Ethiopia.</div>
      </footer>
    </div>
  );
};

export default Landing;
