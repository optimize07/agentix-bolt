import { useEffect, useState } from "react";
import { Navigate, useParams, useLocation } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireClientAccess?: boolean;
}

export const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireClientAccess = true,
}: ProtectedRouteProps) => {
  const { clientId } = useParams();
  const location = useLocation();
  const {
    isAuthenticated,
    isLoading,
    isAgencyAdmin,
    isClientUser,
    accessibleClients,
    hasClientAccess,
    profile,
  } = useUser();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Admin-only route
  if (requireAdmin && !isAgencyAdmin) {
    // Redirect client users to their first accessible client
    if (isClientUser && accessibleClients.length > 0) {
      return <Navigate to={`/client/${accessibleClients[0].slug}`} replace />;
    }
    // If no accessible clients, redirect to auth
    return <Navigate to="/auth" replace />;
  }

  // Check client access for client-scoped routes
  if (requireClientAccess && clientId) {
    // Agency admins have access to all clients
    if (isAgencyAdmin) {
      return <>{children}</>;
    }

    // Client users need explicit membership
    if (!hasClientAccess(clientId)) {
      // Redirect to first accessible client or show unauthorized
      if (accessibleClients.length > 0) {
        return <Navigate to={`/client/${accessibleClients[0].slug}`} replace />;
      }
      // No clients accessible - this shouldn't happen normally
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center max-w-md p-8">
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have access to this client. Please contact your administrator.
            </p>
            <button
              onClick={() => window.location.href = "/auth"}
              className="text-primary underline"
            >
              Return to login
            </button>
          </div>
        </div>
      );
    }
  }

  // All checks passed
  return <>{children}</>;
};

// Wrapper component for admin-only routes
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProtectedRoute requireAdmin requireClientAccess={false}>
      {children}
    </ProtectedRoute>
  );
};

// Component to handle role-based redirects after login
export const AuthRedirect = () => {
  const { isAuthenticated, isLoading, isAgencyAdmin, accessibleClients } = useUser();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Check if there's a "from" location to return to
  const from = (location.state as any)?.from?.pathname;
  if (from && from !== "/") {
    return <Navigate to={from} replace />;
  }

  // Default redirect based on role
  if (isAgencyAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // Client user - redirect to first accessible client
  if (accessibleClients.length > 0) {
    return <Navigate to={`/client/${accessibleClients[0].slug}`} replace />;
  }

  // No clients - show message
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md p-8">
        <h2 className="text-xl font-bold mb-2">No Client Access</h2>
        <p className="text-muted-foreground mb-4">
          You don't have access to any clients yet. Please wait for an invitation or contact your administrator.
        </p>
      </div>
    </div>
  );
};
