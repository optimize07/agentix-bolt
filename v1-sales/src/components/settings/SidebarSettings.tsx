import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useTheme, generateGradientCSS } from "@/contexts/ThemeContext";
import { GradientEditor } from "./GradientEditor";
import { Sun, Moon } from "lucide-react";

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
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

export function SidebarSettings() {
  const {
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
  } = useTheme();

  // Safe guard for undefined theme values
  if (!lightSidebarConfig || !darkSidebarConfig) {
    return <div className="p-4 text-muted-foreground">Loading sidebar settings...</div>;
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

        {/* Solid Colors */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Solid Colors</h4>
          <ColorPicker
            label="Background"
            value={lightSidebarConfig.colors.background}
            onChange={(val) => updateLightSidebarColor("background", val)}
          />
          <ColorPicker
            label="Text"
            value={lightSidebarConfig.colors.text}
            onChange={(val) => updateLightSidebarColor("text", val)}
          />
          <ColorPicker
            label="Active Background"
            value={lightSidebarConfig.colors.activeBackground}
            onChange={(val) => updateLightSidebarColor("activeBackground", val)}
          />
          <ColorPicker
            label="Active Text"
            value={lightSidebarConfig.colors.activeText}
            onChange={(val) => updateLightSidebarColor("activeText", val)}
          />
          <ColorPicker
            label="Hover Background"
            value={lightSidebarConfig.colors.hoverBackground}
            onChange={(val) => updateLightSidebarColor("hoverBackground", val)}
          />
        </div>

        {/* Gradient Toggle & Editor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Gradient</Label>
            <Switch
              checked={lightSidebarConfig.gradient.enabled}
              onCheckedChange={(checked) => updateLightSidebarGradient({ enabled: checked })}
            />
          </div>

          {lightSidebarConfig.gradient.enabled && (
            <>
              <div
                className="h-24 rounded-lg border border-border"
                style={{ background: generateGradientCSS(lightSidebarConfig.gradient) }}
              />

              <GradientEditor
                gradient={lightSidebarConfig.gradient}
                onUpdate={updateLightSidebarGradient}
                onAddStop={addLightSidebarGradientStop}
                onRemoveStop={removeLightSidebarGradientStop}
                onUpdateStop={updateLightSidebarGradientStop}
              />
            </>
          )}
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">Preview</h4>
          <div
            className="rounded-lg border border-border p-4 min-h-[200px]"
            style={{
              background: lightSidebarConfig.gradient.enabled
                ? generateGradientCSS(lightSidebarConfig.gradient)
                : lightSidebarConfig.colors.background,
            }}
          >
            <div className="space-y-2">
              <div
                className="px-3 py-2 rounded-lg"
                style={{ color: lightSidebarConfig.colors.text }}
              >
                Dashboard
              </div>
              <div
                className="px-3 py-2 rounded-lg"
                style={{
                  color: lightSidebarConfig.colors.activeText,
                  backgroundColor: lightSidebarConfig.colors.activeBackground,
                }}
              >
                Settings (Active)
              </div>
              <div
                className="px-3 py-2 rounded-lg"
                style={{
                  color: lightSidebarConfig.colors.text,
                  backgroundColor: lightSidebarConfig.colors.hoverBackground,
                }}
              >
                Analytics (Hover)
              </div>
            </div>
          </div>
        </div>
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

        {/* Solid Colors */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Solid Colors</h4>
          <ColorPicker
            label="Background"
            value={darkSidebarConfig.colors.background}
            onChange={(val) => updateDarkSidebarColor("background", val)}
          />
          <ColorPicker
            label="Text"
            value={darkSidebarConfig.colors.text}
            onChange={(val) => updateDarkSidebarColor("text", val)}
          />
          <ColorPicker
            label="Active Background"
            value={darkSidebarConfig.colors.activeBackground}
            onChange={(val) => updateDarkSidebarColor("activeBackground", val)}
          />
          <ColorPicker
            label="Active Text"
            value={darkSidebarConfig.colors.activeText}
            onChange={(val) => updateDarkSidebarColor("activeText", val)}
          />
          <ColorPicker
            label="Hover Background"
            value={darkSidebarConfig.colors.hoverBackground}
            onChange={(val) => updateDarkSidebarColor("hoverBackground", val)}
          />
        </div>

        {/* Gradient Toggle & Editor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Gradient</Label>
            <Switch
              checked={darkSidebarConfig.gradient.enabled}
              onCheckedChange={(checked) => updateDarkSidebarGradient({ enabled: checked })}
            />
          </div>

          {darkSidebarConfig.gradient.enabled && (
            <>
              <div
                className="h-24 rounded-lg border border-border"
                style={{ background: generateGradientCSS(darkSidebarConfig.gradient) }}
              />

              <GradientEditor
                gradient={darkSidebarConfig.gradient}
                onUpdate={updateDarkSidebarGradient}
                onAddStop={addDarkSidebarGradientStop}
                onRemoveStop={removeDarkSidebarGradientStop}
                onUpdateStop={updateDarkSidebarGradientStop}
              />
            </>
          )}
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">Preview</h4>
          <div
            className="rounded-lg border border-border p-4 min-h-[200px]"
            style={{
              background: darkSidebarConfig.gradient.enabled
                ? generateGradientCSS(darkSidebarConfig.gradient)
                : darkSidebarConfig.colors.background,
            }}
          >
            <div className="space-y-2">
              <div
                className="px-3 py-2 rounded-lg"
                style={{ color: darkSidebarConfig.colors.text }}
              >
                Dashboard
              </div>
              <div
                className="px-3 py-2 rounded-lg"
                style={{
                  color: darkSidebarConfig.colors.activeText,
                  backgroundColor: darkSidebarConfig.colors.activeBackground,
                }}
              >
                Settings (Active)
              </div>
              <div
                className="px-3 py-2 rounded-lg"
                style={{
                  color: darkSidebarConfig.colors.text,
                  backgroundColor: darkSidebarConfig.colors.hoverBackground,
                }}
              >
                Analytics (Hover)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
