import { useState } from "react";
import { useTheme, CompleteTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { Trash2, Save, Palette, Check, Pencil, Copy } from "lucide-react";
import { toast } from "sonner";

interface ThemePresetsProps {
  mode: 'light' | 'dark';
}

// Built-in presets with complete theme configurations
const BUILT_IN_PRESETS: {
  dark: Array<{ name: string; theme: CompleteTheme }>;
  light: Array<{ name: string; theme: CompleteTheme }>;
} = {
  dark: [
    {
      name: "Agentix",
      theme: {
        colors: {
          background: "#0f0f0f",
          foreground: "#ffffff",
          primary: "#ff0000",
          secondary: "#700000",
          accent: "#d6d6d6",
          muted: "#202020"
        },
        sidebarConfig: {
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
            tabHoverBackground: "#1a1d24"
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
              { id: "3", color: "#0d0d0d", position: 100 }
            ]
          }
        },
        buttonConfig: {
          colors: { default: "#333333", hover: "#2e0002", active: "#ff0000", text: "#ffffff" },
          gradient: { enabled: false, type: 'linear', angle: 168, centerX: 34, centerY: 48, stops: [] }
        },
        dividerConfig: { color: "#ff0000", opacity: 25, width: 1, style: 'solid' },
        backgroundConfig: {
          color: "#0a0c10",
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 339,
            centerX: 50,
            centerY: 35,
            stops: [
              { id: "1", color: "#212121", position: 46 },
              { id: "2", color: "#000000", position: 100 }
            ]
          }
        },
        cardConfig: {
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
              { id: "3", color: "#121212", position: 99 }
            ]
          },
          border: { color: "#545454", opacity: 100, width: 1 },
          shadow: { color: "#000000", opacity: 78, blur: 30, spread: -1, offsetX: 6, offsetY: 6 }
        },
        glassConfig: {
          enabled: true,
          blurAmount: 37,
          backgroundOpacity: 47,
          chromeIntensity: 31,
          chromeTexture: true,
          tintColor: "#000000"
        },
        statusColors: {
          success: "#16a34a", successForeground: "#ffffff",
          warning: "#d97706", warningForeground: "#ffffff",
          error: "#dc2626", errorForeground: "#ffffff",
          info: "#2563eb", infoForeground: "#ffffff"
        }
      }
    },
    {
      name: "Midnight",
      theme: {
        colors: {
          background: "#0a0e1a",
          foreground: "#ffffff",
          primary: "#3b82f6",
          secondary: "#1e40af",
          accent: "#60a5fa",
          muted: "#1e293b"
        },
        sidebarConfig: {
          colors: {
            background: "#0f1420",
            text: "#ffffff",
            activeBackground: "#1e40af",
            activeText: "#ffffff",
            hoverBackground: "#1e293b",
            tabBarBackground: "#0f1420",
            tabActiveBackground: "#3b82f6",
            tabActiveText: "#ffffff",
            tabActiveBorder: "#3b82f6",
            tabInactiveText: "#94a3b8",
            tabHoverBackground: "#1e293b"
          },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        buttonConfig: {
          colors: { default: "#3b82f6", hover: "#60a5fa", active: "#1e40af", text: "#ffffff" },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        dividerConfig: { color: "#3b82f6", opacity: 30, width: 1, style: 'solid' },
        backgroundConfig: {
          color: "#0a0e1a",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        cardConfig: {
          background: "#1e293b",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] },
          border: { color: "#3b82f6", opacity: 20, width: 1 },
          shadow: { color: "#000000", opacity: 50, blur: 10, spread: 0, offsetX: 0, offsetY: 4 }
        },
        glassConfig: { enabled: false, blurAmount: 12, backgroundOpacity: 10, chromeIntensity: 30, chromeTexture: false, tintColor: "#ffffff" },
        statusColors: {
          success: "#10b981", successForeground: "#ffffff",
          warning: "#f59e0b", warningForeground: "#ffffff",
          error: "#ef4444", errorForeground: "#ffffff",
          info: "#3b82f6", infoForeground: "#ffffff"
        }
      }
    },
    {
      name: "Ocean Deep",
      theme: {
        colors: {
          background: "#0a1a1a",
          foreground: "#ffffff",
          primary: "#06b6d4",
          secondary: "#0e7490",
          accent: "#22d3ee",
          muted: "#164e63"
        },
        sidebarConfig: {
          colors: {
            background: "#0f1f1f",
            text: "#ffffff",
            activeBackground: "#0e7490",
            activeText: "#ffffff",
            hoverBackground: "#164e63",
            tabBarBackground: "#0f1f1f",
            tabActiveBackground: "#06b6d4",
            tabActiveText: "#ffffff",
            tabActiveBorder: "#06b6d4",
            tabInactiveText: "#67e8f9",
            tabHoverBackground: "#164e63"
          },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        buttonConfig: {
          colors: { default: "#06b6d4", hover: "#22d3ee", active: "#0e7490", text: "#ffffff" },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        dividerConfig: { color: "#06b6d4", opacity: 35, width: 1, style: 'solid' },
        backgroundConfig: {
          color: "#0a1a1a",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        cardConfig: {
          background: "#164e63",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] },
          border: { color: "#06b6d4", opacity: 20, width: 1 },
          shadow: { color: "#000000", opacity: 50, blur: 10, spread: 0, offsetX: 0, offsetY: 4 }
        },
        glassConfig: { enabled: false, blurAmount: 12, backgroundOpacity: 10, chromeIntensity: 30, chromeTexture: false, tintColor: "#ffffff" },
        statusColors: {
          success: "#10b981", successForeground: "#ffffff",
          warning: "#f59e0b", warningForeground: "#ffffff",
          error: "#ef4444", errorForeground: "#ffffff",
          info: "#06b6d4", infoForeground: "#ffffff"
        }
      }
    },
    {
      name: "Purple Haze",
      theme: {
        colors: {
          background: "#0d0a14",
          foreground: "#ffffff",
          primary: "#a855f7",
          secondary: "#9333ea",
          accent: "#c084fc",
          muted: "#1f1a2e"
        },
        sidebarConfig: {
          colors: {
            background: "#120f1a",
            text: "#ffffff",
            activeBackground: "#7e22ce",
            activeText: "#ffffff",
            hoverBackground: "#1f1a2e",
            tabBarBackground: "#120f1a",
            tabActiveBackground: "#9333ea",
            tabActiveText: "#ffffff",
            tabActiveBorder: "#9333ea",
            tabInactiveText: "#a78bfa",
            tabHoverBackground: "#1f1a2e"
          },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        buttonConfig: {
          colors: { default: "#9333ea", hover: "#a855f7", active: "#7e22ce", text: "#ffffff" },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        dividerConfig: { color: "#7e22ce", opacity: 50, width: 1, style: 'solid' },
        backgroundConfig: {
          color: "#0d0a14",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        cardConfig: {
          background: "#1f1a2e",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] },
          border: { color: "#a855f7", opacity: 25, width: 1 },
          shadow: { color: "#000000", opacity: 50, blur: 10, spread: 0, offsetX: 0, offsetY: 4 }
        },
        glassConfig: { enabled: false, blurAmount: 12, backgroundOpacity: 10, chromeIntensity: 30, chromeTexture: false, tintColor: "#ffffff" },
        statusColors: {
          success: "#10b981", successForeground: "#ffffff",
          warning: "#f59e0b", warningForeground: "#ffffff",
          error: "#ef4444", errorForeground: "#ffffff",
          info: "#a855f7", infoForeground: "#ffffff"
        }
      }
    },
    {
      name: "Emerald Forest",
      theme: {
        colors: {
          background: "#0a1410",
          foreground: "#ffffff",
          primary: "#22c55e",
          secondary: "#16a34a",
          accent: "#4ade80",
          muted: "#14532d"
        },
        sidebarConfig: {
          colors: {
            background: "#0f1914",
            text: "#ffffff",
            activeBackground: "#16a34a",
            activeText: "#ffffff",
            hoverBackground: "#14532d",
            tabBarBackground: "#0f1914",
            tabActiveBackground: "#22c55e",
            tabActiveText: "#ffffff",
            tabActiveBorder: "#22c55e",
            tabInactiveText: "#86efac",
            tabHoverBackground: "#14532d"
          },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        buttonConfig: {
          colors: { default: "#22c55e", hover: "#4ade80", active: "#16a34a", text: "#ffffff" },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        dividerConfig: { color: "#22c55e", opacity: 35, width: 1, style: 'solid' },
        backgroundConfig: {
          color: "#0a1410",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        cardConfig: {
          background: "#14532d",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] },
          border: { color: "#22c55e", opacity: 30, width: 1 },
          shadow: { color: "#22c55e", opacity: 20, blur: 15, spread: 0, offsetX: 0, offsetY: 4 }
        },
        glassConfig: { enabled: false, blurAmount: 12, backgroundOpacity: 10, chromeIntensity: 30, chromeTexture: false, tintColor: "#ffffff" },
        statusColors: {
          success: "#22c55e", successForeground: "#ffffff",
          warning: "#f59e0b", warningForeground: "#ffffff",
          error: "#ef4444", errorForeground: "#ffffff",
          info: "#3b82f6", infoForeground: "#ffffff"
        }
      }
    },
    {
      name: "Steel Gray",
      theme: {
        colors: {
          background: "#0f1419",
          foreground: "#ffffff",
          primary: "#6b7280",
          secondary: "#4b5563",
          accent: "#9ca3af",
          muted: "#374151"
        },
        sidebarConfig: {
          colors: {
            background: "#1f2937",
            text: "#ffffff",
            activeBackground: "#4b5563",
            activeText: "#ffffff",
            hoverBackground: "#374151",
            tabBarBackground: "#1f2937",
            tabActiveBackground: "#6b7280",
            tabActiveText: "#ffffff",
            tabActiveBorder: "#6b7280",
            tabInactiveText: "#d1d5db",
            tabHoverBackground: "#374151"
          },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        buttonConfig: {
          colors: { default: "#6b7280", hover: "#9ca3af", active: "#4b5563", text: "#ffffff" },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        dividerConfig: { color: "#6b7280", opacity: 30, width: 1, style: 'solid' },
        backgroundConfig: {
          color: "#0f1419",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        cardConfig: {
          background: "#374151",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] },
          border: { color: "#6b7280", opacity: 40, width: 1 },
          shadow: { color: "#000000", opacity: 50, blur: 10, spread: 0, offsetX: 0, offsetY: 4 }
        },
        glassConfig: { enabled: false, blurAmount: 12, backgroundOpacity: 10, chromeIntensity: 30, chromeTexture: false, tintColor: "#ffffff" },
        statusColors: {
          success: "#10b981", successForeground: "#ffffff",
          warning: "#f59e0b", warningForeground: "#ffffff",
          error: "#ef4444", errorForeground: "#ffffff",
          info: "#6b7280", infoForeground: "#ffffff"
        }
      }
    }
  ],
  light: [
    {
      name: "Clean",
      theme: {
        colors: {
          background: "#ffffff",
          foreground: "#0a0a0a",
          primary: "#2563eb",
          secondary: "#1e40af",
          accent: "#3b82f6",
          muted: "#f1f5f9"
        },
        sidebarConfig: {
          colors: {
            background: "#f8fafc",
            text: "#0f172a",
            activeBackground: "#2563eb",
            activeText: "#ffffff",
            hoverBackground: "#e2e8f0",
            tabBarBackground: "#f8fafc",
            tabActiveBackground: "#2563eb",
            tabActiveText: "#ffffff",
            tabActiveBorder: "#2563eb",
            tabInactiveText: "#64748b",
            tabHoverBackground: "#e2e8f0"
          },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        buttonConfig: {
          colors: { default: "#2563eb", hover: "#3b82f6", active: "#1e40af", text: "#ffffff" },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        dividerConfig: { color: "#cbd5e1", opacity: 60, width: 1, style: 'solid' },
        backgroundConfig: {
          color: "#ffffff",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        cardConfig: {
          background: "#ffffff",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] },
          border: { color: "#e2e8f0", opacity: 100, width: 1 },
          shadow: { color: "#000000", opacity: 10, blur: 10, spread: 0, offsetX: 0, offsetY: 2 }
        },
        glassConfig: { enabled: false, blurAmount: 12, backgroundOpacity: 10, chromeIntensity: 30, chromeTexture: false, tintColor: "#000000" },
        statusColors: {
          success: "#10b981", successForeground: "#ffffff",
          warning: "#f59e0b", warningForeground: "#ffffff",
          error: "#ef4444", errorForeground: "#ffffff",
          info: "#2563eb", infoForeground: "#ffffff"
        }
      }
    },
    {
      name: "Forest Fresh",
      theme: {
        colors: {
          background: "#fefefe",
          foreground: "#0a0a0a",
          primary: "#10b981",
          secondary: "#059669",
          accent: "#34d399",
          muted: "#d1fae5"
        },
        sidebarConfig: {
          colors: {
            background: "#ecfdf5",
            text: "#064e3b",
            activeBackground: "#059669",
            activeText: "#ffffff",
            hoverBackground: "#d1fae5",
            tabBarBackground: "#ecfdf5",
            tabActiveBackground: "#10b981",
            tabActiveText: "#ffffff",
            tabActiveBorder: "#10b981",
            tabInactiveText: "#064e3b",
            tabHoverBackground: "#d1fae5"
          },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        buttonConfig: {
          colors: { default: "#10b981", hover: "#34d399", active: "#059669", text: "#ffffff" },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        dividerConfig: { color: "#6ee7b7", opacity: 50, width: 1, style: 'solid' },
        backgroundConfig: {
          color: "#fefefe",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        cardConfig: {
          background: "#ffffff",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] },
          border: { color: "#6ee7b7", opacity: 40, width: 1 },
          shadow: { color: "#064e3b", opacity: 10, blur: 10, spread: 0, offsetX: 0, offsetY: 2 }
        },
        glassConfig: { enabled: false, blurAmount: 12, backgroundOpacity: 10, chromeIntensity: 30, chromeTexture: false, tintColor: "#000000" },
        statusColors: {
          success: "#10b981", successForeground: "#ffffff",
          warning: "#f59e0b", warningForeground: "#ffffff",
          error: "#ef4444", errorForeground: "#ffffff",
          info: "#3b82f6", infoForeground: "#ffffff"
        }
      }
    },
    {
      name: "Rose Garden",
      theme: {
        colors: {
          background: "#fefefe",
          foreground: "#1a1a1a",
          primary: "#ec4899",
          secondary: "#db2777",
          accent: "#f472b6",
          muted: "#fce7f3"
        },
        sidebarConfig: {
          colors: {
            background: "#fdf2f8",
            text: "#831843",
            activeBackground: "#db2777",
            activeText: "#ffffff",
            hoverBackground: "#fce7f3",
            tabBarBackground: "#fdf2f8",
            tabActiveBackground: "#ec4899",
            tabActiveText: "#ffffff",
            tabActiveBorder: "#ec4899",
            tabInactiveText: "#831843",
            tabHoverBackground: "#fce7f3"
          },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        buttonConfig: {
          colors: { default: "#ec4899", hover: "#f472b6", active: "#db2777", text: "#ffffff" },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        dividerConfig: { color: "#f9a8d4", opacity: 50, width: 1, style: 'solid' },
        backgroundConfig: {
          color: "#fefefe",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        cardConfig: {
          background: "#ffffff",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] },
          border: { color: "#f9a8d4", opacity: 40, width: 1 },
          shadow: { color: "#831843", opacity: 10, blur: 10, spread: 0, offsetX: 0, offsetY: 2 }
        },
        glassConfig: { enabled: false, blurAmount: 12, backgroundOpacity: 10, chromeIntensity: 30, chromeTexture: false, tintColor: "#000000" },
        statusColors: {
          success: "#10b981", successForeground: "#ffffff",
          warning: "#f59e0b", warningForeground: "#ffffff",
          error: "#ec4899", errorForeground: "#ffffff",
          info: "#3b82f6", infoForeground: "#ffffff"
        }
      }
    }
  ]
};

export function ThemePresets({ mode }: ThemePresetsProps) {
  const { 
    applyPreset, 
    saveCustomPreset, 
    deleteCustomPreset, 
    customPresets,
    lightColors,
    darkColors 
  } = useTheme();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [presetToOverwrite, setPresetToOverwrite] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });

  const builtInPresets = BUILT_IN_PRESETS[mode];
  const userPresets = customPresets.filter(p => p.mode === mode);
  const currentColors = mode === 'dark' ? darkColors : lightColors;

  const isActivePreset = (presetColors: Record<string, string>) => {
    return Object.keys(presetColors).every(
      key => presetColors[key]?.toLowerCase() === currentColors[key as keyof typeof currentColors]?.toLowerCase()
    );
  };

  const handleApplyPreset = (theme: CompleteTheme) => {
    applyPreset(theme, mode);
    toast.success("Preset applied successfully");
  };

  const handleSaveCustom = async (confirmOverwrite = false) => {
    if (!presetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }

    const existingPreset = userPresets.find(
      p => p.name.toLowerCase() === presetName.trim().toLowerCase()
    );
    
    if (existingPreset && !confirmOverwrite) {
      setPresetToOverwrite(existingPreset.name);
      setShowOverwriteDialog(true);
      return;
    }

    setIsSaving(true);
    try {
      await saveCustomPreset(presetName.trim(), mode);
      toast.success(confirmOverwrite ? `"${presetName}" updated!` : "Custom preset saved!");
      setShowSaveDialog(false);
      setShowOverwriteDialog(false);
      setPresetName("");
      setPresetToOverwrite(null);
    } catch {
      toast.error("Failed to save preset");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePreset = async (id: string, name: string) => {
    try {
      await deleteCustomPreset(id);
      toast.success(`"${name}" deleted`);
    } catch {
      toast.error("Failed to delete preset");
    }
  };

  const handleDuplicatePreset = (theme: CompleteTheme, name: string) => {
    applyPreset(theme, mode);
    setPresetName(`Copy of ${name}`);
    setShowSaveDialog(true);
    toast.info("Theme applied - save to create your copy");
  };

  return (
    <TooltipProvider>
    <div className="space-y-6 mt-6 pt-6 border-t">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <h4 className="font-semibold">Theme Presets</h4>
        </div>
        <Button 
          onClick={() => setShowSaveDialog(true)}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Save Current
        </Button>
      </div>

      {/* Built-in Presets */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">Built-in Presets</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {builtInPresets.map((preset) => {
            const isActive = isActivePreset(preset.theme.colors as unknown as Record<string, string>);
            return (
              <Card
                key={preset.name}
                className={`p-3 cursor-pointer hover:border-primary hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 group relative ${
                  isActive ? 'border-primary ring-2 ring-primary/20' : ''
                }`}
                onClick={() => handleApplyPreset(preset.theme)}
              >
                {isActive && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 z-10">
                    <Check className="h-3 w-3" />
                  </div>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute bottom-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicatePreset(preset.theme, preset.name);
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Duplicate</TooltipContent>
                </Tooltip>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-1">
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: preset.theme.colors.primary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: preset.theme.colors.secondary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: preset.theme.colors.accent }}
                    />
                  </div>
                </div>
                <p className="text-sm font-medium">{preset.name}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Custom Presets */}
      {userPresets.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">Your Custom Presets</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {userPresets.map((preset) => {
              const presetTheme = preset.theme_config;
              const colors = presetTheme.colors;
              const isActive = isActivePreset(colors as unknown as Record<string, string>);
              return (
                <Card
                  key={preset.id}
                  className={`p-3 cursor-pointer hover:border-primary hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 group relative ${
                    isActive ? 'border-primary ring-2 ring-primary/20' : ''
                  }`}
                  onClick={() => handleApplyPreset(presetTheme)}
                >
                  {isActive && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 z-10">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute bottom-1 right-14 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicatePreset(presetTheme, preset.name);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Duplicate</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute bottom-1 right-8 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPresetName(preset.name);
                          setShowSaveDialog(true);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute bottom-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ open: true, id: preset.id, name: preset.name });
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1">
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: colors.primary }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: colors.secondary }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: colors.accent }}
                      />
                    </div>
                  </div>
                  <p className="text-sm font-medium truncate">{preset.name}</p>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={(open) => {
        setShowSaveDialog(open);
        if (!open) setPresetName("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Custom Preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Preset Name</label>
              <Input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="My Custom Theme"
                maxLength={50}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This will save your current {mode} mode colors as a preset.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleSaveCustom(false)} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Preset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overwrite Confirmation Dialog */}
      <Dialog open={showOverwriteDialog} onOpenChange={setShowOverwriteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Overwrite Existing Preset?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            A preset named "{presetToOverwrite}" already exists. Do you want to overwrite it with your current settings?
          </p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowOverwriteDialog(false);
                setPresetToOverwrite(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleSaveCustom(true)}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Overwrite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteConfirm.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your custom theme preset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => handleDeletePreset(deleteConfirm.id, deleteConfirm.name)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
}

