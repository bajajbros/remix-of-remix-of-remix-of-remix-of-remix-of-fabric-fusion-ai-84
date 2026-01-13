import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { isPreviewDomain } from '@/hooks/usePreviewMode';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, allowedPages, isMaster } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're on preview domain - bypass auth
  const isPreview = isPreviewDomain();

  useEffect(() => {
    // Skip auth check on preview domain
    if (isPreview) return;

    if (!loading && !user) {
      navigate('/auth', { replace: true });
      return;
    }

    // Check page access after user is loaded
    if (!loading && user && !isMaster) {
      const currentPath = location.pathname;
      
      // Always allow profile, settings, and dashboard
      const alwaysAllowed = ['/profile', '/settings', '/dashboard'];
      
      if (!alwaysAllowed.includes(currentPath) && !allowedPages.includes(currentPath)) {
        toast.error('You do not have access to this page');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, loading, navigate, allowedPages, isMaster, location.pathname]);

  // Allow access on preview domain without loading/auth checks
  if (isPreview) {
    return <>{children}</>;
  }

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
