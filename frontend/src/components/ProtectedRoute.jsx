import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const ProtectedRoute = ({ children, allowedUserTypes = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedUserTypes.length > 0 && !allowedUserTypes.includes(user.userType)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;

