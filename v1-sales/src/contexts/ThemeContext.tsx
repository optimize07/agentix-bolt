import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  opacity: number;      // 0-100
  blur: number;         // blur radius in px
  spread: number;       // spread radius in px  
  offsetX: number;      // horizontal offset in px
  offsetY: number;      // vertical offset in px
}

interface CardBorderConfig {
  color: string;
  opacity: number;      // 0-100
  width: number;        // border width in px
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

interface ThemeContextType {
  mode: "light" | "dark" | "system";
  effectiveMode: "light" | "dark";
  setMode: (mode: "light" | "dark" | "system") => void;
  lightColors: ThemeColors;
  darkColors: ThemeColors;
  updateLightColor: (key: keyof ThemeColors, value: string) => void;
  updateDarkColor: (key: keyof ThemeColors, value: string) => void;
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
  lightGlassConfig: GlassConfig;
  darkGlassConfig: GlassConfig;
  updateLightGlass: (updates: Partial<GlassConfig>) => void;
  updateDarkGlass: (updates: Partial<GlassConfig>) => void;
  lightStatusColors: StatusColors;
  darkStatusColors: StatusColors;
  updateLightStatusColor: (key: keyof StatusColors, value: string) => void;
  updateDarkStatusColor: (key: keyof StatusColors, value: string) => void;
  lightDividerConfig: DividerConfig;
  darkDividerConfig: DividerConfig;
  updateLightDivider: (updates: Partial<DividerConfig>) => void;
  updateDarkDivider: (updates: Partial<DividerConfig>) => void;
  resetToDefaults: () => void;
  saveThemeToDatabase: () => Promise<void>;
  loadThemeFromDatabase: () => Promise<void>;
  isSaving: boolean;
  isLoading: boolean;
  customPresets: Array<{ id: string; name: string; mode: string; colors: any }>;
  applyPreset: (colors: any, mode: 'light' | 'dark') => void;
  saveCustomPreset: (name: string, mode: 'light' | 'dark') => Promise<void>;
  deleteCustomPreset: (id: string) => Promise<void>;
}

const defaultDarkColors: ThemeColors = {
  background: "#0a0c10",
  foreground: "#ffffff",
  primary: "#175c4c",
  secondary: "#1f6e2f",
  accent: "#1d7a62",
  muted: "#252a36",
};

const defaultLightColors: ThemeColors = {
  background: "#ffffff",
  foreground: "#0a0c10",
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
    default: "#175c4c",
    hover: "#1d7a62",
    active: "#124a3d",
    text: "#ffffff",
  },
  gradient: {
    enabled: false,
    type: 'linear',
    angle: 90,
    centerX: 50,
    centerY: 50,
    stops: [
      { id: "1", color: "#175c4c", position: 0 },
      { id: "2", color: "#1d7a62", position: 100 },
    ],
  },
};

const defaultLightSidebarConfig: ModeSpecificSidebarConfig = {
  colors: {
    background: "#f8faf9",
    text: "#0a0c10",
    activeBackground: "#20856a",
    activeText: "#ffffff",
    hoverBackground: "#e8f0ed",
    tabBarBackground: "#f8fafc",
    tabActiveBackground: "#7f1d1d",
    tabActiveText: "#ffffff",
    tabActiveBorder: "#7f1d1d",
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
    activeBackground: "#175c4c",
    activeText: "#ffffff",
    hoverBackground: "#1a1d28",
    tabBarBackground: "#0a0c10",
    tabActiveBackground: "#7f1d1d",
    tabActiveText: "#ffffff",
    tabActiveBorder: "#7f1d1d",
    tabInactiveText: "#a1a1aa",
    tabHoverBackground: "#1a1d24",
  },
  gradient: {
    enabled: false,
    type: 'linear',
    angle: 180,
    centerX: 50,
    centerY: 50,
    stops: [
      { id: "1", color: "#0a0c10", position: 0 },
      { id: "2", color: "#1a1d28", position: 100 },
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
    enabled: false,
    type: 'linear',
    angle: 180,
    centerX: 50,
    centerY: 50,
    stops: [
      { id: "1", color: "#0a0c10", position: 0 },
      { id: "2", color: "#1a1d28", position: 100 },
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
    enabled: false,
    type: 'linear',
    angle: 135,
    centerX: 50,
    centerY: 50,
    stops: [
      { id: "1", color: "#131620", position: 0 },
      { id: "2", color: "#1a1d28", position: 100 },
    ],
  },
  border: {
    color: "#404040",
    opacity: 100,
    width: 1,
  },
  shadow: {
    color: "#000000",
    opacity: 20,
    blur: 8,
    spread: 0,
    offsetX: 0,
    offsetY: 2,
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
  enabled: false,
  blurAmount: 16,
  backgroundOpacity: 15,
  chromeTexture: false,
  chromeIntensity: 0,
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
  color: "#404040",
  opacity: 100,
  width: 1,
  style: 'solid',
};

// Utility functions for color conversion
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

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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

  const [customPresets, setCustomPresets] = useState<Array<{ id: string; name: string; mode: string; colors: any }>>([]);

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

    // Save mode
    localStorage.setItem("theme-mode", mode);
  }, [mode, effectiveMode, lightColors, darkColors]);

  // Apply mode-specific styling
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply background based on effective mode
    const bgConfig = effectiveMode === 'dark' ? darkBackgroundConfig : lightBackgroundConfig;
    if (bgConfig.gradient.enabled) {
      root.style.setProperty('--page-bg', generateGradientCSS(bgConfig.gradient));
    } else {
      root.style.setProperty('--page-bg', bgConfig.color);
    }
    
    // Apply buttons based on effective mode
    const btnConfig = effectiveMode === 'dark' ? darkButtonConfig : lightButtonConfig;
    if (btnConfig.gradient.enabled) {
      const gradientCSS = generateGradientCSS(btnConfig.gradient);
      root.style.setProperty('--button-bg', gradientCSS);
    } else {
      root.style.setProperty('--button-bg', btnConfig.colors.default);
    }
    root.style.setProperty('--button-hover', btnConfig.colors.hover);
    root.style.setProperty('--button-active', btnConfig.colors.active);
    root.style.setProperty('--button-text', btnConfig.colors.text);
    
    // Apply sidebar based on effective mode
    const sidebarConfig = effectiveMode === 'dark' ? darkSidebarConfig : lightSidebarConfig;
    if (sidebarConfig.gradient.enabled) {
      const gradientCSS = generateGradientCSS(sidebarConfig.gradient);
      root.style.setProperty('--sidebar-bg', gradientCSS);
    } else {
      root.style.setProperty('--sidebar-bg', sidebarConfig.colors.background);
    }
    root.style.setProperty('--sidebar-text', sidebarConfig.colors.text);
    root.style.setProperty('--sidebar-active-bg', sidebarConfig.colors.activeBackground);
    root.style.setProperty('--sidebar-active-text', sidebarConfig.colors.activeText);
    root.style.setProperty('--sidebar-hover-bg', sidebarConfig.colors.hoverBackground);
    
    // Apply tab bar colors
    root.style.setProperty('--tab-bar-bg', sidebarConfig.colors.tabBarBackground);
    root.style.setProperty('--tab-active-bg', sidebarConfig.colors.tabActiveBackground);
    root.style.setProperty('--tab-active-text', sidebarConfig.colors.tabActiveText);
    root.style.setProperty('--tab-active-border', sidebarConfig.colors.tabActiveBorder);
    root.style.setProperty('--tab-inactive-text', sidebarConfig.colors.tabInactiveText);
    root.style.setProperty('--tab-hover-bg', sidebarConfig.colors.tabHoverBackground);
    
    // Apply cards based on effective mode
    const cardConfig = effectiveMode === 'dark' ? darkCardConfig : lightCardConfig;
    if (cardConfig.gradient.enabled) {
      const gradientCSS = generateGradientCSS(cardConfig.gradient);
      root.style.setProperty('--card-bg', gradientCSS);
    } else {
      root.style.setProperty('--card-bg', cardConfig.background);
    }
    
    // Border with opacity
    const borderRgba = hexToRgba(cardConfig.border.color, cardConfig.border.opacity / 100);
    root.style.setProperty('--card-border', borderRgba);
    root.style.setProperty('--card-border-width', `${cardConfig.border.width}px`);
    
    // Shadow
    const { shadow } = cardConfig;
    const shadowRgba = hexToRgba(shadow.color, shadow.opacity / 100);
    root.style.setProperty('--card-shadow', 
      `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.spread}px ${shadowRgba}`
    );

    // Apply glass based on effective mode
    const glassConfig = effectiveMode === 'dark' ? darkGlassConfig : lightGlassConfig;
    root.style.setProperty('--glass-blur', `${glassConfig.blurAmount}px`);
    root.style.setProperty('--glass-bg-opacity', `${glassConfig.backgroundOpacity / 100}`);
    root.style.setProperty('--glass-chrome-intensity', `${glassConfig.chromeIntensity / 100}`);
    const tintRgba = hexToRgba(glassConfig.tintColor, 0.05);
    root.style.setProperty('--glass-tint', tintRgba);

    // Apply status colors based on effective mode
    const statusColors = effectiveMode === 'dark' ? darkStatusColors : lightStatusColors;
    if (statusColors) {
      Object.entries(statusColors).forEach(([key, value]) => {
        const hsl = hexToHsl(value);
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        root.style.setProperty(`--status-${cssKey}`, `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      });
    }

    // Apply dividers based on effective mode
    const dividerConfig = effectiveMode === 'dark' ? darkDividerConfig : lightDividerConfig;
    const dividerRgba = hexToRgba(dividerConfig.color, dividerConfig.opacity / 100);
    root.style.setProperty('--divider-color', dividerRgba);
    root.style.setProperty('--divider-width', `${dividerConfig.width}px`);
    root.style.setProperty('--divider-style', dividerConfig.style);
  }, [effectiveMode, lightButtonConfig, darkButtonConfig, lightSidebarConfig, darkSidebarConfig, lightBackgroundConfig, darkBackgroundConfig, lightCardConfig, darkCardConfig, lightGlassConfig, darkGlassConfig, lightStatusColors, darkStatusColors, lightDividerConfig, darkDividerConfig]);

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

  // Light Button Config
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

  // Dark Button Config
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

  // Light Sidebar Config
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

  // Dark Sidebar Config
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

  // Light Background Config
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

  // Dark Background Config
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

  // Light Card Config
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

  // Dark Card Config
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

  // Light Glass Config
  const updateLightGlass = (updates: Partial<GlassConfig>) => {
    const newConfig = { ...lightGlassConfig, ...updates };
    setLightGlassConfig(newConfig);
    localStorage.setItem("theme-light-glass-config", JSON.stringify(newConfig));
  };

  // Dark Glass Config
  const updateDarkGlass = (updates: Partial<GlassConfig>) => {
    const newConfig = { ...darkGlassConfig, ...updates };
    setDarkGlassConfig(newConfig);
    localStorage.setItem("theme-dark-glass-config", JSON.stringify(newConfig));
  };

  // Light Status Colors
  const updateLightStatusColor = (key: keyof StatusColors, value: string) => {
    const newColors = { ...lightStatusColors, [key]: value };
    setLightStatusColors(newColors);
    localStorage.setItem("theme-light-status-colors", JSON.stringify(newColors));
  };

  // Dark Status Colors
  const updateDarkStatusColor = (key: keyof StatusColors, value: string) => {
    const newColors = { ...darkStatusColors, [key]: value };
    setDarkStatusColors(newColors);
    localStorage.setItem("theme-dark-status-colors", JSON.stringify(newColors));
  };

  // Light Divider Config
  const updateLightDivider = (updates: Partial<DividerConfig>) => {
    const newConfig = { ...lightDividerConfig, ...updates };
    setLightDividerConfig(newConfig);
    localStorage.setItem("theme-light-divider-config", JSON.stringify(newConfig));
  };

  // Dark Divider Config
  const updateDarkDivider = (updates: Partial<DividerConfig>) => {
    const newConfig = { ...darkDividerConfig, ...updates };
    setDarkDividerConfig(newConfig);
    localStorage.setItem("theme-dark-divider-config", JSON.stringify(newConfig));
  };

  const saveThemeToDatabase = useCallback(async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      // Get organization ID from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.organization_id) throw new Error("No organization found");
      
      const { error } = await supabase
        .from('organization_theme_settings')
        .upsert({
          user_id: user.id,
          organization_id: profile.organization_id,
          mode,
          light_colors: lightColors as any,
          dark_colors: darkColors as any,
          light_button_config: lightButtonConfig as any,
          dark_button_config: darkButtonConfig as any,
          light_sidebar_config: lightSidebarConfig as any,
          dark_sidebar_config: darkSidebarConfig as any,
          light_background_config: lightBackgroundConfig as any,
          dark_background_config: darkBackgroundConfig as any,
          light_card_config: lightCardConfig as any,
          dark_card_config: darkCardConfig as any,
          light_glass_config: lightGlassConfig as any,
          dark_glass_config: darkGlassConfig as any,
          light_status_colors: lightStatusColors as any,
          dark_status_colors: darkStatusColors as any,
          light_divider_config: lightDividerConfig as any,
          dark_divider_config: darkDividerConfig as any,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id,user_id' });
        
      if (error) throw error;
      toast.success("Theme saved successfully!");
    } catch (error) {
      console.error("Failed to save theme:", error);
      toast.error("Failed to save theme");
    } finally {
      setIsSaving(false);
    }
  }, [mode, lightColors, darkColors, lightButtonConfig, darkButtonConfig, lightSidebarConfig, darkSidebarConfig, lightBackgroundConfig, darkBackgroundConfig, lightCardConfig, darkCardConfig, lightGlassConfig, darkGlassConfig, lightStatusColors, darkStatusColors, lightDividerConfig, darkDividerConfig]);

  const loadThemeFromDatabase = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('organization_theme_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (data && !error) {
        setMode(data.mode as "light" | "dark" | "system");
        
        if (data.light_colors) {
          setLightColors({ ...defaultLightColors, ...(data.light_colors as unknown as ThemeColors) });
        }
        if (data.dark_colors) {
          setDarkColors({ ...defaultDarkColors, ...(data.dark_colors as unknown as ThemeColors) });
        }
        
        if (data.light_button_config) {
          const dbConfig = data.light_button_config as unknown as ModeSpecificButtonConfig;
          setLightButtonConfig({
            ...defaultLightButtonConfig,
            colors: { ...defaultLightButtonConfig.colors, ...dbConfig.colors },
            gradient: { ...defaultLightButtonConfig.gradient, ...dbConfig.gradient },
          });
        }
        if (data.dark_button_config) {
          const dbConfig = data.dark_button_config as unknown as ModeSpecificButtonConfig;
          setDarkButtonConfig({
            ...defaultDarkButtonConfig,
            colors: { ...defaultDarkButtonConfig.colors, ...dbConfig.colors },
            gradient: { ...defaultDarkButtonConfig.gradient, ...dbConfig.gradient },
          });
        }
        
        if (data.light_sidebar_config) {
          const dbConfig = data.light_sidebar_config as unknown as ModeSpecificSidebarConfig;
          setLightSidebarConfig({
            ...defaultLightSidebarConfig,
            colors: { ...defaultLightSidebarConfig.colors, ...dbConfig.colors },
            gradient: { ...defaultLightSidebarConfig.gradient, ...dbConfig.gradient },
          });
        }
        if (data.dark_sidebar_config) {
          const dbConfig = data.dark_sidebar_config as unknown as ModeSpecificSidebarConfig;
          setDarkSidebarConfig({
            ...defaultDarkSidebarConfig,
            colors: { ...defaultDarkSidebarConfig.colors, ...dbConfig.colors },
            gradient: { ...defaultDarkSidebarConfig.gradient, ...dbConfig.gradient },
          });
        }
        
        if (data.light_background_config) {
          const dbConfig = data.light_background_config as unknown as ModeSpecificBackgroundConfig;
          setLightBackgroundConfig({
            ...defaultLightBackgroundConfig,
            ...dbConfig,
            gradient: { ...defaultLightBackgroundConfig.gradient, ...dbConfig.gradient },
          });
        }
        if (data.dark_background_config) {
          const dbConfig = data.dark_background_config as unknown as ModeSpecificBackgroundConfig;
          setDarkBackgroundConfig({
            ...defaultDarkBackgroundConfig,
            ...dbConfig,
            gradient: { ...defaultDarkBackgroundConfig.gradient, ...dbConfig.gradient },
          });
        }
        
        if (data.light_card_config) {
          const dbConfig = data.light_card_config as unknown as ModeSpecificCardConfig;
          setLightCardConfig({
            ...defaultLightCardConfig,
            ...dbConfig,
            gradient: { ...defaultLightCardConfig.gradient, ...dbConfig.gradient },
            border: { ...defaultLightCardConfig.border, ...dbConfig.border },
            shadow: { ...defaultLightCardConfig.shadow, ...dbConfig.shadow },
          });
        }
        if (data.dark_card_config) {
          const dbConfig = data.dark_card_config as unknown as ModeSpecificCardConfig;
          setDarkCardConfig({
            ...defaultDarkCardConfig,
            ...dbConfig,
            gradient: { ...defaultDarkCardConfig.gradient, ...dbConfig.gradient },
            border: { ...defaultDarkCardConfig.border, ...dbConfig.border },
            shadow: { ...defaultDarkCardConfig.shadow, ...dbConfig.shadow },
          });
        }
        
        if (data.light_glass_config) {
          setLightGlassConfig({ ...defaultLightGlassConfig, ...(data.light_glass_config as unknown as GlassConfig) });
        }
        if (data.dark_glass_config) {
          setDarkGlassConfig({ ...defaultDarkGlassConfig, ...(data.dark_glass_config as unknown as GlassConfig) });
        }
        
        if (data.light_status_colors) {
          setLightStatusColors({ ...defaultLightStatusColors, ...(data.light_status_colors as unknown as StatusColors) });
        }
        if (data.dark_status_colors) {
          setDarkStatusColors({ ...defaultDarkStatusColors, ...(data.dark_status_colors as unknown as StatusColors) });
        }
        
        if (data.light_divider_config) {
          setLightDividerConfig({ ...defaultLightDividerConfig, ...(data.light_divider_config as unknown as DividerConfig) });
        }
        if (data.dark_divider_config) {
          setDarkDividerConfig({ ...defaultDarkDividerConfig, ...(data.dark_divider_config as unknown as DividerConfig) });
        }
      }
    } catch (error) {
      console.error("Failed to load theme:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load theme from database on mount
  useEffect(() => {
    loadThemeFromDatabase();
    
    // Also call loadCustomPresets directly on mount for cases where session is already restored
    loadCustomPresets();

    // Listen for auth state changes to reload presets when user signs in
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[ThemeContext] Auth event:', event, 'User:', session?.user?.id);
        
        // Explicitly check for session restoration/sign-in events
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            // Use setTimeout to defer async calls (Supabase best practice to avoid deadlocks)
            setTimeout(() => {
              loadCustomPresets();
            }, 0);
          }
        } else if (event === 'SIGNED_OUT') {
          setCustomPresets([]);
        }
      }
    );

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load custom presets
  const loadCustomPresets = useCallback(
    async () => {
      try {
        // Use getSession() to verify session is actually ready before querying
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          console.log('[ThemeContext] No active session, skipping preset load');
          return;
        }

        const { data, error } = await supabase
          .from('custom_theme_presets')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Failed to load custom presets:", error);
          return;
        }

        console.log('[ThemeContext] Loaded custom presets:', data?.length || 0);
        
        if (data) {
          setCustomPresets(data);
        }
      } catch (error) {
        console.error("Failed to load custom presets:", error);
      }
    }, []
  );

  // Helper function to generate color-matched configs from theme colors
  const generateConfigsFromColors = useCallback((colors: ThemeColors, mode: 'light' | 'dark') => {
    const isLight = mode === 'light';
    
    return {
      sidebarConfig: {
        colors: {
          background: colors.background,
          text: colors.foreground,
          activeBackground: colors.primary,
          activeText: "#ffffff",
          hoverBackground: colors.muted,
          tabBarBackground: colors.background,
          tabActiveBackground: colors.primary,
          tabActiveText: "#ffffff",
          tabActiveBorder: colors.primary,
          tabInactiveText: isLight ? "#64748b" : "#a1a1aa",
          tabHoverBackground: colors.muted,
        },
        gradient: {
          enabled: false,
          type: 'linear' as GradientType,
          angle: 180,
          centerX: 50,
          centerY: 50,
          stops: [
            { id: "1", color: colors.background, position: 0 },
            { id: "2", color: colors.muted, position: 100 },
          ],
        },
      },
      buttonConfig: {
        colors: {
          default: colors.primary,
          hover: colors.accent,
          active: colors.secondary,
          text: "#ffffff",
        },
        gradient: {
          enabled: false,
          type: 'linear' as GradientType,
          angle: 90,
          centerX: 50,
          centerY: 50,
          stops: [
            { id: "1", color: colors.primary, position: 0 },
            { id: "2", color: colors.accent, position: 100 },
          ],
        },
      },
      backgroundConfig: {
        color: colors.background,
        gradient: {
          enabled: false,
          type: 'linear' as GradientType,
          angle: 180,
          centerX: 50,
          centerY: 50,
          stops: [
            { id: "1", color: colors.background, position: 0 },
            { id: "2", color: colors.muted, position: 100 },
          ],
        },
      },
      cardConfig: {
        background: isLight ? "#ffffff" : colors.background,
        gradient: {
          enabled: false,
          type: 'linear' as GradientType,
          angle: 135,
          centerX: 50,
          centerY: 50,
          stops: [
            { id: "1", color: isLight ? "#ffffff" : colors.background, position: 0 },
            { id: "2", color: colors.muted, position: 100 },
          ],
        },
        border: {
          color: isLight ? "#e2e8f0" : "#404040",
          opacity: 100,
          width: 1,
        },
        shadow: {
          color: "#000000",
          opacity: isLight ? 5 : 20,
          blur: isLight ? 4 : 8,
          spread: 0,
          offsetX: 0,
          offsetY: isLight ? 1 : 2,
        },
      },
      glassConfig: {
        enabled: false,
        blurAmount: isLight ? 12 : 16,
        backgroundOpacity: isLight ? 10 : 15,
        chromeTexture: false,
        chromeIntensity: 0,
        tintColor: isLight ? "#ffffff" : "#000000",
      },
      statusColors: isLight ? defaultLightStatusColors : defaultDarkStatusColors,
      dividerConfig: {
        color: isLight ? "#e5e7eb" : "#404040",
        opacity: 100,
        width: 1,
        style: 'solid' as const,
      },
    };
  }, []);

  const applyPreset = useCallback((theme: any, mode: 'light' | 'dark') => {
    // Detect truly old format (theme IS the colors object directly)
    const isTrulyOldFormat = theme.background !== undefined && theme.colors === undefined;
    
    // Detect incomplete format (has colors but missing other required configs)
    const isIncompleteFormat = theme.colors !== undefined && (
      !theme.sidebarConfig || 
      !theme.buttonConfig || 
      !theme.backgroundConfig || 
      !theme.cardConfig || 
      !theme.glassConfig || 
      !theme.statusColors ||
      !theme.dividerConfig
    );
    
    // Treat both as needing default reset
    const shouldResetMissingToDefaults = isTrulyOldFormat || isIncompleteFormat;
    
    if (mode === 'light') {
      // Handle colors - old format vs new format, merge with defaults
      const colorsToApply = isTrulyOldFormat ? theme : theme.colors;
      if (colorsToApply) {
        const mergedColors = { ...defaultLightColors, ...colorsToApply };
        setLightColors(mergedColors);
        localStorage.setItem("theme-light-colors", JSON.stringify(mergedColors));
      }
      
      // For old/incomplete format presets, generate color-matched configs
      // For new format, only apply if config exists
      if (shouldResetMissingToDefaults) {
        const colorsToApply = isTrulyOldFormat ? theme : theme.colors;
        const mergedColors = { ...defaultLightColors, ...colorsToApply };
        const generatedConfigs = generateConfigsFromColors(mergedColors, 'light');
        
        // Apply generated configs that match the theme colors
        setLightSidebarConfig(generatedConfigs.sidebarConfig);
        localStorage.setItem("theme-light-sidebar-config", JSON.stringify(generatedConfigs.sidebarConfig));
        
        setLightButtonConfig(generatedConfigs.buttonConfig);
        localStorage.setItem("theme-light-button-config", JSON.stringify(generatedConfigs.buttonConfig));
        
        setLightDividerConfig(generatedConfigs.dividerConfig);
        localStorage.setItem("theme-light-divider-config", JSON.stringify(generatedConfigs.dividerConfig));
        
        setLightBackgroundConfig(generatedConfigs.backgroundConfig);
        localStorage.setItem("theme-light-background-config", JSON.stringify(generatedConfigs.backgroundConfig));
        
        setLightCardConfig(generatedConfigs.cardConfig);
        localStorage.setItem("theme-light-card-config", JSON.stringify(generatedConfigs.cardConfig));
        
        setLightGlassConfig(generatedConfigs.glassConfig);
        localStorage.setItem("theme-light-glass-config", JSON.stringify(generatedConfigs.glassConfig));
        
        setLightStatusColors(generatedConfigs.statusColors);
        localStorage.setItem("theme-light-status-colors", JSON.stringify(generatedConfigs.statusColors));
      } else {
        // New format: apply configs if they exist, merging with defaults
        if (theme.sidebarConfig) {
          const merged = {
            ...defaultLightSidebarConfig,
            colors: { ...defaultLightSidebarConfig.colors, ...theme.sidebarConfig.colors },
            gradient: { ...defaultLightSidebarConfig.gradient, ...theme.sidebarConfig.gradient }
          };
          setLightSidebarConfig(merged);
          localStorage.setItem("theme-light-sidebar-config", JSON.stringify(merged));
        }
        
        if (theme.buttonConfig) {
          const merged = {
            ...defaultLightButtonConfig,
            colors: { ...defaultLightButtonConfig.colors, ...theme.buttonConfig.colors },
            gradient: { ...defaultLightButtonConfig.gradient, ...theme.buttonConfig.gradient }
          };
          setLightButtonConfig(merged);
          localStorage.setItem("theme-light-button-config", JSON.stringify(merged));
        }
        
        if (theme.dividerConfig) {
          const merged = { ...defaultLightDividerConfig, ...theme.dividerConfig };
          setLightDividerConfig(merged);
          localStorage.setItem("theme-light-divider-config", JSON.stringify(merged));
        }
        
        if (theme.backgroundConfig) {
          const merged = {
            ...defaultLightBackgroundConfig,
            ...theme.backgroundConfig,
            gradient: { ...defaultLightBackgroundConfig.gradient, ...theme.backgroundConfig.gradient }
          };
          setLightBackgroundConfig(merged);
          localStorage.setItem("theme-light-background-config", JSON.stringify(merged));
        }
        
        if (theme.cardConfig) {
          const merged = {
            ...defaultLightCardConfig,
            ...theme.cardConfig,
            gradient: { ...defaultLightCardConfig.gradient, ...theme.cardConfig.gradient },
            border: { ...defaultLightCardConfig.border, ...theme.cardConfig.border },
            shadow: { ...defaultLightCardConfig.shadow, ...theme.cardConfig.shadow }
          };
          setLightCardConfig(merged);
          localStorage.setItem("theme-light-card-config", JSON.stringify(merged));
        }
        
        if (theme.glassConfig) {
          const merged = { ...defaultLightGlassConfig, ...theme.glassConfig };
          setLightGlassConfig(merged);
          localStorage.setItem("theme-light-glass-config", JSON.stringify(merged));
        }
        
        if (theme.statusColors) {
          const merged = { ...defaultLightStatusColors, ...theme.statusColors };
          setLightStatusColors(merged);
          localStorage.setItem("theme-light-status-colors", JSON.stringify(merged));
        }
      }
    } else {
      // Handle colors - old format vs new format, merge with defaults
      const colorsToApply = isTrulyOldFormat ? theme : theme.colors;
      if (colorsToApply) {
        const mergedColors = { ...defaultDarkColors, ...colorsToApply };
        setDarkColors(mergedColors);
        localStorage.setItem("theme-dark-colors", JSON.stringify(mergedColors));
      }
      
      // For old/incomplete format presets, generate color-matched configs
      // For new format, only apply if config exists
      if (shouldResetMissingToDefaults) {
        const colorsToApply = isTrulyOldFormat ? theme : theme.colors;
        const mergedColors = { ...defaultDarkColors, ...colorsToApply };
        const generatedConfigs = generateConfigsFromColors(mergedColors, 'dark');
        
        // Apply generated configs that match the theme colors
        setDarkSidebarConfig(generatedConfigs.sidebarConfig);
        localStorage.setItem("theme-dark-sidebar-config", JSON.stringify(generatedConfigs.sidebarConfig));
        
        setDarkButtonConfig(generatedConfigs.buttonConfig);
        localStorage.setItem("theme-dark-button-config", JSON.stringify(generatedConfigs.buttonConfig));
        
        setDarkDividerConfig(generatedConfigs.dividerConfig);
        localStorage.setItem("theme-dark-divider-config", JSON.stringify(generatedConfigs.dividerConfig));
        
        setDarkBackgroundConfig(generatedConfigs.backgroundConfig);
        localStorage.setItem("theme-dark-background-config", JSON.stringify(generatedConfigs.backgroundConfig));
        
        setDarkCardConfig(generatedConfigs.cardConfig);
        localStorage.setItem("theme-dark-card-config", JSON.stringify(generatedConfigs.cardConfig));
        
        setDarkGlassConfig(generatedConfigs.glassConfig);
        localStorage.setItem("theme-dark-glass-config", JSON.stringify(generatedConfigs.glassConfig));
        
        setDarkStatusColors(generatedConfigs.statusColors);
        localStorage.setItem("theme-dark-status-colors", JSON.stringify(generatedConfigs.statusColors));
      } else {
        // New format: apply configs if they exist, merging with defaults
        if (theme.sidebarConfig) {
          const merged = {
            ...defaultDarkSidebarConfig,
            colors: { ...defaultDarkSidebarConfig.colors, ...theme.sidebarConfig.colors },
            gradient: { ...defaultDarkSidebarConfig.gradient, ...theme.sidebarConfig.gradient }
          };
          setDarkSidebarConfig(merged);
          localStorage.setItem("theme-dark-sidebar-config", JSON.stringify(merged));
        }
        
        if (theme.buttonConfig) {
          const merged = {
            ...defaultDarkButtonConfig,
            colors: { ...defaultDarkButtonConfig.colors, ...theme.buttonConfig.colors },
            gradient: { ...defaultDarkButtonConfig.gradient, ...theme.buttonConfig.gradient }
          };
          setDarkButtonConfig(merged);
          localStorage.setItem("theme-dark-button-config", JSON.stringify(merged));
        }
        
        if (theme.dividerConfig) {
          const merged = { ...defaultDarkDividerConfig, ...theme.dividerConfig };
          setDarkDividerConfig(merged);
          localStorage.setItem("theme-dark-divider-config", JSON.stringify(merged));
        }
        
        if (theme.backgroundConfig) {
          const merged = {
            ...defaultDarkBackgroundConfig,
            ...theme.backgroundConfig,
            gradient: { ...defaultDarkBackgroundConfig.gradient, ...theme.backgroundConfig.gradient }
          };
          setDarkBackgroundConfig(merged);
          localStorage.setItem("theme-dark-background-config", JSON.stringify(merged));
        }
        
        if (theme.cardConfig) {
          const merged = {
            ...defaultDarkCardConfig,
            ...theme.cardConfig,
            gradient: { ...defaultDarkCardConfig.gradient, ...theme.cardConfig.gradient },
            border: { ...defaultDarkCardConfig.border, ...theme.cardConfig.border },
            shadow: { ...defaultDarkCardConfig.shadow, ...theme.cardConfig.shadow }
          };
          setDarkCardConfig(merged);
          localStorage.setItem("theme-dark-card-config", JSON.stringify(merged));
        }
        
        if (theme.glassConfig) {
          const merged = { ...defaultDarkGlassConfig, ...theme.glassConfig };
          setDarkGlassConfig(merged);
          localStorage.setItem("theme-dark-glass-config", JSON.stringify(merged));
        }
        
        if (theme.statusColors) {
          const merged = { ...defaultDarkStatusColors, ...theme.statusColors };
          setDarkStatusColors(merged);
          localStorage.setItem("theme-dark-status-colors", JSON.stringify(merged));
        }
      }
    }
  }, []);

  const saveCustomPreset = useCallback(async (name: string, mode: 'light' | 'dark') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error("No organization found");

      const completeTheme = mode === 'light' ? {
        colors: lightColors,
        sidebarConfig: lightSidebarConfig,
        buttonConfig: lightButtonConfig,
        dividerConfig: lightDividerConfig,
        backgroundConfig: lightBackgroundConfig,
        cardConfig: lightCardConfig,
        glassConfig: lightGlassConfig,
        statusColors: lightStatusColors,
      } : {
        colors: darkColors,
        sidebarConfig: darkSidebarConfig,
        buttonConfig: darkButtonConfig,
        dividerConfig: darkDividerConfig,
        backgroundConfig: darkBackgroundConfig,
        cardConfig: darkCardConfig,
        glassConfig: darkGlassConfig,
        statusColors: darkStatusColors,
      };

      // Check if a preset with this name already exists
      const { data: existingPreset } = await supabase
        .from('custom_theme_presets')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .eq('name', name)
        .eq('mode', mode)
        .maybeSingle();

      if (existingPreset) {
        // Update existing preset
        const { error } = await supabase
          .from('custom_theme_presets')
          .update({
            colors: completeTheme as any,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPreset.id);

        if (error) throw error;
      } else {
        // Insert new preset
        const { error } = await supabase
          .from('custom_theme_presets')
          .insert({
            organization_id: profile.organization_id,
            user_id: user.id,
            name,
            mode,
            colors: completeTheme as any,
          });

        if (error) throw error;
      }

      // Reload presets
      await loadCustomPresets();
    } catch (error: any) {
      console.error("Failed to save custom preset:", error);
      const errorMessage = error?.message || "Unknown error occurred";
      throw new Error(`Failed to save preset: ${errorMessage}`);
    }
  }, [
    lightColors, darkColors,
    lightSidebarConfig, darkSidebarConfig,
    lightButtonConfig, darkButtonConfig,
    lightDividerConfig, darkDividerConfig,
    lightBackgroundConfig, darkBackgroundConfig,
    lightCardConfig, darkCardConfig,
    lightGlassConfig, darkGlassConfig,
    lightStatusColors, darkStatusColors,
    loadCustomPresets
  ]);

  const deleteCustomPreset = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_theme_presets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Reload presets
      await loadCustomPresets();
    } catch (error) {
      console.error("Failed to delete preset:", error);
      throw error;
    }
  }, [loadCustomPresets]);

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
    
    localStorage.setItem("theme-light-colors", JSON.stringify(defaultLightColors));
    localStorage.setItem("theme-dark-colors", JSON.stringify(defaultDarkColors));
    localStorage.setItem("theme-light-button-config", JSON.stringify(defaultLightButtonConfig));
    localStorage.setItem("theme-dark-button-config", JSON.stringify(defaultDarkButtonConfig));
    localStorage.setItem("theme-light-sidebar-config", JSON.stringify(defaultLightSidebarConfig));
    localStorage.setItem("theme-dark-sidebar-config", JSON.stringify(defaultDarkSidebarConfig));
    localStorage.setItem("theme-light-background-config", JSON.stringify(defaultLightBackgroundConfig));
    localStorage.setItem("theme-dark-background-config", JSON.stringify(defaultDarkBackgroundConfig));
    localStorage.setItem("theme-light-card-config", JSON.stringify(defaultLightCardConfig));
    localStorage.setItem("theme-dark-card-config", JSON.stringify(defaultDarkCardConfig));
    localStorage.setItem("theme-light-glass-config", JSON.stringify(defaultLightGlassConfig));
    localStorage.setItem("theme-dark-glass-config", JSON.stringify(defaultDarkGlassConfig));
    localStorage.setItem("theme-light-status-colors", JSON.stringify(defaultLightStatusColors));
    localStorage.setItem("theme-dark-status-colors", JSON.stringify(defaultDarkStatusColors));
    localStorage.setItem("theme-light-divider-config", JSON.stringify(defaultLightDividerConfig));
    localStorage.setItem("theme-dark-divider-config", JSON.stringify(defaultDarkDividerConfig));
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        effectiveMode,
        setMode,
        lightColors,
        darkColors,
        updateLightColor,
        updateDarkColor,
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
        saveThemeToDatabase,
        loadThemeFromDatabase,
        isSaving,
        isLoading,
        customPresets,
        applyPreset,
        saveCustomPreset,
        deleteCustomPreset,
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
      // Simplified mesh gradient using overlapping radial gradients
      return `radial-gradient(circle at ${config.centerX}% ${config.centerY}%, ${stopsStr})`;
    case 'freeform':
      // Freeform uses elliptical radial gradient
      return `radial-gradient(ellipse at ${config.centerX}% ${config.centerY}%, ${stopsStr})`;
    default:
      return `linear-gradient(${config.angle}deg, ${stopsStr})`;
  }
}

