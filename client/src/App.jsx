import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import TakeQueue from './pages/TakeQueue';
import MyTickets from './pages/MyTickets';
import BookAppointment from './pages/BookAppointment';
import TrackQueue from './pages/TrackQueue';
import StaffDashboard from './pages/StaffDashboard';
import SuperAdminPanel from './pages/SuperAdminPanel'; // New
import LoadingSpinner from './components/LoadingSpinner';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <Routes>
      {/* Public Routes — redirect logged-in users to their correct dashboard */}
      <Route path="/" element={
        !user ? <Landing /> :
        user.role === 'SUPER_ADMIN' ? <Navigate to="/super-admin/dashboard" replace /> :
        user.role === 'STAFF_ADMIN' ? <Navigate to="/staff/dashboard" replace /> :
        <Navigate to="/home" replace />
      } />
      <Route path="/login" element={
        !user ? <Login /> :
        user.role === 'SUPER_ADMIN' ? <Navigate to="/super-admin/dashboard" replace /> :
        user.role === 'STAFF_ADMIN' ? <Navigate to="/staff/dashboard" replace /> :
        <Navigate to="/home" replace />
      } />
      <Route path="/register" element={user ? <Navigate to="/home" replace /> : <Register />} />

      {/* SUPER ADMIN ROUTES */}
      <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
        <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
        <Route path="/super-admin/dashboard" element={<SuperAdminPanel activeTab="dashboard" />} />
        <Route path="/super-admin/staff" element={<SuperAdminPanel activeTab="staff" />} />
        <Route path="/super-admin/reports" element={<SuperAdminPanel activeTab="reports" />} />
        <Route path="/super-admin/settings" element={<SuperAdminPanel activeTab="settings" />} />
      </Route>

      {/* STAFF ADMIN ROUTES */}
      <Route element={<ProtectedRoute allowedRoles={['STAFF_ADMIN']} />}>
        <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
      </Route>

      {/* CITIZEN ROUTES — admin roles excluded, they have dedicated dashboards */}
      <Route element={<ProtectedRoute allowedRoles={['CITIZEN']} />}>
        <Route path="/home" element={<Home />} />
        <Route path="/queue/track" element={<TrackQueue />} />
        <Route path="/queue/take" element={<TakeQueue />} />
        <Route path="/tickets" element={<MyTickets />} />
        <Route path="/appointments" element={<BookAppointment />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <SocketProvider>
          <Layout>
            <AppRoutes />
          </Layout>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
