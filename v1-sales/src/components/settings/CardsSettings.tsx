import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useTheme, generateGradientCSS } from "@/contexts/ThemeContext";
import { GradientEditor } from "./GradientEditor";
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Light Mode Column */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Light Mode</h3>

        {/* Background Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Background</h4>
          
          <ColorPicker
            label="Solid Background Color"
            value={lightCardConfig.background}
            onChange={updateLightCardBackground}
          />

          <div className="flex items-center justify-between">
            <Label htmlFor="light-card-gradient">Enable Gradient</Label>
            <Switch
              id="light-card-gradient"
              checked={lightCardConfig.gradient.enabled}
              onCheckedChange={(checked) => updateLightCardGradient({ enabled: checked })}
            />
          </div>

          {/* Preview */}
          <div
            className="h-32 rounded-lg"
            style={{
              background: lightCardConfig.gradient.enabled
                ? generateGradientCSS(lightCardConfig.gradient)
                : lightCardConfig.background,
              border: `${lightCardConfig.border.width}px solid rgba(${parseInt(lightCardConfig.border.color.slice(1, 3), 16)}, ${parseInt(lightCardConfig.border.color.slice(3, 5), 16)}, ${parseInt(lightCardConfig.border.color.slice(5, 7), 16)}, ${lightCardConfig.border.opacity / 100})`,
              boxShadow: `${lightCardConfig.shadow.offsetX}px ${lightCardConfig.shadow.offsetY}px ${lightCardConfig.shadow.blur}px ${lightCardConfig.shadow.spread}px rgba(${parseInt(lightCardConfig.shadow.color.slice(1, 3), 16)}, ${parseInt(lightCardConfig.shadow.color.slice(3, 5), 16)}, ${parseInt(lightCardConfig.shadow.color.slice(5, 7), 16)}, ${lightCardConfig.shadow.opacity / 100})`,
            }}
          />

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

        {/* Border Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Border</h4>
          
          <ColorPicker
            label="Border Color"
            value={lightCardConfig.border.color}
            onChange={(value) => updateLightCardBorder({ color: value })}
          />

          <div className="space-y-2">
            <Label>Border Opacity: {lightCardConfig.border.opacity}%</Label>
            <Slider
              value={[lightCardConfig.border.opacity]}
              onValueChange={([value]) => updateLightCardBorder({ opacity: value })}
              min={0}
              max={100}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Border Width: {lightCardConfig.border.width}px</Label>
            <Slider
              value={[lightCardConfig.border.width]}
              onValueChange={([value]) => updateLightCardBorder({ width: value })}
              min={0}
              max={4}
              step={1}
            />
          </div>
        </div>

        {/* Shadow Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Shadow</h4>
          
          <ColorPicker
            label="Shadow Color"
            value={lightCardConfig.shadow.color}
            onChange={(value) => updateLightCardShadow({ color: value })}
          />

          <div className="space-y-2">
            <Label>Shadow Opacity: {lightCardConfig.shadow.opacity}%</Label>
            <Slider
              value={[lightCardConfig.shadow.opacity]}
              onValueChange={([value]) => updateLightCardShadow({ opacity: value })}
              min={0}
              max={100}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Blur Radius: {lightCardConfig.shadow.blur}px</Label>
            <Slider
              value={[lightCardConfig.shadow.blur]}
              onValueChange={([value]) => updateLightCardShadow({ blur: value })}
              min={0}
              max={50}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Spread: {lightCardConfig.shadow.spread}px</Label>
            <Slider
              value={[lightCardConfig.shadow.spread]}
              onValueChange={([value]) => updateLightCardShadow({ spread: value })}
              min={-20}
              max={20}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label>X Offset: {lightCardConfig.shadow.offsetX}px</Label>
            <Slider
              value={[lightCardConfig.shadow.offsetX]}
              onValueChange={([value]) => updateLightCardShadow({ offsetX: value })}
              min={-20}
              max={20}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Y Offset: {lightCardConfig.shadow.offsetY}px</Label>
            <Slider
              value={[lightCardConfig.shadow.offsetY]}
              onValueChange={([value]) => updateLightCardShadow({ offsetY: value })}
              min={-20}
              max={20}
              step={1}
            />
          </div>

          {/* Shadow Preview Card */}
          <Card
            style={{
              background: lightCardConfig.gradient.enabled
                ? generateGradientCSS(lightCardConfig.gradient)
                : lightCardConfig.background,
              border: `${lightCardConfig.border.width}px solid rgba(${parseInt(lightCardConfig.border.color.slice(1, 3), 16)}, ${parseInt(lightCardConfig.border.color.slice(3, 5), 16)}, ${parseInt(lightCardConfig.border.color.slice(5, 7), 16)}, ${lightCardConfig.border.opacity / 100})`,
              boxShadow: `${lightCardConfig.shadow.offsetX}px ${lightCardConfig.shadow.offsetY}px ${lightCardConfig.shadow.blur}px ${lightCardConfig.shadow.spread}px rgba(${parseInt(lightCardConfig.shadow.color.slice(1, 3), 16)}, ${parseInt(lightCardConfig.shadow.color.slice(3, 5), 16)}, ${parseInt(lightCardConfig.shadow.color.slice(5, 7), 16)}, ${lightCardConfig.shadow.opacity / 100})`,
            }}
          >
            <CardHeader>
              <CardTitle>Card Preview</CardTitle>
              <CardDescription>Live shadow preview</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This card shows how your shadow settings will look in the application.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dark Mode Column */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Dark Mode</h3>

        {/* Background Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Background</h4>
          
          <ColorPicker
            label="Solid Background Color"
            value={darkCardConfig.background}
            onChange={updateDarkCardBackground}
          />

          <div className="flex items-center justify-between">
            <Label htmlFor="dark-card-gradient">Enable Gradient</Label>
            <Switch
              id="dark-card-gradient"
              checked={darkCardConfig.gradient.enabled}
              onCheckedChange={(checked) => updateDarkCardGradient({ enabled: checked })}
            />
          </div>

          {/* Preview */}
          <div
            className="h-32 rounded-lg"
            style={{
              background: darkCardConfig.gradient.enabled
                ? generateGradientCSS(darkCardConfig.gradient)
                : darkCardConfig.background,
              border: `${darkCardConfig.border.width}px solid rgba(${parseInt(darkCardConfig.border.color.slice(1, 3), 16)}, ${parseInt(darkCardConfig.border.color.slice(3, 5), 16)}, ${parseInt(darkCardConfig.border.color.slice(5, 7), 16)}, ${darkCardConfig.border.opacity / 100})`,
              boxShadow: `${darkCardConfig.shadow.offsetX}px ${darkCardConfig.shadow.offsetY}px ${darkCardConfig.shadow.blur}px ${darkCardConfig.shadow.spread}px rgba(${parseInt(darkCardConfig.shadow.color.slice(1, 3), 16)}, ${parseInt(darkCardConfig.shadow.color.slice(3, 5), 16)}, ${parseInt(darkCardConfig.shadow.color.slice(5, 7), 16)}, ${darkCardConfig.shadow.opacity / 100})`,
            }}
          />

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

        {/* Border Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Border</h4>
          
          <ColorPicker
            label="Border Color"
            value={darkCardConfig.border.color}
            onChange={(value) => updateDarkCardBorder({ color: value })}
          />

          <div className="space-y-2">
            <Label>Border Opacity: {darkCardConfig.border.opacity}%</Label>
            <Slider
              value={[darkCardConfig.border.opacity]}
              onValueChange={([value]) => updateDarkCardBorder({ opacity: value })}
              min={0}
              max={100}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Border Width: {darkCardConfig.border.width}px</Label>
            <Slider
              value={[darkCardConfig.border.width]}
              onValueChange={([value]) => updateDarkCardBorder({ width: value })}
              min={0}
              max={4}
              step={1}
            />
          </div>
        </div>

        {/* Shadow Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Shadow</h4>
          
          <ColorPicker
            label="Shadow Color"
            value={darkCardConfig.shadow.color}
            onChange={(value) => updateDarkCardShadow({ color: value })}
          />

          <div className="space-y-2">
            <Label>Shadow Opacity: {darkCardConfig.shadow.opacity}%</Label>
            <Slider
              value={[darkCardConfig.shadow.opacity]}
              onValueChange={([value]) => updateDarkCardShadow({ opacity: value })}
              min={0}
              max={100}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Blur Radius: {darkCardConfig.shadow.blur}px</Label>
            <Slider
              value={[darkCardConfig.shadow.blur]}
              onValueChange={([value]) => updateDarkCardShadow({ blur: value })}
              min={0}
              max={50}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Spread: {darkCardConfig.shadow.spread}px</Label>
            <Slider
              value={[darkCardConfig.shadow.spread]}
              onValueChange={([value]) => updateDarkCardShadow({ spread: value })}
              min={-20}
              max={20}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label>X Offset: {darkCardConfig.shadow.offsetX}px</Label>
            <Slider
              value={[darkCardConfig.shadow.offsetX]}
              onValueChange={([value]) => updateDarkCardShadow({ offsetX: value })}
              min={-20}
              max={20}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Y Offset: {darkCardConfig.shadow.offsetY}px</Label>
            <Slider
              value={[darkCardConfig.shadow.offsetY]}
              onValueChange={([value]) => updateDarkCardShadow({ offsetY: value })}
              min={-20}
              max={20}
              step={1}
            />
          </div>

          {/* Shadow Preview Card */}
          <Card
            style={{
              background: darkCardConfig.gradient.enabled
                ? generateGradientCSS(darkCardConfig.gradient)
                : darkCardConfig.background,
              border: `${darkCardConfig.border.width}px solid rgba(${parseInt(darkCardConfig.border.color.slice(1, 3), 16)}, ${parseInt(darkCardConfig.border.color.slice(3, 5), 16)}, ${parseInt(darkCardConfig.border.color.slice(5, 7), 16)}, ${darkCardConfig.border.opacity / 100})`,
              boxShadow: `${darkCardConfig.shadow.offsetX}px ${darkCardConfig.shadow.offsetY}px ${darkCardConfig.shadow.blur}px ${darkCardConfig.shadow.spread}px rgba(${parseInt(darkCardConfig.shadow.color.slice(1, 3), 16)}, ${parseInt(darkCardConfig.shadow.color.slice(3, 5), 16)}, ${parseInt(darkCardConfig.shadow.color.slice(5, 7), 16)}, ${darkCardConfig.shadow.opacity / 100})`,
            }}
          >
            <CardHeader>
              <CardTitle>Card Preview</CardTitle>
              <CardDescription>Live shadow preview</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This card shows how your shadow settings will look in the application.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}