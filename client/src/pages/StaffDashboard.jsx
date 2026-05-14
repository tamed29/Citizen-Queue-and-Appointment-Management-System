import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const [activeTab, setActiveTab] = useState('queue');
  const [queue, setQueue] = useState([]);
  const [serving, setServing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user.staffCenterId) {
      setLoading(false);
      return;
    }

    fetchQueue();
    fetchStats();
    
    // Join center room instead of service room
    socket?.emit('join:center', user.staffCenterId);
    socket?.on('queue:update', fetchQueue);
    socket?.on('queue:called', fetchQueue);

    return () => {
      socket?.emit('leave:center', user.staffCenterId);
      socket?.off('queue:update', fetchQueue);
      socket?.off('queue:called', fetchQueue);
    };
  }, [user.staffCenterId, socket]);

  const fetchQueue = async () => {
    try {
      const { data } = await api.get('/queue/staff/service');
      // The API now returns center-wide queue if not assigned to service
      setQueue(data.filter(t => t.status === 'WAITING'));
      
      // Find what we are currently serving
      const called = data.find(t => t.status === 'CALLED' && t.servedBy === user.id);
      if (called) setServing(called);
    } catch (err) {
      console.error('Error fetching queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/queue/staff/stats');
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleCallNext = async () => {
    try {
      const { data } = await api.post('/queue/staff/call-next');
      setServing(data);
      fetchQueue();
    } catch (err) {
      alert(err.response?.data?.error || 'No waiting tickets');
    }
  };

  const handleServe = async () => {
    try {
      await api.post(`/queue/staff/${serving.id}/serve`);
      setServing(null);
      fetchQueue();
      fetchStats();
    } catch (err) {
      alert('Failed to serve ticket');
    }
  };

  const handleSkip = async () => {
    try {
      await api.post(`/queue/staff/${serving.id}/skip`);
      setServing(null);
      fetchQueue();
      fetchStats();
    } catch (err) {
      alert('Failed to skip ticket');
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  if (!user.staffCenterId) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <h2 style={{ marginTop: '20px' }}>Not Assigned</h2>
        <p style={{ color: 'var(--text-3)' }}>You haven't been assigned to a service center yet. Please contact your administrator.</p>
      </div>
    );
  }

  return (
    <div className="staff-layout" style={{ background: 'var(--bg-1)', minHeight: '100vh' }}>
      {/* Top Bar */}
      <header style={{ 
        minHeight: '56px', background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px',
        flexWrap: 'wrap', gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent-2)', letterSpacing: '0.05em' }}>CQAMS STAFF</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-3)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></span>
            <span className="nav-links-desktop">{user.center?.name || 'Center Admin'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-2)' }} className="nav-links-desktop">{user.name} ({user.email})</span>
          <button onClick={logout} className="btn btn-sm btn-ghost">Logout</button>
        </div>
      </header>

      {/* Tab Bar */}
      <div style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', display: 'flex', padding: '0 24px', overflowX: 'auto' }} className="hide-scrollbar">
        <TabItem id="queue" label={`Queue (${queue.length})`} active={activeTab === 'queue'} onClick={setActiveTab} />
        <TabItem id="appointments" label="Appointments" active={activeTab === 'appointments'} onClick={setActiveTab} />
        <TabItem id="history" label="History" active={activeTab === 'history'} onClick={setActiveTab} />
        <TabItem id="stats" label="My Stats" active={activeTab === 'stats'} onClick={setActiveTab} />
      </div>

      <main className="page" style={{ paddingTop: '24px' }}>
        {activeTab === 'queue' && (
          <div className="grid-2 flex-mobile-column" style={{ gridTemplateColumns: '1fr 320px', gap: '24px' }}>
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="section-title">Waiting Queue</h3>
                <span className="eyebrow" style={{ color: 'var(--warning)' }}>{queue.length} People Waiting</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {queue.map((t, idx) => (
                  <div key={t.id} className="card" style={{ 
                    padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px',
                    borderLeft: t.isPriority ? '3px solid var(--success)' : '1px solid var(--border)'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-4)', width: '24px' }}>#{idx + 1}</div>
                    <div className="mono" style={{ fontWeight: 600, fontSize: '14px', width: '80px' }}>{t.ticketNumber}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{t.userName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{t.service?.name}</div>
                    </div>
                    {t.isPriority && <span style={{ fontSize: '10px', background: 'var(--success-dim)', color: 'var(--success)', padding: '2px 6px', borderRadius: '4px' }}>PRIORITY</span>}
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{Math.round((new Date() - new Date(t.createdAt)) / 60000)}m</div>
                  </div>
                ))}
                {queue.length === 0 && (
                  <div className="empty-state">
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎉</div>
                    <h3>Queue is empty</h3>
                    <p>All caught up! Great job.</p>
                  </div>
                )}
              </div>
            </section>

            <aside>
              <h3 className="section-title" style={{ marginBottom: '16px' }}>Now Serving</h3>
              <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
                {!serving ? (
                  <>
                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>⌛</div>
                    <p style={{ color: 'var(--text-3)', marginBottom: '24px', fontSize: '14px' }}>Ready to serve the next customer in the center?</p>
                    <button className="btn btn-primary btn-lg btn-full" onClick={handleCallNext}>Call Next Ticket</button>
                  </>
                ) : (
                  <>
                    <div className="section-title" style={{ color: 'var(--text-4)', marginBottom: '8px' }}>TICKET NUMBER</div>
                    <div className="mono" style={{ fontSize: '56px', fontWeight: 600, color: 'var(--accent)', lineHeight: 1 }}>{serving.ticketNumber}</div>
                    <div style={{ margin: '16px 0 24px' }}>
                      <div style={{ fontSize: '14px', color: 'var(--accent-2)', fontWeight: 600, marginBottom: '4px' }}>{serving.service?.name}</div>
                      <div style={{ fontSize: '16px', fontWeight: 500 }}>{serving.user?.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Called {Math.round((new Date() - new Date(serving.calledAt)) / 60000)}m ago</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button className="btn btn-success btn-full" onClick={handleServe}>✓ Mark as Served</button>
                      <button className="btn btn-danger btn-full" onClick={handleSkip}>✕ Skip Ticket</button>
                      <button className="btn btn-ghost btn-full" onClick={handleCallNext}>→ Call Next</button>
                    </div>
                  </>
                )}
              </div>

              {stats && (
                <div className="card" style={{ marginTop: '24px', padding: '16px' }}>
                  <div className="section-title" style={{ fontSize: '10px', marginBottom: '12px' }}>CENTER PERFORMANCE</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Served Today</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success)' }}>{stats.servedCount}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Skipped Today</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--danger)' }}>{stats.skippedCount}</span>
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}

        {activeTab === 'appointments' && <AppointmentsTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'stats' && <StatsTab stats={stats} user={user} />}
      </main>
    </div>
  );
};

const TabItem = ({ id, label, active, onClick }) => (
  <div 
    onClick={() => onClick(id)}
    style={{ 
      padding: '16px 20px', fontSize: '13px', color: active ? 'var(--text-1)' : 'var(--text-3)',
      borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
      cursor: 'pointer', transition: 'all 0.2s ease', fontWeight: active ? 500 : 400,
      whiteSpace: 'nowrap'
    }}
  >
    {label}
  </div>
);

const AppointmentsTab = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      const { data } = await api.get('/queue/staff/appointments');
      setAppointments(data);
      setLoading(false);
    };
    fetchAppointments();
  }, []);

  return (
    <div className="tab-content">
      <h3 className="section-title" style={{ marginBottom: '20px' }}>Today's Center Appointments</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {appointments.map(a => (
          <div key={a.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ 
                minWidth: '50px', height: '50px', background: 'var(--accent-dim)', 
                borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', 
                alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-2)', lineHeight: 1 }}>{new Date(a.scheduledAt).getDate()}</div>
                <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase' }}>
                  {new Date(a.scheduledAt).toLocaleDateString([], { month: 'short' })}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 500 }}>{a.user.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--accent)' }}>{a.service?.name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)' }} className="mono">
                  {new Date(a.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <StatusBadge status={a.status} />
              </div>
          </div>
        ))}
        {appointments.length === 0 && <div className="empty-state">No appointments for today</div>}
      </div>
    </div>
  );
};

const HistoryTab = () => {
  const [history, setHistory] = useState([]);
  useEffect(() => {
    api.get('/queue/staff/history').then(res => setHistory(res.data.tickets));
  }, []);

  return (
    <div className="tab-content">
      <h3 className="section-title" style={{ marginBottom: '20px' }}>Center Service History (Today)</h3>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '14px 20px', textAlign: 'left' }}>Ticket</th>
              <th style={{ padding: '14px 20px', textAlign: 'left' }}>Service</th>
              <th style={{ padding: '14px 20px', textAlign: 'left' }}>User</th>
              <th style={{ padding: '14px 20px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Served At</th>
            </tr>
          </thead>
          <tbody>
            {history.map(h => (
              <tr key={h.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '14px 20px' }} className="mono">{h.ticketNumber}</td>
                <td style={{ padding: '14px 20px' }}>{h.service?.name}</td>
                <td style={{ padding: '14px 20px' }}>{h.user.name}</td>
                <td style={{ padding: '14px 20px' }}><StatusBadge status={h.status} /></td>
                <td style={{ padding: '14px 20px', textAlign: 'right' }} className="mono">
                  {h.servedAt ? new Date(h.servedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatsTab = ({ stats, user }) => (
  <div className="tab-content" style={{ maxWidth: '600px' }}>
    <h3 className="section-title" style={{ marginBottom: '20px' }}>Performance Overview</h3>
    <div className="card">
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ 
          width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
        }}>👤</div>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>{user.name}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Center Admin · Managing {stats?.servedCount || 0} tickets today</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card" style={{ background: 'var(--bg-2)' }}>
          <div className="section-title" style={{ fontSize: '10px' }}>COMPLETION RATE</div>
          <div style={{ fontSize: '32px', fontWeight: 600, margin: '8px 0', color: 'var(--accent-2)' }}>
            {stats ? Math.round((stats.servedCount / (stats.servedCount + stats.skippedCount || 1)) * 100) : 0}%
          </div>
          <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px' }}>
            <div style={{ 
              height: '100%', 
              width: `${stats ? (stats.servedCount / (stats.servedCount + stats.skippedCount || 1)) * 100 : 0}%`,
              background: 'var(--accent)', borderRadius: '2px'
            }}></div>
          </div>
        </div>
        <div className="card" style={{ background: 'var(--bg-2)' }}>
          <div className="section-title" style={{ fontSize: '10px' }}>TOTAL WAITING</div>
          <div style={{ fontSize: '32px', fontWeight: 600, margin: '8px 0', color: 'var(--warning)' }}>
            {stats?.currentWaiting || 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Across all services</div>
        </div>
      </div>
    </div>
  </div>
);

export default StaffDashboard;
