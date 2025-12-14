import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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

export function ButtonsSettings() {
  const {
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
  } = useTheme();

  // Safe guard for undefined theme values
  if (!lightButtonConfig || !darkButtonConfig) {
    return <div className="p-4 text-muted-foreground">Loading button settings...</div>;
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
            label="Default"
            value={lightButtonConfig.colors.default}
            onChange={(val) => updateLightButtonColor("default", val)}
          />
          <ColorPicker
            label="Hover"
            value={lightButtonConfig.colors.hover}
            onChange={(val) => updateLightButtonColor("hover", val)}
          />
          <ColorPicker
            label="Active"
            value={lightButtonConfig.colors.active}
            onChange={(val) => updateLightButtonColor("active", val)}
          />
          <ColorPicker
            label="Text"
            value={lightButtonConfig.colors.text}
            onChange={(val) => updateLightButtonColor("text", val)}
          />
        </div>

        {/* Gradient Toggle & Editor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Gradient</Label>
            <Switch
              checked={lightButtonConfig.gradient.enabled}
              onCheckedChange={(checked) => updateLightButtonGradient({ enabled: checked })}
            />
          </div>

          {lightButtonConfig.gradient.enabled && (
            <GradientEditor
              gradient={lightButtonConfig.gradient}
              onUpdate={updateLightButtonGradient}
              onAddStop={addLightButtonGradientStop}
              onRemoveStop={removeLightButtonGradientStop}
              onUpdateStop={updateLightButtonGradientStop}
            />
          )}
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">Preview</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              style={{
                background: lightButtonConfig.gradient.enabled
                  ? generateGradientCSS(lightButtonConfig.gradient)
                  : lightButtonConfig.colors.default,
                color: lightButtonConfig.colors.text,
              }}
            >
              Default
            </Button>
            <Button
              style={{
                background: lightButtonConfig.colors.hover,
                color: lightButtonConfig.colors.text,
              }}
            >
              Hover
            </Button>
            <Button
              style={{
                background: lightButtonConfig.colors.active,
                color: lightButtonConfig.colors.text,
              }}
            >
              Active
            </Button>
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
            label="Default"
            value={darkButtonConfig.colors.default}
            onChange={(val) => updateDarkButtonColor("default", val)}
          />
          <ColorPicker
            label="Hover"
            value={darkButtonConfig.colors.hover}
            onChange={(val) => updateDarkButtonColor("hover", val)}
          />
          <ColorPicker
            label="Active"
            value={darkButtonConfig.colors.active}
            onChange={(val) => updateDarkButtonColor("active", val)}
          />
          <ColorPicker
            label="Text"
            value={darkButtonConfig.colors.text}
            onChange={(val) => updateDarkButtonColor("text", val)}
          />
        </div>

        {/* Gradient Toggle & Editor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Gradient</Label>
            <Switch
              checked={darkButtonConfig.gradient.enabled}
              onCheckedChange={(checked) => updateDarkButtonGradient({ enabled: checked })}
            />
          </div>

          {darkButtonConfig.gradient.enabled && (
            <GradientEditor
              gradient={darkButtonConfig.gradient}
              onUpdate={updateDarkButtonGradient}
              onAddStop={addDarkButtonGradientStop}
              onRemoveStop={removeDarkButtonGradientStop}
              onUpdateStop={updateDarkButtonGradientStop}
            />
          )}
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">Preview</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              style={{
                background: darkButtonConfig.gradient.enabled
                  ? generateGradientCSS(darkButtonConfig.gradient)
                  : darkButtonConfig.colors.default,
                color: darkButtonConfig.colors.text,
              }}
            >
              Default
            </Button>
            <Button
              style={{
                background: darkButtonConfig.colors.hover,
                color: darkButtonConfig.colors.text,
              }}
            >
              Hover
            </Button>
            <Button
              style={{
                background: darkButtonConfig.colors.active,
                color: darkButtonConfig.colors.text,
              }}
            >
              Active
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}







