import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import {
  getCurrentUserProfile,
  getUserClientMemberships,
  type UserProfile,
  type UserRole,
  type ClientMemberRole,
} from "@/integrations/user-profiles/api";

interface ClientAccess {
  id: string;
  slug: string;
  name: string;
  role: ClientMemberRole;
}

interface UserContextType {
  // Auth state
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Profile state
  profile: UserProfile | null;
  isAgencyAdmin: boolean;
  isClientUser: boolean;
  
  // Client access
  accessibleClients: ClientAccess[];
  hasClientAccess: (clientSlug: string) => boolean;
  getClientRole: (clientSlug: string) => ClientMemberRole | "agency_admin" | null;
  
  // Actions
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accessibleClients, setAccessibleClients] = useState<ClientAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserData = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      setAccessibleClients([]);
      setIsLoading(false);
      return;
    }

    try {
      // Load profile
      const userProfile = await getCurrentUserProfile();
      setProfile(userProfile);

      // If client user, load accessible clients
      if (userProfile?.role === "client_user") {
        const memberships = await getUserClientMemberships();
        setAccessibleClients(
          memberships.map((m) => ({
            id: m.client.id,
            slug: m.client.slug,
            name: m.client.name,
            role: m.role as ClientMemberRole,
          }))
        );
      } else if (userProfile?.role === "agency_admin") {
        // Agency admins can access all clients (we don't preload them all)
        setAccessibleClients([]);
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      loadUserData(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Don't await - let it run async to prevent blocking auth
        loadUserData(session?.user ?? null);
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
        setAccessibleClients([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      await loadUserData(user);
    }
  }, [user, loadUserData]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const hasClientAccess = useCallback(
    (clientSlug: string): boolean => {
      // Agency admins have access to all clients
      if (profile?.role === "agency_admin") return true;
      
      // Client users can only access their assigned clients
      return accessibleClients.some((c) => c.slug === clientSlug);
    },
    [profile, accessibleClients]
  );

  const getClientRole = useCallback(
    (clientSlug: string): ClientMemberRole | "agency_admin" | null => {
      if (profile?.role === "agency_admin") return "agency_admin";
      
      const client = accessibleClients.find((c) => c.slug === clientSlug);
      return client?.role ?? null;
    },
    [profile, accessibleClients]
  );

  const isAuthenticated = !!user;
  const isAgencyAdmin = profile?.role === "agency_admin";
  const isClientUser = profile?.role === "client_user";

  return (
    <UserContext.Provider
      value={{
        user,
        session,
        isAuthenticated,
        isLoading,
        profile,
        isAgencyAdmin,
        isClientUser,
        accessibleClients,
        hasClientAccess,
        getClientRole,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

// Hook for checking specific permissions
export function usePermissions() {
  const { isAgencyAdmin, getClientRole } = useUser();

  const canManageClient = useCallback(
    (clientSlug: string): boolean => {
      if (isAgencyAdmin) return true;
      const role = getClientRole(clientSlug);
      return role === "owner" || role === "admin";
    },
    [isAgencyAdmin, getClientRole]
  );

  const canInviteToClient = useCallback(
    (clientSlug: string): boolean => {
      return canManageClient(clientSlug);
    },
    [canManageClient]
  );

  const canEditClientSettings = useCallback(
    (clientSlug: string): boolean => {
      return canManageClient(clientSlug);
    },
    [canManageClient]
  );

  const canAccessAdminPanel = isAgencyAdmin;

  return {
    canManageClient,
    canInviteToClient,
    canEditClientSettings,
    canAccessAdminPanel,
    isAgencyAdmin,
  };
}

