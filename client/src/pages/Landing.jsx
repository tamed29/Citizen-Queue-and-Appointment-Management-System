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
    <div className="page-full">
      {/* Section 1 - Hero */}
      <section style={{ textAlign: 'center', padding: '80px 28px 64px' }}>
        <div className="eyebrow" style={{ marginBottom: '16px' }}>CQAMS Platform — Arba Minch, Ethiopia</div>
        <h1 style={{ fontSize: '44px', fontWeight: 600, letterSpacing: '-1px', lineHeight: 1.12, marginBottom: '24px' }}>
          No more waiting at the door.<br />
          <span style={{ color: 'var(--accent-2)' }}>Join the queue from anywhere.</span>
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-2)', maxWidth: '500px', margin: '0 auto 32px' }}>
          CQAMS lets citizens book queue tickets and appointments at CBE, Ethio Telecom, Arba Minch Hospital, and government offices — remotely, fairly, and in real time.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <Link to="/register" className="btn btn-primary btn-lg">Get Started — It's Free</Link>
          <Link to="/login" className="btn btn-ghost btn-lg">Sign In</Link>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '16px' }}>
          No payment required · Takes 30 seconds
        </div>
      </section>

      {/* Section 2 - Live Stats */}
      <section style={{ maxWidth: '800px', margin: '0 auto 56px' }}>
        <div className="grid-3">
          <div className="card" style={{ textAlign: 'center', padding: '20px 24px' }}>
            <div style={{ fontSize: '32px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '-0.5px', marginBottom: '5px' }}>
              {stats?.totalToday || 0}
            </div>
            <div className="section-title">Tickets Served Today</div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '20px 24px' }}>
            <div style={{ fontSize: '32px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '-0.5px', marginBottom: '5px' }}>
              3
            </div>
            <div className="section-title">Active Centers</div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '20px 24px' }}>
            <div style={{ fontSize: '32px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '-0.5px', marginBottom: '5px' }}>
              {stats?.avgWaitTime || 0}m
            </div>
            <div className="section-title">Avg Wait Time</div>
          </div>
        </div>
      </section>

      {/* Section 3 - How It Works */}
      <section style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '48px 28px' }}>
        <div className="page">
          <div className="eyebrow" style={{ marginBottom: '8px' }}>How It Works</div>
          <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '36px' }}>From home to served in 4 steps</h2>
          
          <div className="grid-4">
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', marginBottom: '10px' }}>STEP 01</div>
              <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-1)', marginBottom: '6px' }}>Register once</div>
              <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>Create your CQAMS account with just a phone number. Takes under a minute.</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', marginBottom: '10px' }}>STEP 02</div>
              <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-1)', marginBottom: '6px' }}>Pick a service center</div>
              <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>Choose from CBE, Ethio Telecom, hospital, or other registered centers.</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', marginBottom: '10px' }}>STEP 03</div>
              <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-1)', marginBottom: '6px' }}>Take your queue ticket</div>
              <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>Get a digital ticket number or book a specific appointment slot.</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', marginBottom: '10px' }}>STEP 04</div>
              <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-1)', marginBottom: '6px' }}>Arrive when it's your turn</div>
              <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>Track your position live and only arrive when you're close to the front.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 - Service Centers */}
      <section style={{ padding: '48px 28px', maxWidth: '1160px', margin: '0 auto' }}>
        <div className="eyebrow" style={{ marginBottom: '8px' }}>Where CQAMS Works</div>
        <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '32px' }}>Available service centers</h2>

        <div className="grid-3">
          {centers.map(center => (
            <div key={center.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex' }}>
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: 600, 
                  padding: '2px 8px', 
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  background: center.type === 'Bank' ? 'var(--info-dim)' : center.type === 'Telecom' ? 'var(--success-dim)' : 'var(--warning-dim)',
                  color: center.type === 'Bank' ? 'var(--info)' : center.type === 'Telecom' ? 'var(--success)' : 'var(--warning)'
                }}>
                  {center.type}
                </span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-1)' }}>{center.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>{center.location}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {center.services?.slice(0, 3).map(service => (
                  <div key={service._id} style={{ fontSize: '12px', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'var(--accent)', fontSize: '14px' }}>·</span> {service.name}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                {center.services?.length || 0} services available
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 5 - CTA strip */}
      <section style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--border)', padding: '48px 28px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Start saving time today</h2>
        <p style={{ color: 'var(--text-2)', marginBottom: '24px' }}>Join citizens across Arba Minch who no longer wait in line.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <Link to="/register" className="btn btn-primary btn-lg">Create Free Account</Link>
          <Link to="/login" className="btn btn-ghost btn-lg">I already have an account</Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
