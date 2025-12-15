import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTheme, generateGradientCSS } from "@/contexts/ThemeContext";
import { GradientEditor } from "./GradientEditor";
import { Sun, Moon } from "lucide-react";

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

        {/* Solid Button Colors */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Button Colors</h4>
          <ColorPicker
            label="Default"
            value={lightButtonConfig.colors.default}
            onChange={(value) => updateLightButtonColor("default", value)}
          />
          <ColorPicker
            label="Hover"
            value={lightButtonConfig.colors.hover}
            onChange={(value) => updateLightButtonColor("hover", value)}
          />
          <ColorPicker
            label="Active"
            value={lightButtonConfig.colors.active}
            onChange={(value) => updateLightButtonColor("active", value)}
          />
          <ColorPicker
            label="Text"
            value={lightButtonConfig.colors.text}
            onChange={(value) => updateLightButtonColor("text", value)}
          />
        </div>

        {/* Gradient Styling */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Gradient</Label>
            <Switch
              checked={lightButtonConfig.gradient.enabled}
              onCheckedChange={(checked) => updateLightButtonGradient({ enabled: checked })}
            />
          </div>

          {lightButtonConfig.gradient.enabled && (
            <>
              <div
                className="h-16 rounded-lg border border-border"
                style={{ background: generateGradientCSS(lightButtonConfig.gradient) }}
              />

              <GradientEditor
                gradient={lightButtonConfig.gradient}
                onUpdate={updateLightButtonGradient}
                onAddStop={addLightButtonGradientStop}
                onRemoveStop={removeLightButtonGradientStop}
                onUpdateStop={updateLightButtonGradientStop}
              />
            </>
          )}
        </div>

        {/* Live Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">Preview</h4>
          <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
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

        {/* Solid Button Colors */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Button Colors</h4>
          <ColorPicker
            label="Default"
            value={darkButtonConfig.colors.default}
            onChange={(value) => updateDarkButtonColor("default", value)}
          />
          <ColorPicker
            label="Hover"
            value={darkButtonConfig.colors.hover}
            onChange={(value) => updateDarkButtonColor("hover", value)}
          />
          <ColorPicker
            label="Active"
            value={darkButtonConfig.colors.active}
            onChange={(value) => updateDarkButtonColor("active", value)}
          />
          <ColorPicker
            label="Text"
            value={darkButtonConfig.colors.text}
            onChange={(value) => updateDarkButtonColor("text", value)}
          />
        </div>

        {/* Gradient Styling */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Gradient</Label>
            <Switch
              checked={darkButtonConfig.gradient.enabled}
              onCheckedChange={(checked) => updateDarkButtonGradient({ enabled: checked })}
            />
          </div>

          {darkButtonConfig.gradient.enabled && (
            <>
              <div
                className="h-16 rounded-lg border border-border"
                style={{ background: generateGradientCSS(darkButtonConfig.gradient) }}
              />

              <GradientEditor
                gradient={darkButtonConfig.gradient}
                onUpdate={updateDarkButtonGradient}
                onAddStop={addDarkButtonGradientStop}
                onRemoveStop={removeDarkButtonGradientStop}
                onUpdateStop={updateDarkButtonGradientStop}
              />
            </>
          )}
        </div>

        {/* Live Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">Preview</h4>
          <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
