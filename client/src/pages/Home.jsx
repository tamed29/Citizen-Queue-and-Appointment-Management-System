import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import QueueTicketCard from '../components/QueueTicketCard';

const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  if (user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN')) {
    return <Navigate to="/admin" replace />;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ticketsRes] = await Promise.all([
          api.get('/admin/stats'),
          user.role === 'CITIZEN' ? api.get('/queue/my') : Promise.resolve({ data: [] })
        ]);
        setStats(statsRes.data);
        setTickets(ticketsRes.data.slice(0, 3));
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.role]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return <LoadingSpinner fullPage />;

  const ActionCard = ({ title, desc, icon, to, actionText }) => (
    <Link to={to} className="card-interactive" style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ 
        width: '38px', 
        height: '38px', 
        background: 'var(--accent-dim)', 
        borderRadius: 'var(--radius)', 
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        color: 'var(--accent-2)'
      }}>
        {icon}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-1)', marginBottom: '5px' }}>{title}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5 }}>{desc}</div>
      <div style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '10px', fontWeight: 500 }}>
        → {actionText}
      </div>
    </Link>
  );

  return (
    <div className="page">
      {/* Header section */}
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>
          {getGreeting()}, {user.name.split(' ')[0]}
        </h1>
        <div style={{ color: 'var(--text-2)', marginBottom: '24px' }}>Here's what's happening today.</div>

        <div className="grid-3">
          <div className="card" style={{ padding: '20px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '-0.5px', marginBottom: '4px' }}>
              {stats?.totalToday || 0}
            </div>
            <div className="section-title">Tickets Issued Today</div>
          </div>
          <div className="card" style={{ padding: '20px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '-0.5px', marginBottom: '4px' }}>
              {stats?.activeCenters || 3}
            </div>
            <div className="section-title">Active Centers</div>
          </div>
          <div className="card" style={{ padding: '20px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '-0.5px', marginBottom: '4px' }}>
              {stats?.avgWaitTime || 0}m
            </div>
            <div className="section-title">Avg Wait Time</div>
          </div>
        </div>
      </header>

      {/* Action Cards */}
      <section style={{ marginTop: '32px' }}>
        <div className="section-title" style={{ marginBottom: '16px' }}>Quick Actions</div>
        
        {user.role === 'CITIZEN' && (
          <div className="grid-4">
            <ActionCard 
              title="Take a Queue" 
              desc="Get a virtual ticket for any service center." 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.7.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4"/><path d="M2 9h20"/></svg>} 
              to="/queue/take" 
              actionText="Take Ticket"
            />
            <ActionCard 
              title="Book Appointment" 
              desc="Schedule a visit for a specific date and time." 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} 
              to="/appointments" 
              actionText="Book Now"
            />
            <ActionCard 
              title="Track Live Queue" 
              desc="See real-time status and your current position." 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>} 
              to="/queue/track" 
              actionText="Track Live"
            />
            <ActionCard 
              title="My Tickets" 
              desc="View your history and active queue tickets." 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>} 
              to="/tickets" 
              actionText="View All"
            />
          </div>
        )}

        {user.role === 'STAFF' && (
          <div className="grid-2">
            <ActionCard 
              title="Staff Dashboard" 
              desc="Manage your counter and call customers." 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y2="21" x2="16" y1="21"/><line x1="12" y2="17" x2="12" y1="21"/></svg>} 
              to="/staff" 
              actionText="Open Dashboard"
            />
            <ActionCard 
              title="Track Live Queue" 
              desc="Monitor real-time queue status." 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>} 
              to="/queue/track" 
              actionText="Track Live"
            />
          </div>
        )}

        {user.role === 'SUPER_ADMIN' && (
          <div className="grid-4" style={{ marginBottom: '32px' }}>
            <ActionCard 
              title="Super Admin Panel" 
              desc="Full control over users, centers, and system." 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>} 
              to="/admin" 
              actionText="Manage System"
            />
            <ActionCard 
              title="Staff Dashboard" 
              desc="Monitor counters and call customers." 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y2="21" x2="16" y1="21"/><line x1="12" y2="17" x2="12" y1="21"/></svg>} 
              to="/staff" 
              actionText="Open Dashboard"
            />
            <ActionCard 
              title="Track Live Queue" 
              desc="Monitor real-time queue status." 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>} 
              to="/queue/track" 
              actionText="Track Live"
            />
             <ActionCard 
              title="Citizens" 
              desc="Manage citizen accounts and priority." 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} 
              to="/admin" 
              actionText="Manage"
            />
          </div>
        )}

        {user.role === 'ADMIN' && (
          <div className="grid-4">
            <ActionCard 
              title="Admin Panel" 
              desc="Manage users, centers, and system settings." 
              icon="⚙️" 
              to="/admin" 
              actionText="Open Panel"
            />
            <ActionCard 
              title="Staff Dashboard" 
              desc="Manage counters and call customers." 
              icon="🖥️" 
              to="/staff" 
              actionText="Open Dashboard"
            />
            <ActionCard 
              title="Track Queue" 
              desc="Monitor real-time queue status." 
              icon="⚡" 
              to="/queue/track" 
              actionText="Track Live"
            />
            <ActionCard 
              title="Service Centers" 
              desc="Manage centers and services." 
              icon="🏦" 
              to="/admin" 
              actionText="Manage"
            />
          </div>
        )}
      </section>

      {/* Today's Tickets - CITIZEN only */}
      {user.role === 'CITIZEN' && (
        <section style={{ marginTop: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div className="section-title">Your Tickets Today</div>
            <Link to="/tickets" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              View All →
            </Link>
          </div>

          {tickets.length > 0 ? (
            <div>
              {tickets.map(ticket => (
                <QueueTicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No tickets taken today</h3>
              <p>When you take a queue number, it will appear here.</p>
              <Link to="/queue/take" className="btn btn-primary" style={{ marginTop: '16px' }}>Take a Queue</Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Home;
