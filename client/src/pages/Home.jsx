import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import QueueTicketCard from '../components/QueueTicketCard';

const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

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
  }, [user.role]);

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
              icon="🎫" 
              to="/queue/take" 
              actionText="Take Ticket"
            />
            <ActionCard 
              title="Book Appointment" 
              desc="Schedule a visit for a specific date and time." 
              icon="📅" 
              to="/appointments" 
              actionText="Book Now"
            />
            <ActionCard 
              title="Track Live Queue" 
              desc="See real-time status and your current position." 
              icon="⚡" 
              to="/queue/track" 
              actionText="Track Live"
            />
            <ActionCard 
              title="My Tickets" 
              desc="View your history and active queue tickets." 
              icon="📋" 
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
              icon="🖥️" 
              to="/staff" 
              actionText="Open Dashboard"
            />
            <ActionCard 
              title="Track Live Queue" 
              desc="Monitor real-time queue status." 
              icon="⚡" 
              to="/queue/track" 
              actionText="Track Live"
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
                <QueueTicketCard key={ticket._id} ticket={ticket} />
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
