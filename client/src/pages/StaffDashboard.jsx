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
  const [appointments, setAppointments] = useState([]);
  const [serving, setServing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Dynamic Theme based on Center Type
  const theme = {
    color: user.staffCenter?.type === 'Bank' ? 'var(--accent)' : 
           user.staffCenter?.type === 'Telecom' ? 'var(--warning)' : 
           user.staffCenter?.type === 'Hospital' ? 'var(--success)' : 'var(--accent)',
    dim: user.staffCenter?.type === 'Bank' ? 'var(--accent-dim)' : 
         user.staffCenter?.type === 'Telecom' ? 'var(--warning-dim)' : 
         user.staffCenter?.type === 'Hospital' ? 'var(--success-dim)' : 'var(--accent-dim)'
  };

  useEffect(() => {
    if (!user.staffCenterId) {
      setLoading(false);
      return;
    }

    fetchData();
    fetchStats();
    
    socket?.emit('join:center', user.staffCenterId);
    socket?.on('queue:update', fetchData);
    socket?.on('queue:called', fetchData);

    return () => {
      socket?.emit('leave:center', user.staffCenterId);
      socket?.off('queue:update', fetchData);
      socket?.off('queue:called', fetchData);
    };
  }, [user.staffCenterId, socket]);

  const fetchData = async () => {
    try {
      const [queueRes, apptRes] = await Promise.all([
        api.get('/queue/staff/service'),
        api.get('/appointments/staff/center').catch(() => ({ data: [] }))
      ]);
      setQueue(queueRes.data.filter(t => t.status === 'WAITING'));
      setAppointments(apptRes.data || []);
      
      const called = queueRes.data.find(t => t.status === 'CALLED' && t.servedBy === user.id);
      if (called) setServing(called);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
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
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'No waiting tickets');
    }
  };

  const handleServe = async () => {
    try {
      await api.post(`/queue/staff/${serving.id}/serve`);
      setServing(null);
      fetchData();
      fetchStats();
    } catch (err) {
      alert('Failed to serve ticket');
    }
  };

  const handleSkip = async () => {
    try {
      await api.post(`/queue/staff/${serving.id}/skip`);
      setServing(null);
      fetchData();
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
    <div className="admin-layout">
      <aside className="admin-sidebar" style={{ borderRight: `1px solid ${theme.dim}` }}>
        <div style={{ padding: '24px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: theme.color, marginBottom: '4px', textTransform: 'uppercase' }}>
            {user.staffCenter?.type || 'STAFF'} Portal
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-1)' }}>{user.staffCenter?.name}</div>
        </div>

        <div className="sidebar-header">Management</div>
        <SidebarItem id="queue" icon="ti-users" label="Live Queue" activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />
        <SidebarItem id="appointments" icon="ti-calendar-event" label="Appointments" activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />
        <SidebarItem id="stats" icon="ti-chart-bar" label="Statistics" activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />

        <div className="sidebar-header" style={{ marginTop: 'auto' }}>Account</div>
        <div className="sidebar-item" onClick={logout} style={{ color: 'var(--danger)' }}>
          <i className="ti ti-logout"></i>
          <span>Logout</span>
        </div>
      </aside>

      <main className="admin-content">
        <header style={{ 
          marginBottom: '32px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '20px 0',
          borderBottom: '1px solid var(--border)'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-1)' }}>Welcome, {user.name}</h1>
            <p style={{ color: 'var(--text-3)', fontSize: '14px' }}>Counter: {user.counterLabel || 'Not assigned'}</p>
          </div>
          <div className="live-dot" style={{ background: theme.color, color: '#fff' }}>SYSTEM ACTIVE</div>
        </header>

        {activeTab === 'queue' && (
          <div className="tab-content">
            <div className="card" style={{ marginBottom: '32px', border: serving ? `1px solid ${theme.color}` : '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="section-title">CURRENTLY SERVING</div>
                  {serving ? (
                    <div style={{ marginTop: '12px' }}>
                      <div className="mono" style={{ fontSize: '40px', fontWeight: 700, color: theme.color }}>{serving.ticketNumber}</div>
                      <div style={{ fontSize: '16px', color: 'var(--text-2)', marginTop: '4px' }}>{serving.userName || serving.user?.name}</div>
                    </div>
                  ) : (
                    <div style={{ marginTop: '12px', color: 'var(--text-4)', fontSize: '18px' }}>No active ticket</div>
                  )}
                </div>
                <div>
                  {!serving ? (
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '16px 32px', fontSize: '16px', background: theme.color }}
                      onClick={handleCallNext}
                    >
                      Call Next Ticket
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button className="btn btn-ghost" onClick={handleSkip}>Skip</button>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '12px 24px', background: 'var(--success)' }}
                        onClick={handleServe}
                      >
                        Complete Service
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="section-title" style={{ marginBottom: '16px' }}>WAITING QUEUE ({queue.length})</div>
            <div className="grid-1" style={{ gap: '12px' }}>
              {queue.map((ticket, index) => (
                <div key={ticket.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div className="mono" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)' }}>{ticket.ticketNumber}</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{ticket.userName || ticket.user?.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{ticket.service?.name}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {ticket.isPriority && <span className="badge badge-priority">PRIORITY</span>}
                    <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>{new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <StatusBadge status={ticket.status} />
                  </div>
                </div>
              ))}
              {queue.length === 0 && (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-4)', border: '2px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                  All caught up! No waiting tickets.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="tab-content">
            <div className="section-title" style={{ marginBottom: '24px' }}>SCHEDULED APPOINTMENTS</div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-2)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-3)' }}>TIME</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-3)' }}>CITIZEN</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-3)' }}>SERVICE</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-3)' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length > 0 ? appointments.map(appt => (
                    <tr key={appt.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 500 }}>{new Date(appt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px' }}>{appt.user?.name}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-3)' }}>{appt.service?.name}</td>
                      <td style={{ padding: '16px 24px' }}><StatusBadge status={appt.status} /></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4)' }}>No appointments scheduled for today.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'stats' && stats && <StatsSection stats={stats} theme={theme} />}
      </main>
    </div>
  );
};

const SidebarItem = ({ id, icon, label, activeTab, setActiveTab, theme }) => {
  const active = activeTab === id;
  return (
    <div 
      className={`sidebar-item ${active ? 'active' : ''}`}
      onClick={() => setActiveTab(id)}
      style={active ? { background: theme.dim, color: theme.color, borderLeftColor: theme.color } : {}}
    >
      <i className={`ti ${icon}`}></i>
      <span>{label}</span>
    </div>
  );
};

const StatsSection = ({ stats, theme }) => (
  <div className="tab-content">
    <div className="grid-4" style={{ marginBottom: '32px' }}>
      <div className="card">
        <div className="section-title">Waiting Tickets</div>
        <div style={{ fontSize: '32px', fontWeight: 700, color: theme.color, marginTop: '8px' }}>{stats.waitingCount || 0}</div>
      </div>
      <div className="card">
        <div className="section-title">Successfully Served</div>
        <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--success)', marginTop: '8px' }}>{stats.servedToday || 0}</div>
      </div>
      <div className="card">
        <div className="section-title">Average Duration</div>
        <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--info)', marginTop: '8px' }}>{stats.avgServiceTime || 0}m</div>
      </div>
      <div className="card">
        <div className="section-title">Center Utilization</div>
        <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--warning)', marginTop: '8px' }}>86%</div>
      </div>
    </div>

    <div className="card" style={{ height: '400px', padding: '32px' }}>
      <div className="section-title" style={{ marginBottom: '24px' }}>SERVICE PERFORMANCE BY CATEGORY</div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={[
          { name: 'Mon', count: 45 },
          { name: 'Tue', count: 52 },
          { name: 'Wed', count: 48 },
          { name: 'Thu', count: 61 },
          { name: 'Fri', count: 55 },
          { name: 'Sat', count: 32 },
        ]}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-3)', fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-3)', fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '8px' }}
            itemStyle={{ color: theme.color }}
          />
          <Bar dataKey="count" fill={theme.color} radius={[4, 4, 0, 0]} barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default StaffDashboard;
