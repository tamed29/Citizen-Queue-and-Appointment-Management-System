import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const [activeTab, setActiveTab] = useState('overview');
  const [queue, setQueue] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [serving, setServing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);

  // Dynamic Theme Mapping
  const themes = {
    Telecom: { main: '#1E3A8A', dim: '#DBEAFE', text: '#1E40AF', badge: 'Telecom' },
    Bank: { main: '#14532D', dim: '#DCFCE7', text: '#166534', badge: 'Bank' },
    Hospital: { main: '#881337', dim: '#FFE4E6', text: '#9F1239', badge: 'Hospital' },
    Other: { main: '#4C1D95', dim: '#EDE9FE', text: '#5B21B6', badge: 'Other' }
  };

  const currentTheme = themes[user.staffCenter?.type] || themes.Other;

  useEffect(() => {
    if (!user.staffCenterId) {
      setLoading(false);
      return;
    }

    fetchData();
    
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
      const [queueRes, apptRes, servRes] = await Promise.all([
        api.get(`/queue/staff/service`), 
        api.get(`/queue/staff/appointments`),
        api.get(`/centers/${user.staffCenterId}`)
      ]);
      setQueue(queueRes.data);
      setAppointments(apptRes.data || []);
      setServices(servRes.data?.services || []);
      
      const called = queueRes.data.find(t => t.status === 'CALLED' && t.servedBy === user.id);
      if (called) setServing(called);
    } catch (err) {
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCallNext = async (serviceId) => {
    try {
      const { data } = await api.post('/queue/staff/call-next', { serviceId });
      setServing(data);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'No waiting tickets');
    }
  };

  const handleAction = async (ticketId, action) => {
    try {
      await api.post(`/queue/staff/${ticketId}/${action}`);
      if (action === 'serve' || action === 'skip') setServing(null);
      fetchData();
    } catch (err) {
      alert(`Failed to ${action} ticket`);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="staff-layout" style={{ '--theme-main': currentTheme.main, '--theme-dim': currentTheme.dim, '--theme-text': currentTheme.text }}>
      {/* Dynamic Header */}
      <header className="staff-header">
        <div className="header-brand">
          <div className="center-badge">{currentTheme.badge}</div>
          <div className="center-info">
            <h1 className="center-name">{user.staffCenter?.name}</h1>
            <span className="center-type">{user.staffCenter?.type} Service Administration</span>
          </div>
        </div>
        <div className="header-actions">
          <div className="user-box" onClick={logout}>
            <span className="user-name">{user.name}</span>
            <i className="ti ti-logout"></i>
          </div>
        </div>
      </header>

      <div className="staff-container">
        {/* Navigation Tabs */}
        <div className="staff-tabs">
          <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <i className="ti ti-layout-dashboard"></i> Overview
          </button>
          <button className={`tab-btn ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => setActiveTab('queue')}>
            <i className="ti ti-users"></i> Live Queue
          </button>
          <button className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>
            <i className="ti ti-calendar-event"></i> Appointments
          </button>
          <button className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>
            <i className="ti ti-category"></i> Services
          </button>
        </div>

        <main className="staff-content">
          {activeTab === 'overview' && (
            <div className="grid-overview">
              <div className="stat-box">
                <span className="stat-label">Active Queue</span>
                <span className="stat-value">{queue.filter(t => t.status === 'WAITING').length}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Today's Appointments</span>
                <span className="stat-value">{appointments.length}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Completed Today</span>
                <span className="stat-value">{queue.filter(t => t.status === 'SERVED').length}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Service Channels</span>
                <span className="stat-value">{services.length}</span>
              </div>
              
              <div className="serving-hero card">
                <div className="hero-label">CURRENTLY SERVING</div>
                {serving ? (
                  <div className="hero-body">
                    <div className="hero-number">{serving.ticketNumber}</div>
                    <div className="hero-customer">{serving.userName || serving.user?.name}</div>
                    <div className="hero-service">{serving.service?.name}</div>
                    <div className="hero-actions">
                      <button className="btn btn-ghost" onClick={() => handleAction(serving.id, 'skip')}>Skip No-Show</button>
                      <button className="btn btn-success" onClick={() => handleAction(serving.id, 'serve')}>Mark Complete</button>
                    </div>
                  </div>
                ) : (
                  <div className="hero-empty">
                    <p>System idle. Call the next customer from a service channel.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="queue-grid">
              {services.map(service => {
                const waiting = queue.filter(t => t.serviceId === service.id && t.status === 'WAITING');
                return (
                  <div key={service.id} className="service-channel card">
                    <div className="channel-header">
                      <div>
                        <h3>{service.name}</h3>
                        <span className="waiting-count">{waiting.length} waiting</span>
                      </div>
                      <button 
                        className="btn btn-primary btn-sm" 
                        disabled={waiting.length === 0 || !!serving}
                        onClick={() => handleCallNext(service.id)}
                      >
                        Call Next
                      </button>
                    </div>
                    <div className="channel-list">
                      {waiting.map(t => (
                        <div key={t.id} className="queue-item">
                          <span className="t-num">{t.ticketNumber}</span>
                          <span className="t-name">{t.userName || t.user?.name}</span>
                          <span className="t-time">{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))}
                      {waiting.length === 0 && <p className="empty-text">No one waiting</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="card appointment-card">
               <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Customer</th>
                    <th>Service Category</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length > 0 ? appointments.map(appt => (
                    <tr key={appt.id}>
                      <td className="mono">{new Date(appt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>{appt.user?.name}</td>
                      <td>{appt.service?.name}</td>
                      <td><StatusBadge status={appt.status} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-icon" title="Approve"><i className="ti ti-check"></i></button>
                          <button className="btn-icon" title="Cancel"><i className="ti ti-x"></i></button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="empty-row">No appointments scheduled for today.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {activeTab === 'services' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3>Service Configuration</h3>
                <button className="btn btn-primary btn-sm">+ Add Service</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Avg. Duration</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>{s.avgDurationMin} minutes</td>
                      <td><span className="badge-active">Active</span></td>
                      <td>
                         <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-icon"><i className="ti ti-edit"></i></button>
                          <button className="btn-icon" style={{ color: '#ef4444' }}><i className="ti ti-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .staff-layout {
          min-height: 100vh;
          background: #f8fafc;
          color: #1e293b;
          display: flex;
          flex-direction: column;
        }

        /* Header */
        .staff-header {
          height: 80px;
          background: var(--theme-main);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .header-brand {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .center-badge {
          background: rgba(255,255,255,0.2);
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          border: 1px solid rgba(255,255,255,0.3);
        }
        .center-name {
          font-size: 18px;
          font-weight: 700;
          margin: 0;
          line-height: 1.2;
        }
        .center-type {
          font-size: 12px;
          opacity: 0.8;
          font-weight: 500;
        }
        .user-box {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          background: rgba(0,0,0,0.1);
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .user-box:hover { background: rgba(0,0,0,0.2); }
        .user-name { font-weight: 600; font-size: 14px; }

        .staff-container {
          padding: 40px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        /* Tabs */
        .staff-tabs {
          display: flex;
          gap: 8px;
          background: #fff;
          padding: 8px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          width: fit-content;
        }
        .tab-btn {
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #64748b;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .tab-btn:hover { background: #f1f5f9; }
        .tab-btn.active {
          background: var(--theme-dim);
          color: var(--theme-text);
        }

        /* Overview Grid */
        .grid-overview {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .stat-box {
          background: #fff;
          padding: 24px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .stat-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; }
        .stat-value { font-size: 28px; font-weight: 800; color: #0f172a; }

        .serving-hero {
          grid-column: span 4;
          padding: 48px !important;
          text-align: center;
          background: #fff;
          border: 2px solid var(--theme-main) !important;
        }
        .hero-label { font-size: 14px; font-weight: 800; color: var(--theme-text); letter-spacing: 1px; }
        .hero-number { font-size: 64px; font-weight: 900; color: var(--theme-text); margin: 16px 0; font-family: var(--font-mono); }
        .hero-customer { font-size: 20px; font-weight: 700; color: #0f172a; }
        .hero-service { font-size: 14px; color: #64748b; margin-top: 4px; }
        .hero-actions { display: flex; justify-content: center; gap: 16px; margin-top: 32px; }
        .hero-empty { padding: 40px; color: #94a3b8; font-style: italic; }

        /* Queue Grid */
        .queue-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 24px;
        }
        .service-channel { padding: 0 !important; overflow: hidden; }
        .channel-header {
          padding: 20px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .channel-header h3 { font-size: 16px; font-weight: 700; margin: 0; }
        .waiting-count { font-size: 12px; color: #64748b; font-weight: 500; }
        .channel-list { padding: 16px 24px; min-height: 200px; max-height: 400px; overflow-y: auto; }
        .queue-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .t-num { font-weight: 800; color: var(--theme-text); font-family: var(--font-mono); width: 60px; }
        .t-name { font-size: 14px; font-weight: 500; flex: 1; }
        .t-time { font-size: 11px; color: #94a3b8; }
        .empty-text { text-align: center; color: #94a3b8; margin-top: 60px; font-size: 14px; }

        /* Tables */
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { text-align: left; padding: 16px; font-size: 12px; font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0; }
        .data-table td { padding: 16px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
        .empty-row { text-align: center; padding: 60px !important; color: #94a3b8; font-style: italic; }
        .btn-icon { background: none; border: none; cursor: pointer; color: #64748b; font-size: 18px; transition: color 0.2s; }
        .btn-icon:hover { color: var(--theme-main); }
        .badge-active { background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }

        .btn-success { background: #10b981; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .btn-success:hover { background: #059669; }
      `}} />
    </div>
  );
};

export default StaffDashboard;
