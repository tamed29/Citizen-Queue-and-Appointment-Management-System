import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

const TrackQueue = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [centers, setCenters] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCenter, setExpandedCenter] = useState(null);

  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const { data } = await api.get('/centers');
        setCenters(data);
      } catch (err) {
        console.error('Error fetching centers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCenters();
  }, []);

  const fetchQueue = async (serviceId) => {
    try {
      const { data } = await api.get(`/queue/service/${serviceId}`);
      setQueue(data);
    } catch (err) {
      console.error('Error fetching queue:', err);
    }
  };

  useEffect(() => {
    if (selectedService && socket) {
      fetchQueue(selectedService._id);
      socket.emit('join:service', selectedService._id);

      const handleUpdate = () => fetchQueue(selectedService._id);
      
      socket.on('queue:update', handleUpdate);
      socket.on('queue:called', handleUpdate);

      return () => {
        socket.emit('leave:service', selectedService._id);
        socket.off('queue:update', handleUpdate);
        socket.off('queue:called', handleUpdate);
      };
    }
  }, [selectedService, socket]);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>
      {/* Left Sidebar */}
      <div style={{ 
        width: '300px', 
        background: 'var(--bg-2)', 
        borderRight: '1px solid var(--border)', 
        padding: '20px',
        flexShrink: 0,
        overflowY: 'auto'
      }}>
        <h1 className="page-title" style={{ fontSize: '18px', marginBottom: '4px' }}>Track Queue</h1>
        <p style={{ color: 'var(--text-3)', fontSize: '13px', marginBottom: '20px' }}>Select a service to see live updates</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {centers.map(center => (
            <div key={center.id}>
              <div 
                onClick={() => setExpandedCenter(expandedCenter === center.id ? null : center.id)}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: 'var(--radius)', 
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: expandedCenter === center.id ? 'rgba(255,255,255,.03)' : 'transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-2)' }}>{center.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-4)', transform: expandedCenter === center.id ? 'rotate(180deg)' : 'none' }}>▼</div>
              </div>
              
              {expandedCenter === center.id && (
                <div style={{ paddingLeft: '12px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {center.services.map(service => (
                    <div 
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      style={{ 
                        padding: '6px 12px', 
                        fontSize: '13px', 
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-sm)',
                        color: selectedService?.id === service.id ? 'var(--accent-2)' : 'var(--text-3)',
                        fontWeight: selectedService?.id === service.id ? '500' : '400',
                        background: selectedService?.id === service.id ? 'var(--accent-dim)' : 'transparent'
                      }}
                    >
                      · {service.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {!selectedService ? (
          <div className="empty-state" style={{ marginTop: '80px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
            <h3>No service selected</h3>
            <p>Select a service from the left panel to track its live queue.</p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-1)' }}>{selectedService.name}</h2>
                <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>{centers.find(c => c.id === selectedService.center || c.id === selectedService.centerId)?.name}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <div className="live-dot">LIVE</div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{queue.filter(t => t.status === 'WAITING').length} people waiting</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {queue.length > 0 ? queue.map((ticket, index) => {
                const isMe = ticket.userId === user.id || ticket.user?.id === user.id;
                return (
                  <div 
                    key={ticket.id || `ticket-${index}`}
                    className="card"
                    style={{ 
                      padding: '10px 14px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      background: ticket.isPriority ? 'rgba(99,102,241,0.05)' : 'var(--surface)',
                      border: ticket.isPriority ? '1px solid rgba(99,102,241,0.12)' : '1px solid var(--border)',
                      borderLeft: isMe ? '2px solid var(--accent)' : (ticket.isPriority ? '1px solid rgba(99,102,241,0.12)' : '1px solid var(--border)')
                    }}
                  >
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', minWidth: '24px' }}>#{index + 1}</div>
                    <div className="mono" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-1)', minWidth: '80px' }}>{ticket.ticketNumber}</div>
                    <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-2)' }}>
                      {ticket.user?.name?.split(' ').map((n, i) => i === 0 ? n : '***').join(' ')}
                    </div>
                    {ticket.isPriority && <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--accent-2)' }}>⭑ PRIORITY</div>}
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>~{index * selectedService.avgDuration}m</div>
                    <StatusBadge status={ticket.status} />
                  </div>
                );
              }) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                  Queue is currently empty.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackQueue;
