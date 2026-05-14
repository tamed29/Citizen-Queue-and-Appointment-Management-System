import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import TakeQueue from './pages/TakeQueue';
import MyTickets from './pages/MyTickets';
import BookAppointment from './pages/BookAppointment';
import TrackQueue from './pages/TrackQueue';
import StaffDashboard from './pages/StaffDashboard';
import AdminPanel from './pages/AdminPanel';
import LoadingSpinner from './components/LoadingSpinner';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={user ? <Navigate to="/home" replace /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/home" replace /> : <Login />} />
      <Route path="/admin" element={
        user ? (
          user.role === 'ADMIN' ? <AdminPanel /> : 
          user.role === 'STAFF' ? <Navigate to="/staff" replace /> : <Navigate to="/home" replace />
        ) : <AdminLogin />
      } />
      <Route path="/admin/login" element={user ? <Navigate to="/home" replace /> : <AdminLogin />} />
      <Route path="/register" element={user ? <Navigate to="/home" replace /> : <Register />} />

      {/* Authenticated routes */}
      <Route element={<ProtectedRoute allowedRoles={['CITIZEN', 'STAFF', 'ADMIN']} />}>
        <Route path="/home" element={<Home />} />
        <Route path="/queue/track" element={<TrackQueue />} />
      </Route>

      {/* Citizen & Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN']} />}>
        <Route path="/queue/take" element={<TakeQueue />} />
        <Route path="/tickets" element={<MyTickets />} />
        <Route path="/appointments" element={<BookAppointment />} />
      </Route>

      {/* Staff & Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['STAFF', 'ADMIN']} />}>
        <Route path="/staff" element={<StaffDashboard />} />
      </Route>

      {/* Admin Only Routes */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        {/* /admin is handled above for cleaner admin-first login flow */}
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
