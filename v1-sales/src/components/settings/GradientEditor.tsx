import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GradientStopsEditor } from "./GradientStopsEditor";
import { GradientConfig, GradientStop, GradientType, generateGradientCSS } from "@/contexts/ThemeContext";

interface GradientEditorProps {
  gradient: GradientConfig;
  onUpdate: (config: Partial<GradientConfig>) => void;
  onAddStop: () => void;
  onRemoveStop: (id: string) => void;
  onUpdateStop: (id: string, updates: Partial<GradientStop>) => void;
}

export function GradientEditor({
  gradient,
  onUpdate,
  onAddStop,
  onRemoveStop,
  onUpdateStop,
}: GradientEditorProps) {
  return (
    <div className="space-y-6">
      {/* Gradient Type Selector */}
      <div className="space-y-2">
        <Label>Gradient Type</Label>
        <Select value={gradient.type} onValueChange={(value: GradientType) => onUpdate({ type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="linear">Linear</SelectItem>
            <SelectItem value="radial">Radial</SelectItem>
            <SelectItem value="angular">Angular (Conic)</SelectItem>
            <SelectItem value="mesh">Mesh</SelectItem>
            <SelectItem value="freeform">Freeform</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Type-Specific Controls */}
      {(gradient.type === 'linear' || gradient.type === 'angular') && (
        <div className="space-y-2">
          <Label>Angle: {gradient.angle}°</Label>
          <Slider
            value={[gradient.angle]}
            max={360}
            step={1}
            onValueChange={([val]) => onUpdate({ angle: val })}
          />
        </div>
      )}

      {(gradient.type === 'radial' || gradient.type === 'mesh' || gradient.type === 'freeform') && (
        <>
          <div className="space-y-2">
            <Label>Center X: {gradient.centerX}%</Label>
            <Slider
              value={[gradient.centerX]}
              max={100}
              step={1}
              onValueChange={([val]) => onUpdate({ centerX: val })}
            />
          </div>
          <div className="space-y-2">
            <Label>Center Y: {gradient.centerY}%</Label>
            <Slider
              value={[gradient.centerY]}
              max={100}
              step={1}
              onValueChange={([val]) => onUpdate({ centerY: val })}
            />
          </div>
        </>
      )}

      {/* Color Stops Editor */}
      <GradientStopsEditor
        stops={gradient.stops}
        gradient={gradient}
        onUpdateStop={onUpdateStop}
        onAddStop={onAddStop}
        onRemoveStop={onRemoveStop}
      />
    </div>
  );
}
