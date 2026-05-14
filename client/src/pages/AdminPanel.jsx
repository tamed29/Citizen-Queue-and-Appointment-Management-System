import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/stats');
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const SidebarItem = ({ id, icon, label, section }) => (
    <div 
      className={`sidebar-item ${activeTab === id ? 'active' : ''}`}
      onClick={() => setActiveTab(id)}
    >
      <i className={`ti ${icon}`}></i>
      <span>{label}</span>
    </div>
  );

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">OVERVIEW</div>
        <SidebarItem id="dashboard" icon="ti-layout-dashboard" label="Dashboard" />
        <SidebarItem id="live" icon="ti-broadcast" label="Live Queues" />
        <SidebarItem id="reports" icon="ti-report-analytics" label="Reports" />

        <div className="sidebar-header">STAFF MANAGEMENT</div>
        <SidebarItem id="all-staff" icon="ti-users" label="All Staff" />
        <SidebarItem id="create-staff" icon="ti-user-plus" label="Create Staff Account" />

        <div className="sidebar-header">SERVICE CENTERS</div>
        <SidebarItem id="center-cbe" icon="ti-building-bank" label="CBE Bank" />
        <SidebarItem id="center-telecom" icon="ti-device-mobile" label="Ethio Telecom" />
        <SidebarItem id="center-hospital" icon="ti-building-hospital" label="AM Hospital" />

        <div className="sidebar-header">SYSTEM</div>
        <SidebarItem id="citizens" icon="ti-users-group" label="Citizens" />
        <SidebarItem id="settings" icon="ti-settings" label="Settings" />
      </aside>

      <main className="admin-content">
        {loading && activeTab === 'dashboard' ? <LoadingSpinner /> : (
          <>
            {activeTab === 'dashboard' && <DashboardTab stats={stats} />}
            {activeTab === 'live' && <LiveQueuesTab />}
            {activeTab === 'all-staff' && <AllStaffTab />}
            {activeTab === 'create-staff' && <CreateStaffTab onCreated={() => setActiveTab('all-staff')} />}
            {activeTab === 'citizens' && <CitizensTab />}
            {activeTab === 'reports' && <ReportsTab />}
            {activeTab === 'settings' && <SettingsTab />}
            {activeTab.startsWith('center-') && <CenterTab centerType={activeTab.split('-')[1]} />}
          </>
        )}
      </main>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const DashboardTab = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="tab-content">
      <h2 className="page-title" style={{ marginBottom: '24px' }}>Dashboard Overview</h2>
      
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div className="section-title">Total Staff</div>
          <div style={{ fontSize: '28px', fontWeight: 600, marginTop: '8px' }}>{stats.totalStaff}</div>
        </div>
        <div className="card">
          <div className="section-title">Active Today</div>
          <div style={{ fontSize: '28px', fontWeight: 600, marginTop: '8px', color: 'var(--success)' }}>{stats.activeStaff}</div>
        </div>
        <div className="card">
          <div className="section-title">Tickets Today</div>
          <div style={{ fontSize: '28px', fontWeight: 600, marginTop: '8px' }}>{stats.totalTickets}</div>
        </div>
        <div className="card">
          <div className="section-title">Avg Wait Time</div>
          <div style={{ fontSize: '28px', fontWeight: 600, marginTop: '8px', color: 'var(--accent)' }}>{stats.avgWaitTime}m</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-title" style={{ marginBottom: '16px' }}>Ticket Volume by Hour</div>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.hourlyVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="hour" fontSize={11} tick={{fill: 'var(--text-3)'}} axisLine={false} tickLine={false} />
                <YAxis fontSize={11} tick={{fill: 'var(--text-3)'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--accent)' }}
                />
                <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="section-title" style={{ marginBottom: '16px' }}>Tickets by Service</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {stats.ticketsByService.map(service => (
              <div key={service.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span>{service.name}</span>
                  <span style={{ color: 'var(--text-3)' }}>{service.count}</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-2)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${(service.count / stats.totalTickets) * 100 || 0}%`, 
                    background: 'var(--accent)',
                    borderRadius: '3px'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const LiveQueuesTab = () => {
  const [centers, setCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [liveData, setLiveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => {
    const fetchCenters = async () => {
      const { data } = await api.get('/centers');
      setCenters(data);
      if (data.length > 0) setSelectedCenter(data[0]);
    };
    fetchCenters();
  }, []);

  useEffect(() => {
    if (selectedCenter) {
      fetchLive();
      socket?.on('queue:update', fetchLive);
      socket?.on('queue:called', fetchLive);
      return () => {
        socket?.off('queue:update', fetchLive);
        socket?.off('queue:called', fetchLive);
      };
    }
  }, [selectedCenter, socket]);

  const fetchLive = async () => {
    if (!selectedCenter) return;
    try {
      const { data } = await api.get(`/admin/centers/${selectedCenter.id}/live`);
      setLiveData(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="page-title">Live Monitoring</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {centers.map(c => (
            <button 
              key={c.id} 
              className={`btn btn-sm ${selectedCenter?.id === c.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSelectedCenter(c)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '12px', width: '100%' }} className="hide-scrollbar">
        {liveData.map(service => (
          <div key={service.id} style={{ minWidth: '300px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{service.name}</div>
              <div style={{ fontSize: '11px', background: 'var(--warning-dim)', color: 'var(--warning)', padding: '2px 8px', borderRadius: '4px' }}>
                {service.tickets.filter(t => t.status === 'WAITING').length} waiting
              </div>
            </div>

            <div className="card" style={{ padding: '12px', background: 'var(--bg-2)' }}>
              <div className="section-title" style={{ fontSize: '10px', marginBottom: '10px' }}>NOW SERVING / CALLED</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {service.tickets.filter(t => t.status === 'CALLED').map(t => (
                  <div key={t.id} style={{ padding: '10px', background: 'var(--accent-dim)', border: '1px solid var(--accent-dim-2)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between' }}>
                    <div className="mono" style={{ fontWeight: 600, color: 'var(--accent-2)' }}>{t.ticketNumber}</div>
                    <div style={{ fontSize: '12px' }}>{t.user.name}</div>
                  </div>
                ))}
                {service.tickets.filter(t => t.status === 'CALLED').length === 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--text-4)', textAlign: 'center', padding: '10px' }}>No active calls</div>
                )}
              </div>

              <div className="section-title" style={{ fontSize: '10px', margin: '16px 0 10px' }}>WAITING</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {service.tickets.filter(t => t.status === 'WAITING').map((t, idx) => (
                  <div key={t.id} style={{ padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="mono" style={{ fontSize: '13px', fontWeight: 500 }}>{t.ticketNumber}</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {t.isPriority && <span style={{ color: 'var(--success)', fontSize: '10px' }}>⭑</span>}
                      <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{Math.round((new Date() - new Date(t.createdAt)) / 60000)}m</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AllStaffTab = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data } = await api.get('/admin/staff');
      setStaff(data);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id) => {
    await api.patch(`/admin/staff/${id}/toggle-active`);
    fetchStaff();
  };

  return (
    <div className="tab-content">
      <h2 className="page-title" style={{ marginBottom: '24px' }}>Staff Members</h2>
      
      <div className="grid-3">
        {staff.map(s => (
          <div key={s.id} className="card">
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: s.staffCenter?.type === 'Bank' ? 'var(--info-dim)' : 'var(--success-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 600,
                color: s.staffCenter?.type === 'Bank' ? 'var(--info)' : 'var(--success)'
              }}>
                {s.name[0]}
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 500 }}>{s.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{s.phone}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
              <span className="btn btn-sm btn-ghost" style={{ fontSize: '10px', padding: '2px 8px' }}>{s.staffCenter?.name}</span>
              <span className="btn btn-sm btn-ghost" style={{ fontSize: '10px', padding: '2px 8px' }}>{s.assignedService?.name}</span>
            </div>

            <hr className="divider" style={{ marginBottom: '16px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{s.counterLabel || 'No Counter'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ 
                  width: '8px', height: '8px', borderRadius: '50%', 
                  background: (s.lastLoginAt && (new Date() - new Date(s.lastLoginAt) < 1800000)) ? 'var(--success)' : 'var(--text-4)' 
                }}></span>
                <button 
                  className={`btn btn-sm ${s.isActive ? 'btn-ghost' : 'btn-primary'}`}
                  onClick={() => toggleActive(s.id)}
                >
                  {s.isActive ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CreateStaffTab = ({ onCreated }) => {
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', password: '', 
    staffCenterId: '', serviceId: '', counterLabel: ''
  });
  const [centers, setCenters] = useState([]);
  const [services, setServices] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchCenters = async () => {
      const { data } = await api.get('/centers');
      setCenters(data);
    };
    fetchCenters();
  }, []);

  useEffect(() => {
    if (formData.staffCenterId) {
      const center = centers.find(c => c.id === formData.staffCenterId);
      setServices(center?.services || []);
    }
  }, [formData.staffCenterId, centers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/staff/create', formData);
      setSuccess(true);
      setTimeout(onCreated, 2000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create staff');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '48px', color: 'var(--success)', marginBottom: '16px' }}>✓</div>
        <h2>Account Created</h2>
        <p style={{ color: 'var(--text-3)' }}>Redirecting to staff list...</p>
      </div>
    );
  }

  return (
    <div className="tab-content" style={{ maxWidth: '800px' }}>
      <h2 className="page-title" style={{ marginBottom: '32px' }}>Create Staff Account</h2>
      <form onSubmit={handleSubmit} className="grid-2" style={{ gap: '24px' }}>
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="section-title" style={{ marginBottom: '20px' }}>Account Details</div>
          <div className="grid-2">
            <div className="field">
              <label className="label">Full Name</label>
              <input 
                className="input" 
                required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            <div className="field">
              <label className="label">Phone Number</label>
              <input 
                className="input" 
                required 
                placeholder="0911000000"
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
              />
            </div>
            <div className="field">
              <label className="label">Email (Login ID)</label>
              <input 
                type="email"
                className="input" 
                required
                placeholder="staff@example.com"
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
              />
            </div>
            <div className="field">
              <label className="label">Password</label>
              <input 
                type="password" 
                className="input" 
                required 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
              />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="label">Assigned Service Center</label>
              <select 
                className="input" 
                required 
                value={formData.staffCenterId} 
                onChange={e => setFormData({...formData, staffCenterId: e.target.value})}
              >
                <option value="">Select Center</option>
                {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Staff Account'}
          </button>
          <button type="button" className="btn btn-ghost btn-lg" onClick={() => onCreated()}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

const CitizensTab = () => {
  const [citizens, setCitizens] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCitizens = async () => {
      const { data } = await api.get(`/admin/users?role=CITIZEN&search=${search}`);
      setCitizens(data.users);
    };
    fetchCitizens();
  }, [search]);

  const togglePriority = async (id) => {
    await api.patch(`/admin/users/${id}/priority`);
    setSearch(search + ' '); // Trigger re-fetch
    setSearch(search);
  };

  return (
    <div className="tab-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="page-title">Citizen Accounts</h2>
        <input 
          className="input" 
          placeholder="Search by name or phone..." 
          style={{ maxWidth: '300px' }}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '16px 24px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '16px 24px', textAlign: 'left' }}>Phone</th>
              <th style={{ padding: '16px 24px', textAlign: 'left' }}>Priority</th>
              <th style={{ padding: '16px 24px', textAlign: 'left' }}>Registered</th>
              <th style={{ padding: '16px 24px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {citizens.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px 24px' }}>{c.name}</td>
                <td style={{ padding: '16px 24px' }} className="mono">{c.phone}</td>
                <td style={{ padding: '16px 24px' }}>
                  {c.isPriority ? <span style={{ color: 'var(--success)' }}>Yes</span> : 'No'}
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--text-3)' }}>
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => togglePriority(c.id)}>
                    Toggle Priority
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ReportsTab = () => <div>Reports coming soon... (Backend is ready)</div>;
const SettingsTab = () => <div>Settings coming soon...</div>;
const CenterTab = ({ centerType }) => <div>Live Center Specific View coming soon...</div>;

export default AdminPanel;
