import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brush, Save, Loader2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ButtonsSettings } from "./ButtonsSettings";
import { SidebarSettings } from "./SidebarSettings";
import { BackgroundSettings } from "./BackgroundSettings";
import { CardsSettings } from "./CardsSettings";
import { GlassSettings } from "./GlassSettings";
import { StatusSettings } from "./StatusSettings";
import { DividersSettings } from "./DividersSettings";
import { ThemePresets } from "./ThemePresets";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 rounded-md cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-0"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

export function ThemesSettings() {
  const { lightColors, darkColors, updateLightColor, updateDarkColor, resetToDefaults, saveThemeToDatabase, isSaving } = useTheme();

  // Safe guard for undefined theme values
  if (!lightColors || !darkColors) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brush size={20} />
            Theme Customization
          </CardTitle>
          <CardDescription>
            Loading theme settings...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brush size={20} />
          Theme Customization
        </CardTitle>
        <CardDescription>
          Customize the appearance and visual style of your application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="dark" className="w-full">
          <TabsList className="grid w-full grid-cols-9 mb-6">
            <TabsTrigger value="dark">Dark Mode</TabsTrigger>
            <TabsTrigger value="light">Light Mode</TabsTrigger>
            <TabsTrigger value="sidebar">Sidebar</TabsTrigger>
            <TabsTrigger value="background">Background</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="glass">Glass</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="dividers">Dividers</TabsTrigger>
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
          </TabsList>

          <TabsContent value="dark" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ColorPicker
                label="Background"
                value={darkColors.background}
                onChange={(value) => updateDarkColor("background", value)}
              />
              <ColorPicker
                label="Foreground"
                value={darkColors.foreground}
                onChange={(value) => updateDarkColor("foreground", value)}
              />
              <ColorPicker
                label="Primary"
                value={darkColors.primary}
                onChange={(value) => updateDarkColor("primary", value)}
              />
              <ColorPicker
                label="Secondary"
                value={darkColors.secondary}
                onChange={(value) => updateDarkColor("secondary", value)}
              />
              <ColorPicker
                label="Accent"
                value={darkColors.accent}
                onChange={(value) => updateDarkColor("accent", value)}
              />
              <ColorPicker
                label="Muted"
                value={darkColors.muted}
                onChange={(value) => updateDarkColor("muted", value)}
              />
            </div>
            <ThemePresets mode="dark" />
          </TabsContent>

          <TabsContent value="light" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ColorPicker
                label="Background"
                value={lightColors.background}
                onChange={(value) => updateLightColor("background", value)}
              />
              <ColorPicker
                label="Foreground"
                value={lightColors.foreground}
                onChange={(value) => updateLightColor("foreground", value)}
              />
              <ColorPicker
                label="Primary"
                value={lightColors.primary}
                onChange={(value) => updateLightColor("primary", value)}
              />
              <ColorPicker
                label="Secondary"
                value={lightColors.secondary}
                onChange={(value) => updateLightColor("secondary", value)}
              />
              <ColorPicker
                label="Accent"
                value={lightColors.accent}
                onChange={(value) => updateLightColor("accent", value)}
              />
              <ColorPicker
                label="Muted"
                value={lightColors.muted}
                onChange={(value) => updateLightColor("muted", value)}
              />
            </div>
            <ThemePresets mode="light" />
          </TabsContent>

          <TabsContent value="sidebar" className="mt-6">
            <SidebarSettings />
          </TabsContent>

          <TabsContent value="buttons">
            <ButtonsSettings />
          </TabsContent>

          <TabsContent value="background" className="mt-6">
            <BackgroundSettings />
          </TabsContent>

          <TabsContent value="cards" className="mt-6">
            <CardsSettings />
          </TabsContent>

          <TabsContent value="glass" className="mt-6">
            <GlassSettings />
          </TabsContent>

          <TabsContent value="status" className="mt-6">
            <StatusSettings />
          </TabsContent>

          <TabsContent value="dividers" className="mt-6">
            <DividersSettings />
          </TabsContent>
        </Tabs>

        <div className="pt-6 border-t mt-6 flex gap-4">
          <Button onClick={saveThemeToDatabase} disabled={isSaving} className="flex-1">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Theme
          </Button>
          <Button variant="outline" onClick={resetToDefaults} className="flex-1">
            Reset to Default Theme
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
