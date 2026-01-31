import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/ui/Loading';
import { AdminSetupPage } from '@/pages/admin/AdminSetupPage';

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, isAdmin, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <PageLoader />;
    }

    if (!user) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    if (!isAdmin) {
        // Show setup page if user is logged in but not admin
        return <AdminSetupPage />;
    }

    return <>{children}</>;
}
