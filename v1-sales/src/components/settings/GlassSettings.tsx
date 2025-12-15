import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Light Mode Column */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Light Mode</h3>

        <div className="flex items-center justify-between">
          <Label htmlFor="light-glass-enabled">Enable Glass Mode</Label>
          <Switch
            id="light-glass-enabled"
            checked={lightGlassConfig.enabled}
            onCheckedChange={(checked) => updateLightGlass({ enabled: checked })}
          />
        </div>

        {lightGlassConfig.enabled && (
          <>
            <div className="space-y-2">
              <Label>Blur Amount: {lightGlassConfig.blurAmount}px</Label>
              <Slider
                value={[lightGlassConfig.blurAmount]}
                onValueChange={([value]) => updateLightGlass({ blurAmount: value })}
                min={0}
                max={50}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Background Opacity: {lightGlassConfig.backgroundOpacity}%</Label>
              <Slider
                value={[lightGlassConfig.backgroundOpacity]}
                onValueChange={([value]) => updateLightGlass({ backgroundOpacity: value })}
                min={0}
                max={100}
                step={1}
              />
            </div>

            <ColorPicker
              label="Tint Color"
              value={lightGlassConfig.tintColor}
              onChange={(value) => updateLightGlass({ tintColor: value })}
            />

            <div className="flex items-center justify-between">
              <Label htmlFor="light-chrome-texture">Chrome Texture</Label>
              <Switch
                id="light-chrome-texture"
                checked={lightGlassConfig.chromeTexture}
                onCheckedChange={(checked) => updateLightGlass({ chromeTexture: checked })}
              />
            </div>

            {lightGlassConfig.chromeTexture && (
              <div className="space-y-2">
                <Label>Chrome Intensity: {lightGlassConfig.chromeIntensity}%</Label>
                <Slider
                  value={[lightGlassConfig.chromeIntensity]}
                  onValueChange={([value]) => updateLightGlass({ chromeIntensity: value })}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
            )}
          </>
        )}

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Glass Effect Preview</CardTitle>
            <CardDescription>Light mode glass preview</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="h-32 rounded-lg flex items-center justify-center text-sm font-medium relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, #f0f9ff, #e0f2fe)`,
              }}
            >
              {lightGlassConfig.enabled ? (
                <div
                  className="absolute inset-2 rounded-lg flex items-center justify-center"
                  style={{
                    backdropFilter: `blur(${lightGlassConfig.blurAmount}px)`,
                    WebkitBackdropFilter: `blur(${lightGlassConfig.blurAmount}px)`,
                    background: `rgba(${parseInt(lightGlassConfig.tintColor.slice(1, 3), 16)}, ${parseInt(lightGlassConfig.tintColor.slice(3, 5), 16)}, ${parseInt(lightGlassConfig.tintColor.slice(5, 7), 16)}, ${lightGlassConfig.backgroundOpacity / 100})`,
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: lightGlassConfig.chromeTexture
                      ? `inset 0 0 20px rgba(255, 255, 255, ${lightGlassConfig.chromeIntensity / 100})`
                      : 'none',
                  }}
                >
                  Glass Effect Active
                </div>
              ) : (
                <span className="text-muted-foreground">Glass mode disabled</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dark Mode Column */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Dark Mode</h3>

        <div className="flex items-center justify-between">
          <Label htmlFor="dark-glass-enabled">Enable Glass Mode</Label>
          <Switch
            id="dark-glass-enabled"
            checked={darkGlassConfig.enabled}
            onCheckedChange={(checked) => updateDarkGlass({ enabled: checked })}
          />
        </div>

        {darkGlassConfig.enabled && (
          <>
            <div className="space-y-2">
              <Label>Blur Amount: {darkGlassConfig.blurAmount}px</Label>
              <Slider
                value={[darkGlassConfig.blurAmount]}
                onValueChange={([value]) => updateDarkGlass({ blurAmount: value })}
                min={0}
                max={50}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Background Opacity: {darkGlassConfig.backgroundOpacity}%</Label>
              <Slider
                value={[darkGlassConfig.backgroundOpacity]}
                onValueChange={([value]) => updateDarkGlass({ backgroundOpacity: value })}
                min={0}
                max={100}
                step={1}
              />
            </div>

            <ColorPicker
              label="Tint Color"
              value={darkGlassConfig.tintColor}
              onChange={(value) => updateDarkGlass({ tintColor: value })}
            />

            <div className="flex items-center justify-between">
              <Label htmlFor="dark-chrome-texture">Chrome Texture</Label>
              <Switch
                id="dark-chrome-texture"
                checked={darkGlassConfig.chromeTexture}
                onCheckedChange={(checked) => updateDarkGlass({ chromeTexture: checked })}
              />
            </div>

            {darkGlassConfig.chromeTexture && (
              <div className="space-y-2">
                <Label>Chrome Intensity: {darkGlassConfig.chromeIntensity}%</Label>
                <Slider
                  value={[darkGlassConfig.chromeIntensity]}
                  onValueChange={([value]) => updateDarkGlass({ chromeIntensity: value })}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
            )}
          </>
        )}

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Glass Effect Preview</CardTitle>
            <CardDescription>Dark mode glass preview</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="h-32 rounded-lg flex items-center justify-center text-sm font-medium relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, #1e293b, #0f172a)`,
              }}
            >
              {darkGlassConfig.enabled ? (
                <div
                  className="absolute inset-2 rounded-lg flex items-center justify-center text-white"
                  style={{
                    backdropFilter: `blur(${darkGlassConfig.blurAmount}px)`,
                    WebkitBackdropFilter: `blur(${darkGlassConfig.blurAmount}px)`,
                    background: `rgba(${parseInt(darkGlassConfig.tintColor.slice(1, 3), 16)}, ${parseInt(darkGlassConfig.tintColor.slice(3, 5), 16)}, ${parseInt(darkGlassConfig.tintColor.slice(5, 7), 16)}, ${darkGlassConfig.backgroundOpacity / 100})`,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: darkGlassConfig.chromeTexture
                      ? `inset 0 0 20px rgba(255, 255, 255, ${darkGlassConfig.chromeIntensity / 100})`
                      : 'none',
                  }}
                >
                  Glass Effect Active
                </div>
              ) : (
                <span className="text-muted-foreground">Glass mode disabled</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
