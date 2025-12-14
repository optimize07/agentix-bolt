import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

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

export function StatusSettings() {
  const {
    lightStatusColors,
    darkStatusColors,
    updateLightStatusColor,
    updateDarkStatusColor,
  } = useTheme();

  // Safe guard for undefined theme values
  if (!lightStatusColors || !darkStatusColors) {
    return <div className="p-4 text-muted-foreground">Loading status settings...</div>;
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

        {/* Success */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" />
            Success
          </h4>
          <ColorPicker
            label="Background"
            value={lightStatusColors.success}
            onChange={(val) => updateLightStatusColor("success", val)}
          />
          <ColorPicker
            label="Foreground"
            value={lightStatusColors.successForeground}
            onChange={(val) => updateLightStatusColor("successForeground", val)}
          />
        </div>

        {/* Warning */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-500" />
            Warning
          </h4>
          <ColorPicker
            label="Background"
            value={lightStatusColors.warning}
            onChange={(val) => updateLightStatusColor("warning", val)}
          />
          <ColorPicker
            label="Foreground"
            value={lightStatusColors.warningForeground}
            onChange={(val) => updateLightStatusColor("warningForeground", val)}
          />
        </div>

        {/* Error */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <XCircle size={16} className="text-red-500" />
            Error
          </h4>
          <ColorPicker
            label="Background"
            value={lightStatusColors.error}
            onChange={(val) => updateLightStatusColor("error", val)}
          />
          <ColorPicker
            label="Foreground"
            value={lightStatusColors.errorForeground}
            onChange={(val) => updateLightStatusColor("errorForeground", val)}
          />
        </div>

        {/* Info */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Info size={16} className="text-blue-500" />
            Info
          </h4>
          <ColorPicker
            label="Background"
            value={lightStatusColors.info}
            onChange={(val) => updateLightStatusColor("info", val)}
          />
          <ColorPicker
            label="Foreground"
            value={lightStatusColors.infoForeground}
            onChange={(val) => updateLightStatusColor("infoForeground", val)}
          />
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">Preview</h4>
          <div className="flex flex-wrap gap-2">
            <Badge style={{ backgroundColor: lightStatusColors.success, color: lightStatusColors.successForeground }}>
              Success
            </Badge>
            <Badge style={{ backgroundColor: lightStatusColors.warning, color: lightStatusColors.warningForeground }}>
              Warning
            </Badge>
            <Badge style={{ backgroundColor: lightStatusColors.error, color: lightStatusColors.errorForeground }}>
              Error
            </Badge>
            <Badge style={{ backgroundColor: lightStatusColors.info, color: lightStatusColors.infoForeground }}>
              Info
            </Badge>
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

        {/* Success */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" />
            Success
          </h4>
          <ColorPicker
            label="Background"
            value={darkStatusColors.success}
            onChange={(val) => updateDarkStatusColor("success", val)}
          />
          <ColorPicker
            label="Foreground"
            value={darkStatusColors.successForeground}
            onChange={(val) => updateDarkStatusColor("successForeground", val)}
          />
        </div>

        {/* Warning */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-500" />
            Warning
          </h4>
          <ColorPicker
            label="Background"
            value={darkStatusColors.warning}
            onChange={(val) => updateDarkStatusColor("warning", val)}
          />
          <ColorPicker
            label="Foreground"
            value={darkStatusColors.warningForeground}
            onChange={(val) => updateDarkStatusColor("warningForeground", val)}
          />
        </div>

        {/* Error */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <XCircle size={16} className="text-red-500" />
            Error
          </h4>
          <ColorPicker
            label="Background"
            value={darkStatusColors.error}
            onChange={(val) => updateDarkStatusColor("error", val)}
          />
          <ColorPicker
            label="Foreground"
            value={darkStatusColors.errorForeground}
            onChange={(val) => updateDarkStatusColor("errorForeground", val)}
          />
        </div>

        {/* Info */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Info size={16} className="text-blue-500" />
            Info
          </h4>
          <ColorPicker
            label="Background"
            value={darkStatusColors.info}
            onChange={(val) => updateDarkStatusColor("info", val)}
          />
          <ColorPicker
            label="Foreground"
            value={darkStatusColors.infoForeground}
            onChange={(val) => updateDarkStatusColor("infoForeground", val)}
          />
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">Preview</h4>
          <div className="flex flex-wrap gap-2">
            <Badge style={{ backgroundColor: darkStatusColors.success, color: darkStatusColors.successForeground }}>
              Success
            </Badge>
            <Badge style={{ backgroundColor: darkStatusColors.warning, color: darkStatusColors.warningForeground }}>
              Warning
            </Badge>
            <Badge style={{ backgroundColor: darkStatusColors.error, color: darkStatusColors.errorForeground }}>
              Error
            </Badge>
            <Badge style={{ backgroundColor: darkStatusColors.info, color: darkStatusColors.infoForeground }}>
              Info
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}







