import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "@/contexts/ThemeContext";
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

export function GlassSettings() {
  const {
    lightGlassConfig,
    darkGlassConfig,
    updateLightGlass,
    updateDarkGlass,
  } = useTheme();

  // Safe guard for undefined theme values
  if (!lightGlassConfig || !darkGlassConfig) {
    return <div className="p-4 text-muted-foreground">Loading glass settings...</div>;
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

        {/* Enable Toggle */}
        <div className="flex items-center justify-between">
          <Label>Enable Glass Effect</Label>
          <Switch
            checked={lightGlassConfig.enabled}
            onCheckedChange={(checked) => updateLightGlass({ enabled: checked })}
          />
        </div>

        {lightGlassConfig.enabled && (
          <>
            {/* Blur */}
            <div className="space-y-2">
              <Label>Blur Amount: {lightGlassConfig.blurAmount}px</Label>
              <Slider
                value={[lightGlassConfig.blurAmount]}
                max={50}
                step={1}
                onValueChange={([val]) => updateLightGlass({ blurAmount: val })}
              />
            </div>

            {/* Background Opacity */}
            <div className="space-y-2">
              <Label>Background Opacity: {lightGlassConfig.backgroundOpacity}%</Label>
              <Slider
                value={[lightGlassConfig.backgroundOpacity]}
                max={100}
                step={1}
                onValueChange={([val]) => updateLightGlass({ backgroundOpacity: val })}
              />
            </div>

            {/* Chrome Texture */}
            <div className="flex items-center justify-between">
              <Label>Chrome Texture</Label>
              <Switch
                checked={lightGlassConfig.chromeTexture}
                onCheckedChange={(checked) => updateLightGlass({ chromeTexture: checked })}
              />
            </div>

            {lightGlassConfig.chromeTexture && (
              <div className="space-y-2">
                <Label>Chrome Intensity: {lightGlassConfig.chromeIntensity}%</Label>
                <Slider
                  value={[lightGlassConfig.chromeIntensity]}
                  max={100}
                  step={1}
                  onValueChange={([val]) => updateLightGlass({ chromeIntensity: val })}
                />
              </div>
            )}

            {/* Tint Color */}
            <ColorPicker
              label="Tint Color"
              value={lightGlassConfig.tintColor}
              onChange={(val) => updateLightGlass({ tintColor: val })}
            />
          </>
        )}

        {/* Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">Preview</h4>
          <div 
            className="relative h-40 rounded-lg overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            }}
          >
            <div
              className="absolute inset-4 rounded-lg p-4"
              style={{
                background: lightGlassConfig.enabled
                  ? hexToRgba(lightGlassConfig.tintColor, lightGlassConfig.backgroundOpacity / 100)
                  : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: lightGlassConfig.enabled
                  ? `blur(${lightGlassConfig.blurAmount}px)`
                  : 'none',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <h4 className="font-semibold text-gray-800">Glass Card</h4>
              <p className="text-sm text-gray-600">This is a preview of the glass effect.</p>
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

        {/* Enable Toggle */}
        <div className="flex items-center justify-between">
          <Label>Enable Glass Effect</Label>
          <Switch
            checked={darkGlassConfig.enabled}
            onCheckedChange={(checked) => updateDarkGlass({ enabled: checked })}
          />
        </div>

        {darkGlassConfig.enabled && (
          <>
            {/* Blur */}
            <div className="space-y-2">
              <Label>Blur Amount: {darkGlassConfig.blurAmount}px</Label>
              <Slider
                value={[darkGlassConfig.blurAmount]}
                max={50}
                step={1}
                onValueChange={([val]) => updateDarkGlass({ blurAmount: val })}
              />
            </div>

            {/* Background Opacity */}
            <div className="space-y-2">
              <Label>Background Opacity: {darkGlassConfig.backgroundOpacity}%</Label>
              <Slider
                value={[darkGlassConfig.backgroundOpacity]}
                max={100}
                step={1}
                onValueChange={([val]) => updateDarkGlass({ backgroundOpacity: val })}
              />
            </div>

            {/* Chrome Texture */}
            <div className="flex items-center justify-between">
              <Label>Chrome Texture</Label>
              <Switch
                checked={darkGlassConfig.chromeTexture}
                onCheckedChange={(checked) => updateDarkGlass({ chromeTexture: checked })}
              />
            </div>

            {darkGlassConfig.chromeTexture && (
              <div className="space-y-2">
                <Label>Chrome Intensity: {darkGlassConfig.chromeIntensity}%</Label>
                <Slider
                  value={[darkGlassConfig.chromeIntensity]}
                  max={100}
                  step={1}
                  onValueChange={([val]) => updateDarkGlass({ chromeIntensity: val })}
                />
              </div>
            )}

            {/* Tint Color */}
            <ColorPicker
              label="Tint Color"
              value={darkGlassConfig.tintColor}
              onChange={(val) => updateDarkGlass({ tintColor: val })}
            />
          </>
        )}

        {/* Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">Preview</h4>
          <div 
            className="relative h-40 rounded-lg overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            }}
          >
            <div
              className="absolute inset-4 rounded-lg p-4"
              style={{
                background: darkGlassConfig.enabled
                  ? hexToRgba(darkGlassConfig.tintColor, darkGlassConfig.backgroundOpacity / 100)
                  : 'rgba(0, 0, 0, 0.5)',
                backdropFilter: darkGlassConfig.enabled
                  ? `blur(${darkGlassConfig.blurAmount}px)`
                  : 'none',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <h4 className="font-semibold text-white">Glass Card</h4>
              <p className="text-sm text-gray-300">This is a preview of the glass effect.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}







