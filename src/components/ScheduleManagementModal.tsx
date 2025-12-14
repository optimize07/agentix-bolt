import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

interface ScheduleManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName: string;
  currentSchedule: "daily" | "weekly" | "monthly";
  lastRun?: string;
  nextRun?: string;
  onSave: (newSchedule: "daily" | "weekly" | "monthly") => void;
}

export const ScheduleManagementModal = ({
  open,
  onOpenChange,
  agentName,
  currentSchedule,
  lastRun = "2025-10-24 14:30",
  nextRun = "2025-10-25 14:30",
  onSave,
}: ScheduleManagementModalProps) => {
  const [selectedSchedule, setSelectedSchedule] = useState(currentSchedule);

  const handleSave = () => {
    onSave(selectedSchedule);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Schedule Management
          </DialogTitle>
          <DialogDescription>
            Configure schedule for {agentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Run Information */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Run:</span>
              <span className="font-medium text-foreground">{lastRun}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Next Run:</span>
              <span className="font-medium text-foreground">{nextRun}</span>
            </div>
          </div>

          {/* Schedule Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Schedule Interval
            </label>
            <Select value={selectedSchedule} onValueChange={(value: any) => setSelectedSchedule(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
