import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { GradientStop, GradientConfig, generateGradientCSS } from "@/contexts/ThemeContext";

interface GradientStopsEditorProps {
  stops: GradientStop[];
  gradient: GradientConfig;
  onUpdateStop: (id: string, updates: Partial<GradientStop>) => void;
  onAddStop: () => void;
  onRemoveStop: (id: string) => void;
}

export function GradientStopsEditor({
  stops,
  gradient,
  onUpdateStop,
  onAddStop,
  onRemoveStop,
}: GradientStopsEditorProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);


  const handleDrag = (e: React.MouseEvent<HTMLDivElement>, stopId: string) => {
    if (!draggingId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    
    onUpdateStop(stopId, { position: Math.round(percentage) });
  };

  const sortedStops = [...stops].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-4">
      <Label>Color Stops</Label>

      {/* Visual gradient bar with draggable handles */}
      <div 
        className="relative h-12 rounded-lg border border-border overflow-hidden"
        style={{ background: generateGradientCSS(gradient) }}
        onMouseMove={(e) => draggingId && handleDrag(e, draggingId)}
        onMouseUp={() => setDraggingId(null)}
        onMouseLeave={() => setDraggingId(null)}
      >
        {sortedStops.map((stop) => (
          <div
            key={stop.id}
            className="absolute top-1/2 -translate-y-1/2 cursor-ew-resize"
            style={{ left: `${stop.position}%`, transform: 'translateX(-50%) translateY(-50%)' }}
            onMouseDown={() => setDraggingId(stop.id)}
          >
            <div
              className="w-5 h-5 rounded-full border-2 border-white shadow-lg ring-2 ring-black/20"
              style={{ backgroundColor: stop.color }}
            />
          </div>
        ))}
      </div>

      {/* List of color stops */}
      <div className="space-y-3">
        {sortedStops.map((stop, index) => (
          <div key={stop.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <span className="text-sm font-medium w-16">Stop {index + 1}</span>
            <input
              type="color"
              value={stop.color}
              onChange={(e) => onUpdateStop(stop.id, { color: e.target.value })}
              className="h-8 w-8 rounded cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded [&::-moz-color-swatch]:border-0"
            />
            <Input
              type="text"
              value={stop.color}
              onChange={(e) => onUpdateStop(stop.id, { color: e.target.value })}
              className="w-24 font-mono text-xs"
            />
            <div className="flex-1 flex items-center gap-2">
              <Slider
                value={[stop.position]}
                max={100}
                step={1}
                onValueChange={([val]) => onUpdateStop(stop.id, { position: val })}
                className="flex-1"
              />
              <span className="text-sm w-12 text-right">{stop.position}%</span>
            </div>
            {stops.length > 2 && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onRemoveStop(stop.id)}
                className="h-8 w-8"
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add stop button */}
      <Button variant="outline" onClick={onAddStop} className="w-full">
        <Plus size={16} />
        Add Color Stop
      </Button>
    </div>
  );
}
