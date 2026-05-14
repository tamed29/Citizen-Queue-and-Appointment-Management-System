import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import { 
  Building2, Users, Calendar as CalendarIcon, Settings, LogOut, 
  Clock, Activity, ChevronRight, CheckCircle, XCircle, AlertTriangle, Play, FastForward
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const THEMES = {
  Telecom: { main: 'bg-blue-900', accent: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-600', hover: 'hover:bg-blue-50', border: 'border-blue-200' },
  Bank: { main: 'bg-green-900', accent: 'bg-green-600', light: 'bg-green-50', text: 'text-green-600', hover: 'hover:bg-green-50', border: 'border-green-200' },
  Hospital: { main: 'bg-rose-900', accent: 'bg-rose-600', light: 'bg-rose-50', text: 'text-rose-600', hover: 'hover:bg-rose-50', border: 'border-rose-200' },
  Other: { main: 'bg-purple-900', accent: 'bg-purple-600', light: 'bg-purple-50', text: 'text-purple-600', hover: 'hover:bg-purple-50', border: 'border-purple-200' }
};

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const [activeTab, setActiveTab] = useState('live');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Data State
  const [queue, setQueue] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);

  const centerType = user?.staffCenter?.type || 'Other';
  const theme = THEMES[centerType] || THEMES.Other;
  const isHospital = centerType === 'Hospital';

  // Fetch Data
  const fetchData = async () => {
    try {
      const [queueRes, apptRes, centerRes] = await Promise.all([
        api.get('/queue/staff/service'),
        api.get('/queue/staff/appointments'),
        api.get(`/centers/${user?.staffCenterId || ''}`)
      ]);
      setQueue(queueRes.data);
      setAppointments(apptRes.data);
      setServices(centerRes.data?.services || []);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!socket || !user?.staffCenterId) return;
    
    // Listen for queue updates on all services in this center
    services.forEach(s => socket.emit('join:service', s.id));
    socket.emit('join:center', user.staffCenterId);

    const handleUpdate = () => fetchData(); // Refresh on update
    socket.on('queue:update', handleUpdate);
    socket.on('appointment:new', handleUpdate);

    return () => {
      socket.off('queue:update', handleUpdate);
      socket.off('appointment:new', handleUpdate);
    };
  }, [socket, user, services]);

  // Actions
  const handleAction = async (action, id, payload = {}) => {
    try {
      if (action === 'callNext') {
        await api.post('/queue/staff/call-next', { serviceId: id });
      } else if (['serve', 'skip', 'no-show'].includes(action)) {
        await api.patch(`/queue/staff/${id}/${action}`);
      } else if (action === 'appt-status') {
        await api.patch(`/queue/staff/appointments/${id}/status`, { status: payload.status });
      }
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || `Action ${action} failed`);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  // Derived Stats
  const currentlyServing = queue.find(t => t.status === 'CALLED');
  const waitingTotal = queue.filter(t => t.status === 'WAITING').length;
  const todayAppts = appointments.filter(a => a.scheduledDate === new Date().toISOString().split('T')[0]);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`w-64 ${theme.main} text-white flex flex-col transition-all duration-300 z-20`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <Building2 className="w-8 h-8 text-white/80" />
            <div>
              <h1 className="font-bold tracking-wide">{user?.staffCenter?.name || 'Center'}</h1>
              <p className="text-xs text-white/60 uppercase tracking-widest">{centerType}</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'live', icon: Activity, label: 'Live Queue' },
              { id: 'appointments', icon: CalendarIcon, label: 'Appointments' },
              { id: 'services', icon: Settings, label: 'Services Config' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id 
                    ? 'bg-white/20 font-medium text-white shadow-sm' 
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-sm">{user?.name}</p>
              <p className="text-xs text-white/60">Staff Admin</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center z-10 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 capitalize">{activeTab.replace('-', ' ')}</h2>
            <p className="text-slate-500 text-sm">Manage your center's workflow</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="bg-slate-100 px-4 py-2 rounded-lg flex items-center gap-2 text-slate-700 font-medium border border-slate-200">
              <Clock className="w-4 h-4 text-slate-400" />
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-auto p-8">
          
          {/* Currently Serving Hero Panel */}
          {activeTab === 'live' && (
            <div className={`mb-8 p-6 rounded-2xl shadow-sm border ${theme.border} ${theme.light} flex items-center justify-between`}>
              <div>
                <p className={`text-sm font-bold uppercase tracking-wider ${theme.text} mb-1`}>Currently Serving</p>
                {currentlyServing ? (
                  <div className="flex items-baseline gap-4">
                    <h3 className="text-4xl font-black text-slate-900">{currentlyServing.ticketNumber}</h3>
                    <span className="text-lg text-slate-600">{currentlyServing.customerName || currentlyServing.userName || 'Walk-in'}</span>
                  </div>
                ) : (
                  <h3 className="text-3xl font-medium text-slate-400">Ready for next customer</h3>
                )}
              </div>
              
              {currentlyServing && (
                <div className="flex gap-3">
                  <button onClick={() => handleAction('serve', currentlyServing.id)} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" /> Mark Complete
                  </button>
                  <button onClick={() => handleAction('no-show', currentlyServing.id)} className="px-4 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50">
                    No Show
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: LIVE QUEUE (SWIMLANES) */}
          {activeTab === 'live' && (
            <div className="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-280px)]">
              {services.map(service => {
                const serviceQueue = queue.filter(t => t.serviceId === service.id && t.status === 'WAITING');
                
                return (
                  <div key={service.id} className="min-w-[340px] max-w-[340px] flex flex-col bg-slate-100 rounded-2xl p-4 border border-slate-200 h-full">
                    <div className="flex justify-between items-center mb-4 px-2">
                      <div>
                        <h4 className="font-bold text-slate-800">{service.name}</h4>
                        <span className="text-xs font-medium text-slate-500">{serviceQueue.length} Waiting • ~{serviceQueue.length * service.avgDurationMin}m</span>
                      </div>
                      <button 
                        onClick={() => handleAction('callNext', service.id)}
                        disabled={serviceQueue.length === 0}
                        className={`p-2 rounded-xl text-white transition-all ${serviceQueue.length > 0 ? `${theme.accent} hover:opacity-90 shadow-md` : 'bg-slate-300 cursor-not-allowed'}`}
                      >
                        <Play className="w-5 h-5 ml-0.5" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                      {serviceQueue.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-sm">Queue is empty</div>
                      ) : (
                        serviceQueue.map((ticket, idx) => (
                          <div key={ticket.id} className={`bg-white p-4 rounded-xl shadow-sm border ${ticket.isPriority ? 'border-red-300 bg-red-50/30' : 'border-slate-100'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-lg text-slate-800">{ticket.ticketNumber}</span>
                              {isHospital && ticket.isPriority && (
                                <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-700 rounded-md uppercase tracking-wider flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Emergency
                                </span>
                              )}
                              {(!isHospital || !ticket.isPriority) && (
                                <span className="text-xs font-medium text-slate-400">#{idx + 1}</span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 mb-3">{ticket.customerName || ticket.userName || 'Walk-in Customer'}</p>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Wait: {Math.round((new Date() - new Date(ticket.createdAt)) / 60000)}m</span>
                              <div className="flex gap-2">
                                <button onClick={() => handleAction('skip', ticket.id)} className="text-xs text-amber-600 hover:text-amber-700 font-medium px-2 py-1 bg-amber-50 rounded">Skip</button>
                                <button onClick={() => handleAction('no-show', ticket.id)} className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2 py-1 bg-slate-100 rounded">Drop</button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* TAB CONTENT: APPOINTMENTS */}
          {activeTab === 'appointments' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800">Manage Appointments</h3>
                <div className="flex gap-4">
                  <div className="px-4 py-2 bg-slate-50 rounded-lg text-sm border border-slate-200"><span className="font-bold text-slate-700">{todayAppts.length}</span> Today</div>
                  <div className="px-4 py-2 bg-slate-50 rounded-lg text-sm border border-slate-200"><span className="font-bold text-slate-700">{appointments.length}</span> Total</div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-semibold">Ref & Service</th>
                      <th className="p-4 font-semibold">Customer</th>
                      <th className="p-4 font-semibold">Schedule</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointments.length === 0 ? (
                      <tr><td colSpan="5" className="p-8 text-center text-slate-400">No appointments booked</td></tr>
                    ) : (
                      appointments.map(appt => (
                        <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-slate-800">{appt.referenceNumber}</p>
                            <p className="text-xs text-slate-500">{appt.service?.name}</p>
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-slate-700">{appt.customerName}</p>
                            <p className="text-xs text-slate-500">{appt.phone}</p>
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-slate-700 flex items-center gap-1"><CalendarIcon className="w-3 h-3 text-slate-400"/> {appt.scheduledDate}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Clock className="w-3 h-3 text-slate-400"/> {appt.scheduledTime}</p>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                              appt.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                              appt.status === 'CONFIRMED' ? 'bg-indigo-100 text-indigo-700' :
                              appt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {appt.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {appt.status === 'PENDING' && (
                              <>
                                <button onClick={() => handleAction('appt-status', appt.id, {status: 'CONFIRMED'})} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-medium text-xs rounded hover:bg-indigo-100">Confirm</button>
                                <button onClick={() => handleAction('appt-status', appt.id, {status: 'CANCELLED'})} className="px-3 py-1.5 bg-red-50 text-red-700 font-medium text-xs rounded hover:bg-red-100">Reject</button>
                              </>
                            )}
                            {appt.status === 'CONFIRMED' && (
                              <button onClick={() => handleAction('appt-status', appt.id, {status: 'COMPLETED'})} className="px-3 py-1.5 bg-green-50 text-green-700 font-medium text-xs rounded hover:bg-green-100">Complete</button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: SERVICES CONFIG */}
          {activeTab === 'services' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-800">Service Configuration</h3>
                <p className="text-sm text-slate-500 mt-1">Manage wait time intelligence and service settings.</p>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map(service => (
                  <div key={service.id} className="border border-slate-200 rounded-xl p-5 hover:border-indigo-200 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg">{service.name}</h4>
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded mt-1">PREFIX: {service.codePrefix}</span>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${service.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Avg Duration (Mins)</label>
                        <input type="number" defaultValue={service.avgDurationMin} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <button className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                        Save Settings
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
