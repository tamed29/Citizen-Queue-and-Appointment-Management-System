import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import QueueTicketCard from '../components/QueueTicketCard';
import StatusBadge from '../components/StatusBadge';

const MyTickets = () => {
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'tickets') {
          const { data } = await api.get('/queue/my');
          setTickets(data);
        } else {
          const { data } = await api.get('/appointments/my');
          setAppointments(data);
        }
      } catch (err) {
        console.error('Error fetching activity:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const handleCancelTicket = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this ticket?')) return;
    try {
      await api.delete(`/queue/${id}`);
      setTickets(tickets.filter(t => t.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel ticket');
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments(appointments.filter(a => a.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const Tab = ({ id, label }) => (
    <div 
      onClick={() => setActiveTab(id)}
      style={{ 
        padding: '10px 16px', 
        fontSize: '13px', 
        fontWeight: '500', 
        cursor: 'pointer',
        color: activeTab === id ? 'var(--text-1)' : 'var(--text-3)',
        borderBottom: activeTab === id ? '2px solid var(--accent)' : 'none',
        transition: 'all 0.15s ease'
      }}
    >
      {label}
    </div>
  );

  return (
    <div className="page">
      <h1 className="page-title" style={{ marginBottom: '24px' }}>My Queue Activity</h1>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
        <Tab id="tickets" label="Today's Tickets" />
        <Tab id="appointments" label="Appointments" />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : activeTab === 'tickets' ? (
        <div>
          {tickets.length > 0 ? (
            tickets.map(ticket => (
              <QueueTicketCard key={ticket.id} ticket={ticket} onCancel={handleCancelTicket} />
            ))
          ) : (
            <div className="empty-state">
              <h3>No tickets taken today</h3>
              <p>Take a queue number to get started.</p>
              <Link to="/queue/take" className="btn btn-primary" style={{ marginTop: '16px' }}>Take a Queue</Link>
            </div>
          )}
        </div>
      ) : (
        <div>
          {appointments.length > 0 ? (
            appointments.map(appointment => (
              <div key={appointment.id} className="card" style={{ display: 'flex', gap: '16px', marginBottom: '10px', alignItems: 'center' }}>
                <div style={{ 
                  minWidth: '60px', 
                  height: '60px', 
                  background: 'var(--surface-2)', 
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase' }}>
                    {new Date(appointment.scheduledAt).toLocaleDateString([], { month: 'short' })}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-1)' }}>
                    {new Date(appointment.scheduledAt).getDate()}
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-1)' }}>{appointment.service.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{appointment.service.center?.name || 'Service Center'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--accent-2)', fontWeight: '500', marginTop: '4px' }}>
                    {new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <StatusBadge status={appointment.status} />
                  {appointment.status === 'PENDING' && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleCancelAppointment(appointment.id)}>Cancel</button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <h3>No upcoming appointments</h3>
              <p>Book a slot to skip the waiting line.</p>
              <Link to="/appointments" className="btn btn-primary" style={{ marginTop: '16px' }}>Book Appointment</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyTickets;
