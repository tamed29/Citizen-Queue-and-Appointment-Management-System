import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, Landmark, HeartPulse, FileText, 
  ChevronRight, MapPin, Clock, Calendar as CalendarIcon, 
  User, Phone, Hash, CheckCircle, ArrowLeft, Ticket 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

const centerTypes = [
  { id: 'Telecom', icon: Building2, color: 'bg-blue-600', text: 'text-blue-600', bgLight: 'bg-blue-50', label: 'Telecom', desc: 'Ethio Telecom & Internet Services' },
  { id: 'Bank', icon: Landmark, color: 'bg-green-600', text: 'text-green-600', bgLight: 'bg-green-50', label: 'Bank', desc: 'Commercial Banks & Finance' },
  { id: 'Hospital', icon: HeartPulse, color: 'bg-rose-600', text: 'text-rose-600', bgLight: 'bg-rose-50', label: 'Hospital', desc: 'Health Centers & Clinics' },
  { id: 'Other', icon: FileText, color: 'bg-purple-600', text: 'text-purple-600', bgLight: 'bg-purple-50', label: 'Other', desc: 'Government & Utility Offices' }
];

export default function PublicBooking() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Selections
  const [selectedType, setSelectedType] = useState(null);
  const [centers, setCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  
  // Flow Type
  const [flowType, setFlowType] = useState(null); // 'QUEUE' or 'APPOINTMENT'

  // Form Data (Prefilled from user)
  const [formData, setFormData] = useState({ 
    name: user?.name || '', 
    phone: user?.phone || '', 
    idNumber: '', 
    notes: '' 
  });
  
  // Appointment Data
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Results
  const [ticketResult, setTicketResult] = useState(null);

  // Fetch Centers when Type is selected
  useEffect(() => {
    if (step === 2 && selectedType) {
      setLoading(true);
      api.get(`/centers?type=${selectedType}`)
        .then(res => setCenters(res.data))
        .catch(err => setError('Failed to load centers'))
        .finally(() => setLoading(false));
    }
  }, [step, selectedType]);

  // Fetch Slots when Date/Service is selected for Appointment
  useEffect(() => {
    if (step === 5 && flowType === 'APPOINTMENT' && selectedService && selectedDate) {
      setLoading(true);
      api.get(`/queue/public/slots?serviceId=${selectedService.id}&date=${selectedDate}`)
        .then(res => setTimeSlots(res.data))
        .catch(err => setError('Failed to load time slots'))
        .finally(() => setLoading(false));
    }
  }, [step, flowType, selectedService, selectedDate]);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => {
    setError('');
    if (step === 6) { setStep(4); setTicketResult(null); }
    else if (step > 1) setStep(s => s - 1);
  };

  const handleJoinQueue = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/queue/my/join', {
        serviceId: selectedService.id,
        customerName: formData.name,
        phone: formData.phone,
        idNumber: formData.idNumber
      });
      setTicketResult({ type: 'QUEUE', data: res.data });
      setStep(6);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join queue');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return setError('Please select a time slot');
    setLoading(true); setError('');
    try {
      const res = await api.post('/queue/my/appointments/book', {
        serviceId: selectedService.id,
        customerName: formData.name,
        phone: formData.phone,
        idNumber: formData.idNumber,
        scheduledDate: selectedDate,
        scheduledTime: selectedSlot.startTime,
        notes: formData.notes
      });
      setTicketResult({ type: 'APPOINTMENT', data: res.data });
      setStep(6);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const ProgressBar = () => (
    <div className="w-full bg-slate-100 h-2 mb-8 rounded-full overflow-hidden">
      <div 
        className="bg-indigo-600 h-full transition-all duration-500 ease-out" 
        style={{ width: `${(step / 6) * 100}%` }}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 px-4 py-4 flex items-center">
        {step > 1 && step < 6 && (
          <button onClick={handleBack} className="mr-4 p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
        )}
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">
          CQAMS Booking
        </h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-8">
        {step < 6 && <ProgressBar />}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center">
            {error}
          </div>
        )}

        {/* STEP 1: Select Type */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold mb-6">What service do you need?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {centerTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => { setSelectedType(type.id); handleNext(); }}
                  className="flex items-start p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group text-left"
                >
                  <div className={`p-4 rounded-xl ${type.bgLight} ${type.text} mr-5 group-hover:scale-110 transition-transform`}>
                    <type.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{type.label}</h3>
                    <p className="text-sm text-slate-500">{type.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Select Branch */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold mb-6">Select a Branch</h2>
            {loading ? <LoadingSpinner /> : (
              <div className="space-y-4">
                {centers.length === 0 ? (
                  <p className="text-slate-500 text-center py-10 bg-white rounded-xl border border-slate-100">No branches found for this category.</p>
                ) : (
                  centers.map(center => (
                    <div key={center.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{center.name}</h3>
                        <div className="flex items-center text-sm text-slate-500 mt-2 space-x-4">
                          <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {center.location || 'Unknown'}</span>
                          <span className="flex items-center text-amber-600"><Clock className="w-4 h-4 mr-1" /> ~{center.estimatedWaitMinutes || 0} min wait</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setSelectedCenter(center); handleNext(); }}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors w-full sm:w-auto"
                      >
                        Select
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Select Service */}
        {step === 3 && selectedCenter && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold mb-2">Select Service</h2>
            <p className="text-slate-500 mb-6">{selectedCenter.name}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedCenter.services?.map(service => (
                <button
                  key={service.id}
                  onClick={() => { setSelectedService(service); handleNext(); }}
                  className="p-5 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all text-left flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg tracking-wider">
                      {service.codePrefix || 'SRV'}
                    </span>
                    <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded">~{service.avgDurationMin} min</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{service.name}</h3>
                  {service.description && <p className="text-sm text-slate-500 mt-auto">{service.description}</p>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Choose Queue vs Appointment */}
        {step === 4 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold mb-6">How would you like to proceed?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={() => { setFlowType('QUEUE'); handleNext(); }}
                className="p-8 bg-white rounded-3xl shadow-sm border-2 border-transparent hover:border-indigo-600 transition-all text-center group"
              >
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Ticket className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Join Walk-in Queue</h3>
                <p className="text-sm text-slate-500">Get a ticket now and wait for your turn today.</p>
              </button>

              <button 
                onClick={() => { setFlowType('APPOINTMENT'); handleNext(); }}
                className="p-8 bg-white rounded-3xl shadow-sm border-2 border-transparent hover:border-indigo-600 transition-all text-center group"
              >
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <CalendarIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Book Appointment</h3>
                <p className="text-sm text-slate-500">Schedule a specific date and time for your visit.</p>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Form Details */}
        {step === 5 && (
          <div className="animate-fade-in bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-semibold mb-6">
              {flowType === 'QUEUE' ? 'Your Details' : 'Schedule Appointment'}
            </h2>
            
            <form onSubmit={flowType === 'QUEUE' ? handleJoinQueue : handleBookAppointment} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      required type="text" 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                      placeholder="Abebe Kebede"
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      required type="tel" 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                      placeholder="0911000000"
                      value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ID Number (Optional)</label>
                <div className="relative">
                  <Hash className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                    placeholder="National ID or Passport"
                    value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})}
                  />
                </div>
              </div>

              {flowType === 'APPOINTMENT' && (
                <>
                  <div className="pt-4 border-t border-slate-100 mt-6">
                    <label className="block text-sm font-medium text-slate-700 mb-3">Select Date</label>
                    <input 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
                      value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setSelectedSlot(null); }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Select Time Slot</label>
                    {loading ? <div className="text-center py-4"><LoadingSpinner /></div> : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {timeSlots.length === 0 ? (
                          <div className="col-span-full text-slate-500 text-sm py-2">No available slots for this date.</div>
                        ) : (
                          timeSlots.map(slot => {
                            const isFull = slot.bookedCount >= slot.maxCapacity;
                            const isSelected = selectedSlot?.id === slot.id;
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                disabled={isFull}
                                onClick={() => setSelectedSlot(slot)}
                                className={`py-3 px-2 rounded-xl text-sm font-medium border transition-all ${
                                  isFull ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' :
                                  isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' :
                                  'bg-white border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600'
                                }`}
                              >
                                {slot.startTime} - {slot.endTime}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              <button 
                type="submit" 
                disabled={loading || (flowType === 'APPOINTMENT' && !selectedSlot)}
                className="w-full mt-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {loading ? <LoadingSpinner size="small" /> : flowType === 'QUEUE' ? 'Get Queue Ticket' : 'Confirm Appointment'}
              </button>
            </form>
          </div>
        )}

        {/* STEP 6: Confirmation Screen */}
        {step === 6 && ticketResult && (
          <div className="animate-fade-in max-w-md mx-auto">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 print:shadow-none print:border-black">
              
              <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-8 text-center text-white relative">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-1">
                  {ticketResult.type === 'QUEUE' ? 'You are in line!' : 'Appointment Confirmed!'}
                </h2>
                <p className="text-indigo-100 text-sm">Please keep this screen open or screenshot it.</p>
                
                {/* Torn paper effect bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-[radial-gradient(circle,white_4px,transparent_4px)] bg-[length:16px_8px] bg-bottom bg-repeat-x transform translate-y-2"></div>
              </div>

              <div className="p-8 pt-10 text-center">
                <div className="mb-8">
                  <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mb-2">
                    {ticketResult.type === 'QUEUE' ? 'Token Number' : 'Reference Number'}
                  </p>
                  <p className="text-5xl font-black text-slate-900 tracking-tight">
                    {ticketResult.type === 'QUEUE' ? ticketResult.data.ticketNumber : ticketResult.data.referenceNumber}
                  </p>
                </div>

                {ticketResult.type === 'QUEUE' && (
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-slate-500 text-xs uppercase font-bold tracking-wide mb-1">Position</p>
                      <p className="text-2xl font-bold text-indigo-600">{ticketResult.data.position}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-slate-500 text-xs uppercase font-bold tracking-wide mb-1">Est. Wait</p>
                      <p className="text-2xl font-bold text-indigo-600">~{ticketResult.data.position * (ticketResult.data.service?.avgDurationMin || 10)}<span className="text-sm">m</span></p>
                    </div>
                  </div>
                )}

                {ticketResult.type === 'APPOINTMENT' && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-8 text-left">
                    <p className="text-slate-700 font-medium mb-1"><CalendarIcon className="inline w-4 h-4 mr-2 text-blue-600" />{ticketResult.data.scheduledDate}</p>
                    <p className="text-slate-700 font-medium"><Clock className="inline w-4 h-4 mr-2 text-blue-600" />{ticketResult.data.scheduledTime}</p>
                  </div>
                )}

                <div className="border-t border-dashed border-slate-200 pt-6 mb-6">
                  <p className="text-sm text-slate-600 font-medium mb-1">{selectedCenter?.name}</p>
                  <p className="text-sm text-slate-500">{selectedService?.name}</p>
                  <p className="text-sm text-slate-500 mt-2">{formData.name}</p>
                </div>

                <div className="flex justify-center mb-6">
                  <div className="p-3 bg-white border-2 border-slate-100 rounded-xl">
                    <QRCodeSVG 
                      value={JSON.stringify({
                        type: ticketResult.type,
                        id: ticketResult.type === 'QUEUE' ? ticketResult.data.ticketNumber : ticketResult.data.referenceNumber,
                        center: selectedCenter?.id
                      })} 
                      size={120} 
                    />
                  </div>
                </div>

                <div className="space-y-3 print:hidden">
                  <button onClick={() => window.print()} className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors">
                    Print Ticket
                  </button>
                  <button onClick={() => window.location.href = '/'} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors">
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
