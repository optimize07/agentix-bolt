import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "@/contexts/ThemeContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export function DividersSettings() {
  const {
    lightDividerConfig,
    darkDividerConfig,
    updateLightDivider,
    updateDarkDivider,
  } = useTheme();

  // Safe guard for undefined theme values
  if (!lightDividerConfig || !darkDividerConfig) {
    return <div className="p-4 text-muted-foreground">Loading divider settings...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Light Mode Column */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Light Mode</h3>

        <ColorPicker
          label="Divider Color"
          value={lightDividerConfig.color}
          onChange={(value) => updateLightDivider({ color: value })}
        />

        <div className="space-y-2">
          <Label>Opacity: {lightDividerConfig.opacity}%</Label>
          <Slider
            value={[lightDividerConfig.opacity]}
            onValueChange={([value]) => updateLightDivider({ opacity: value })}
            min={0}
            max={100}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <Label>Width: {lightDividerConfig.width}px</Label>
          <Slider
            value={[lightDividerConfig.width]}
            onValueChange={([value]) => updateLightDivider({ width: value })}
            min={1}
            max={4}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <Label>Style</Label>
          <Select
            value={lightDividerConfig.style}
            onValueChange={(value: 'solid' | 'dashed' | 'dotted') => updateLightDivider({ style: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">Solid</SelectItem>
              <SelectItem value="dashed">Dashed</SelectItem>
              <SelectItem value="dotted">Dotted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Divider Preview</CardTitle>
            <CardDescription>Light mode divider</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm font-medium">Header Section</div>
            <div
              style={{
                borderTop: `${lightDividerConfig.width}px ${lightDividerConfig.style} rgba(${parseInt(lightDividerConfig.color.slice(1, 3), 16)}, ${parseInt(lightDividerConfig.color.slice(3, 5), 16)}, ${parseInt(lightDividerConfig.color.slice(5, 7), 16)}, ${lightDividerConfig.opacity / 100})`,
              }}
              className="w-full"
            />
            <div className="text-sm text-muted-foreground">Content Section</div>
          </CardContent>
        </Card>
      </div>

      {/* Dark Mode Column */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Dark Mode</h3>

        <ColorPicker
          label="Divider Color"
          value={darkDividerConfig.color}
          onChange={(value) => updateDarkDivider({ color: value })}
        />

        <div className="space-y-2">
          <Label>Opacity: {darkDividerConfig.opacity}%</Label>
          <Slider
            value={[darkDividerConfig.opacity]}
            onValueChange={([value]) => updateDarkDivider({ opacity: value })}
            min={0}
            max={100}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <Label>Width: {darkDividerConfig.width}px</Label>
          <Slider
            value={[darkDividerConfig.width]}
            onValueChange={([value]) => updateDarkDivider({ width: value })}
            min={1}
            max={4}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <Label>Style</Label>
          <Select
            value={darkDividerConfig.style}
            onValueChange={(value: 'solid' | 'dashed' | 'dotted') => updateDarkDivider({ style: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">Solid</SelectItem>
              <SelectItem value="dashed">Dashed</SelectItem>
              <SelectItem value="dotted">Dotted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Divider Preview</CardTitle>
            <CardDescription>Dark mode divider</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm font-medium">Header Section</div>
            <div
              style={{
                borderTop: `${darkDividerConfig.width}px ${darkDividerConfig.style} rgba(${parseInt(darkDividerConfig.color.slice(1, 3), 16)}, ${parseInt(darkDividerConfig.color.slice(3, 5), 16)}, ${parseInt(darkDividerConfig.color.slice(5, 7), 16)}, ${darkDividerConfig.opacity / 100})`,
              }}
              className="w-full"
            />
            <div className="text-sm text-muted-foreground">Content Section</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
