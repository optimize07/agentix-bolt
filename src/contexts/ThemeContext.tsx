import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { toast } from "sonner";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
}

interface ButtonColors {
  default: string;
  hover: string;
  active: string;
  text: string;
}

interface SidebarColors {
  background: string;
  text: string;
  activeBackground: string;
  activeText: string;
  hoverBackground: string;
  tabBarBackground: string;
  tabActiveBackground: string;
  tabActiveText: string;
  tabActiveBorder: string;
  tabInactiveText: string;
  tabHoverBackground: string;
}

interface CardShadowConfig {
  color: string;
  opacity: number;
  blur: number;
  spread: number;
  offsetX: number;
  offsetY: number;
}

interface CardBorderConfig {
  color: string;
  opacity: number;
  width: number;
}

interface ModeSpecificCardConfig {
  background: string;
  gradient: GradientConfig;
  border: CardBorderConfig;
  shadow: CardShadowConfig;
}

export interface GradientStop {
  id: string;
  color: string;
  position: number;
}

export type GradientType = 'linear' | 'radial' | 'angular' | 'mesh' | 'freeform';

export interface GradientConfig {
  enabled: boolean;
  type: GradientType;
  angle: number;
  centerX: number;
  centerY: number;
  stops: GradientStop[];
}

interface ModeSpecificButtonConfig {
  colors: ButtonColors;
  gradient: GradientConfig;
}

interface ModeSpecificSidebarConfig {
  colors: SidebarColors;
  gradient: GradientConfig;
}

interface ModeSpecificBackgroundConfig {
  color: string;
  gradient: GradientConfig;
}

interface GlassConfig {
  enabled: boolean;
  blurAmount: number;
  backgroundOpacity: number;
  chromeTexture: boolean;
  chromeIntensity: number;
  tintColor: string;
}

interface StatusColors {
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  error: string;
  errorForeground: string;
  info: string;
  infoForeground: string;
}

interface DividerConfig {
  color: string;
  opacity: number;
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface CompleteTheme {
  colors: ThemeColors;
  sidebarConfig: ModeSpecificSidebarConfig;
  buttonConfig: ModeSpecificButtonConfig;
  dividerConfig: DividerConfig;
  backgroundConfig: ModeSpecificBackgroundConfig;
  cardConfig: ModeSpecificCardConfig;
  glassConfig: GlassConfig;
  statusColors: StatusColors;
}

type ThemeSource = 'agency' | 'template' | 'custom';

interface ThemeContextType {
  // Current mode
  mode: "light" | "dark" | "system";
  effectiveMode: "light" | "dark";
  setMode: (mode: "light" | "dark" | "system") => void;
  
  // Theme source info
  themeSource: ThemeSource;
  isThemeLocked: boolean;
  currentClientId: string | null;
  
  // Color configs
  lightColors: ThemeColors;
  darkColors: ThemeColors;
  updateLightColor: (key: keyof ThemeColors, value: string) => void;
  updateDarkColor: (key: keyof ThemeColors, value: string) => void;
  
  // Card configs
  lightCardConfig: ModeSpecificCardConfig;
  darkCardConfig: ModeSpecificCardConfig;
  updateLightCardBackground: (value: string) => void;
  updateDarkCardBackground: (value: string) => void;
  updateLightCardGradient: (config: Partial<GradientConfig>) => void;
  updateDarkCardGradient: (config: Partial<GradientConfig>) => void;
  addLightCardGradientStop: () => void;
  addDarkCardGradientStop: () => void;
  removeLightCardGradientStop: (id: string) => void;
  removeDarkCardGradientStop: (id: string) => void;
  updateLightCardGradientStop: (id: string, updates: Partial<GradientStop>) => void;
  updateDarkCardGradientStop: (id: string, updates: Partial<GradientStop>) => void;
  updateLightCardBorder: (updates: Partial<CardBorderConfig>) => void;
  updateDarkCardBorder: (updates: Partial<CardBorderConfig>) => void;
  updateLightCardShadow: (updates: Partial<CardShadowConfig>) => void;
  updateDarkCardShadow: (updates: Partial<CardShadowConfig>) => void;
  
  // Button configs
  lightButtonConfig: ModeSpecificButtonConfig;
  darkButtonConfig: ModeSpecificButtonConfig;
  updateLightButtonColor: (key: keyof ButtonColors, value: string) => void;
  updateDarkButtonColor: (key: keyof ButtonColors, value: string) => void;
  updateLightButtonGradient: (config: Partial<GradientConfig>) => void;
  updateDarkButtonGradient: (config: Partial<GradientConfig>) => void;
  addLightButtonGradientStop: () => void;
  addDarkButtonGradientStop: () => void;
  removeLightButtonGradientStop: (id: string) => void;
  removeDarkButtonGradientStop: (id: string) => void;
  updateLightButtonGradientStop: (id: string, updates: Partial<GradientStop>) => void;
  updateDarkButtonGradientStop: (id: string, updates: Partial<GradientStop>) => void;
  
  // Sidebar configs
  lightSidebarConfig: ModeSpecificSidebarConfig;
  darkSidebarConfig: ModeSpecificSidebarConfig;
  updateLightSidebarColor: (key: keyof SidebarColors, value: string) => void;
  updateDarkSidebarColor: (key: keyof SidebarColors, value: string) => void;
  updateLightSidebarGradient: (config: Partial<GradientConfig>) => void;
  updateDarkSidebarGradient: (config: Partial<GradientConfig>) => void;
  addLightSidebarGradientStop: () => void;
  addDarkSidebarGradientStop: () => void;
  removeLightSidebarGradientStop: (id: string) => void;
  removeDarkSidebarGradientStop: (id: string) => void;
  updateLightSidebarGradientStop: (id: string, updates: Partial<GradientStop>) => void;
  updateDarkSidebarGradientStop: (id: string, updates: Partial<GradientStop>) => void;
  
  // Background configs
  lightBackgroundConfig: ModeSpecificBackgroundConfig;
  darkBackgroundConfig: ModeSpecificBackgroundConfig;
  updateLightBackgroundColor: (value: string) => void;
  updateDarkBackgroundColor: (value: string) => void;
  updateLightBackgroundGradient: (config: Partial<GradientConfig>) => void;
  updateDarkBackgroundGradient: (config: Partial<GradientConfig>) => void;
  addLightBackgroundGradientStop: () => void;
  addDarkBackgroundGradientStop: () => void;
  removeLightBackgroundGradientStop: (id: string) => void;
  removeDarkBackgroundGradientStop: (id: string) => void;
  updateLightBackgroundGradientStop: (id: string, updates: Partial<GradientStop>) => void;
  updateDarkBackgroundGradientStop: (id: string, updates: Partial<GradientStop>) => void;
  
  // Glass configs
  lightGlassConfig: GlassConfig;
  darkGlassConfig: GlassConfig;
  updateLightGlass: (updates: Partial<GlassConfig>) => void;
  updateDarkGlass: (updates: Partial<GlassConfig>) => void;
  
  // Status colors
  lightStatusColors: StatusColors;
  darkStatusColors: StatusColors;
  updateLightStatusColor: (key: keyof StatusColors, value: string) => void;
  updateDarkStatusColor: (key: keyof StatusColors, value: string) => void;
  
  // Divider configs
  lightDividerConfig: DividerConfig;
  darkDividerConfig: DividerConfig;
  updateLightDivider: (updates: Partial<DividerConfig>) => void;
  updateDarkDivider: (updates: Partial<DividerConfig>) => void;
  
  // Actions
  resetToDefaults: () => void;
  saveTheme: () => Promise<void>;
  loadTheme: () => Promise<void>;
  setClientContext: (clientId: string | null) => void;
  
  // Presets
  customPresets: Array<{ id: string; name: string; mode: string; theme_config: CompleteTheme }>;
  applyPreset: (theme: CompleteTheme, mode: 'light' | 'dark') => void;
  saveCustomPreset: (name: string, mode: 'light' | 'dark') => Promise<void>;
  deleteCustomPreset: (id: string) => Promise<void>;
  
  // Loading states
  isSaving: boolean;
  isLoading: boolean;
  isAgencyAdmin: boolean;
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const defaultDarkColors: ThemeColors = {
  background: "#0f0f0f",
  foreground: "#ffffff",
  primary: "#ff0000",
  secondary: "#700000",
  accent: "#d6d6d6",
  muted: "#202020",
};

const defaultLightColors: ThemeColors = {
  background: "#ffffff",
  foreground: "#090a0e",
  primary: "#20856a",
  secondary: "#2d9a45",
  accent: "#28a882",
  muted: "#f1f5f9",
};

const defaultLightButtonConfig: ModeSpecificButtonConfig = {
  colors: {
    default: "#20856a",
    hover: "#28a882",
    active: "#175c4c",
    text: "#ffffff",
  },
  gradient: {
    enabled: false,
    type: 'linear',
    angle: 90,
    centerX: 50,
    centerY: 50,
    stops: [
      { id: "1", color: "#20856a", position: 0 },
      { id: "2", color: "#28a882", position: 100 },
    ],
  },
};

const defaultDarkButtonConfig: ModeSpecificButtonConfig = {
  colors: {
    default: "#333333",
    hover: "#2e0002",
    active: "#ff0000",
    text: "#ffffff",
  },
  gradient: {
    enabled: false,
    type: 'linear',
    angle: 168,
    centerX: 34,
    centerY: 48,
    stops: [
      { id: "1", color: "#000000", position: 45 },
      { id: "2", color: "#6b0000", position: 0 },
      { id: "3", color: "#3d3d3d", position: 97 },
    ],
  },
};

const defaultLightSidebarConfig: ModeSpecificSidebarConfig = {
  colors: {
    background: "#f8faf9",
    text: "#090a0e",
    activeBackground: "#20856a",
    activeText: "#ffffff",
    hoverBackground: "#e8f0ed",
    tabBarBackground: "#f8fafc",
    tabActiveBackground: "#20856a",
    tabActiveText: "#ffffff",
    tabActiveBorder: "#20856a",
    tabInactiveText: "#64748b",
    tabHoverBackground: "#f1f5f9",
  },
  gradient: {
    enabled: false,
    type: 'linear',
    angle: 180,
    centerX: 50,
    centerY: 50,
    stops: [
      { id: "1", color: "#f8faf9", position: 0 },
      { id: "2", color: "#e8f0ed", position: 100 },
    ],
  },
};

const defaultDarkSidebarConfig: ModeSpecificSidebarConfig = {
  colors: {
    background: "#0a0c10",
    text: "#ffffff",
    activeBackground: "#ff0000",
    activeText: "#ffffff",
    hoverBackground: "#212121",
    tabBarBackground: "#0a0c10",
    tabActiveBackground: "#7f1d1d",
    tabActiveText: "#ffffff",
    tabActiveBorder: "#7f1d1d",
    tabInactiveText: "#a1a1aa",
    tabHoverBackground: "#1a1d24",
  },
  gradient: {
    enabled: true,
    type: 'radial',
    angle: 180,
    centerX: 47,
    centerY: 100,
    stops: [
      { id: "1", color: "#0a0c10", position: 0 },
      { id: "2", color: "#750000", position: 0 },
      { id: "3", color: "#0d0d0d", position: 100 },
    ],
  },
};

const defaultLightBackgroundConfig: ModeSpecificBackgroundConfig = {
  color: "#ffffff",
  gradient: {
    enabled: false,
    type: 'linear',
    angle: 180,
    centerX: 50,
    centerY: 50,
    stops: [
      { id: "1", color: "#ffffff", position: 0 },
      { id: "2", color: "#f1f5f9", position: 100 },
    ],
  },
};

const defaultDarkBackgroundConfig: ModeSpecificBackgroundConfig = {
  color: "#0a0c10",
  gradient: {
    enabled: true,
    type: 'linear',
    angle: 339,
    centerX: 50,
    centerY: 35,
    stops: [
      { id: "1", color: "#212121", position: 46 },
      { id: "2", color: "#000000", position: 100 },
    ],
  },
};

const defaultLightCardConfig: ModeSpecificCardConfig = {
  background: "#ffffff",
  gradient: {
    enabled: false,
    type: 'linear',
    angle: 135,
    centerX: 50,
    centerY: 50,
    stops: [
      { id: "1", color: "#ffffff", position: 0 },
      { id: "2", color: "#f1f5f9", position: 100 },
    ],
  },
  border: {
    color: "#e2e8f0",
    opacity: 100,
    width: 1,
  },
  shadow: {
    color: "#000000",
    opacity: 5,
    blur: 4,
    spread: 0,
    offsetX: 0,
    offsetY: 1,
  },
};

const defaultDarkCardConfig: ModeSpecificCardConfig = {
  background: "#131620",
  gradient: {
    enabled: true,
    type: 'linear',
    angle: 178,
    centerX: 50,
    centerY: 50,
    stops: [
      { id: "1", color: "#0d0d0d", position: 0 },
      { id: "2", color: "#292929", position: 50 },
      { id: "3", color: "#121212", position: 99 },
    ],
  },
  border: {
    color: "#545454",
    opacity: 100,
    width: 1,
  },
  shadow: {
    color: "#000000",
    opacity: 78,
    blur: 30,
    spread: -1,
    offsetX: 6,
    offsetY: 6,
  },
};

const defaultLightGlassConfig: GlassConfig = {
  enabled: false,
  blurAmount: 12,
  backgroundOpacity: 10,
  chromeTexture: false,
  chromeIntensity: 0,
  tintColor: "#ffffff",
};

const defaultDarkGlassConfig: GlassConfig = {
  enabled: true,
  blurAmount: 37,
  backgroundOpacity: 47,
  chromeTexture: true,
  chromeIntensity: 31,
  tintColor: "#000000",
};

const defaultLightStatusColors: StatusColors = {
  success: "#22c55e",
  successForeground: "#ffffff",
  warning: "#f59e0b",
  warningForeground: "#ffffff",
  error: "#ef4444",
  errorForeground: "#ffffff",
  info: "#3b82f6",
  infoForeground: "#ffffff",
};

const defaultDarkStatusColors: StatusColors = {
  success: "#16a34a",
  successForeground: "#ffffff",
  warning: "#d97706",
  warningForeground: "#ffffff",
  error: "#dc2626",
  errorForeground: "#ffffff",
  info: "#2563eb",
  infoForeground: "#ffffff",
};

const defaultLightDividerConfig: DividerConfig = {
  color: "#e5e7eb",
  opacity: 100,
  width: 1,
  style: 'solid',
};

const defaultDarkDividerConfig: DividerConfig = {
  color: "#ff0000",
  opacity: 25,
  width: 1,
  style: 'solid',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function hexToRgba(hex: string, alpha: number = 1): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0, 0, 0, ${alpha})`;
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function generateGradientCSS(config: GradientConfig): string {
  const sortedStops = [...config.stops].sort((a, b) => a.position - b.position);
  const stopsStr = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ');
  
  switch (config.type) {
    case 'linear':
      return `linear-gradient(${config.angle}deg, ${stopsStr})`;
    case 'radial':
      return `radial-gradient(circle at ${config.centerX}% ${config.centerY}%, ${stopsStr})`;
    case 'angular':
      return `conic-gradient(from ${config.angle}deg, ${stopsStr})`;
    case 'mesh':
      return `radial-gradient(circle at ${config.centerX}% ${config.centerY}%, ${stopsStr})`;
    case 'freeform':
      return `radial-gradient(ellipse at ${config.centerX}% ${config.centerY}%, ${stopsStr})`;
    default:
      return `linear-gradient(${config.angle}deg, ${stopsStr})`;
  }
}

function loadFromStorageWithDefaults<T extends object>(key: string, defaults: T): T {
  if (typeof window === "undefined") return defaults;
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return defaults;
    const parsed = JSON.parse(saved);
    return { ...defaults, ...parsed };
  } catch (error) {
    console.error(`Failed to parse theme setting for ${key}`, error);
    return defaults;
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAgencyAdmin, setIsAgencyAdmin] = useState(false);
  const [themeSource, setThemeSource] = useState<ThemeSource>('agency');
  const [isThemeLocked, setIsThemeLocked] = useState(false);
  const [currentClientId, setCurrentClientId] = useState<string | null>(null);
  
  const [mode, setMode] = useState<"light" | "dark" | "system">(() => {
    const saved = localStorage.getItem("theme-mode");
    return (saved as "light" | "dark" | "system") || "dark";
  });

  const [effectiveMode, setEffectiveMode] = useState<"light" | "dark">(() => {
    if (mode === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return mode as "light" | "dark";
  });

  // State for all theme configs
  const [lightColors, setLightColors] = useState<ThemeColors>(() =>
    loadFromStorageWithDefaults("theme-light-colors", defaultLightColors)
  );
  const [darkColors, setDarkColors] = useState<ThemeColors>(() =>
    loadFromStorageWithDefaults("theme-dark-colors", defaultDarkColors)
  );
  const [lightButtonConfig, setLightButtonConfig] = useState<ModeSpecificButtonConfig>(() =>
    loadFromStorageWithDefaults("theme-light-button-config", defaultLightButtonConfig)
  );
  const [darkButtonConfig, setDarkButtonConfig] = useState<ModeSpecificButtonConfig>(() =>
    loadFromStorageWithDefaults("theme-dark-button-config", defaultDarkButtonConfig)
  );
  const [lightSidebarConfig, setLightSidebarConfig] = useState<ModeSpecificSidebarConfig>(() =>
    loadFromStorageWithDefaults("theme-light-sidebar-config", defaultLightSidebarConfig)
  );
  const [darkSidebarConfig, setDarkSidebarConfig] = useState<ModeSpecificSidebarConfig>(() =>
    loadFromStorageWithDefaults("theme-dark-sidebar-config", defaultDarkSidebarConfig)
  );
  const [lightBackgroundConfig, setLightBackgroundConfig] = useState<ModeSpecificBackgroundConfig>(() =>
    loadFromStorageWithDefaults("theme-light-background-config", defaultLightBackgroundConfig)
  );
  const [darkBackgroundConfig, setDarkBackgroundConfig] = useState<ModeSpecificBackgroundConfig>(() =>
    loadFromStorageWithDefaults("theme-dark-background-config", defaultDarkBackgroundConfig)
  );
  const [lightCardConfig, setLightCardConfig] = useState<ModeSpecificCardConfig>(() =>
    loadFromStorageWithDefaults("theme-light-card-config", defaultLightCardConfig)
  );
  const [darkCardConfig, setDarkCardConfig] = useState<ModeSpecificCardConfig>(() =>
    loadFromStorageWithDefaults("theme-dark-card-config", defaultDarkCardConfig)
  );
  const [lightGlassConfig, setLightGlassConfig] = useState<GlassConfig>(() =>
    loadFromStorageWithDefaults("theme-light-glass-config", defaultLightGlassConfig)
  );
  const [darkGlassConfig, setDarkGlassConfig] = useState<GlassConfig>(() =>
    loadFromStorageWithDefaults("theme-dark-glass-config", defaultDarkGlassConfig)
  );
  const [lightStatusColors, setLightStatusColors] = useState<StatusColors>(() =>
    loadFromStorageWithDefaults("theme-light-status-colors", defaultLightStatusColors)
  );
  const [darkStatusColors, setDarkStatusColors] = useState<StatusColors>(() =>
    loadFromStorageWithDefaults("theme-dark-status-colors", defaultDarkStatusColors)
  );
  const [lightDividerConfig, setLightDividerConfig] = useState<DividerConfig>(() =>
    loadFromStorageWithDefaults("theme-light-divider-config", defaultLightDividerConfig)
  );
  const [darkDividerConfig, setDarkDividerConfig] = useState<DividerConfig>(() =>
    loadFromStorageWithDefaults("theme-dark-divider-config", defaultDarkDividerConfig)
  );
  const [customPresets, setCustomPresets] = useState<Array<{ id: string; name: string; mode: string; theme_config: CompleteTheme }>>([]);

  // Check agency admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAgencyAdmin(false);
        return;
      }
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      setIsAgencyAdmin(profile?.role === 'agency_admin');
    };
    
    checkAdminStatus();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminStatus();
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (mode !== "system") {
      setEffectiveMode(mode as "light" | "dark");
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateEffectiveMode = () => {
      setEffectiveMode(mediaQuery.matches ? "dark" : "light");
    };

    updateEffectiveMode();
    mediaQuery.addEventListener("change", updateEffectiveMode);
    return () => mediaQuery.removeEventListener("change", updateEffectiveMode);
  }, [mode]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const colors = effectiveMode === "dark" ? darkColors : lightColors;

    // Apply mode class
    if (effectiveMode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply colors as CSS variables
    if (colors) {
      Object.entries(colors).forEach(([key, value]) => {
        const hsl = hexToHsl(value);
        root.style.setProperty(`--${key}`, `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      });
    }

    localStorage.setItem("theme-mode", mode);
  }, [mode, effectiveMode, lightColors, darkColors]);

  // Apply mode-specific styling
  useEffect(() => {
    const root = document.documentElement;
    
    // Background
    const bgConfig = effectiveMode === 'dark' ? darkBackgroundConfig : lightBackgroundConfig;
    if (bgConfig.gradient.enabled) {
      root.style.setProperty('--page-bg', generateGradientCSS(bgConfig.gradient));
    } else {
      root.style.setProperty('--page-bg', bgConfig.color);
    }
    
    // Buttons
    const btnConfig = effectiveMode === 'dark' ? darkButtonConfig : lightButtonConfig;
    if (btnConfig.gradient.enabled) {
      root.style.setProperty('--button-bg', generateGradientCSS(btnConfig.gradient));
    } else {
      root.style.setProperty('--button-bg', btnConfig.colors.default);
    }
    root.style.setProperty('--button-hover', btnConfig.colors.hover);
    root.style.setProperty('--button-active', btnConfig.colors.active);
    root.style.setProperty('--button-text', btnConfig.colors.text);
    
    // Sidebar
    const sidebarConfig = effectiveMode === 'dark' ? darkSidebarConfig : lightSidebarConfig;
    if (sidebarConfig.gradient.enabled) {
      root.style.setProperty('--sidebar-bg', generateGradientCSS(sidebarConfig.gradient));
    } else {
      root.style.setProperty('--sidebar-bg', sidebarConfig.colors.background);
    }
    root.style.setProperty('--sidebar-text', sidebarConfig.colors.text);
    root.style.setProperty('--sidebar-active-bg', sidebarConfig.colors.activeBackground);
    root.style.setProperty('--sidebar-active-text', sidebarConfig.colors.activeText);
    root.style.setProperty('--sidebar-hover-bg', sidebarConfig.colors.hoverBackground);
    root.style.setProperty('--tab-bar-bg', sidebarConfig.colors.tabBarBackground);
    root.style.setProperty('--tab-active-bg', sidebarConfig.colors.tabActiveBackground);
    root.style.setProperty('--tab-active-text', sidebarConfig.colors.tabActiveText);
    root.style.setProperty('--tab-active-border', sidebarConfig.colors.tabActiveBorder);
    root.style.setProperty('--tab-inactive-text', sidebarConfig.colors.tabInactiveText);
    root.style.setProperty('--tab-hover-bg', sidebarConfig.colors.tabHoverBackground);
    
    // Cards
    const cardConfig = effectiveMode === 'dark' ? darkCardConfig : lightCardConfig;
    if (cardConfig.gradient.enabled) {
      root.style.setProperty('--card-bg', generateGradientCSS(cardConfig.gradient));
    } else {
      root.style.setProperty('--card-bg', cardConfig.background);
    }
    const borderRgba = hexToRgba(cardConfig.border.color, cardConfig.border.opacity / 100);
    root.style.setProperty('--card-border', borderRgba);
    root.style.setProperty('--card-border-width', `${cardConfig.border.width}px`);
    const { shadow } = cardConfig;
    const shadowRgba = hexToRgba(shadow.color, shadow.opacity / 100);
    root.style.setProperty('--card-shadow', 
      `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.spread}px ${shadowRgba}`
    );

    // Glass
    const glassConfig = effectiveMode === 'dark' ? darkGlassConfig : lightGlassConfig;
    root.style.setProperty('--glass-blur', `${glassConfig.blurAmount}px`);
    root.style.setProperty('--glass-bg-opacity', `${glassConfig.backgroundOpacity / 100}`);
    root.style.setProperty('--glass-chrome-intensity', `${glassConfig.chromeIntensity / 100}`);
    const tintRgba = hexToRgba(glassConfig.tintColor, 0.05);
    root.style.setProperty('--glass-tint', tintRgba);

    // Status colors
    const statusColors = effectiveMode === 'dark' ? darkStatusColors : lightStatusColors;
    if (statusColors) {
      Object.entries(statusColors).forEach(([key, value]) => {
        const hsl = hexToHsl(value);
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        root.style.setProperty(`--status-${cssKey}`, `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      });
    }

    // Dividers
    const dividerConfig = effectiveMode === 'dark' ? darkDividerConfig : lightDividerConfig;
    const dividerRgba = hexToRgba(dividerConfig.color, dividerConfig.opacity / 100);
    root.style.setProperty('--divider-color', dividerRgba);
    root.style.setProperty('--divider-width', `${dividerConfig.width}px`);
    root.style.setProperty('--divider-style', dividerConfig.style);
  }, [effectiveMode, lightButtonConfig, darkButtonConfig, lightSidebarConfig, darkSidebarConfig, 
      lightBackgroundConfig, darkBackgroundConfig, lightCardConfig, darkCardConfig, 
      lightGlassConfig, darkGlassConfig, lightStatusColors, darkStatusColors, 
      lightDividerConfig, darkDividerConfig]);

  // =============================================================================
  // UPDATE FUNCTIONS
  // =============================================================================

  const updateLightColor = (key: keyof ThemeColors, value: string) => {
    const newColors = { ...lightColors, [key]: value };
    setLightColors(newColors);
    localStorage.setItem("theme-light-colors", JSON.stringify(newColors));
  };

  const updateDarkColor = (key: keyof ThemeColors, value: string) => {
    const newColors = { ...darkColors, [key]: value };
    setDarkColors(newColors);
    localStorage.setItem("theme-dark-colors", JSON.stringify(newColors));
  };

  // Button configs
  const updateLightButtonColor = (key: keyof ButtonColors, value: string) => {
    const newConfig = { ...lightButtonConfig, colors: { ...lightButtonConfig.colors, [key]: value } };
    setLightButtonConfig(newConfig);
    localStorage.setItem("theme-light-button-config", JSON.stringify(newConfig));
  };

  const updateLightButtonGradient = (config: Partial<GradientConfig>) => {
    const newConfig = { ...lightButtonConfig, gradient: { ...lightButtonConfig.gradient, ...config } };
    setLightButtonConfig(newConfig);
    localStorage.setItem("theme-light-button-config", JSON.stringify(newConfig));
  };

  const addLightButtonGradientStop = () => {
    const newStop: GradientStop = { id: Date.now().toString(), color: "#28a882", position: 50 };
    const newStops = [...lightButtonConfig.gradient.stops, newStop].sort((a, b) => a.position - b.position);
    updateLightButtonGradient({ stops: newStops });
  };

  const removeLightButtonGradientStop = (id: string) => {
    if (lightButtonConfig.gradient.stops.length <= 2) return;
    const newStops = lightButtonConfig.gradient.stops.filter(s => s.id !== id);
    updateLightButtonGradient({ stops: newStops });
  };

  const updateLightButtonGradientStop = (id: string, updates: Partial<GradientStop>) => {
    const newStops = lightButtonConfig.gradient.stops.map(s => s.id === id ? { ...s, ...updates } : s);
    updateLightButtonGradient({ stops: newStops });
  };

  const updateDarkButtonColor = (key: keyof ButtonColors, value: string) => {
    const newConfig = { ...darkButtonConfig, colors: { ...darkButtonConfig.colors, [key]: value } };
    setDarkButtonConfig(newConfig);
    localStorage.setItem("theme-dark-button-config", JSON.stringify(newConfig));
  };

  const updateDarkButtonGradient = (config: Partial<GradientConfig>) => {
    const newConfig = { ...darkButtonConfig, gradient: { ...darkButtonConfig.gradient, ...config } };
    setDarkButtonConfig(newConfig);
    localStorage.setItem("theme-dark-button-config", JSON.stringify(newConfig));
  };

  const addDarkButtonGradientStop = () => {
    const newStop: GradientStop = { id: Date.now().toString(), color: "#1d7a62", position: 50 };
    const newStops = [...darkButtonConfig.gradient.stops, newStop].sort((a, b) => a.position - b.position);
    updateDarkButtonGradient({ stops: newStops });
  };

  const removeDarkButtonGradientStop = (id: string) => {
    if (darkButtonConfig.gradient.stops.length <= 2) return;
    const newStops = darkButtonConfig.gradient.stops.filter(s => s.id !== id);
    updateDarkButtonGradient({ stops: newStops });
  };

  const updateDarkButtonGradientStop = (id: string, updates: Partial<GradientStop>) => {
    const newStops = darkButtonConfig.gradient.stops.map(s => s.id === id ? { ...s, ...updates } : s);
    updateDarkButtonGradient({ stops: newStops });
  };

  // Sidebar configs
  const updateLightSidebarColor = (key: keyof SidebarColors, value: string) => {
    const newConfig = { ...lightSidebarConfig, colors: { ...lightSidebarConfig.colors, [key]: value } };
    setLightSidebarConfig(newConfig);
    localStorage.setItem("theme-light-sidebar-config", JSON.stringify(newConfig));
  };

  const updateLightSidebarGradient = (config: Partial<GradientConfig>) => {
    const newConfig = { ...lightSidebarConfig, gradient: { ...lightSidebarConfig.gradient, ...config } };
    setLightSidebarConfig(newConfig);
    localStorage.setItem("theme-light-sidebar-config", JSON.stringify(newConfig));
  };

  const addLightSidebarGradientStop = () => {
    const newStop: GradientStop = { id: Date.now().toString(), color: "#e8f0ed", position: 50 };
    const newStops = [...lightSidebarConfig.gradient.stops, newStop].sort((a, b) => a.position - b.position);
    updateLightSidebarGradient({ stops: newStops });
  };

  const removeLightSidebarGradientStop = (id: string) => {
    if (lightSidebarConfig.gradient.stops.length <= 2) return;
    const newStops = lightSidebarConfig.gradient.stops.filter(s => s.id !== id);
    updateLightSidebarGradient({ stops: newStops });
  };

  const updateLightSidebarGradientStop = (id: string, updates: Partial<GradientStop>) => {
    const newStops = lightSidebarConfig.gradient.stops.map(s => s.id === id ? { ...s, ...updates } : s);
    updateLightSidebarGradient({ stops: newStops });
  };

  const updateDarkSidebarColor = (key: keyof SidebarColors, value: string) => {
    const newConfig = { ...darkSidebarConfig, colors: { ...darkSidebarConfig.colors, [key]: value } };
    setDarkSidebarConfig(newConfig);
    localStorage.setItem("theme-dark-sidebar-config", JSON.stringify(newConfig));
  };

  const updateDarkSidebarGradient = (config: Partial<GradientConfig>) => {
    const newConfig = { ...darkSidebarConfig, gradient: { ...darkSidebarConfig.gradient, ...config } };
    setDarkSidebarConfig(newConfig);
    localStorage.setItem("theme-dark-sidebar-config", JSON.stringify(newConfig));
  };

  const addDarkSidebarGradientStop = () => {
    const newStop: GradientStop = { id: Date.now().toString(), color: "#1a1d28", position: 50 };
    const newStops = [...darkSidebarConfig.gradient.stops, newStop].sort((a, b) => a.position - b.position);
    updateDarkSidebarGradient({ stops: newStops });
  };

  const removeDarkSidebarGradientStop = (id: string) => {
    if (darkSidebarConfig.gradient.stops.length <= 2) return;
    const newStops = darkSidebarConfig.gradient.stops.filter(s => s.id !== id);
    updateDarkSidebarGradient({ stops: newStops });
  };

  const updateDarkSidebarGradientStop = (id: string, updates: Partial<GradientStop>) => {
    const newStops = darkSidebarConfig.gradient.stops.map(s => s.id === id ? { ...s, ...updates } : s);
    updateDarkSidebarGradient({ stops: newStops });
  };

  // Background configs
  const updateLightBackgroundColor = (value: string) => {
    const newConfig = { ...lightBackgroundConfig, color: value };
    setLightBackgroundConfig(newConfig);
    localStorage.setItem("theme-light-background-config", JSON.stringify(newConfig));
  };

  const updateLightBackgroundGradient = (config: Partial<GradientConfig>) => {
    const newConfig = { ...lightBackgroundConfig, gradient: { ...lightBackgroundConfig.gradient, ...config } };
    setLightBackgroundConfig(newConfig);
    localStorage.setItem("theme-light-background-config", JSON.stringify(newConfig));
  };

  const addLightBackgroundGradientStop = () => {
    const newStop: GradientStop = { id: Date.now().toString(), color: "#f1f5f9", position: 50 };
    const newStops = [...lightBackgroundConfig.gradient.stops, newStop].sort((a, b) => a.position - b.position);
    updateLightBackgroundGradient({ stops: newStops });
  };

  const removeLightBackgroundGradientStop = (id: string) => {
    if (lightBackgroundConfig.gradient.stops.length <= 2) return;
    const newStops = lightBackgroundConfig.gradient.stops.filter(s => s.id !== id);
    updateLightBackgroundGradient({ stops: newStops });
  };

  const updateLightBackgroundGradientStop = (id: string, updates: Partial<GradientStop>) => {
    const newStops = lightBackgroundConfig.gradient.stops.map(s => s.id === id ? { ...s, ...updates } : s);
    updateLightBackgroundGradient({ stops: newStops });
  };

  const updateDarkBackgroundColor = (value: string) => {
    const newConfig = { ...darkBackgroundConfig, color: value };
    setDarkBackgroundConfig(newConfig);
    localStorage.setItem("theme-dark-background-config", JSON.stringify(newConfig));
  };

  const updateDarkBackgroundGradient = (config: Partial<GradientConfig>) => {
    const newConfig = { ...darkBackgroundConfig, gradient: { ...darkBackgroundConfig.gradient, ...config } };
    setDarkBackgroundConfig(newConfig);
    localStorage.setItem("theme-dark-background-config", JSON.stringify(newConfig));
  };

  const addDarkBackgroundGradientStop = () => {
    const newStop: GradientStop = { id: Date.now().toString(), color: "#1a1d28", position: 50 };
    const newStops = [...darkBackgroundConfig.gradient.stops, newStop].sort((a, b) => a.position - b.position);
    updateDarkBackgroundGradient({ stops: newStops });
  };

  const removeDarkBackgroundGradientStop = (id: string) => {
    if (darkBackgroundConfig.gradient.stops.length <= 2) return;
    const newStops = darkBackgroundConfig.gradient.stops.filter(s => s.id !== id);
    updateDarkBackgroundGradient({ stops: newStops });
  };

  const updateDarkBackgroundGradientStop = (id: string, updates: Partial<GradientStop>) => {
    const newStops = darkBackgroundConfig.gradient.stops.map(s => s.id === id ? { ...s, ...updates } : s);
    updateDarkBackgroundGradient({ stops: newStops });
  };

  // Card configs
  const updateLightCardBackground = (value: string) => {
    const newConfig = { ...lightCardConfig, background: value };
    setLightCardConfig(newConfig);
    localStorage.setItem("theme-light-card-config", JSON.stringify(newConfig));
  };

  const updateLightCardGradient = (config: Partial<GradientConfig>) => {
    const newConfig = { ...lightCardConfig, gradient: { ...lightCardConfig.gradient, ...config } };
    setLightCardConfig(newConfig);
    localStorage.setItem("theme-light-card-config", JSON.stringify(newConfig));
  };

  const addLightCardGradientStop = () => {
    const newStop: GradientStop = { id: Date.now().toString(), color: "#f1f5f9", position: 50 };
    const newStops = [...lightCardConfig.gradient.stops, newStop].sort((a, b) => a.position - b.position);
    updateLightCardGradient({ stops: newStops });
  };

  const removeLightCardGradientStop = (id: string) => {
    if (lightCardConfig.gradient.stops.length <= 2) return;
    const newStops = lightCardConfig.gradient.stops.filter(s => s.id !== id);
    updateLightCardGradient({ stops: newStops });
  };

  const updateLightCardGradientStop = (id: string, updates: Partial<GradientStop>) => {
    const newStops = lightCardConfig.gradient.stops.map(s => s.id === id ? { ...s, ...updates } : s);
    updateLightCardGradient({ stops: newStops });
  };

  const updateLightCardBorder = (updates: Partial<CardBorderConfig>) => {
    const newConfig = { ...lightCardConfig, border: { ...lightCardConfig.border, ...updates } };
    setLightCardConfig(newConfig);
    localStorage.setItem("theme-light-card-config", JSON.stringify(newConfig));
  };

  const updateLightCardShadow = (updates: Partial<CardShadowConfig>) => {
    const newConfig = { ...lightCardConfig, shadow: { ...lightCardConfig.shadow, ...updates } };
    setLightCardConfig(newConfig);
    localStorage.setItem("theme-light-card-config", JSON.stringify(newConfig));
  };

  const updateDarkCardBackground = (value: string) => {
    const newConfig = { ...darkCardConfig, background: value };
    setDarkCardConfig(newConfig);
    localStorage.setItem("theme-dark-card-config", JSON.stringify(newConfig));
  };

  const updateDarkCardGradient = (config: Partial<GradientConfig>) => {
    const newConfig = { ...darkCardConfig, gradient: { ...darkCardConfig.gradient, ...config } };
    setDarkCardConfig(newConfig);
    localStorage.setItem("theme-dark-card-config", JSON.stringify(newConfig));
  };

  const addDarkCardGradientStop = () => {
    const newStop: GradientStop = { id: Date.now().toString(), color: "#1a1d28", position: 50 };
    const newStops = [...darkCardConfig.gradient.stops, newStop].sort((a, b) => a.position - b.position);
    updateDarkCardGradient({ stops: newStops });
  };

  const removeDarkCardGradientStop = (id: string) => {
    if (darkCardConfig.gradient.stops.length <= 2) return;
    const newStops = darkCardConfig.gradient.stops.filter(s => s.id !== id);
    updateDarkCardGradient({ stops: newStops });
  };

  const updateDarkCardGradientStop = (id: string, updates: Partial<GradientStop>) => {
    const newStops = darkCardConfig.gradient.stops.map(s => s.id === id ? { ...s, ...updates } : s);
    updateDarkCardGradient({ stops: newStops });
  };

  const updateDarkCardBorder = (updates: Partial<CardBorderConfig>) => {
    const newConfig = { ...darkCardConfig, border: { ...darkCardConfig.border, ...updates } };
    setDarkCardConfig(newConfig);
    localStorage.setItem("theme-dark-card-config", JSON.stringify(newConfig));
  };

  const updateDarkCardShadow = (updates: Partial<CardShadowConfig>) => {
    const newConfig = { ...darkCardConfig, shadow: { ...darkCardConfig.shadow, ...updates } };
    setDarkCardConfig(newConfig);
    localStorage.setItem("theme-dark-card-config", JSON.stringify(newConfig));
  };

  // Glass configs
  const updateLightGlass = (updates: Partial<GlassConfig>) => {
    const newConfig = { ...lightGlassConfig, ...updates };
    setLightGlassConfig(newConfig);
    localStorage.setItem("theme-light-glass-config", JSON.stringify(newConfig));
  };

  const updateDarkGlass = (updates: Partial<GlassConfig>) => {
    const newConfig = { ...darkGlassConfig, ...updates };
    setDarkGlassConfig(newConfig);
    localStorage.setItem("theme-dark-glass-config", JSON.stringify(newConfig));
  };

  // Status colors
  const updateLightStatusColor = (key: keyof StatusColors, value: string) => {
    const newColors = { ...lightStatusColors, [key]: value };
    setLightStatusColors(newColors);
    localStorage.setItem("theme-light-status-colors", JSON.stringify(newColors));
  };

  const updateDarkStatusColor = (key: keyof StatusColors, value: string) => {
    const newColors = { ...darkStatusColors, [key]: value };
    setDarkStatusColors(newColors);
    localStorage.setItem("theme-dark-status-colors", JSON.stringify(newColors));
  };

  // Divider configs
  const updateLightDivider = (updates: Partial<DividerConfig>) => {
    const newConfig = { ...lightDividerConfig, ...updates };
    setLightDividerConfig(newConfig);
    localStorage.setItem("theme-light-divider-config", JSON.stringify(newConfig));
  };

  const updateDarkDivider = (updates: Partial<DividerConfig>) => {
    const newConfig = { ...darkDividerConfig, ...updates };
    setDarkDividerConfig(newConfig);
    localStorage.setItem("theme-dark-divider-config", JSON.stringify(newConfig));
  };

  // =============================================================================
  // DATABASE OPERATIONS
  // =============================================================================

  const saveTheme = useCallback(async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const themeData = {
        mode,
        light_colors: lightColors,
        dark_colors: darkColors,
        light_button_config: lightButtonConfig,
        dark_button_config: darkButtonConfig,
        light_sidebar_config: lightSidebarConfig,
        dark_sidebar_config: darkSidebarConfig,
        light_background_config: lightBackgroundConfig,
        dark_background_config: darkBackgroundConfig,
        light_card_config: lightCardConfig,
        dark_card_config: darkCardConfig,
        light_glass_config: lightGlassConfig,
        dark_glass_config: darkGlassConfig,
        light_status_colors: lightStatusColors,
        dark_status_colors: darkStatusColors,
        light_divider_config: lightDividerConfig,
        dark_divider_config: darkDividerConfig,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };
      
      if (currentClientId && !isAgencyAdmin) {
        // Client-level save (custom theme)
        const { error } = await supabase
          .from('client_theme_settings')
          .upsert({
            client_id: currentClientId,
            theme_source: 'custom',
            ...themeData,
          }, { onConflict: 'client_id' });
        
        if (error) throw error;
      } else {
        // Agency-level save
        const { data: existing } = await supabase
          .from('agency_theme_settings')
          .select('id')
          .limit(1)
          .single();
        
        if (existing) {
          const { error } = await supabase
            .from('agency_theme_settings')
            .update(themeData)
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('agency_theme_settings')
            .insert(themeData);
          if (error) throw error;
        }
      }
      
      toast.success("Theme saved successfully!");
    } catch (error) {
      console.error("Failed to save theme:", error);
      toast.error("Failed to save theme");
    } finally {
      setIsSaving(false);
    }
  }, [mode, lightColors, darkColors, lightButtonConfig, darkButtonConfig, 
      lightSidebarConfig, darkSidebarConfig, lightBackgroundConfig, darkBackgroundConfig,
      lightCardConfig, darkCardConfig, lightGlassConfig, darkGlassConfig,
      lightStatusColors, darkStatusColors, lightDividerConfig, darkDividerConfig,
      currentClientId, isAgencyAdmin]);

  const applyThemeConfig = useCallback((data: Record<string, unknown>) => {
    if (data.mode) setMode(data.mode as "light" | "dark" | "system");
    if (data.light_colors) setLightColors({ ...defaultLightColors, ...(data.light_colors as ThemeColors) });
    if (data.dark_colors) setDarkColors({ ...defaultDarkColors, ...(data.dark_colors as ThemeColors) });
    if (data.light_button_config) setLightButtonConfig({ ...defaultLightButtonConfig, ...(data.light_button_config as ModeSpecificButtonConfig) });
    if (data.dark_button_config) setDarkButtonConfig({ ...defaultDarkButtonConfig, ...(data.dark_button_config as ModeSpecificButtonConfig) });
    if (data.light_sidebar_config) setLightSidebarConfig({ ...defaultLightSidebarConfig, ...(data.light_sidebar_config as ModeSpecificSidebarConfig) });
    if (data.dark_sidebar_config) setDarkSidebarConfig({ ...defaultDarkSidebarConfig, ...(data.dark_sidebar_config as ModeSpecificSidebarConfig) });
    if (data.light_background_config) setLightBackgroundConfig({ ...defaultLightBackgroundConfig, ...(data.light_background_config as ModeSpecificBackgroundConfig) });
    if (data.dark_background_config) setDarkBackgroundConfig({ ...defaultDarkBackgroundConfig, ...(data.dark_background_config as ModeSpecificBackgroundConfig) });
    if (data.light_card_config) setLightCardConfig({ ...defaultLightCardConfig, ...(data.light_card_config as ModeSpecificCardConfig) });
    if (data.dark_card_config) setDarkCardConfig({ ...defaultDarkCardConfig, ...(data.dark_card_config as ModeSpecificCardConfig) });
    if (data.light_glass_config) setLightGlassConfig({ ...defaultLightGlassConfig, ...(data.light_glass_config as GlassConfig) });
    if (data.dark_glass_config) setDarkGlassConfig({ ...defaultDarkGlassConfig, ...(data.dark_glass_config as GlassConfig) });
    if (data.light_status_colors) setLightStatusColors({ ...defaultLightStatusColors, ...(data.light_status_colors as StatusColors) });
    if (data.dark_status_colors) setDarkStatusColors({ ...defaultDarkStatusColors, ...(data.dark_status_colors as StatusColors) });
    if (data.light_divider_config) setLightDividerConfig({ ...defaultLightDividerConfig, ...(data.light_divider_config as DividerConfig) });
    if (data.dark_divider_config) setDarkDividerConfig({ ...defaultDarkDividerConfig, ...(data.dark_divider_config as DividerConfig) });
  }, []);

  const loadTheme = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      // If client context is set, try to load client theme first
      if (currentClientId) {
        const { data: clientTheme } = await supabase
          .from('client_theme_settings')
          .select('*')
          .eq('client_id', currentClientId)
          .single();
        
        if (clientTheme) {
          setThemeSource(clientTheme.theme_source as ThemeSource);
          setIsThemeLocked(clientTheme.is_locked || false);
          
          if (clientTheme.theme_source === 'template' && clientTheme.template_id) {
            // Load template
            const { data: template } = await supabase
              .from('theme_templates')
              .select('theme_config')
              .eq('id', clientTheme.template_id)
              .single();
            
            if (template?.theme_config) {
              applyThemeConfig(template.theme_config as Record<string, unknown>);
              return;
            }
          } else if (clientTheme.theme_source === 'custom') {
            applyThemeConfig(clientTheme as unknown as Record<string, unknown>);
            return;
          }
        }
      }
      
      // Fall back to agency theme
      const { data: agencyTheme } = await supabase
        .from('agency_theme_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (agencyTheme) {
        setThemeSource('agency');
        applyThemeConfig(agencyTheme as unknown as Record<string, unknown>);
      }
    } catch (error) {
      console.error("Failed to load theme:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentClientId, applyThemeConfig]);

  const setClientContext = useCallback((clientId: string | null) => {
    setCurrentClientId(clientId);
  }, []);

  // Load theme and presets on mount
  useEffect(() => {
    loadTheme();
    loadCustomPresets();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadTheme();
        loadCustomPresets();
      } else if (event === 'SIGNED_OUT') {
        setCustomPresets([]);
      }
    });
    
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload theme when client context changes
  useEffect(() => {
    if (currentClientId !== null) {
      loadTheme();
    }
  }, [currentClientId, loadTheme]);

  const loadCustomPresets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('custom_theme_presets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCustomPresets(data || []);
    } catch (error) {
      console.error("Failed to load custom presets:", error);
    }
  };

  const applyPreset = useCallback((theme: CompleteTheme, mode: 'light' | 'dark') => {
    if (mode === 'light') {
      if (theme.colors) {
        setLightColors({ ...defaultLightColors, ...theme.colors });
        localStorage.setItem("theme-light-colors", JSON.stringify({ ...defaultLightColors, ...theme.colors }));
      }
      if (theme.sidebarConfig) {
        setLightSidebarConfig({ ...defaultLightSidebarConfig, ...theme.sidebarConfig });
        localStorage.setItem("theme-light-sidebar-config", JSON.stringify({ ...defaultLightSidebarConfig, ...theme.sidebarConfig }));
      }
      if (theme.buttonConfig) {
        setLightButtonConfig({ ...defaultLightButtonConfig, ...theme.buttonConfig });
        localStorage.setItem("theme-light-button-config", JSON.stringify({ ...defaultLightButtonConfig, ...theme.buttonConfig }));
      }
      if (theme.backgroundConfig) {
        setLightBackgroundConfig({ ...defaultLightBackgroundConfig, ...theme.backgroundConfig });
        localStorage.setItem("theme-light-background-config", JSON.stringify({ ...defaultLightBackgroundConfig, ...theme.backgroundConfig }));
      }
      if (theme.cardConfig) {
        setLightCardConfig({ ...defaultLightCardConfig, ...theme.cardConfig });
        localStorage.setItem("theme-light-card-config", JSON.stringify({ ...defaultLightCardConfig, ...theme.cardConfig }));
      }
      if (theme.glassConfig) {
        setLightGlassConfig({ ...defaultLightGlassConfig, ...theme.glassConfig });
        localStorage.setItem("theme-light-glass-config", JSON.stringify({ ...defaultLightGlassConfig, ...theme.glassConfig }));
      }
      if (theme.statusColors) {
        setLightStatusColors({ ...defaultLightStatusColors, ...theme.statusColors });
        localStorage.setItem("theme-light-status-colors", JSON.stringify({ ...defaultLightStatusColors, ...theme.statusColors }));
      }
      if (theme.dividerConfig) {
        setLightDividerConfig({ ...defaultLightDividerConfig, ...theme.dividerConfig });
        localStorage.setItem("theme-light-divider-config", JSON.stringify({ ...defaultLightDividerConfig, ...theme.dividerConfig }));
      }
    } else {
      if (theme.colors) {
        setDarkColors({ ...defaultDarkColors, ...theme.colors });
        localStorage.setItem("theme-dark-colors", JSON.stringify({ ...defaultDarkColors, ...theme.colors }));
      }
      if (theme.sidebarConfig) {
        setDarkSidebarConfig({ ...defaultDarkSidebarConfig, ...theme.sidebarConfig });
        localStorage.setItem("theme-dark-sidebar-config", JSON.stringify({ ...defaultDarkSidebarConfig, ...theme.sidebarConfig }));
      }
      if (theme.buttonConfig) {
        setDarkButtonConfig({ ...defaultDarkButtonConfig, ...theme.buttonConfig });
        localStorage.setItem("theme-dark-button-config", JSON.stringify({ ...defaultDarkButtonConfig, ...theme.buttonConfig }));
      }
      if (theme.backgroundConfig) {
        setDarkBackgroundConfig({ ...defaultDarkBackgroundConfig, ...theme.backgroundConfig });
        localStorage.setItem("theme-dark-background-config", JSON.stringify({ ...defaultDarkBackgroundConfig, ...theme.backgroundConfig }));
      }
      if (theme.cardConfig) {
        setDarkCardConfig({ ...defaultDarkCardConfig, ...theme.cardConfig });
        localStorage.setItem("theme-dark-card-config", JSON.stringify({ ...defaultDarkCardConfig, ...theme.cardConfig }));
      }
      if (theme.glassConfig) {
        setDarkGlassConfig({ ...defaultDarkGlassConfig, ...theme.glassConfig });
        localStorage.setItem("theme-dark-glass-config", JSON.stringify({ ...defaultDarkGlassConfig, ...theme.glassConfig }));
      }
      if (theme.statusColors) {
        setDarkStatusColors({ ...defaultDarkStatusColors, ...theme.statusColors });
        localStorage.setItem("theme-dark-status-colors", JSON.stringify({ ...defaultDarkStatusColors, ...theme.statusColors }));
      }
      if (theme.dividerConfig) {
        setDarkDividerConfig({ ...defaultDarkDividerConfig, ...theme.dividerConfig });
        localStorage.setItem("theme-dark-divider-config", JSON.stringify({ ...defaultDarkDividerConfig, ...theme.dividerConfig }));
      }
    }
  }, []);

  const saveCustomPreset = useCallback(async (name: string, mode: 'light' | 'dark') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const themeConfig: CompleteTheme = mode === 'light' ? {
        colors: lightColors,
        sidebarConfig: lightSidebarConfig,
        buttonConfig: lightButtonConfig,
        backgroundConfig: lightBackgroundConfig,
        cardConfig: lightCardConfig,
        glassConfig: lightGlassConfig,
        statusColors: lightStatusColors,
        dividerConfig: lightDividerConfig,
      } : {
        colors: darkColors,
        sidebarConfig: darkSidebarConfig,
        buttonConfig: darkButtonConfig,
        backgroundConfig: darkBackgroundConfig,
        cardConfig: darkCardConfig,
        glassConfig: darkGlassConfig,
        statusColors: darkStatusColors,
        dividerConfig: darkDividerConfig,
      };
      
      const previewColors = {
        primary: themeConfig.colors.primary,
        secondary: themeConfig.colors.secondary,
        accent: themeConfig.colors.accent,
      };
      
      // Check if preset exists
      const { data: existing } = await supabase
        .from('custom_theme_presets')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', name)
        .eq('mode', mode)
        .single();
      
      if (existing) {
        const { error } = await supabase
          .from('custom_theme_presets')
          .update({ theme_config: themeConfig, preview_colors: previewColors, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('custom_theme_presets')
          .insert({
            user_id: user.id,
            name,
            mode,
            theme_config: themeConfig,
            preview_colors: previewColors,
          });
        if (error) throw error;
      }
      
      await loadCustomPresets();
      toast.success("Preset saved!");
    } catch (error) {
      console.error("Failed to save preset:", error);
      toast.error("Failed to save preset");
      throw error;
    }
  }, [lightColors, darkColors, lightSidebarConfig, darkSidebarConfig, 
      lightButtonConfig, darkButtonConfig, lightBackgroundConfig, darkBackgroundConfig,
      lightCardConfig, darkCardConfig, lightGlassConfig, darkGlassConfig,
      lightStatusColors, darkStatusColors, lightDividerConfig, darkDividerConfig]);

  const deleteCustomPreset = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_theme_presets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await loadCustomPresets();
      toast.success("Preset deleted");
    } catch (error) {
      console.error("Failed to delete preset:", error);
      toast.error("Failed to delete preset");
      throw error;
    }
  }, []);

  const resetToDefaults = () => {
    setLightColors(defaultLightColors);
    setDarkColors(defaultDarkColors);
    setLightButtonConfig(defaultLightButtonConfig);
    setDarkButtonConfig(defaultDarkButtonConfig);
    setLightSidebarConfig(defaultLightSidebarConfig);
    setDarkSidebarConfig(defaultDarkSidebarConfig);
    setLightBackgroundConfig(defaultLightBackgroundConfig);
    setDarkBackgroundConfig(defaultDarkBackgroundConfig);
    setLightCardConfig(defaultLightCardConfig);
    setDarkCardConfig(defaultDarkCardConfig);
    setLightGlassConfig(defaultLightGlassConfig);
    setDarkGlassConfig(defaultDarkGlassConfig);
    setLightStatusColors(defaultLightStatusColors);
    setDarkStatusColors(defaultDarkStatusColors);
    setLightDividerConfig(defaultLightDividerConfig);
    setDarkDividerConfig(defaultDarkDividerConfig);
    
    // Clear localStorage
    const keys = [
      "theme-light-colors", "theme-dark-colors",
      "theme-light-button-config", "theme-dark-button-config",
      "theme-light-sidebar-config", "theme-dark-sidebar-config",
      "theme-light-background-config", "theme-dark-background-config",
      "theme-light-card-config", "theme-dark-card-config",
      "theme-light-glass-config", "theme-dark-glass-config",
      "theme-light-status-colors", "theme-dark-status-colors",
      "theme-light-divider-config", "theme-dark-divider-config",
    ];
    keys.forEach(key => localStorage.removeItem(key));
    
    toast.success("Theme reset to defaults");
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        effectiveMode,
        setMode,
        themeSource,
        isThemeLocked,
        currentClientId,
        lightColors,
        darkColors,
        updateLightColor,
        updateDarkColor,
        lightCardConfig,
        darkCardConfig,
        updateLightCardBackground,
        updateDarkCardBackground,
        updateLightCardGradient,
        updateDarkCardGradient,
        addLightCardGradientStop,
        addDarkCardGradientStop,
        removeLightCardGradientStop,
        removeDarkCardGradientStop,
        updateLightCardGradientStop,
        updateDarkCardGradientStop,
        updateLightCardBorder,
        updateDarkCardBorder,
        updateLightCardShadow,
        updateDarkCardShadow,
        lightButtonConfig,
        darkButtonConfig,
        updateLightButtonColor,
        updateDarkButtonColor,
        updateLightButtonGradient,
        updateDarkButtonGradient,
        addLightButtonGradientStop,
        addDarkButtonGradientStop,
        removeLightButtonGradientStop,
        removeDarkButtonGradientStop,
        updateLightButtonGradientStop,
        updateDarkButtonGradientStop,
        lightSidebarConfig,
        darkSidebarConfig,
        updateLightSidebarColor,
        updateDarkSidebarColor,
        updateLightSidebarGradient,
        updateDarkSidebarGradient,
        addLightSidebarGradientStop,
        addDarkSidebarGradientStop,
        removeLightSidebarGradientStop,
        removeDarkSidebarGradientStop,
        updateLightSidebarGradientStop,
        updateDarkSidebarGradientStop,
        lightBackgroundConfig,
        darkBackgroundConfig,
        updateLightBackgroundColor,
        updateDarkBackgroundColor,
        updateLightBackgroundGradient,
        updateDarkBackgroundGradient,
        addLightBackgroundGradientStop,
        addDarkBackgroundGradientStop,
        removeLightBackgroundGradientStop,
        removeDarkBackgroundGradientStop,
        updateLightBackgroundGradientStop,
        updateDarkBackgroundGradientStop,
        lightGlassConfig,
        darkGlassConfig,
        updateLightGlass,
        updateDarkGlass,
        lightStatusColors,
        darkStatusColors,
        updateLightStatusColor,
        updateDarkStatusColor,
        lightDividerConfig,
        darkDividerConfig,
        updateLightDivider,
        updateDarkDivider,
        resetToDefaults,
        saveTheme,
        loadTheme,
        setClientContext,
        customPresets,
        applyPreset,
        saveCustomPreset,
        deleteCustomPreset,
        isSaving,
        isLoading,
        isAgencyAdmin,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

