import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

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
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Light Mode</h3>

        {/* Success */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Success</h4>
          <ColorPicker
            label="Success Color"
            value={lightStatusColors.success}
            onChange={(value) => updateLightStatusColor("success", value)}
          />
          <ColorPicker
            label="Success Foreground"
            value={lightStatusColors.successForeground}
            onChange={(value) => updateLightStatusColor("successForeground", value)}
          />
        </div>

        {/* Warning */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Warning</h4>
          <ColorPicker
            label="Warning Color"
            value={lightStatusColors.warning}
            onChange={(value) => updateLightStatusColor("warning", value)}
          />
          <ColorPicker
            label="Warning Foreground"
            value={lightStatusColors.warningForeground}
            onChange={(value) => updateLightStatusColor("warningForeground", value)}
          />
        </div>

        {/* Error */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Error</h4>
          <ColorPicker
            label="Error Color"
            value={lightStatusColors.error}
            onChange={(value) => updateLightStatusColor("error", value)}
          />
          <ColorPicker
            label="Error Foreground"
            value={lightStatusColors.errorForeground}
            onChange={(value) => updateLightStatusColor("errorForeground", value)}
          />
        </div>

        {/* Info */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Info</h4>
          <ColorPicker
            label="Info Color"
            value={lightStatusColors.info}
            onChange={(value) => updateLightStatusColor("info", value)}
          />
          <ColorPicker
            label="Info Foreground"
            value={lightStatusColors.infoForeground}
            onChange={(value) => updateLightStatusColor("infoForeground", value)}
          />
        </div>

        {/* Preview */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="text-sm font-medium">Preview</h4>
          <div className="flex flex-wrap gap-3">
            <Badge
              className="gap-1.5"
              style={{
                backgroundColor: lightStatusColors.success,
                color: lightStatusColors.successForeground,
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Success
            </Badge>
            <Badge
              className="gap-1.5"
              style={{
                backgroundColor: lightStatusColors.warning,
                color: lightStatusColors.warningForeground,
              }}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Warning
            </Badge>
            <Badge
              className="gap-1.5"
              style={{
                backgroundColor: lightStatusColors.error,
                color: lightStatusColors.errorForeground,
              }}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              Error
            </Badge>
            <Badge
              className="gap-1.5"
              style={{
                backgroundColor: lightStatusColors.info,
                color: lightStatusColors.infoForeground,
              }}
            >
              <Info className="h-3.5 w-3.5" />
              Info
            </Badge>
          </div>
        </div>
      </div>

      {/* Dark Mode Column */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Dark Mode</h3>

        {/* Success */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Success</h4>
          <ColorPicker
            label="Success Color"
            value={darkStatusColors.success}
            onChange={(value) => updateDarkStatusColor("success", value)}
          />
          <ColorPicker
            label="Success Foreground"
            value={darkStatusColors.successForeground}
            onChange={(value) => updateDarkStatusColor("successForeground", value)}
          />
        </div>

        {/* Warning */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Warning</h4>
          <ColorPicker
            label="Warning Color"
            value={darkStatusColors.warning}
            onChange={(value) => updateDarkStatusColor("warning", value)}
          />
          <ColorPicker
            label="Warning Foreground"
            value={darkStatusColors.warningForeground}
            onChange={(value) => updateDarkStatusColor("warningForeground", value)}
          />
        </div>

        {/* Error */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Error</h4>
          <ColorPicker
            label="Error Color"
            value={darkStatusColors.error}
            onChange={(value) => updateDarkStatusColor("error", value)}
          />
          <ColorPicker
            label="Error Foreground"
            value={darkStatusColors.errorForeground}
            onChange={(value) => updateDarkStatusColor("errorForeground", value)}
          />
        </div>

        {/* Info */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Info</h4>
          <ColorPicker
            label="Info Color"
            value={darkStatusColors.info}
            onChange={(value) => updateDarkStatusColor("info", value)}
          />
          <ColorPicker
            label="Info Foreground"
            value={darkStatusColors.infoForeground}
            onChange={(value) => updateDarkStatusColor("infoForeground", value)}
          />
        </div>

        {/* Preview */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="text-sm font-medium">Preview</h4>
          <div className="flex flex-wrap gap-3">
            <Badge
              className="gap-1.5"
              style={{
                backgroundColor: darkStatusColors.success,
                color: darkStatusColors.successForeground,
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Success
            </Badge>
            <Badge
              className="gap-1.5"
              style={{
                backgroundColor: darkStatusColors.warning,
                color: darkStatusColors.warningForeground,
              }}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Warning
            </Badge>
            <Badge
              className="gap-1.5"
              style={{
                backgroundColor: darkStatusColors.error,
                color: darkStatusColors.errorForeground,
              }}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              Error
            </Badge>
            <Badge
              className="gap-1.5"
              style={{
                backgroundColor: darkStatusColors.info,
                color: darkStatusColors.infoForeground,
              }}
            >
              <Info className="h-3.5 w-3.5" />
              Info
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
