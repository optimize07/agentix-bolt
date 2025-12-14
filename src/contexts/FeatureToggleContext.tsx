import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  getEffectiveFeatures,
  isFeatureEnabled as checkFeatureEnabled,
  type EffectiveFeature,
} from "@/integrations/feature-toggles/api";
import { supabase } from "@/integrations/supabase/client";

interface FeatureToggleContextType {
  features: EffectiveFeature[];
  loading: boolean;
  error: Error | null;
  isFeatureEnabled: (featureKey: string) => boolean;
  refreshFeatures: () => Promise<void>;
  clientId: string | null;
}

const FeatureToggleContext = createContext<FeatureToggleContextType | null>(null);

export function FeatureToggleProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const clientId = params.clientId || null;
  
  const [features, setFeatures] = useState<EffectiveFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadFeatures = useCallback(async () => {
    if (!clientId) {
      setFeatures([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get client ID from slug
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("slug", clientId)
        .single();

      if (client) {
        const effectiveFeatures = await getEffectiveFeatures(client.id);
        setFeatures(effectiveFeatures);
      } else {
        setFeatures([]);
      }
    } catch (e) {
      console.error("Failed to load feature toggles:", e);
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel("feature-toggles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "platform_feature_toggles" },
        () => loadFeatures()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "client_feature_toggles" },
        () => loadFeatures()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, loadFeatures]);

  const isFeatureEnabled = useCallback(
    (featureKey: string): boolean => {
      // If no features loaded yet, default to true to avoid flash of missing content
      if (features.length === 0 && loading) return true;
      
      const feature = features.find((f) => f.feature_key === featureKey);
      if (!feature) return true; // Unknown features are enabled by default
      
      return feature.enabled;
    },
    [features, loading]
  );

  const refreshFeatures = useCallback(async () => {
    await loadFeatures();
  }, [loadFeatures]);

  return (
    <FeatureToggleContext.Provider
      value={{
        features,
        loading,
        error,
        isFeatureEnabled,
        refreshFeatures,
        clientId,
      }}
    >
      {children}
    </FeatureToggleContext.Provider>
  );
}

export function useFeatureToggleContext() {
  const context = useContext(FeatureToggleContext);
  if (!context) {
    throw new Error(
      "useFeatureToggleContext must be used within a FeatureToggleProvider"
    );
  }
  return context;
}

