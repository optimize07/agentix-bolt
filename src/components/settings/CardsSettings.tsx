import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
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

export function CardsSettings() {
  const {
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
  } = useTheme();

  // Safe guard for undefined theme values
  if (!lightCardConfig || !darkCardConfig) {
    return <div className="p-4 text-muted-foreground">Loading card settings...</div>;
  }

  const hexToRgba = (hex: string, alpha: number): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0, 0, 0, ${alpha})`;
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

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

        {/* Background */}
        <div className="space-y-4">
          <ColorPicker
            label="Background"
            value={lightCardConfig.background}
            onChange={updateLightCardBackground}
          />
          
          <div className="flex items-center justify-between">
            <Label>Enable Gradient</Label>
            <Switch
              checked={lightCardConfig.gradient.enabled}
              onCheckedChange={(checked) => updateLightCardGradient({ enabled: checked })}
            />
          </div>

          {lightCardConfig.gradient.enabled && (
            <GradientEditor
              gradient={lightCardConfig.gradient}
              onUpdate={updateLightCardGradient}
              onAddStop={addLightCardGradientStop}
              onRemoveStop={removeLightCardGradientStop}
              onUpdateStop={updateLightCardGradientStop}
            />
          )}
        </div>

        {/* Border */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Border</h4>
          <ColorPicker
            label="Color"
            value={lightCardConfig.border.color}
            onChange={(val) => updateLightCardBorder({ color: val })}
          />
          <div className="space-y-2">
            <Label>Opacity: {lightCardConfig.border.opacity}%</Label>
            <Slider
              value={[lightCardConfig.border.opacity]}
              max={100}
              step={1}
              onValueChange={([val]) => updateLightCardBorder({ opacity: val })}
            />
          </div>
          <div className="space-y-2">
            <Label>Width: {lightCardConfig.border.width}px</Label>
            <Slider
              value={[lightCardConfig.border.width]}
              max={5}
              step={1}
              onValueChange={([val]) => updateLightCardBorder({ width: val })}
            />
          </div>
        </div>

        {/* Shadow */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Shadow</h4>
          <ColorPicker
            label="Color"
            value={lightCardConfig.shadow.color}
            onChange={(val) => updateLightCardShadow({ color: val })}
          />
          <div className="space-y-2">
            <Label>Opacity: {lightCardConfig.shadow.opacity}%</Label>
            <Slider
              value={[lightCardConfig.shadow.opacity]}
              max={100}
              step={1}
              onValueChange={([val]) => updateLightCardShadow({ opacity: val })}
            />
          </div>
          <div className="space-y-2">
            <Label>Blur: {lightCardConfig.shadow.blur}px</Label>
            <Slider
              value={[lightCardConfig.shadow.blur]}
              max={50}
              step={1}
              onValueChange={([val]) => updateLightCardShadow({ blur: val })}
            />
          </div>
          <div className="space-y-2">
            <Label>Offset Y: {lightCardConfig.shadow.offsetY}px</Label>
            <Slider
              value={[lightCardConfig.shadow.offsetY]}
              min={-20}
              max={20}
              step={1}
              onValueChange={([val]) => updateLightCardShadow({ offsetY: val })}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">Preview</h4>
          <Card
            className="p-4"
            style={{
              background: lightCardConfig.gradient.enabled
                ? generateGradientCSS(lightCardConfig.gradient)
                : lightCardConfig.background,
              border: `${lightCardConfig.border.width}px solid ${hexToRgba(lightCardConfig.border.color, lightCardConfig.border.opacity / 100)}`,
              boxShadow: `${lightCardConfig.shadow.offsetX}px ${lightCardConfig.shadow.offsetY}px ${lightCardConfig.shadow.blur}px ${lightCardConfig.shadow.spread}px ${hexToRgba(lightCardConfig.shadow.color, lightCardConfig.shadow.opacity / 100)}`,
            }}
          >
            <h4 className="font-semibold">Sample Card</h4>
            <p className="text-sm text-muted-foreground">This is a preview of your card settings.</p>
          </Card>
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

        {/* Background */}
        <div className="space-y-4">
          <ColorPicker
            label="Background"
            value={darkCardConfig.background}
            onChange={updateDarkCardBackground}
          />
          
          <div className="flex items-center justify-between">
            <Label>Enable Gradient</Label>
            <Switch
              checked={darkCardConfig.gradient.enabled}
              onCheckedChange={(checked) => updateDarkCardGradient({ enabled: checked })}
            />
          </div>

          {darkCardConfig.gradient.enabled && (
            <GradientEditor
              gradient={darkCardConfig.gradient}
              onUpdate={updateDarkCardGradient}
              onAddStop={addDarkCardGradientStop}
              onRemoveStop={removeDarkCardGradientStop}
              onUpdateStop={updateDarkCardGradientStop}
            />
          )}
        </div>

        {/* Border */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Border</h4>
          <ColorPicker
            label="Color"
            value={darkCardConfig.border.color}
            onChange={(val) => updateDarkCardBorder({ color: val })}
          />
          <div className="space-y-2">
            <Label>Opacity: {darkCardConfig.border.opacity}%</Label>
            <Slider
              value={[darkCardConfig.border.opacity]}
              max={100}
              step={1}
              onValueChange={([val]) => updateDarkCardBorder({ opacity: val })}
            />
          </div>
          <div className="space-y-2">
            <Label>Width: {darkCardConfig.border.width}px</Label>
            <Slider
              value={[darkCardConfig.border.width]}
              max={5}
              step={1}
              onValueChange={([val]) => updateDarkCardBorder({ width: val })}
            />
          </div>
        </div>

        {/* Shadow */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Shadow</h4>
          <ColorPicker
            label="Color"
            value={darkCardConfig.shadow.color}
            onChange={(val) => updateDarkCardShadow({ color: val })}
          />
          <div className="space-y-2">
            <Label>Opacity: {darkCardConfig.shadow.opacity}%</Label>
            <Slider
              value={[darkCardConfig.shadow.opacity]}
              max={100}
              step={1}
              onValueChange={([val]) => updateDarkCardShadow({ opacity: val })}
            />
          </div>
          <div className="space-y-2">
            <Label>Blur: {darkCardConfig.shadow.blur}px</Label>
            <Slider
              value={[darkCardConfig.shadow.blur]}
              max={50}
              step={1}
              onValueChange={([val]) => updateDarkCardShadow({ blur: val })}
            />
          </div>
          <div className="space-y-2">
            <Label>Offset Y: {darkCardConfig.shadow.offsetY}px</Label>
            <Slider
              value={[darkCardConfig.shadow.offsetY]}
              min={-20}
              max={20}
              step={1}
              onValueChange={([val]) => updateDarkCardShadow({ offsetY: val })}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">Preview</h4>
          <Card
            className="p-4"
            style={{
              background: darkCardConfig.gradient.enabled
                ? generateGradientCSS(darkCardConfig.gradient)
                : darkCardConfig.background,
              border: `${darkCardConfig.border.width}px solid ${hexToRgba(darkCardConfig.border.color, darkCardConfig.border.opacity / 100)}`,
              boxShadow: `${darkCardConfig.shadow.offsetX}px ${darkCardConfig.shadow.offsetY}px ${darkCardConfig.shadow.blur}px ${darkCardConfig.shadow.spread}px ${hexToRgba(darkCardConfig.shadow.color, darkCardConfig.shadow.opacity / 100)}`,
            }}
          >
            <h4 className="font-semibold">Sample Card</h4>
            <p className="text-sm text-muted-foreground">This is a preview of your card settings.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}







