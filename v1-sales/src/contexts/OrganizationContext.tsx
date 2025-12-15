import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface Organization {
  id: string;
  name: string;
  niche_id: string;
  settings: any;
  created_at?: string;
  niche?: Niche;
}

interface Niche {
  id: string;
  name: string;
  slug: string;
  organizational_type: string;
}

interface Role {
  id: string;
  name: string;
  slug: string;
  permissions: any;
}

interface GlossaryTerm {
  id: string;
  term_key: string;
  default_label: string;
  category: string;
  niche_id: string;
  description?: string;
}

interface GlossaryOverride {
  id: string;
  glossary_term_id: string;
  custom_label: string;
  organization_id: string;
}

interface OrganizationContextType {
  user: User | null;
  organization: Organization | null;
  niche: Niche | null;
  role: Role | null;
  loading: boolean;
  hasPermission: (path: string) => boolean;
  getLabel: (termKey: string) => string;
  glossaryTerms: GlossaryTerm[];
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [niche, setNiche] = useState<Niche | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const [glossaryOverrides, setGlossaryOverrides] = useState<GlossaryOverride[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use ref to track current organization for realtime callbacks
  const organizationRef = useRef<Organization | null>(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    organizationRef.current = organization;
  }, [organization]);

  useEffect(() => {
    const initializeOrganization = async (sessionFromCallback?: { user: User } | null) => {
      // Guard: Don't re-initialize if already have this user's data
      if (user && sessionFromCallback?.user?.id === user.id && organization) {
        console.log('[OrganizationContext] Skipping re-initialization - already loaded');
        return;
      }
      
      setLoading(true);
      try {
        // Use provided session or fetch fresh
        let session = sessionFromCallback;
        if (!session) {
          const { data: { session: fetchedSession } } = await supabase.auth.getSession();
          session = fetchedSession;
        }
        
        if (!session?.user) {
          setLoading(false);
          return;
        }

        setUser(session.user);

        // Fetch user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", session.user.id)
          .single();

        if (!profile?.organization_id) {
          setLoading(false);
          return;
        }

        // Fetch organization with niche
        const { data: org } = await supabase
          .from("organizations")
          .select(`
            *,
            niche:niches(*)
          `)
          .eq("id", profile.organization_id)
          .single();

        if (org) {
          setOrganization(org as any);

          // Fetch niche
          const { data: nicheData } = await supabase
            .from("niches")
            .select("*")
            .eq("id", org.niche_id)
            .single();

          if (nicheData) setNiche(nicheData);

          // Fetch user role
          const { data: userRole } = await supabase
            .from("user_roles")
            .select("role_id, organization_id")
            .eq("user_id", session.user.id)
            .eq("organization_id", org.id)
            .single();

          if (userRole?.role_id) {
            const { data: nicheRole } = await supabase
              .from("niche_roles")
              .select("id, name, slug, permissions")
              .eq("id", userRole.role_id)
              .single();
            
            if (nicheRole) {
              console.log("User role loaded:", nicheRole);
              setRole(nicheRole);
            }
          }

          // Fetch glossary terms for this niche
          const { data: terms } = await supabase
            .from("glossary_terms")
            .select("*")
            .eq("niche_id", org.niche_id);

          if (terms) setGlossaryTerms(terms);

          // Fetch glossary overrides for this organization
          const { data: overrides } = await supabase
            .from("organization_glossary_overrides")
            .select("*")
            .eq("organization_id", org.id);

          if (overrides) setGlossaryOverrides(overrides);
        }
      } catch (error) {
        console.error("Error loading organization:", error);
      } finally {
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[OrganizationContext] Auth event:', event, 'User:', session?.user?.id);
      
      if (!session?.user) {
        setUser(null);
        setOrganization(null);
        setNiche(null);
        setRole(null);
        setGlossaryTerms([]);
        setGlossaryOverrides([]);
        setLoading(false);
      } else {
        // Use setTimeout to defer async calls (Supabase best practice to avoid deadlocks)
        setTimeout(() => {
          initializeOrganization(session);
        }, 0);
      }
    });

    // Set up realtime subscription for glossary terms
    const glossaryChannel = supabase
      .channel('glossary-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'glossary_terms'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setGlossaryTerms(prev => [...prev, payload.new as GlossaryTerm]);
          } else if (payload.eventType === 'UPDATE') {
            setGlossaryTerms(prev => 
              prev.map(term => term.id === payload.new.id ? payload.new as GlossaryTerm : term)
            );
          } else if (payload.eventType === 'DELETE') {
            setGlossaryTerms(prev => prev.filter(term => term.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Set up realtime subscription for glossary overrides
    const overridesChannel = supabase
      .channel('overrides-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_glossary_overrides'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setGlossaryOverrides(prev => [...prev, payload.new as GlossaryOverride]);
          } else if (payload.eventType === 'UPDATE') {
            setGlossaryOverrides(prev => 
              prev.map(override => override.id === payload.new.id ? payload.new as GlossaryOverride : override)
            );
          } else if (payload.eventType === 'DELETE') {
            setGlossaryOverrides(prev => prev.filter(override => override.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Set up realtime subscription for organization changes
    const organizationChannel = supabase
      .channel('organization-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'organizations'
        },
        async (payload) => {
          const updatedOrg = payload.new as any;
          
          // Only process if it's our organization (use ref to avoid stale closure)
          if (organizationRef.current && updatedOrg.id === organizationRef.current.id) {
            setOrganization(prev => prev ? { ...prev, ...updatedOrg } : null);
            
            // If niche changed, refresh glossary terms
            if (updatedOrg.niche_id !== organizationRef.current.niche_id) {
              const { data: newNiche } = await supabase
                .from("niches")
                .select("*")
                .eq("id", updatedOrg.niche_id)
                .single();
              
              if (newNiche) setNiche(newNiche);
              
              const { data: terms } = await supabase
                .from("glossary_terms")
                .select("*")
                .eq("niche_id", updatedOrg.niche_id);
              
              if (terms) setGlossaryTerms(terms);
              
              const { data: overrides } = await supabase
                .from("organization_glossary_overrides")
                .select("*")
                .eq("organization_id", updatedOrg.id);
              
              if (overrides) setGlossaryOverrides(overrides);
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(glossaryChannel);
      supabase.removeChannel(overridesChannel);
      supabase.removeChannel(organizationChannel);
    };
  }, []);

  const hasPermission = (path: string): boolean => {
    if (!role?.permissions) return false;

    const parts = path.split(".");
    let current: any = role.permissions;

    for (const part of parts) {
      if (current[part] === undefined) return false;
      current = current[part];
    }

    return current === true;
  };

  const getLabel = (termKey: string): string => {
    // First, check if there's an organization override
    const term = glossaryTerms.find(t => t.term_key === termKey);
    if (!term) {
      // Intelligently convert term key to readable label
      // e.g., "action.create" → "Create", "entity.canvas" → "Canvas"
      const parts = termKey.split('.');
      const lastPart = parts[parts.length - 1];
      return lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/_/g, ' ');
    }

    const override = glossaryOverrides.find(o => o.glossary_term_id === term.id);
    return override ? override.custom_label : term.default_label;
  };

  return (
    <OrganizationContext.Provider
      value={{ user, organization, niche, role, loading, hasPermission, getLabel, glossaryTerms }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
};
