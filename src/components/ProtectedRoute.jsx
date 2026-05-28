import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageSpinner } from './ui/Spinner';

export function ProtectedRoute({ allowedRole }) {
  const { user, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole) {
    // marketing_company shares the customer portal until a dedicated portal is built
    const effectiveRole = user.role === 'marketing_company' ? 'customer' : user.role;
    if (effectiveRole !== allowedRole) {
      return <Navigate to={user.role === 'admin' ? '/dashboard' : '/portal'} replace />;
    }
  }
  return <Outlet />;
}
