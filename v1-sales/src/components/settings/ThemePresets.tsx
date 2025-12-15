import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
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

interface CompleteTheme {
  colors: Record<string, string>;
  sidebarConfig: any;
  buttonConfig: any;
  dividerConfig: any;
  backgroundConfig: any;
  cardConfig: any;
  glassConfig: any;
  statusColors: any;
}

const BUILT_IN_PRESETS: {
  dark: Array<{ name: string; theme: CompleteTheme }>;
  light: Array<{ name: string; theme: CompleteTheme }>;
} = {
  dark: [
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
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: '#0a0e1a', position: 0 },
              { id: "2", color: '#1e40af', position: 100 }
            ]
          }
        },
        buttonConfig: {
          colors: {
            default: "#3b82f6",
            hover: "#60a5fa",
            active: "#1e40af",
            text: "#ffffff"
          },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        dividerConfig: {
          color: "#3b82f6",
          opacity: 30,
          width: 1,
          style: 'solid'
        },
        backgroundConfig: {
          color: "#0a0e1a",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [{ id: "1", color: "#0a0e1a", position: 0 }, { id: "2", color: "#1a1d28", position: 100 }] }
        },
        cardConfig: {
          background: "#1e293b",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [{ id: "1", color: "#1e293b", position: 0 }, { id: "2", color: "#2d3748", position: 100 }] },
          border: { color: "#3b82f6", opacity: 20, width: 1 },
          shadow: { color: "#000000", opacity: 50, blur: 10, spread: 0, offsetX: 0, offsetY: 4 }
        },
        glassConfig: {
          enabled: false,
          blurAmount: 12,
          backgroundOpacity: 10,
          chromeIntensity: 30,
          chromeTexture: false,
          tintColor: "#ffffff"
        },
        statusColors: {
          success: "#10b981",
          successForeground: "#ffffff",
          warning: "#f59e0b",
          warningForeground: "#ffffff",
          error: "#ef4444",
          errorForeground: "#ffffff",
          info: "#3b82f6",
          infoForeground: "#ffffff"
        }
      }
    },
    {
      name: "Crimson Night",
      theme: {
        colors: {
          background: "#1a0a0e",
          foreground: "#ffffff",
          primary: "#dc2626",
          secondary: "#991b1b",
          accent: "#ef4444",
          muted: "#2d1417"
        },
        sidebarConfig: {
          colors: {
            background: "#1f0f13",
            text: "#ffffff",
            activeBackground: "#991b1b",
            activeText: "#ffffff",
            hoverBackground: "#2d1417",
            tabBarBackground: "#1f0f13",
            tabActiveBackground: "#dc2626",
            tabActiveText: "#ffffff",
            tabActiveBorder: "#dc2626",
            tabInactiveText: "#fca5a5",
            tabHoverBackground: "#2d1417"
          },
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: '#1a0a0e', position: 0 },
              { id: "2", color: '#991b1b', position: 100 }
            ]
          }
        },
        buttonConfig: {
          colors: {
            default: "#dc2626",
            hover: "#ef4444",
            active: "#991b1b",
            text: "#ffffff"
          },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        dividerConfig: {
          color: "#dc2626",
          opacity: 40,
          width: 1,
          style: 'solid'
        },
        backgroundConfig: {
          color: "#1a0a0e",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [{ id: "1", color: "#1a0a0e", position: 0 }, { id: "2", color: "#2d1417", position: 100 }] }
        },
        cardConfig: {
          background: "#2d1417",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [{ id: "1", color: "#2d1417", position: 0 }, { id: "2", color: "#3d1c1f", position: 100 }] },
          border: { color: "#dc2626", opacity: 20, width: 1 },
          shadow: { color: "#000000", opacity: 50, blur: 10, spread: 0, offsetX: 0, offsetY: 4 }
        },
        glassConfig: {
          enabled: false,
          blurAmount: 12,
          backgroundOpacity: 10,
          chromeIntensity: 30,
          chromeTexture: false,
          tintColor: "#ffffff"
        },
        statusColors: {
          success: "#10b981",
          successForeground: "#ffffff",
          warning: "#f59e0b",
          warningForeground: "#ffffff",
          error: "#dc2626",
          errorForeground: "#ffffff",
          info: "#3b82f6",
          infoForeground: "#ffffff"
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
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: '#0a1a1a', position: 0 },
              { id: "2", color: '#0e7490', position: 100 }
            ]
          }
        },
        buttonConfig: {
          colors: {
            default: "#06b6d4",
            hover: "#22d3ee",
            active: "#0e7490",
            text: "#ffffff"
          },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        dividerConfig: {
          color: "#06b6d4",
          opacity: 35,
          width: 1,
          style: 'solid'
        },
        backgroundConfig: {
          color: "#0a1a1a",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [{ id: "1", color: "#0a1a1a", position: 0 }, { id: "2", color: "#164e63", position: 100 }] }
        },
        cardConfig: {
          background: "#164e63",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [{ id: "1", color: "#164e63", position: 0 }, { id: "2", color: "#0e7490", position: 100 }] },
          border: { color: "#06b6d4", opacity: 20, width: 1 },
          shadow: { color: "#000000", opacity: 50, blur: 10, spread: 0, offsetX: 0, offsetY: 4 }
        },
        glassConfig: {
          enabled: false,
          blurAmount: 12,
          backgroundOpacity: 10,
          chromeIntensity: 30,
          chromeTexture: false,
          tintColor: "#ffffff"
        },
        statusColors: {
          success: "#10b981",
          successForeground: "#ffffff",
          warning: "#f59e0b",
          warningForeground: "#ffffff",
          error: "#ef4444",
          errorForeground: "#ffffff",
          info: "#06b6d4",
          infoForeground: "#ffffff"
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
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 160,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: '#0d0a14', position: 0 },
              { id: "2", color: '#581c87', position: 100 }
            ]
          }
        },
        buttonConfig: {
          colors: {
            default: "#9333ea",
            hover: "#a855f7",
            active: "#7e22ce",
            text: "#ffffff"
          },
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: '#9333ea', position: 0 },
              { id: "2", color: '#a855f7', position: 100 }
            ]
          }
        },
        dividerConfig: {
          color: "#7e22ce",
          opacity: 50,
          width: 1,
          style: 'solid'
        },
        backgroundConfig: {
          color: "#0d0a14",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [{ id: "1", color: "#0d0a14", position: 0 }, { id: "2", color: "#1f1a2e", position: 100 }] }
        },
        cardConfig: {
          background: "#1f1a2e",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [{ id: "1", color: "#1f1a2e", position: 0 }, { id: "2", color: "#2d2540", position: 100 }] },
          border: { color: "#a855f7", opacity: 25, width: 1 },
          shadow: { color: "#000000", opacity: 50, blur: 10, spread: 0, offsetX: 0, offsetY: 4 }
        },
        glassConfig: {
          enabled: false,
          blurAmount: 12,
          backgroundOpacity: 10,
          chromeIntensity: 30,
          chromeTexture: false,
          tintColor: "#ffffff"
        },
        statusColors: {
          success: "#10b981",
          successForeground: "#ffffff",
          warning: "#f59e0b",
          warningForeground: "#ffffff",
          error: "#ef4444",
          errorForeground: "#ffffff",
          info: "#a855f7",
          infoForeground: "#ffffff"
        }
      }
    },
    {
      name: "Ember Glow",
      theme: {
        colors: {
          background: "#1a0f0a",
          foreground: "#ffffff",
          primary: "#f97316",
          secondary: "#ea580c",
          accent: "#fb923c",
          muted: "#2d1a12"
        },
        sidebarConfig: {
          colors: {
            background: "#1f140f",
            text: "#ffffff",
            activeBackground: "#c2410c",
            activeText: "#ffffff",
            hoverBackground: "#2d1a12",
            tabBarBackground: "#1f140f",
            tabActiveBackground: "#ea580c",
            tabActiveText: "#ffffff",
            tabActiveBorder: "#ea580c",
            tabInactiveText: "#fdba74",
            tabHoverBackground: "#2d1a12"
          },
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: '#1a0f0a', position: 0 },
              { id: "2", color: '#c2410c', position: 100 }
            ]
          }
        },
        buttonConfig: {
          colors: {
            default: "#f97316",
            hover: "#fb923c",
            active: "#ea580c",
            text: "#ffffff"
          },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        dividerConfig: {
          color: "#f97316",
          opacity: 40,
          width: 1,
          style: 'solid'
        },
        backgroundConfig: {
          color: "#1a0f0a",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [{ id: "1", color: "#1a0f0a", position: 0 }, { id: "2", color: "#2d1a12", position: 100 }] }
        },
        cardConfig: {
          background: "#2d1a12",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [{ id: "1", color: "#2d1a12", position: 0 }, { id: "2", color: "#3d241a", position: 100 }] },
          border: { color: "#f97316", opacity: 20, width: 1 },
          shadow: { color: "#000000", opacity: 50, blur: 10, spread: 0, offsetX: 0, offsetY: 4 }
        },
        glassConfig: {
          enabled: false,
          blurAmount: 12,
          backgroundOpacity: 10,
          chromeIntensity: 30,
          chromeTexture: false,
          tintColor: "#ffffff"
        },
        statusColors: {
          success: "#10b981",
          successForeground: "#ffffff",
          warning: "#f97316",
          warningForeground: "#ffffff",
          error: "#ef4444",
          errorForeground: "#ffffff",
          info: "#3b82f6",
          infoForeground: "#ffffff"
        }
      }
    },
    {
      name: "Neon Matrix",
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
          gradient: {
            enabled: true,
            type: 'mesh',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: '#064e3b', position: 0 },
              { id: "2", color: '#14532d', position: 50 },
              { id: "3", color: '#052e16', position: 100 }
            ]
          }
        },
        buttonConfig: {
          colors: {
            default: "#22c55e",
            hover: "#4ade80",
            active: "#16a34a",
            text: "#ffffff"
          },
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: '#16a34a', position: 0 },
              { id: "2", color: '#22c55e', position: 100 }
            ]
          }
        },
        dividerConfig: {
          color: "#22c55e",
          opacity: 35,
          width: 1,
          style: 'solid'
        },
        backgroundConfig: {
          color: "#0a1410",
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 180,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: "#0a1410", position: 0 },
              { id: "2", color: "#14532d", position: 100 }
            ]
          }
        },
        cardConfig: {
          background: "#14532d",
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: "#14532d", position: 0 },
              { id: "2", color: "#166534", position: 100 }
            ]
          },
          border: { color: "#22c55e", opacity: 30, width: 1 },
          shadow: { color: "#22c55e", opacity: 20, blur: 15, spread: 0, offsetX: 0, offsetY: 4 }
        },
        glassConfig: {
          enabled: true,
          blurAmount: 16,
          backgroundOpacity: 15,
          chromeIntensity: 40,
          chromeTexture: true,
          tintColor: "#22c55e"
        },
        statusColors: {
          success: "#22c55e",
          successForeground: "#ffffff",
          warning: "#f59e0b",
          warningForeground: "#ffffff",
          error: "#ef4444",
          errorForeground: "#ffffff",
          info: "#3b82f6",
          infoForeground: "#ffffff"
        }
      }
    },
    {
      name: "Golden Night",
      theme: {
        colors: {
          background: "#1a140a",
          foreground: "#ffffff",
          primary: "#eab308",
          secondary: "#ca8a04",
          accent: "#fde047",
          muted: "#422006"
        },
        sidebarConfig: {
          colors: {
            background: "#1f190f",
            text: "#ffffff",
            activeBackground: "#a16207",
            activeText: "#ffffff",
            hoverBackground: "#422006",
            tabBarBackground: "#1f190f",
            tabActiveBackground: "#ca8a04",
            tabActiveText: "#ffffff",
            tabActiveBorder: "#ca8a04",
            tabInactiveText: "#fde047",
            tabHoverBackground: "#422006"
          },
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: '#78350f', position: 0 },
              { id: "2", color: '#713f12', position: 100 }
            ]
          }
        },
        buttonConfig: {
          colors: {
            default: "#eab308",
            hover: "#fde047",
            active: "#ca8a04",
            text: "#ffffff"
          },
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: '#ca8a04', position: 0 },
              { id: "2", color: '#eab308', position: 100 }
            ]
          }
        },
        dividerConfig: {
          color: "#eab308",
          opacity: 40,
          width: 1,
          style: 'solid'
        },
        backgroundConfig: {
          color: "#1a140a",
          gradient: {
            enabled: true,
            type: 'radial',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: "#422006", position: 0 },
              { id: "2", color: "#1a140a", position: 100 }
            ]
          }
        },
        cardConfig: {
          background: "#422006",
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: "#422006", position: 0 },
              { id: "2", color: "#713f12", position: 100 }
            ]
          },
          border: { color: "#eab308", opacity: 25, width: 1 },
          shadow: { color: "#eab308", opacity: 15, blur: 12, spread: 0, offsetX: 0, offsetY: 4 }
        },
        glassConfig: {
          enabled: true,
          blurAmount: 14,
          backgroundOpacity: 12,
          chromeIntensity: 35,
          chromeTexture: false,
          tintColor: "#eab308"
        },
        statusColors: {
          success: "#10b981",
          successForeground: "#ffffff",
          warning: "#eab308",
          warningForeground: "#ffffff",
          error: "#ef4444",
          errorForeground: "#ffffff",
          info: "#3b82f6",
          infoForeground: "#ffffff"
        }
      }
    },
    {
      name: "Violet Storm",
      theme: {
        colors: {
          background: "#0d0a1a",
          foreground: "#ffffff",
          primary: "#6366f1",
          secondary: "#4f46e5",
          accent: "#818cf8",
          muted: "#312e81"
        },
        sidebarConfig: {
          colors: {
            background: "#120f20",
            text: "#ffffff",
            activeBackground: "#4338ca",
            activeText: "#ffffff",
            hoverBackground: "#312e81",
            tabBarBackground: "#120f20",
            tabActiveBackground: "#4f46e5",
            tabActiveText: "#ffffff",
            tabActiveBorder: "#4f46e5",
            tabInactiveText: "#a5b4fc",
            tabHoverBackground: "#312e81"
          },
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 145,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: '#1e1b4b', position: 0 },
              { id: "2", color: '#312e81', position: 100 }
            ]
          }
        },
        buttonConfig: {
          colors: {
            default: "#6366f1",
            hover: "#818cf8",
            active: "#4f46e5",
            text: "#ffffff"
          },
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: '#4f46e5', position: 0 },
              { id: "2", color: '#6366f1', position: 100 }
            ]
          }
        },
        dividerConfig: {
          color: "#6366f1",
          opacity: 45,
          width: 1,
          style: 'solid'
        },
        backgroundConfig: {
          color: "#0d0a1a",
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 180,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: "#0d0a1a", position: 0 },
              { id: "2", color: "#1e1b4b", position: 100 }
            ]
          }
        },
        cardConfig: {
          background: "#312e81",
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: "#312e81", position: 0 },
              { id: "2", color: "#3730a3", position: 100 }
            ]
          },
          border: { color: "#6366f1", opacity: 30, width: 1 },
          shadow: { color: "#6366f1", opacity: 25, blur: 14, spread: 0, offsetX: 0, offsetY: 4 }
        },
        glassConfig: {
          enabled: true,
          blurAmount: 18,
          backgroundOpacity: 18,
          chromeIntensity: 45,
          chromeTexture: true,
          tintColor: "#6366f1"
        },
        statusColors: {
          success: "#10b981",
          successForeground: "#ffffff",
          warning: "#f59e0b",
          warningForeground: "#ffffff",
          error: "#ef4444",
          errorForeground: "#ffffff",
          info: "#6366f1",
          infoForeground: "#ffffff"
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
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: '#1f2937', position: 0 },
              { id: "2", color: '#374151', position: 100 }
            ]
          }
        },
        buttonConfig: {
          colors: {
            default: "#6b7280",
            hover: "#9ca3af",
            active: "#4b5563",
            text: "#ffffff"
          },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        dividerConfig: {
          color: "#6b7280",
          opacity: 30,
          width: 1,
          style: 'solid'
        },
        backgroundConfig: {
          color: "#0f1419",
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 180,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: "#0f1419", position: 0 },
              { id: "2", color: "#1f2937", position: 100 }
            ]
          }
        },
        cardConfig: {
          background: "#374151",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] },
          border: { color: "#6b7280", opacity: 40, width: 1 },
          shadow: { color: "#000000", opacity: 50, blur: 10, spread: 0, offsetX: 0, offsetY: 4 }
        },
        glassConfig: {
          enabled: false,
          blurAmount: 12,
          backgroundOpacity: 10,
          chromeIntensity: 30,
          chromeTexture: false,
          tintColor: "#ffffff"
        },
        statusColors: {
          success: "#10b981",
          successForeground: "#ffffff",
          warning: "#f59e0b",
          warningForeground: "#ffffff",
          error: "#ef4444",
          errorForeground: "#ffffff",
          info: "#6b7280",
          infoForeground: "#ffffff"
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
          colors: {
            default: "#2563eb",
            hover: "#3b82f6",
            active: "#1e40af",
            text: "#ffffff"
          },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        dividerConfig: {
          color: "#cbd5e1",
          opacity: 60,
          width: 1,
          style: 'solid'
        },
        backgroundConfig: {
          color: "#ffffff",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [{ id: "1", color: "#ffffff", position: 0 }, { id: "2", color: "#f8fafc", position: 100 }] }
        },
        cardConfig: {
          background: "#ffffff",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [{ id: "1", color: "#ffffff", position: 0 }, { id: "2", color: "#f8fafc", position: 100 }] },
          border: { color: "#e2e8f0", opacity: 100, width: 1 },
          shadow: { color: "#000000", opacity: 10, blur: 10, spread: 0, offsetX: 0, offsetY: 2 }
        },
        glassConfig: {
          enabled: false,
          blurAmount: 12,
          backgroundOpacity: 10,
          chromeIntensity: 30,
          chromeTexture: false,
          tintColor: "#000000"
        },
        statusColors: {
          success: "#10b981",
          successForeground: "#ffffff",
          warning: "#f59e0b",
          warningForeground: "#ffffff",
          error: "#ef4444",
          errorForeground: "#ffffff",
          info: "#2563eb",
          infoForeground: "#ffffff"
        }
      }
    },
    {
      name: "Warm Sand",
      theme: {
        colors: {
          background: "#fefefe",
          foreground: "#1a1a1a",
          primary: "#d97706",
          secondary: "#b45309",
          accent: "#f59e0b",
          muted: "#fef3c7"
        },
        sidebarConfig: {
          colors: {
            background: "#fffbeb",
            text: "#1a1a1a",
            activeBackground: "#d97706",
            activeText: "#ffffff",
            hoverBackground: "#fef3c7",
            tabBarBackground: "#fffbeb",
            tabActiveBackground: "#d97706",
            tabActiveText: "#ffffff",
            tabActiveBorder: "#d97706",
            tabInactiveText: "#92400e",
            tabHoverBackground: "#fef3c7"
          },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        buttonConfig: {
          colors: {
            default: "#d97706",
            hover: "#f59e0b",
            active: "#b45309",
            text: "#ffffff"
          },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        dividerConfig: {
          color: "#fcd34d",
          opacity: 50,
          width: 1,
          style: 'solid'
        },
        backgroundConfig: {
          color: "#fefefe",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [{ id: "1", color: "#fefefe", position: 0 }, { id: "2", color: "#fffbeb", position: 100 }] }
        },
        cardConfig: {
          background: "#ffffff",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [{ id: "1", color: "#ffffff", position: 0 }, { id: "2", color: "#fffbeb", position: 100 }] },
          border: { color: "#fcd34d", opacity: 40, width: 1 },
          shadow: { color: "#92400e", opacity: 10, blur: 10, spread: 0, offsetX: 0, offsetY: 2 }
        },
        glassConfig: {
          enabled: false,
          blurAmount: 12,
          backgroundOpacity: 10,
          chromeIntensity: 30,
          chromeTexture: false,
          tintColor: "#000000"
        },
        statusColors: {
          success: "#10b981",
          successForeground: "#ffffff",
          warning: "#d97706",
          warningForeground: "#ffffff",
          error: "#ef4444",
          errorForeground: "#ffffff",
          info: "#3b82f6",
          infoForeground: "#ffffff"
        }
      }
    },
    {
      name: "Arctic Blue",
      theme: {
        colors: {
          background: "#f8fafc",
          foreground: "#0f172a",
          primary: "#0ea5e9",
          secondary: "#0284c7",
          accent: "#38bdf8",
          muted: "#e0f2fe"
        },
        sidebarConfig: {
          colors: {
            background: "#e0f2fe",
            text: "#0c4a6e",
            activeBackground: "#0284c7",
            activeText: "#ffffff",
            hoverBackground: "#bae6fd",
            tabBarBackground: "#e0f2fe",
            tabActiveBackground: "#0ea5e9",
            tabActiveText: "#ffffff",
            tabActiveBorder: "#0ea5e9",
            tabInactiveText: "#0c4a6e",
            tabHoverBackground: "#bae6fd"
          },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        buttonConfig: {
          colors: {
            default: "#0ea5e9",
            hover: "#38bdf8",
            active: "#0284c7",
            text: "#ffffff"
          },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        dividerConfig: {
          color: "#7dd3fc",
          opacity: 50,
          width: 1,
          style: 'solid'
        },
        backgroundConfig: {
          color: "#f8fafc",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [{ id: "1", color: "#f8fafc", position: 0 }, { id: "2", color: "#e0f2fe", position: 100 }] }
        },
        cardConfig: {
          background: "#ffffff",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [{ id: "1", color: "#ffffff", position: 0 }, { id: "2", color: "#e0f2fe", position: 100 }] },
          border: { color: "#7dd3fc", opacity: 40, width: 1 },
          shadow: { color: "#0c4a6e", opacity: 10, blur: 10, spread: 0, offsetX: 0, offsetY: 2 }
        },
        glassConfig: {
          enabled: false,
          blurAmount: 12,
          backgroundOpacity: 10,
          chromeIntensity: 30,
          chromeTexture: false,
          tintColor: "#000000"
        },
        statusColors: {
          success: "#10b981",
          successForeground: "#ffffff",
          warning: "#f59e0b",
          warningForeground: "#ffffff",
          error: "#ef4444",
          errorForeground: "#ffffff",
          info: "#0ea5e9",
          infoForeground: "#ffffff"
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
          colors: {
            default: "#ec4899",
            hover: "#f472b6",
            active: "#db2777",
            text: "#ffffff"
          },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        dividerConfig: {
          color: "#f9a8d4",
          opacity: 50,
          width: 1,
          style: 'solid'
        },
        backgroundConfig: {
          color: "#fefefe",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [{ id: "1", color: "#fefefe", position: 0 }, { id: "2", color: "#fdf2f8", position: 100 }] }
        },
        cardConfig: {
          background: "#ffffff",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [{ id: "1", color: "#ffffff", position: 0 }, { id: "2", color: "#fdf2f8", position: 100 }] },
          border: { color: "#f9a8d4", opacity: 40, width: 1 },
          shadow: { color: "#831843", opacity: 10, blur: 10, spread: 0, offsetX: 0, offsetY: 2 }
        },
        glassConfig: {
          enabled: false,
          blurAmount: 12,
          backgroundOpacity: 10,
          chromeIntensity: 30,
          chromeTexture: false,
          tintColor: "#000000"
        },
        statusColors: {
          success: "#10b981",
          successForeground: "#ffffff",
          warning: "#f59e0b",
          warningForeground: "#ffffff",
          error: "#ec4899",
          errorForeground: "#ffffff",
          info: "#3b82f6",
          infoForeground: "#ffffff"
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
          colors: {
            default: "#10b981",
            hover: "#34d399",
            active: "#059669",
            text: "#ffffff"
          },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        dividerConfig: {
          color: "#6ee7b7",
          opacity: 50,
          width: 1,
          style: 'solid'
        },
        backgroundConfig: {
          color: "#fefefe",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [{ id: "1", color: "#fefefe", position: 0 }, { id: "2", color: "#ecfdf5", position: 100 }] }
        },
        cardConfig: {
          background: "#ffffff",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [{ id: "1", color: "#ffffff", position: 0 }, { id: "2", color: "#ecfdf5", position: 100 }] },
          border: { color: "#6ee7b7", opacity: 40, width: 1 },
          shadow: { color: "#064e3b", opacity: 10, blur: 10, spread: 0, offsetX: 0, offsetY: 2 }
        },
        glassConfig: {
          enabled: false,
          blurAmount: 12,
          backgroundOpacity: 10,
          chromeIntensity: 30,
          chromeTexture: false,
          tintColor: "#000000"
        },
        statusColors: {
          success: "#10b981",
          successForeground: "#ffffff",
          warning: "#f59e0b",
          warningForeground: "#ffffff",
          error: "#ef4444",
          errorForeground: "#ffffff",
          info: "#3b82f6",
          infoForeground: "#ffffff"
        }
      }
    },
    {
      name: "Mint Fresh",
      theme: {
        colors: {
          background: "#f0fdfa",
          foreground: "#0f172a",
          primary: "#14b8a6",
          secondary: "#0d9488",
          accent: "#2dd4bf",
          muted: "#ccfbf1"
        },
        sidebarConfig: {
          colors: {
            background: "#ccfbf1",
            text: "#134e4a",
            activeBackground: "#0d9488",
            activeText: "#ffffff",
            hoverBackground: "#99f6e4",
            tabBarBackground: "#ccfbf1",
            tabActiveBackground: "#14b8a6",
            tabActiveText: "#ffffff",
            tabActiveBorder: "#14b8a6",
            tabInactiveText: "#134e4a",
            tabHoverBackground: "#99f6e4"
          },
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: '#f0fdfa', position: 0 },
              { id: "2", color: '#ccfbf1', position: 100 }
            ]
          }
        },
        buttonConfig: {
          colors: {
            default: "#14b8a6",
            hover: "#2dd4bf",
            active: "#0d9488",
            text: "#ffffff"
          },
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: '#0d9488', position: 0 },
              { id: "2", color: '#14b8a6', position: 100 }
            ]
          }
        },
        dividerConfig: {
          color: "#5eead4",
          opacity: 60,
          width: 1,
          style: 'solid'
        },
        backgroundConfig: {
          color: "#f0fdfa",
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 180,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: "#ffffff", position: 0 },
              { id: "2", color: "#f0fdfa", position: 100 }
            ]
          }
        },
        cardConfig: {
          background: "#ffffff",
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: "#ffffff", position: 0 },
              { id: "2", color: "#f0fdfa", position: 100 }
            ]
          },
          border: { color: "#5eead4", opacity: 50, width: 1 },
          shadow: { color: "#0d9488", opacity: 12, blur: 12, spread: 0, offsetX: 0, offsetY: 2 }
        },
        glassConfig: {
          enabled: true,
          blurAmount: 14,
          backgroundOpacity: 15,
          chromeIntensity: 35,
          chromeTexture: true,
          tintColor: "#14b8a6"
        },
        statusColors: {
          success: "#14b8a6",
          successForeground: "#ffffff",
          warning: "#f59e0b",
          warningForeground: "#ffffff",
          error: "#ef4444",
          errorForeground: "#ffffff",
          info: "#3b82f6",
          infoForeground: "#ffffff"
        }
      }
    },
    {
      name: "Lavender Dreams",
      theme: {
        colors: {
          background: "#faf5ff",
          foreground: "#1a1a1a",
          primary: "#8b5cf6",
          secondary: "#7c3aed",
          accent: "#a78bfa",
          muted: "#ede9fe"
        },
        sidebarConfig: {
          colors: {
            background: "#f5f3ff",
            text: "#5b21b6",
            activeBackground: "#7c3aed",
            activeText: "#ffffff",
            hoverBackground: "#ede9fe",
            tabBarBackground: "#f5f3ff",
            tabActiveBackground: "#8b5cf6",
            tabActiveText: "#ffffff",
            tabActiveBorder: "#8b5cf6",
            tabInactiveText: "#5b21b6",
            tabHoverBackground: "#ede9fe"
          },
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: '#faf5ff', position: 0 },
              { id: "2", color: '#f5f3ff', position: 100 }
            ]
          }
        },
        buttonConfig: {
          colors: {
            default: "#8b5cf6",
            hover: "#a78bfa",
            active: "#7c3aed",
            text: "#ffffff"
          },
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: '#7c3aed', position: 0 },
              { id: "2", color: '#8b5cf6', position: 100 }
            ]
          }
        },
        dividerConfig: {
          color: "#c4b5fd",
          opacity: 60,
          width: 1,
          style: 'solid'
        },
        backgroundConfig: {
          color: "#faf5ff",
          gradient: {
            enabled: true,
            type: 'radial',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: "#ffffff", position: 0 },
              { id: "2", color: "#faf5ff", position: 100 }
            ]
          }
        },
        cardConfig: {
          background: "#ffffff",
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: "#ffffff", position: 0 },
              { id: "2", color: "#f5f3ff", position: 100 }
            ]
          },
          border: { color: "#c4b5fd", opacity: 50, width: 1 },
          shadow: { color: "#7c3aed", opacity: 12, blur: 12, spread: 0, offsetX: 0, offsetY: 2 }
        },
        glassConfig: {
          enabled: true,
          blurAmount: 16,
          backgroundOpacity: 18,
          chromeIntensity: 40,
          chromeTexture: true,
          tintColor: "#8b5cf6"
        },
        statusColors: {
          success: "#10b981",
          successForeground: "#ffffff",
          warning: "#f59e0b",
          warningForeground: "#ffffff",
          error: "#ef4444",
          errorForeground: "#ffffff",
          info: "#8b5cf6",
          infoForeground: "#ffffff"
        }
      }
    },
    {
      name: "Peach Blossom",
      theme: {
        colors: {
          background: "#fff7ed",
          foreground: "#1a1a1a",
          primary: "#f97316",
          secondary: "#ea580c",
          accent: "#fb923c",
          muted: "#fed7aa"
        },
        sidebarConfig: {
          colors: {
            background: "#ffedd5",
            text: "#7c2d12",
            activeBackground: "#ea580c",
            activeText: "#ffffff",
            hoverBackground: "#fed7aa",
            tabBarBackground: "#ffedd5",
            tabActiveBackground: "#f97316",
            tabActiveText: "#ffffff",
            tabActiveBorder: "#f97316",
            tabInactiveText: "#7c2d12",
            tabHoverBackground: "#fed7aa"
          },
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: '#fff7ed', position: 0 },
              { id: "2", color: '#ffedd5', position: 100 }
            ]
          }
        },
        buttonConfig: {
          colors: {
            default: "#f97316",
            hover: "#fb923c",
            active: "#ea580c",
            text: "#ffffff"
          },
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: '#ea580c', position: 0 },
              { id: "2", color: '#f97316', position: 100 }
            ]
          }
        },
        dividerConfig: {
          color: "#fdba74",
          opacity: 60,
          width: 1,
          style: 'solid'
        },
        backgroundConfig: {
          color: "#fff7ed",
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 180,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: "#ffffff", position: 0 },
              { id: "2", color: "#fff7ed", position: 100 }
            ]
          }
        },
        cardConfig: {
          background: "#ffffff",
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: "#ffffff", position: 0 },
              { id: "2", color: "#ffedd5", position: 100 }
            ]
          },
          border: { color: "#fdba74", opacity: 50, width: 1 },
          shadow: { color: "#ea580c", opacity: 12, blur: 12, spread: 0, offsetX: 0, offsetY: 2 }
        },
        glassConfig: {
          enabled: true,
          blurAmount: 14,
          backgroundOpacity: 16,
          chromeIntensity: 38,
          chromeTexture: false,
          tintColor: "#f97316"
        },
        statusColors: {
          success: "#10b981",
          successForeground: "#ffffff",
          warning: "#f97316",
          warningForeground: "#ffffff",
          error: "#ef4444",
          errorForeground: "#ffffff",
          info: "#3b82f6",
          infoForeground: "#ffffff"
        }
      }
    },
    {
      name: "Slate Professional",
      theme: {
        colors: {
          background: "#f8fafc",
          foreground: "#0f172a",
          primary: "#475569",
          secondary: "#334155",
          accent: "#64748b",
          muted: "#e2e8f0"
        },
        sidebarConfig: {
          colors: {
            background: "#e2e8f0",
            text: "#1e293b",
            activeBackground: "#334155",
            activeText: "#ffffff",
            hoverBackground: "#cbd5e1",
            tabBarBackground: "#e2e8f0",
            tabActiveBackground: "#475569",
            tabActiveText: "#ffffff",
            tabActiveBorder: "#475569",
            tabInactiveText: "#1e293b",
            tabHoverBackground: "#cbd5e1"
          },
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 135,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: '#f1f5f9', position: 0 },
              { id: "2", color: '#e2e8f0', position: 100 }
            ]
          }
        },
        buttonConfig: {
          colors: {
            default: "#475569",
            hover: "#64748b",
            active: "#334155",
            text: "#ffffff"
          },
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] }
        },
        dividerConfig: {
          color: "#94a3b8",
          opacity: 60,
          width: 1,
          style: 'solid'
        },
        backgroundConfig: {
          color: "#f8fafc",
          gradient: {
            enabled: true,
            type: 'linear',
            angle: 180,
            centerX: 50,
            centerY: 50,
            stops: [
              { id: "1", color: "#ffffff", position: 0 },
              { id: "2", color: "#f1f5f9", position: 100 }
            ]
          }
        },
        cardConfig: {
          background: "#ffffff",
          gradient: { enabled: false, type: 'linear', angle: 135, centerX: 50, centerY: 50, stops: [] },
          border: { color: "#cbd5e1", opacity: 100, width: 1 },
          shadow: { color: "#334155", opacity: 10, blur: 10, spread: 0, offsetX: 0, offsetY: 2 }
        },
        glassConfig: {
          enabled: false,
          blurAmount: 12,
          backgroundOpacity: 10,
          chromeIntensity: 30,
          chromeTexture: false,
          tintColor: "#000000"
        },
        statusColors: {
          success: "#10b981",
          successForeground: "#ffffff",
          warning: "#f59e0b",
          warningForeground: "#ffffff",
          error: "#ef4444",
          errorForeground: "#ffffff",
          info: "#475569",
          infoForeground: "#ffffff"
        }
      }
    }
  ]
};

export const ThemePresets = ({ mode }: ThemePresetsProps) => {
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
      key => presetColors[key]?.toLowerCase() === currentColors[key]?.toLowerCase()
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

    // Check if preset with this name already exists
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
    } catch (error) {
      toast.error("Failed to save preset");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePreset = async (id: string, name: string) => {
    try {
      await deleteCustomPreset(id);
      toast.success(`"${name}" deleted`);
    } catch (error) {
      toast.error("Failed to delete preset");
      console.error(error);
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
            const isActive = isActivePreset(preset.theme.colors);
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
              const presetTheme = preset.colors as any;
              const colors = presetTheme.colors || presetTheme;
              const isActive = isActivePreset(colors);
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
};
