import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const AdminPanel = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
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
        <div style={{ padding: '24px 20px 32px' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-2)', letterSpacing: '-0.5px' }}>CQAMS PANEL</div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, marginTop: '4px' }}>VERSION 2.4.0</div>
        </div>

        <div className="sidebar-header">INSIGHTS</div>
        <SidebarItem id="dashboard" icon="ti-layout-grid" label="Overview" />
        <SidebarItem id="live" icon="ti-activity-heartbeat" label="Real-time Monitor" />
        <SidebarItem id="reports" icon="ti-chart-dots" label="Analytics" />

        <div className="sidebar-header">MANAGEMENT</div>
        <SidebarItem id="all-staff" icon="ti-users" label="Personnel Directory" />
        <SidebarItem id="create-staff" icon="ti-user-plus" label="Provision Account" />

        <div className="sidebar-header">LOCATIONS</div>
        <SidebarItem id="center-cbe" icon="ti-building-bank" label="CBE Bank" />
        <SidebarItem id="center-telecom" icon="ti-device-mobile" label="Ethio Telecom" />
        <SidebarItem id="center-hospital" icon="ti-building-hospital" label="AM Hospital" />

        <div className="sidebar-header">PREFERENCES</div>
        <SidebarItem id="citizens" icon="ti-users-group" label="User Accounts" />
        <SidebarItem id="settings" icon="ti-settings" label="System Settings" />
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

  const deleteStaff = async (id) => {
    if (window.confirm('Are you sure you want to delete this personnel member?')) {
      await api.delete(`/admin/staff/${id}`);
      fetchStaff();
    }
  };

  const [editingStaff, setEditingStaff] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', phone: '', email: '', role: '', staffCenterId: '' });

  const startEdit = (s) => {
    setEditingStaff(s);
    setEditFormData({
      name: s.name,
      phone: s.phone,
      email: s.email || '',
      role: s.role,
      staffCenterId: s.staffCenterId || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/admin/staff/${editingStaff.id}`, editFormData);
      setEditingStaff(null);
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.error || 'Update failed');
    }
  };

  return (
    <div className="tab-content">
      <h2 className="page-title" style={{ marginBottom: '24px' }}>Personnel Members</h2>
      
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  width: '8px', height: '8px', borderRadius: '50%', 
                  background: (s.lastLoginAt && (new Date() - new Date(s.lastLoginAt) < 1800000)) ? 'var(--success)' : 'var(--text-4)' 
                }}></span>
                <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 500 }}>
                  {(s.lastLoginAt && (new Date() - new Date(s.lastLoginAt) < 1800000)) ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button className="btn btn-sm btn-ghost" onClick={() => startEdit(s)} style={{ fontSize: '11px', gap: '5px' }}>
                  <i className="ti ti-edit" style={{ fontSize: '13px' }}></i> Edit
                </button>
                <button className="btn btn-sm btn-danger-dim" onClick={() => deleteStaff(s.id)} style={{ fontSize: '11px', gap: '5px', color: 'var(--danger)' }}>
                  <i className="ti ti-trash" style={{ fontSize: '13px' }}></i> Delete
                </button>
                <button 
                  className={`btn btn-sm ${s.isActive ? 'btn-ghost' : 'btn-primary'}`}
                  onClick={() => toggleActive(s.id)}
                  style={{ fontSize: '11px' }}
                >
                  {s.isActive ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingStaff && (
        <div className="modal-overlay">
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Edit Personnel</h2>
            <form onSubmit={handleUpdate}>
              <div className="field">
                <label className="label">Full Name</label>
                <input 
                  type="text" className="input" required 
                  value={editFormData.name} 
                  onChange={e => setEditFormData({...editFormData, name: e.target.value})} 
                />
              </div>
              <div className="field">
                <label className="label">Phone</label>
                <input 
                  type="text" className="input" required 
                  value={editFormData.phone} 
                  onChange={e => setEditFormData({...editFormData, phone: e.target.value})} 
                />
              </div>
              <div className="field">
                <label className="label">Email</label>
                <input 
                  type="email" className="input" required 
                  value={editFormData.email} 
                  onChange={e => setEditFormData({...editFormData, email: e.target.value})} 
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditingStaff(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const CreateStaffTab = ({ onCreated }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', password: '', 
    staffCenterId: '', role: 'ADMIN'
  });
  const [centers, setCenters] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchCenters = async () => {
      const { data } = await api.get('/centers');
      setCenters(data);
    };
    fetchCenters();
  }, []);

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

const ReportsTab = () => (
  <div className="tab-content">
    <h2 className="page-title">Analytics & Reports</h2>
    <div className="grid-3" style={{ marginBottom: '24px' }}>
      <div className="card">
        <div className="section-title">Peak Hours</div>
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 600, color: 'var(--accent-2)' }}>10 AM - 1 PM</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '8px' }}>Based on last 7 days</div>
        </div>
      </div>
      <div className="card">
        <div className="section-title">Most Busy Service</div>
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 600, color: 'var(--info)' }}>Cash Withdrawal</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '8px' }}>CBE Bank Center</div>
        </div>
      </div>
      <div className="card">
        <div className="section-title">Efficiency Rate</div>
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 600, color: 'var(--success)' }}>94.2%</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '8px' }}>+2.1% from last month</div>
        </div>
      </div>
    </div>
    
    <div className="card" style={{ padding: '32px' }}>
      <div className="section-title" style={{ marginBottom: '20px' }}>Monthly Ticket Distribution</div>
      <div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-4)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius)' }}>
        Detailed Graph Analysis Visualization
      </div>
    </div>
  </div>
);

const SettingsTab = () => (
  <div className="tab-content">
    <h2 className="page-title">System Settings</h2>
    <div className="grid-2">
      <div className="card" style={{ padding: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>General Configuration</h3>
        <div className="field">
          <label className="label">System Identity Name</label>
          <input type="text" className="input" defaultValue="Arba Minch Citizen Queue Management" />
        </div>
        <div className="field">
          <label className="label">Primary Notification Email</label>
          <input type="email" className="input" defaultValue="admin@cqams.gov" />
        </div>
        <div style={{ marginTop: '32px' }}>
          <button className="btn btn-primary">Save Global Changes</button>
        </div>
      </div>
      
      <div className="card" style={{ padding: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>System Controls</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>Maintenance Mode</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Pause citizen registrations and bookings.</div>
            </div>
            <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: 'var(--bg-3)', position: 'relative', cursor: 'pointer' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--text-4)', position: 'absolute', top: '2px', left: '2px' }}></div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>Public Real-time Tracking</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Allow guests to view live center queues.</div>
            </div>
            <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: 'var(--success-dim)', position: 'relative', cursor: 'pointer' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--success)', position: 'absolute', top: '2px', right: '2px' }}></div>
            </div>
          </div>
          <div style={{ paddingTop: '16px', marginTop: '16px', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-danger-dim" style={{ width: '100%', color: 'var(--danger)' }}>Purge Historical Logs</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
const CenterTab = ({ centerType }) => <div>Live Center Specific View coming soon...</div>;

export default AdminPanel;
