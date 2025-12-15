import { Settings, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FloatingControlsProps {
  isEditMode: boolean;
  isFullscreen: boolean;
  onToggleEditMode: () => void;
  onToggleFullscreen: () => void;
}

export const FloatingControls = ({
  isEditMode,
  isFullscreen,
  onToggleEditMode,
  onToggleFullscreen,
}: FloatingControlsProps) => {
  return (
    <TooltipProvider>
      <div className="flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant={isEditMode ? "default" : "outline"}
              onClick={onToggleEditMode}
            >
              <Settings size={16} className="mr-2" />
              {isEditMode ? "Exit Edit" : "Edit Mode"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isEditMode ? "Exit Edit Mode" : "Enter Edit Mode"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 size={16} className="mr-2" />
                  Exit Presentation
                </>
              ) : (
                <>
                  <Maximize2 size={16} className="mr-2" />
                  Presentation Mode
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isFullscreen ? "Exit Presentation Mode" : "Enter Presentation Mode"}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
