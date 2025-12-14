// Feature Toggles API - Data access layer for feature toggle management
// Uses untyped client as these tables exist in external Supabase but not in auto-generated types

import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";

export type FeatureCategory = "department" | "agent" | "feature" | "module";

export interface FeatureDefinition {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: FeatureCategory;
  parent_key: string | null;
  default_enabled: boolean;
  sort_order: number;
  icon: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PlatformFeatureToggle {
  id: string;
  feature_key: string;
  enabled: boolean;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

export interface ClientFeatureToggle {
  id: string;
  client_id: string;
  feature_key: string;
  enabled: boolean | null;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

export interface EffectiveFeature {
  feature_key: string;
  name: string;
  category: string;
  parent_key: string | null;
  enabled: boolean;
  is_overridden: boolean;
}

export interface FeatureWithToggleState extends FeatureDefinition {
  platform_enabled: boolean | null;
  client_enabled: boolean | null;
  effective_enabled: boolean;
  is_overridden: boolean;
}

// ============================================================================
// Feature Definitions
// ============================================================================

export async function listFeatureDefinitions(): Promise<FeatureDefinition[]> {
  const { data, error } = await supabase
    .from("feature_definitions")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data || []) as FeatureDefinition[];
}

export async function getFeatureDefinition(key: string): Promise<FeatureDefinition | null> {
  const { data, error } = await supabase
    .from("feature_definitions")
    .select("*")
    .eq("key", key)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data as FeatureDefinition;
}

export async function getFeaturesByCategory(category: FeatureCategory): Promise<FeatureDefinition[]> {
  const { data, error } = await supabase
    .from("feature_definitions")
    .select("*")
    .eq("category", category)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data || []) as FeatureDefinition[];
}

export async function getChildFeatures(parentKey: string): Promise<FeatureDefinition[]> {
  const { data, error } = await supabase
    .from("feature_definitions")
    .select("*")
    .eq("parent_key", parentKey)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data || []) as FeatureDefinition[];
}

// ============================================================================
// Platform Feature Toggles
// ============================================================================

export async function listPlatformToggles(): Promise<PlatformFeatureToggle[]> {
  const { data, error } = await supabase
    .from("platform_feature_toggles")
    .select("*");

  if (error) throw error;
  return (data || []) as PlatformFeatureToggle[];
}

export async function getPlatformToggle(featureKey: string): Promise<PlatformFeatureToggle | null> {
  const { data, error } = await supabase
    .from("platform_feature_toggles")
    .select("*")
    .eq("feature_key", featureKey)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data as PlatformFeatureToggle;
}

export async function setPlatformToggle(
  featureKey: string,
  enabled: boolean
): Promise<PlatformFeatureToggle> {
  const { data, error } = await supabase
    .from("platform_feature_toggles")
    .upsert(
      { feature_key: featureKey, enabled },
      { onConflict: "feature_key" }
    )
    .select("*")
    .single();

  if (error) throw error;
  return data as PlatformFeatureToggle;
}

export async function deletePlatformToggle(featureKey: string): Promise<void> {
  const { error } = await supabase
    .from("platform_feature_toggles")
    .delete()
    .eq("feature_key", featureKey);

  if (error) throw error;
}

// ============================================================================
// Client Feature Toggles
// ============================================================================

export async function listClientToggles(clientId: string): Promise<ClientFeatureToggle[]> {
  const { data, error } = await supabase
    .from("client_feature_toggles")
    .select("*")
    .eq("client_id", clientId);

  if (error) throw error;
  return (data || []) as ClientFeatureToggle[];
}

export async function getClientToggle(
  clientId: string,
  featureKey: string
): Promise<ClientFeatureToggle | null> {
  const { data, error } = await supabase
    .from("client_feature_toggles")
    .select("*")
    .eq("client_id", clientId)
    .eq("feature_key", featureKey)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data as ClientFeatureToggle;
}

export async function setClientToggle(
  clientId: string,
  featureKey: string,
  enabled: boolean | null
): Promise<ClientFeatureToggle | null> {
  // If enabled is null, remove the override
  if (enabled === null) {
    const { error } = await supabase
      .from("client_feature_toggles")
      .delete()
      .eq("client_id", clientId)
      .eq("feature_key", featureKey);

    if (error) throw error;
    return null;
  }

  const { data, error } = await supabase
    .from("client_feature_toggles")
    .upsert(
      { client_id: clientId, feature_key: featureKey, enabled },
      { onConflict: "client_id,feature_key" }
    )
    .select("*")
    .single();

  if (error) throw error;
  return data as ClientFeatureToggle;
}

export async function bulkSetClientToggles(
  clientId: string,
  toggles: Array<{ feature_key: string; enabled: boolean | null }>
): Promise<void> {
  const { error } = await supabase.rpc("set_client_feature_toggles", {
    p_client_id: clientId,
    p_toggles: toggles.filter(t => t.enabled !== null),
  });

  if (error) throw error;

  // Handle resets (null values)
  const resets = toggles.filter(t => t.enabled === null);
  for (const reset of resets) {
    await supabase
      .from("client_feature_toggles")
      .delete()
      .eq("client_id", clientId)
      .eq("feature_key", reset.feature_key);
  }
}

export async function resetClientToggle(
  clientId: string,
  featureKey: string
): Promise<void> {
  const { error } = await supabase.rpc("reset_client_feature_toggle", {
    p_client_id: clientId,
    p_feature_key: featureKey,
  });

  if (error) throw error;
}

// ============================================================================
// Effective Feature State (Computed)
// ============================================================================

export async function getEffectiveFeatures(clientId: string): Promise<EffectiveFeature[]> {
  const { data, error } = await supabase.rpc("get_client_features", {
    p_client_id: clientId,
  });

  if (error) throw error;
  return (data || []) as EffectiveFeature[];
}

export async function isFeatureEnabled(
  featureKey: string,
  clientId?: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("get_feature_enabled", {
    p_feature_key: featureKey,
    p_client_id: clientId || null,
  });

  if (error) throw error;
  return data as boolean;
}

// ============================================================================
// Aggregated Feature Data for Admin UI
// ============================================================================

export async function getFeaturesWithToggleStates(
  clientId?: string
): Promise<FeatureWithToggleState[]> {
  const [definitions, platformToggles, clientToggles] = await Promise.all([
    listFeatureDefinitions(),
    listPlatformToggles(),
    clientId ? listClientToggles(clientId) : Promise.resolve([]),
  ]);

  const platformMap = new Map(platformToggles.map(t => [t.feature_key, t.enabled]));
  const clientMap = new Map(clientToggles.map(t => [t.feature_key, t.enabled]));

  return definitions.map(def => {
    const platformEnabled = platformMap.get(def.key) ?? null;
    const clientEnabled = clientId ? clientMap.get(def.key) ?? null : null;
    
    // Compute effective state
    let effectiveEnabled = def.default_enabled;
    if (platformEnabled !== null) {
      effectiveEnabled = platformEnabled;
    }
    if (clientEnabled !== null) {
      effectiveEnabled = clientEnabled;
    }

    return {
      ...def,
      platform_enabled: platformEnabled,
      client_enabled: clientEnabled,
      effective_enabled: effectiveEnabled,
      is_overridden: clientEnabled !== null,
    };
  });
}

// ============================================================================
// Feature Hierarchy Helpers
// ============================================================================

export interface FeatureTree {
  feature: FeatureDefinition;
  children: FeatureTree[];
  platform_enabled: boolean | null;
  client_enabled: boolean | null;
  effective_enabled: boolean;
}

export async function getFeatureTree(clientId?: string): Promise<FeatureTree[]> {
  const features = await getFeaturesWithToggleStates(clientId);
  
  // Build tree structure
  const featureMap = new Map<string, FeatureWithToggleState>();
  features.forEach(f => featureMap.set(f.key, f));

  const buildTree = (parentKey: string | null): FeatureTree[] => {
    return features
      .filter(f => f.parent_key === parentKey)
      .map(f => ({
        feature: f,
        children: buildTree(f.key),
        platform_enabled: f.platform_enabled,
        client_enabled: f.client_enabled,
        effective_enabled: f.effective_enabled,
      }));
  };

  return buildTree(null);
}
