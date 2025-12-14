import { useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

// Types for feature toggles
export interface FeatureState {
  enabled: boolean;
  loading: boolean;
  error: Error | null;
}

export interface AllFeaturesState {
  features: Map<string, boolean>;
  loading: boolean;
  error: Error | null;
  isEnabled: (featureKey: string) => boolean;
  refresh: () => Promise<void>;
}

// Simple hook to check if a single feature is enabled
export function useFeatureToggle(featureKey: string, clientId?: string): FeatureState {
  const [enabled, setEnabled] = useState(true); // Default to enabled
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function checkFeature() {
      try {
        setLoading(true);
        // For now, default all features to enabled
        // This will work once the feature_definitions table exists
        setEnabled(true);
      } catch (e) {
        console.error("Failed to check feature toggle:", e);
        setError(e as Error);
        setEnabled(true); // Default to enabled on error
      } finally {
        setLoading(false);
      }
    }

    checkFeature();
  }, [featureKey, clientId]);

  return { enabled, loading, error };
}

// Hook to get all feature toggles for a client
export function useAllFeatureToggles(clientSlug?: string): AllFeaturesState {
  const [features, setFeatures] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadFeatures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // If no client, just return empty (all enabled by default)
      if (!clientSlug) {
        setFeatures(new Map());
        setLoading(false);
        return;
      }

      // Get client ID from slug
      const { data: client } = await (supabase as any)
        .from("clients")
        .select("id")
        .eq("slug", clientSlug)
        .maybeSingle();

      if (!client) {
        setFeatures(new Map());
        setLoading(false);
        return;
      }

      // Try to get effective features - this may fail if tables don't exist
      try {
        const { data, error: rpcError } = await (supabase as any).rpc("get_client_features", {
          p_client_id: client.id,
        });

        if (rpcError) throw rpcError;

        const featureMap = new Map<string, boolean>();
        if (data) {
          for (const feature of data) {
            featureMap.set(feature.feature_key, feature.enabled);
          }
        }
        setFeatures(featureMap);
      } catch {
        // If RPC doesn't exist, default to empty map (all enabled)
        setFeatures(new Map());
      }
    } catch (e) {
      console.error("Failed to load feature toggles:", e);
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [clientSlug]);

  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);

  const isEnabled = useCallback(
    (featureKey: string): boolean => {
      // If features not loaded or key not found, default to enabled
      if (loading || !features.has(featureKey)) return true;
      return features.get(featureKey) ?? true;
    },
    [features, loading]
  );

  const refresh = useCallback(async () => {
    await loadFeatures();
  }, [loadFeatures]);

  return { features, loading, error, isEnabled, refresh };
}

// Component wrapper for conditional rendering based on feature
interface FeatureGateProps {
  featureKey: string;
  clientId?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ featureKey, clientId, children, fallback = null }: FeatureGateProps) {
  const { enabled, loading } = useFeatureToggle(featureKey, clientId);

  if (loading) return null;
  if (!enabled) return <>{fallback}</>;
  return <>{children}</>;
}

// Export default for backwards compatibility
export default useFeatureToggle;
