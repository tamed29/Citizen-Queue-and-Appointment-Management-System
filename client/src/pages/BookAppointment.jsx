import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import DatePicker from '../components/DatePicker';

// Helper functions
function formatDate(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function formatTime(time) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

function toDateStr(date) {
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const LegendItem = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }}></div>
    <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>{label}</span>
  </div>
);

// MAIN COMPONENT
const BookAppointment = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [centers, setCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsCache, setSlotsCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);

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

  const fetchSlots = async (serviceId, date) => {
    const dateStr = toDateStr(date);
    if (slotsCache[dateStr]) {
      setSlots(slotsCache[dateStr]);
      return;
    }
    setLoadingSlots(true);
    try {
      const res = await api.get(`/appointments/slots?serviceId=${serviceId}&date=${dateStr}`);
      setSlots(res.data);
      setSlotsCache(prev => ({ ...prev, [dateStr]: res.data }));
    } catch (err) {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBook = async () => {
    setSubmitting(true);
    try {
      await api.post('/appointments/book', {
        serviceId: selectedService.id,
        date: toDateStr(selectedDate),
        time: selectedTime
      });
      setBooked(true);
      setStep(4);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const resetSelection = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setSlots([]);
    setSlotsCache({});
  };

  if (loading) return <LoadingSpinner fullPage />;

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
      {!booked && (
        <div style={{ 
          position: 'sticky', 
          top: '56px', 
          zIndex: 90, 
          background: 'var(--bg-2)', 
          borderBottom: '1px solid var(--border)', 
          padding: '16px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          overflowX: 'auto'
        }} className="hide-scrollbar">
          <StepItem num="1" label="Center" active={step === 1} done={step > 1} />
          <div style={{ minWidth: '20px', height: '1px', background: 'var(--border)' }} />
          <StepItem num="2" label="Service" active={step === 2} done={step > 2} />
          <div style={{ minWidth: '20px', height: '1px', background: 'var(--border)' }} />
          <StepItem num="3" label="Time" active={step === 3} done={step > 3} />
          <div style={{ minWidth: '20px', height: '1px', background: 'var(--border)' }} />
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
                  onClick={() => {
                    setSelectedCenter(center);
                    setSelectedService(null);
                    resetSelection();
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '10px', 
                      fontWeight: '600', 
                      padding: '2px 8px', 
                      borderRadius: '4px',
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
              <button className="btn btn-primary btn-lg" disabled={!selectedCenter} onClick={() => setStep(2)}>
                Continue → Choose Service
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px', fontSize: '13px', color: 'var(--text-3)' }}>
              <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0 }}>← Back</button>
              <span>/</span>
              <span>{selectedCenter.name}</span>
            </div>

            <div className="eyebrow" style={{ marginBottom: '8px' }}>Step 2 of 4</div>
            <h2 className="page-title" style={{ marginBottom: '4px' }}>What do you need help with?</h2>
            <p style={{ color: 'var(--text-2)', marginBottom: '32px' }}>Services at {selectedCenter.name}</p>

            <div className="grid-2">
              {selectedCenter.services.map(service => (
                <div 
                  key={service.id} 
                  className={`card-interactive ${selectedService?.id === service.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedService(service);
                    resetSelection();
                  }}
                >
                  <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '5px' }}>{service.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>~{service.avgDurationMin} min per person</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-lg" disabled={!selectedService} onClick={() => setStep(3)}>
                Continue → Pick Time
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <div className="eyebrow" style={{ marginBottom: '8px' }}>Step 3 of 4</div>
            <h2 className="page-title" style={{ marginBottom: '24px' }}>When would you like to come?</h2>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 280px', 
              gap: 24 
            }} className="flex-mobile-column">
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card" style={{ padding: '24px' }}>
                  <DatePicker 
                    selectedDate={selectedDate}
                    onSelectDate={date => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                      if (date) fetchSlots(selectedService.id, date);
                    }}
                    label="Choose Appointment Date"
                    maxDays={30}
                  />
                </div>

                {selectedDate && (
                  <div className="card" style={{ padding: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(237,237,245,0.28)', marginBottom: 14 }}>
                      Available time slots — {formatDate(selectedDate)}
                    </div>

                    {loadingSlots ? (
                      <LoadingSpinner />
                    ) : slots.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(237,237,245,0.3)', fontSize: 13 }}>
                        No slots available for this date
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                        {slots.map(slot => {
                          const isFull = slot.remaining === 0;
                          const isSelected = selectedTime === slot.time;
                          return (
                            <div
                              key={slot.time}
                              onClick={() => !isFull && setSelectedTime(slot.time)}
                              style={{
                                padding: '10px 8px',
                                borderRadius: 8,
                                border: `1px solid ${isSelected ? '#6366f1' : isFull ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)'}`,
                                background: isSelected ? '#6366f1' : 'transparent',
                                textAlign: 'center',
                                cursor: isFull ? 'not-allowed' : 'pointer',
                                opacity: isFull ? 0.3 : 1,
                                transition: 'all 0.15s',
                              }}
                            >
                              <div style={{ fontSize: 13, fontWeight: 500, color: isSelected ? '#fff' : isFull ? 'rgba(237,237,245,0.35)' : '#ededf5', marginBottom: 3 }}>
                                {formatTime(slot.time)}
                              </div>
                              <div style={{ fontSize: 11, color: isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(237,237,245,0.35)' }}>
                                {isFull ? 'Full' : `${slot.remaining} spot${slot.remaining !== 1 ? 's' : ''} left`}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="card" style={{ padding: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'rgba(237,237,245,0.28)', marginBottom: 14 }}>
                    Your Selection
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div className="label" style={{ marginBottom: 3 }}>CENTER</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#ededf5' }}>{selectedCenter?.name}</div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div className="label" style={{ marginBottom: 3 }}>SERVICE</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#ededf5' }}>{selectedService?.name}</div>
                  </div>

                  {selectedDate && (
                    <>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 0 12px' }} />
                      <div style={{ marginBottom: 12 }}>
                        <div className="label" style={{ marginBottom: 3 }}>DATE</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#818cf8' }}>{formatDate(selectedDate)}</div>
                      </div>
                    </>
                  )}

                  {selectedTime && (
                    <div style={{ marginBottom: 12 }}>
                      <div className="label" style={{ marginBottom: 3 }}>TIME</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#818cf8' }}>{formatTime(selectedTime)}</div>
                    </div>
                  )}

                  {selectedService && (
                    <>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 0 12px' }} />
                      <div style={{ marginBottom: 14 }}>
                        <div className="label" style={{ marginBottom: 3 }}>DURATION</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#ededf5' }}>~{selectedService.avgDurationMin} minutes</div>
                      </div>
                    </>
                  )}

                  <button
                    disabled={!selectedDate || !selectedTime}
                    onClick={() => setStep(4)}
                    style={{
                      width: '100%',
                      background: (!selectedDate || !selectedTime) ? 'rgba(99,102,241,0.3)' : '#6366f1',
                      color: '#fff',
                      border: 'none',
                      padding: '10px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: (!selectedDate || !selectedTime) ? 'not-allowed' : 'pointer',
                      fontFamily: 'DM Sans, sans-serif',
                      opacity: (!selectedDate || !selectedTime) ? 0.5 : 1,
                    }}
                  >
                    Continue → Confirm
                  </button>

                  {(!selectedDate || !selectedTime) && (
                    <div style={{ fontSize: 11, color: 'rgba(237,237,245,0.3)', textAlign: 'center', marginTop: 8 }}>
                      {!selectedDate ? 'Select a date to continue' : 'Select a time slot to continue'}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </section>
        )}

        {step === 4 && (
          <section style={{ maxWidth: '600px', margin: '0 auto' }}>
            {!booked ? (
              <>
                <div className="eyebrow" style={{ marginBottom: '8px' }}>Step 4 of 4</div>
                <h2 className="page-title" style={{ marginBottom: '24px' }}>Confirm your booking</h2>

                <div className="card" style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div className="label">Center</div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedCenter.name}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div className="label">Service</div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedService.name}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div className="label">Date</div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{formatDate(selectedDate)}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div className="label">Time</div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{formatTime(selectedTime)}</div>
                    </div>
                  </div>
                </div>

                <button 
                  className="btn btn-primary btn-lg btn-full"
                  disabled={submitting}
                  onClick={handleBook}
                >
                  {submitting ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                <div className="eyebrow" style={{ color: 'var(--success)', marginBottom: '12px' }}>Booking Confirmed</div>
                <h2 className="page-title" style={{ marginBottom: '8px' }}>Your appointment is set</h2>
                <p style={{ color: 'var(--text-2)', marginBottom: '32px' }}>We've reserved your spot at {selectedCenter.name}.</p>

                <div className="card" style={{ textAlign: 'left', border: '1px solid var(--success-dim)', marginBottom: '32px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '4px' }}>{selectedService.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>{selectedCenter.name}</div>
                  <hr className="divider" style={{ margin: '16px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>{formatDate(selectedDate)}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-2)' }}>{formatTime(selectedTime)}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button className="btn btn-primary" onClick={() => { setBooked(false); setStep(1); setSelectedCenter(null); setSelectedService(null); resetSelection(); }}>Book Another</button>
                  <Link to="/tickets" className="btn btn-ghost">View My Appointments</Link>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default BookAppointment;
