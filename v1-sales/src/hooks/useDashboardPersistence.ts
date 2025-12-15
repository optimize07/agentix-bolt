import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tab } from '@/types/tab';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';

interface SaveStatus {
  state: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  error?: string;
}

export const useDashboardPersistence = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ state: 'idle' });
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { user, organization } = useOrganization();
  
  // Use refs to prevent loadDashboard from being recreated on every user/org change
  const userRef = useRef(user);
  const orgRef = useRef(organization);
  
  // Keep refs in sync with state
  useEffect(() => {
    userRef.current = user;
    orgRef.current = organization;
  }, [user, organization]);

  // Load dashboard from database with localStorage fallback
  const loadDashboard = useCallback(async (dashboardId?: string) => {
    const currentUser = userRef.current;
    const currentOrg = orgRef.current;
    
    if (!currentUser || !currentOrg) {
      // Try to load from localStorage first
      try {
        const local = localStorage.getItem('dashboard_layout_latest');
        if (local) {
          const parsed = JSON.parse(local);
          setTabs(parsed);
          setSaveStatus({ state: 'saved' });
          setIsLoading(false);
          console.log('Loaded from localStorage (no user/org)');
          return;
        }
      } catch (e) {
        console.error('Failed to load from localStorage:', e);
      }
      
      // Set default in-memory dashboard and backup to localStorage
      const defaultTabs: Tab[] = [{
        id: 'tab-1',
        name: 'Main Dashboard',
        type: 'canvas',
        order: 0,
        components: [],
        dataSources: []
      }];
      setTabs(defaultTabs);
      try {
        localStorage.setItem('dashboard_layout_latest', JSON.stringify(defaultTabs));
      } catch (e) {
        console.error('Failed to backup default to localStorage:', e);
      }
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      let query = supabase
        .from('dashboard_layouts')
        .select('*')
        .eq('organization_id', currentOrg.id);
      
      if (dashboardId) {
        // Load specific dashboard
        query = query.eq('id', dashboardId);
      } else {
        // Load user's dashboard or org default
        query = query
          .or(`user_id.eq.${currentUser.id},is_default.eq.true`)
          .order('is_default', { ascending: false })
          .order('updated_at', { ascending: false });
      }
      
      const { data, error } = await query.limit(1).single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No dashboard found - try localStorage fallback
          try {
            const local = localStorage.getItem('dashboard_layout_latest');
            if (local) {
              const parsed = JSON.parse(local);
              setTabs(parsed);
              setSaveStatus({ state: 'saved' });
              console.log('Loaded from localStorage fallback');
              return;
            }
          } catch (e) {
            console.error('Failed to load from localStorage:', e);
          }
          
          // Create default
          const defaultTabs: Tab[] = [{
            id: 'tab-1',
            name: 'Main Dashboard',
            type: 'canvas',
            order: 0,
            components: [],
            dataSources: []
          }];
          setTabs(defaultTabs);
        } else {
          throw error;
        }
      } else if (data) {
        const layoutConfig = data.layout_config as any;
        setTabs(layoutConfig?.tabs || []);
        setSaveStatus({ state: 'saved', lastSaved: new Date(data.updated_at!) });
        
        // Backup to localStorage
        try {
          localStorage.setItem('dashboard_layout_latest', JSON.stringify(layoutConfig?.tabs || []));
        } catch (e) {
          console.error('Failed to backup to localStorage:', e);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      
      // Try localStorage fallback on error
      try {
        const local = localStorage.getItem('dashboard_layout_latest');
        if (local) {
          const parsed = JSON.parse(local);
          setTabs(parsed);
          setSaveStatus({ state: 'saved' });
          toast({
            title: 'Loaded from backup',
            description: 'Using locally saved dashboard',
          });
          return;
        }
      } catch (e) {
        console.error('Failed to load from localStorage:', e);
      }
      
      toast({
        title: 'Error loading dashboard',
        description: 'Using default dashboard',
        variant: 'destructive'
      });
      setTabs([{
        id: 'tab-1',
        name: 'Main Dashboard',
        type: 'canvas',
        order: 0,
        components: [],
        dataSources: []
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Save dashboard to database with retry logic and localStorage backup
  const saveDashboard = useCallback(async (tabsToSave: Tab[], retryCount = 0) => {
    if (!user || !organization) {
      // Backup to localStorage even without user/org
      try {
        localStorage.setItem('dashboard_layout_latest', JSON.stringify(tabsToSave));
        console.log('Saved to localStorage (no user/org)');
      } catch (e) {
        console.error('Failed to backup to localStorage:', e);
      }
      return;
    }

    try {
      setSaveStatus({ state: 'saving' });

      const layoutConfig = { tabs: tabsToSave } as any;

      // Check if dashboard exists
      const { data: existing } = await supabase
        .from('dashboard_layouts')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('dashboard_layouts')
          .update({
            layout_config: layoutConfig,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('dashboard_layouts')
          .insert([{
            organization_id: organization.id,
            user_id: user.id,
            name: 'My Dashboard',
            layout_config: layoutConfig,
            is_default: true
          }]);

        if (error) throw error;
      }

      // Successful save - backup to localStorage
      try {
        localStorage.setItem('dashboard_layout_latest', JSON.stringify(tabsToSave));
        console.log('Saved to both database and localStorage');
      } catch (e) {
        console.error('Failed to backup to localStorage:', e);
      }

      setSaveStatus({ state: 'saved', lastSaved: new Date() });
    } catch (error) {
      console.error('Error saving dashboard:', error);
      
      // Retry logic with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`Retrying save in ${delay}ms (attempt ${retryCount + 1}/3)`);
        setTimeout(() => saveDashboard(tabsToSave, retryCount + 1), delay);
        return;
      }
      
      setSaveStatus({ state: 'error', error: 'Failed to save dashboard' });
      toast({
        title: 'Error saving dashboard',
        description: 'Changes could not be saved after 3 attempts',
        variant: 'destructive'
      });
    }
  }, [user, organization, toast]);

  // Debounced save function
  const debouncedSave = useCallback((tabsToSave: Tab[]) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    setSaveStatus({ state: 'saving' });

    const timeout = setTimeout(() => {
      saveDashboard(tabsToSave);
    }, 500); // Save 500ms after last change (faster saves)

    setSaveTimeout(timeout);
  }, [saveTimeout, saveDashboard]);

  // Warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus.state === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus.state]);

  // Update tabs and trigger save
  const updateTabs = useCallback((newTabs: Tab[] | ((prev: Tab[]) => Tab[])) => {
    setTabs(prev => {
      const updated = typeof newTabs === 'function' ? newTabs(prev) : newTabs;
      debouncedSave(updated);
      return updated;
    });
  }, [debouncedSave]);

  // Load on mount - only once when user/org are available
  useEffect(() => {
    if (!hasLoaded && (user || !organization)) {
      loadDashboard();
      setHasLoaded(true);
    }
  }, [loadDashboard, hasLoaded, user, organization]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  return {
    tabs,
    setTabs: updateTabs,
    saveStatus,
    isLoading,
    loadDashboard
  };
};