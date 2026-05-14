import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

const SuperAdminPanel = ({ activeTab: initialTab }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab || 'dashboard');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchStaff();
  }, []);

  const fetchStats = async () => {
    try {
      // For now using mock stats if endpoint not ready
      setStats({
        totalCenters: 4,
        totalStaff: 12,
        activeAdmins: 10,
        disabledAdmins: 2,
        todayAppointments: 24,
        totalQueues: 156
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data } = await api.get('/admin/staff');
      setStaff(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff admin?')) return;
    try {
      await api.delete(`/admin/staff/${id}`);
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete staff');
    }
  };

  const handleEditStaff = (staff) => {
    setEditingStaff(staff);
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="super-layout">
      {/* Sidebar */}
      <aside className="super-sidebar">
        <div className="sidebar-brand">
          <div className="brand-dot"></div>
          <span>CQAMS MASTER</span>
        </div>

        <nav className="sidebar-nav">
          <SidebarItem 
            id="dashboard" icon="ti-layout-dashboard" label="Dashboard" 
            active={activeTab === 'dashboard'} onClick={setActiveTab} 
          />
          <SidebarItem 
            id="staff" icon="ti-users" label="Manage Staff Admins" 
            active={activeTab === 'staff'} onClick={setActiveTab} 
          />
          <SidebarItem 
            id="reports" icon="ti-report-analytics" label="Reports" 
            active={activeTab === 'reports'} onClick={setActiveTab} 
          />
          <SidebarItem 
            id="settings" icon="ti-settings" label="Global Settings" 
            active={activeTab === 'settings'} onClick={setActiveTab} 
          />
        </nav>

        <div className="sidebar-footer" onClick={logout}>
          <i className="ti ti-logout"></i>
          <span>Logout Session</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="super-main">
        <header className="super-header">
          <div className="header-left">
            <h1 className="header-title">
              {activeTab === 'dashboard' && 'System Overview'}
              {activeTab === 'staff' && 'Administrative Personnel'}
              {activeTab === 'reports' && 'Global Analytics'}
              {activeTab === 'settings' && 'System Configuration'}
            </h1>
          </div>
          <div className="header-right">
            <div className="admin-profile">
              <div className="profile-info">
                <span className="profile-name">{user.name}</span>
                <span className="profile-role">Root Administrator</span>
              </div>
              <div className="profile-avatar">SA</div>
            </div>
          </div>
        </header>

        <div className="super-content">
          {activeTab === 'dashboard' && <DashboardView stats={stats} />}
          {activeTab === 'staff' && (
            <StaffManagementView 
              staff={staff} 
              onRefresh={fetchStaff} 
              onOpenModal={() => setShowCreateModal(true)} 
              onEdit={handleEditStaff}
              onDelete={handleDeleteStaff}
            />
          )}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'settings' && <SettingsView />}
        </div>
      </main>

      {showCreateModal && (
        <CreateStaffModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => { fetchStaff(); setShowCreateModal(false); }} 
        />
      )}

      {editingStaff && (
        <EditStaffModal 
          staff={editingStaff}
          onClose={() => setEditingStaff(null)} 
          onSuccess={() => { fetchStaff(); setEditingStaff(null); }} 
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .super-layout {
          display: flex;
          min-height: 100vh;
          background: #f8fafc;
          color: #1e293b;
        }

        /* Sidebar */
        .super-sidebar {
          width: 280px;
          background: #0f172a;
          color: #f8fafc;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
        }
        .sidebar-brand {
          padding: 32px 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 700;
          font-size: 18px;
          letter-spacing: -0.5px;
        }
        .brand-dot {
          width: 12px;
          height: 12px;
          background: #3b82f6;
          border-radius: 50%;
          box-shadow: 0 0 10px #3b82f6;
        }
        .sidebar-nav {
          flex: 1;
          padding: 0 16px;
        }
        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          color: #94a3b8;
          margin-bottom: 4px;
        }
        .sidebar-item:hover {
          background: rgba(255,255,255,0.05);
          color: #f8fafc;
        }
        .sidebar-item.active {
          background: #3b82f6;
          color: #fff;
        }
        .sidebar-item i {
          font-size: 20px;
        }
        .sidebar-footer {
          padding: 24px;
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          gap: 12px;
          color: #ef4444;
          cursor: pointer;
          font-weight: 600;
          transition: opacity 0.2s;
        }
        .sidebar-footer:hover {
          opacity: 0.8;
        }

        /* Main Content */
        .super-main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .super-header {
          height: 80px;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .header-title {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
        }
        .admin-profile {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .profile-info {
          text-align: right;
        }
        .profile-name {
          display: block;
          font-weight: 600;
          font-size: 14px;
        }
        .profile-role {
          display: block;
          font-size: 12px;
          color: #64748b;
        }
        .profile-avatar {
          width: 40px;
          height: 40px;
          background: #3b82f6;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          font-weight: 700;
          font-size: 14px;
        }

        .super-content {
          padding: 40px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        /* Stats Cards */
        .grid-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }
        .stat-card {
          background: #fff;
          padding: 24px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .stat-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #0f172a;
        }
        .stat-footer {
          font-size: 12px;
          color: #3b82f6;
          font-weight: 600;
        }

        /* View Sections */
        .card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 32px;
        }
        .table-container {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          text-align: left;
          padding: 16px;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          border-bottom: 1px solid #e2e8f0;
        }
        td {
          padding: 16px;
          font-size: 14px;
          border-bottom: 1px solid #f1f5f9;
        }
        .badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .badge-telecom { background: #dbeafe; color: #1e40af; }
        .badge-bank { background: #dcfce7; color: #166534; }
        .badge-hospital { background: #ffe4e6; color: #9f1239; }
        
        .action-btn {
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          background: transparent;
        }
        .action-btn:hover { background: #f1f5f9; }
        .action-btn.edit { color: #3b82f6; }
        .action-btn.delete { color: #ef4444; }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          background: #ffffff;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .modal-content .input {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #1e293b;
        }
        .modal-content .input:focus {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .modal-content .label {
          color: #64748b;
        }
        .modal-content .btn-ghost {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #475569;
        }
        .modal-content .btn-ghost:hover {
          background: #e2e8f0;
          color: #1e293b;
        }
      `}} />
    </div>
  );
};

const SidebarItem = ({ id, icon, label, active, onClick }) => (
  <div className={`sidebar-item ${active ? 'active' : ''}`} onClick={() => onClick(id)}>
    <i className={`ti ${icon}`}></i>
    <span>{label}</span>
  </div>
);

const DashboardView = ({ stats }) => (
  <>
    <div className="grid-stats">
      <StatCard label="Service Centers" value={stats.totalCenters} footer="+1 since last month" />
      <StatCard label="Total Staff Admins" value={stats.totalStaff} footer="3 pending approval" />
      <StatCard label="Active Admins" value={stats.activeAdmins} footer="91% system usage" />
      <StatCard label="Disabled Admins" value={stats.disabledAdmins} footer="Maintenance required" />
      <StatCard label="Today's Appointments" value={stats.todayAppointments} footer="Live tracking active" />
      <StatCard label="Total Queues" value={stats.totalQueues} footer="Across all branches" />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      <div className="card">
        <h3 style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 700 }}>Queue Activity by Service</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name: 'Telecom', value: 45 },
              { name: 'Bank', value: 52 },
              { name: 'Hospital', value: 38 },
              { name: 'Other', value: 24 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 700 }}>Appointments Trend</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[
              { name: 'Mon', value: 12 },
              { name: 'Tue', value: 19 },
              { name: 'Wed', value: 15 },
              { name: 'Thu', value: 22 },
              { name: 'Fri', value: 30 },
              { name: 'Sat', value: 10 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </>
);

const StatCard = ({ label, value, footer }) => (
  <div className="stat-card">
    <span className="stat-label">{label}</span>
    <span className="stat-value">{value}</span>
    <span className="stat-footer">{footer}</span>
  </div>
);

const StaffManagementView = ({ staff, onRefresh, onOpenModal, onEdit, onDelete }) => (
  <div className="card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Administrative Personnel</h3>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Manage all service center administrators across the platform.</p>
      </div>
      <button className="btn btn-primary" onClick={onOpenModal}>
        <i className="ti ti-user-plus"></i> Create Staff Admin
      </button>
    </div>

    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Service Type</th>
            <th>Service Center</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.length > 0 ? staff.map(s => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td style={{ color: '#64748b' }}>{s.email}</td>
              <td>
                <span className={`badge badge-${s.staffCenter?.type?.toLowerCase() || 'other'}`}>
                  {s.staffCenter?.type || 'Other'}
                </span>
              </td>
              <td style={{ fontWeight: 500 }}>{s.staffCenter?.name || 'N/A'}</td>
              <td>
                <span style={{ color: s.isActive ? '#10b981' : '#ef4444', fontWeight: 600, fontSize: '12px' }}>
                  {s.isActive ? '● Active' : '● Disabled'}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="action-btn edit" style={{ background: '#eff6ff', color: '#2563eb', fontWeight: 600, fontSize: '12px', padding: '6px 12px' }} onClick={() => onEdit(s)}>Edit</button>
                  <button className="action-btn delete" style={{ background: '#fef2f2', color: '#dc2626', fontWeight: 600, fontSize: '12px', padding: '6px 12px' }} onClick={() => onDelete(s.id)}>Delete</button>
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                No administrative accounts found. Create your first staff admin.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const CreateStaffModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', centerType: 'Telecom', centerName: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/staff/rebuild', formData); // New endpoint needed
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content card" style={{ width: '500px', padding: '40px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Create Staff Admin</h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '32px' }}>Provision a new administrative account and service center.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Full Name</label>
            <input 
              type="text" className="input" required 
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
            />
          </div>
          <div className="field">
            <label className="label">Email Address</label>
            <input 
              type="email" className="input" required 
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} 
            />
          </div>
          <div className="field">
            <label className="label">Access Password</label>
            <input 
              type="password" className="input" required 
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} 
            />
          </div>
          <div className="field">
            <label className="label">Service Center Type</label>
            <select 
              className="input" 
              value={formData.centerType} onChange={e => setFormData({...formData, centerType: e.target.value})}
            >
              <option value="Telecom">Telecom Center</option>
              <option value="Bank">Banking Institution</option>
              <option value="Hospital">Medical Center</option>
              <option value="Other">Custom Category</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Service Center Name</label>
            <input 
              type="text" className="input" required 
              value={formData.centerName} onChange={e => setFormData({...formData, centerName: e.target.value})} 
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Creating...' : 'Provision Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditStaffModal = ({ staff, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: staff.name, 
    email: staff.email, 
    password: '',
    centerType: staff.staffCenter?.type || 'Telecom', 
    centerName: staff.staffCenter?.name || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/admin/staff/${staff.id}`, formData);
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content card" style={{ width: '500px', padding: '40px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Edit Staff Admin</h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '32px' }}>Update the administrative account and service center details.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Full Name</label>
            <input 
              type="text" className="input" required 
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
            />
          </div>
          <div className="field">
            <label className="label">Email Address</label>
            <input 
              type="email" className="input" required 
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} 
            />
          </div>
          <div className="field">
            <label className="label">New Password (Optional)</label>
            <input 
              type="password" className="input" placeholder="Leave blank to keep current password"
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} 
            />
          </div>
          <div className="field">
            <label className="label">Service Center Type</label>
            <select 
              className="input" 
              value={formData.centerType} onChange={e => setFormData({...formData, centerType: e.target.value})}
            >
              <option value="Telecom">Telecom Center</option>
              <option value="Bank">Banking Institution</option>
              <option value="Hospital">Medical Center</option>
              <option value="Other">Custom Category</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Service Center Name</label>
            <input 
              type="text" className="input" required 
              value={formData.centerName} onChange={e => setFormData({...formData, centerName: e.target.value})} 
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ReportsView = () => <div className="card"><h1>Global Reports coming soon...</h1></div>;

const SettingsView = () => {
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return alert("New passwords do not match.");
    }
    setLoading(true);
    try {
      await api.patch('/auth/update-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      alert('Password updated successfully!');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>System Configuration</h3>
      
      <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#334155', marginBottom: '16px' }}>Update Admin Password</h4>
        <form onSubmit={handlePasswordUpdate}>
          <div className="field" style={{ marginBottom: '16px' }}>
            <label className="label" style={{ color: '#64748b' }}>Current Password</label>
            <input type="password" required
              style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '6px', width: '100%' }}
              value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} 
            />
          </div>
          <div className="field" style={{ marginBottom: '16px' }}>
            <label className="label" style={{ color: '#64748b' }}>New Password</label>
            <input type="password" required minLength="6"
              style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '6px', width: '100%' }}
              value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} 
            />
          </div>
          <div className="field" style={{ marginBottom: '24px' }}>
            <label className="label" style={{ color: '#64748b' }}>Confirm New Password</label>
            <input type="password" required minLength="6"
              style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '6px', width: '100%' }}
              value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} 
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminPanel;
