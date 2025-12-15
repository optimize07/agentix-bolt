import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useTheme, generateGradientCSS } from "@/contexts/ThemeContext";
import { GradientEditor } from "./GradientEditor";
import { Sun, Moon } from "lucide-react";

export function BackgroundSettings() {
  const {
    lightBackgroundConfig,
    darkBackgroundConfig,
    lightColors,
    darkColors,
    updateLightBackgroundGradient,
    updateDarkBackgroundGradient,
    addLightBackgroundGradientStop,
    addDarkBackgroundGradientStop,
    removeLightBackgroundGradientStop,
    removeDarkBackgroundGradientStop,
    updateLightBackgroundGradientStop,
    updateDarkBackgroundGradientStop,
  } = useTheme();

  // Safe guard for undefined theme values
  if (!lightBackgroundConfig || !darkBackgroundConfig || !lightColors || !darkColors) {
    return <div className="p-4 text-muted-foreground">Loading background settings...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Light Mode Column */}
      <div 
        className="space-y-6 p-6 rounded-lg"
        style={{
          background: 'var(--card-bg)',
          border: 'var(--card-border-width) solid var(--card-border)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">Light Mode</h3>
        </div>

        {/* Solid Color - Read Only */}
        {!lightBackgroundConfig.gradient.enabled && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Solid Background Color</Label>
            <div className="flex items-center gap-3">
              <div 
                className="h-10 w-10 rounded-md border border-border"
                style={{ backgroundColor: lightColors.background }}
              />
              <Input
                type="text"
                value={lightColors.background}
                readOnly
                className="flex-1 font-mono text-sm bg-muted cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Change this in the <span className="font-semibold">Light Mode</span> tab
            </p>
          </div>
        )}

        {/* Gradient Toggle & Editor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Gradient</Label>
            <Switch
              checked={lightBackgroundConfig.gradient.enabled}
              onCheckedChange={(checked) => updateLightBackgroundGradient({ enabled: checked })}
            />
          </div>

          {lightBackgroundConfig.gradient.enabled && (
            <>
              {/* Gradient Preview */}
              <div
                className="h-32 rounded-lg border border-border"
                style={{ background: generateGradientCSS(lightBackgroundConfig.gradient) }}
              />

              <GradientEditor
                gradient={lightBackgroundConfig.gradient}
                onUpdate={updateLightBackgroundGradient}
                onAddStop={addLightBackgroundGradientStop}
                onRemoveStop={removeLightBackgroundGradientStop}
                onUpdateStop={updateLightBackgroundGradientStop}
              />
            </>
          )}
        </div>

        {/* Preview */}
        {!lightBackgroundConfig.gradient.enabled && (
          <div
            className="h-32 rounded-lg border border-border"
            style={{ backgroundColor: lightColors.background }}
          />
        )}
      </div>

      {/* Dark Mode Column */}
      <div 
        className="space-y-6 p-6 rounded-lg"
        style={{
          background: 'var(--card-bg)',
          border: 'var(--card-border-width) solid var(--card-border)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div className="flex items-center gap-2">
          <Moon className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold">Dark Mode</h3>
        </div>

        {/* Solid Color - Read Only */}
        {!darkBackgroundConfig.gradient.enabled && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Solid Background Color</Label>
            <div className="flex items-center gap-3">
              <div 
                className="h-10 w-10 rounded-md border border-border"
                style={{ backgroundColor: darkColors.background }}
              />
              <Input
                type="text"
                value={darkColors.background}
                readOnly
                className="flex-1 font-mono text-sm bg-muted cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Change this in the <span className="font-semibold">Dark Mode</span> tab
            </p>
          </div>
        )}

        {/* Gradient Toggle & Editor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Gradient</Label>
            <Switch
              checked={darkBackgroundConfig.gradient.enabled}
              onCheckedChange={(checked) => updateDarkBackgroundGradient({ enabled: checked })}
            />
          </div>

          {darkBackgroundConfig.gradient.enabled && (
            <>
              {/* Gradient Preview */}
              <div
                className="h-32 rounded-lg border border-border"
                style={{ background: generateGradientCSS(darkBackgroundConfig.gradient) }}
              />

              <GradientEditor
                gradient={darkBackgroundConfig.gradient}
                onUpdate={updateDarkBackgroundGradient}
                onAddStop={addDarkBackgroundGradientStop}
                onRemoveStop={removeDarkBackgroundGradientStop}
                onUpdateStop={updateDarkBackgroundGradientStop}
              />
            </>
          )}
        </div>

        {/* Preview */}
        {!darkBackgroundConfig.gradient.enabled && (
          <div
            className="h-32 rounded-lg border border-border"
            style={{ backgroundColor: darkColors.background }}
          />
        )}
      </div>
    </div>
  );
}
