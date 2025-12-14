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
import { Activity } from "lucide-react";

interface StatusChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName: string;
  currentStatus: "Active" | "Inactive" | "Paused";
  onSave: (newStatus: "Active" | "Inactive" | "Paused") => void;
}

export const StatusChangeModal = ({
  open,
  onOpenChange,
  agentName,
  currentStatus,
  onSave,
}: StatusChangeModalProps) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  const handleSave = () => {
    onSave(selectedStatus);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Change Agent Status
          </DialogTitle>
          <DialogDescription>
            Update status for {agentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Agent Status
            </label>
            <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Descriptions */}
          <div className="rounded-lg border border-border bg-muted/50 p-3 text-xs space-y-1">
            <div><span className="font-medium">Active:</span> Agent is running normally</div>
            <div><span className="font-medium">Paused:</span> Temporarily stopped, can be resumed</div>
            <div><span className="font-medium">Inactive:</span> Disabled, requires reconfiguration</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Update Status
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
