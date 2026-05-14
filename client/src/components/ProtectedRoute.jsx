import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ allowedRoles = ['CITIZEN', 'STAFF', 'ADMIN'] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  if (!user) {
    // If trying to access admin or staff paths, redirect to admin login
    const isAdminPath = location.pathname.startsWith('/admin') || location.pathname.startsWith('/staff');
    return <Navigate to={isAdminPath ? "/admin" : "/login"} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
