import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

        {/* Color */}
        <ColorPicker
          label="Color"
          value={lightDividerConfig.color}
          onChange={(val) => updateLightDivider({ color: val })}
        />

        {/* Opacity */}
        <div className="space-y-2">
          <Label>Opacity: {lightDividerConfig.opacity}%</Label>
          <Slider
            value={[lightDividerConfig.opacity]}
            max={100}
            step={1}
            onValueChange={([val]) => updateLightDivider({ opacity: val })}
          />
        </div>

        {/* Width */}
        <div className="space-y-2">
          <Label>Width: {lightDividerConfig.width}px</Label>
          <Slider
            value={[lightDividerConfig.width]}
            max={5}
            step={1}
            onValueChange={([val]) => updateLightDivider({ width: val })}
          />
        </div>

        {/* Style */}
        <div className="space-y-2">
          <Label>Style</Label>
          <Select 
            value={lightDividerConfig.style} 
            onValueChange={(val: 'solid' | 'dashed' | 'dotted') => updateLightDivider({ style: val })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="solid">Solid</SelectItem>
              <SelectItem value="dashed">Dashed</SelectItem>
              <SelectItem value="dotted">Dotted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">Preview</h4>
          <div className="space-y-4 p-4 bg-white rounded-lg">
            <p className="text-gray-800">Content above divider</p>
            <hr 
              style={{
                border: 'none',
                borderTop: `${lightDividerConfig.width}px ${lightDividerConfig.style} ${hexToRgba(lightDividerConfig.color, lightDividerConfig.opacity / 100)}`,
              }}
            />
            <p className="text-gray-800">Content below divider</p>
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

        {/* Color */}
        <ColorPicker
          label="Color"
          value={darkDividerConfig.color}
          onChange={(val) => updateDarkDivider({ color: val })}
        />

        {/* Opacity */}
        <div className="space-y-2">
          <Label>Opacity: {darkDividerConfig.opacity}%</Label>
          <Slider
            value={[darkDividerConfig.opacity]}
            max={100}
            step={1}
            onValueChange={([val]) => updateDarkDivider({ opacity: val })}
          />
        </div>

        {/* Width */}
        <div className="space-y-2">
          <Label>Width: {darkDividerConfig.width}px</Label>
          <Slider
            value={[darkDividerConfig.width]}
            max={5}
            step={1}
            onValueChange={([val]) => updateDarkDivider({ width: val })}
          />
        </div>

        {/* Style */}
        <div className="space-y-2">
          <Label>Style</Label>
          <Select 
            value={darkDividerConfig.style} 
            onValueChange={(val: 'solid' | 'dashed' | 'dotted') => updateDarkDivider({ style: val })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="solid">Solid</SelectItem>
              <SelectItem value="dashed">Dashed</SelectItem>
              <SelectItem value="dotted">Dotted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">Preview</h4>
          <div className="space-y-4 p-4 bg-gray-900 rounded-lg">
            <p className="text-white">Content above divider</p>
            <hr 
              style={{
                border: 'none',
                borderTop: `${darkDividerConfig.width}px ${darkDividerConfig.style} ${hexToRgba(darkDividerConfig.color, darkDividerConfig.opacity / 100)}`,
              }}
            />
            <p className="text-white">Content below divider</p>
          </div>
        </div>
      </div>
    </div>
  );
}







