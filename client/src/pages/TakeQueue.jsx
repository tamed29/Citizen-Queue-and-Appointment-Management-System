import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import DatePicker from '../components/DatePicker';

const TakeQueue = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();
  const [step, setStep] = useState(1);
  const [centers, setCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState(0);

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

  const toDateStr = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (step === 5 && ticket && socket) {
      socket.emit('join:service', ticket.service.id);
      socket.on('queue:update', fetchQueuePosition);
      return () => {
        socket.emit('leave:service', ticket.service.id);
        socket.off('queue:update', fetchQueuePosition);
      };
    }
  }, [step, ticket, socket]);

  const fetchQueuePosition = async () => {
    if (!ticket) return;
    try {
      const { data } = await api.get(`/queue/ticket/${ticket.id}/position`);
      setPosition(data.position);
    } catch (err) {
      console.error('Error fetching position:', err);
    }
  };

  const handleTakeTicket = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post('/queue/take', { 
        serviceId: selectedService.id,
        date: toDateStr(selectedDate)
      });
      setTicket(data);
      setPosition(data.position || 1); 
      setStep(5);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to take ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const StepItem = ({ num, label, active, done }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ 
        width: '22px', 
        height: '22px', 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '11px',
        fontWeight: '600',
        background: active ? 'var(--accent)' : done ? 'var(--success-dim)' : 'rgba(255,255,255,.06)',
        color: active ? 'white' : done ? 'var(--success)' : 'var(--text-3)',
      }}>
        {done ? '✓' : num}
      </div>
      <div style={{ 
        fontSize: '13px', 
        fontWeight: active ? '500' : '400',
        color: active ? 'var(--text-1)' : 'var(--text-4)'
      }} className="hide-on-mobile">{label}</div>
    </div>
  );

  return (
    <div className="page-full">
      {step < 5 && (
        <div style={{ 
          position: 'sticky', top: '56px', zIndex: 90, background: 'var(--bg-2)', 
          borderBottom: '1px solid var(--border)', padding: '16px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px'
        }} className="step-bar">
          <StepItem num="1" label="Center" active={step === 1} done={step > 1} />
          <div style={{ width: '30px', height: '1px', background: 'var(--border)' }} />
          <StepItem num="2" label="Service" active={step === 2} done={step > 2} />
          <div style={{ width: '30px', height: '1px', background: 'var(--border)' }} />
          <StepItem num="3" label="Date" active={step === 3} done={step > 3} />
          <div style={{ width: '30px', height: '1px', background: 'var(--border)' }} />
          <StepItem num="4" label="Confirm" active={step === 4} done={step > 4} />
        </div>
      )}

      <div className="page">
        {step === 1 && (
          <section>
            <div className="eyebrow" style={{ marginBottom: '8px' }}>Step 1 of 4</div>
            <h2 className="page-title" style={{ marginBottom: '4px' }}>Where do you need service?</h2>
            <p style={{ color: 'var(--text-2)', marginBottom: '32px' }}>Choose the service center you want to visit</p>
            <div className="grid-3">
              {centers.map(center => (
                <div 
                  key={center.id} 
                  className={`card-interactive ${selectedCenter?.id === center.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCenter(center)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px',
                      textTransform: 'uppercase',
                      background: center.type === 'Bank' ? 'var(--info-dim)' : center.type === 'Telecom' ? 'var(--success-dim)' : center.type === 'Hospital' ? 'var(--warning-dim)' : 'rgba(255,255,255,.05)',
                      color: center.type === 'Bank' ? 'var(--info)' : center.type === 'Telecom' ? 'var(--success)' : center.type === 'Hospital' ? 'var(--warning)' : 'var(--text-2)'
                    }}>
                      {center.type}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>{center.services?.length || 0} services</span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 500, marginTop: '12px', marginBottom: '4px' }}>{center.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '12px' }}>{center.location}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-lg" disabled={!selectedCenter} onClick={() => setStep(2)}>Next Step →</button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px', fontSize: '13px', color: 'var(--text-3)' }}>
              <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0 }}>← Back</button>
              <span>/</span><span>{selectedCenter.name}</span>
            </div>
            <div className="eyebrow" style={{ marginBottom: '8px' }}>Step 2 of 4</div>
            <h2 className="page-title" style={{ marginBottom: '4px' }}>What do you need help with?</h2>
            <p style={{ color: 'var(--text-2)', marginBottom: '32px' }}>Services at {selectedCenter.name}</p>
            <div className="grid-2">
              {selectedCenter.services.map(service => (
                <div 
                  key={service.id} 
                  className={`card-interactive ${selectedService?.id === service.id ? 'selected' : ''}`}
                  onClick={() => setSelectedService(service)}
                >
                  <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '5px' }}>{service.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>~{service.avgDurationMin} min per person</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-lg" disabled={!selectedService} onClick={() => setStep(3)}>Next Step →</button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px', fontSize: '13px', color: 'var(--text-3)' }}>
              <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0 }}>← Back</button>
              <span>/</span><span>{selectedService.name}</span>
            </div>
            <div className="eyebrow" style={{ marginBottom: '8px' }}>Step 3 of 4</div>
            <h2 className="page-title" style={{ marginBottom: '32px' }}>When are you visiting?</h2>
            
            <div style={{ maxWidth: '400px' }}>
              <DatePicker 
                selectedDate={selectedDate} 
                onSelectDate={setSelectedDate}
                label="Select Visit Date"
                maxDays={7}
              />
            </div>

            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-lg" disabled={!selectedDate} onClick={() => setStep(4)}>Continue to Confirm →</button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px', fontSize: '13px', color: 'var(--text-3)' }}>
              <button onClick={() => setStep(3)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0 }}>← Back</button>
            </div>
            <div className="eyebrow" style={{ marginBottom: '8px' }}>Step 4 of 4</div>
            <h2 className="page-title" style={{ marginBottom: '24px' }}>Ready to take your ticket?</h2>
            <div className="card" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div className="label">Service Center</div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedCenter.name}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div className="label">Service</div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedService.name}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div className="label">Visit Date</div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedDate?.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              </div>
              {user.isPriority && (
                <div style={{ marginTop: '20px', padding: '12px 14px', background: 'var(--success-dim)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: 'var(--radius)', color: 'var(--success)', fontSize: '13px' }}>
                  ⭑ You have priority access. You will be served before regular customers.
                </div>
              )}
            </div>
            <button className="btn btn-primary btn-lg btn-full" disabled={submitting} onClick={handleTakeTicket}>
              {submitting ? 'Generating Ticket...' : 'Confirm & Take Ticket'}
            </button>
          </section>
        )}

        {step === 5 && ticket && (
          <section style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <div className="eyebrow" style={{ color: 'var(--success)', marginBottom: '16px' }}>✓ You're in the queue</div>
            <h2 className="page-title" style={{ marginBottom: '4px' }}>Your Ticket Is Ready</h2>
            <p style={{ color: 'var(--text-2)', marginBottom: '28px' }}>Track your position below. We'll keep you updated.</p>
            <div className="card" style={{ border: '1px solid rgba(99,102,241,0.25)', borderRadius: 'var(--radius-xl)', padding: '28px', textAlign: 'left', display: 'flex', gap: '28px' }} className="flex-mobile-column">
              <div style={{ minWidth: '120px' }}>
                <div className="section-title" style={{ marginBottom: '6px' }}>TICKET NUMBER</div>
                <div style={{ fontSize: '52px', fontWeight: 600, color: 'var(--accent)', fontFamily: "'DM Mono', monospace", letterSpacing: '-1px', lineHeight: 1 }}>{ticket.ticketNumber}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '12px' }}><StatusBadge status="WAITING" /></div>
                <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '3px' }}>{ticket.service.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '16px' }}>{selectedCenter.name}</div>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div><div className="label" style={{ marginBottom: '4px' }}>POSITION</div><div style={{ fontSize: '15px', fontWeight: 500 }}>#{position}</div></div>
                  <div><div className="label" style={{ marginBottom: '4px' }}>EST. WAIT</div><div style={{ fontSize: '15px', fontWeight: 500 }}>~{position * selectedService.avgDurationMin}m</div></div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '32px', display: 'flex', gap: '10px', justifyContent: 'center' }} className="flex-mobile-column">
              <Link to="/queue/track" className="btn btn-primary">Track Live Queue</Link>
              <Link to="/tickets" className="btn btn-ghost">View My Tickets</Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default TakeQueue;
