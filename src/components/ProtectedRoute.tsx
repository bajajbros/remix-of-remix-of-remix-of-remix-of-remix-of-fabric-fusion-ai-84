import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, allowedPages, isMaster } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
      return;
    }

    // Check page access after user is loaded
    if (!loading && user && !isMaster) {
      const currentPath = location.pathname;
      
      // Always allow profile and settings
      const alwaysAllowed = ['/profile', '/settings'];
      
      if (!alwaysAllowed.includes(currentPath) && !allowedPages.includes(currentPath)) {
        toast.error('You do not have access to this page');
        navigate('/', { replace: true });
      }
    }
  }, [user, loading, navigate, allowedPages, isMaster, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
