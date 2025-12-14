import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface RunNowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName: string;
  clientName?: string;
}

export const RunNowModal = ({
  open,
  onOpenChange,
  agentName,
  clientName = "Client",
}: RunNowModalProps) => {
  const [parameters, setParameters] = useState("");
  const [notes, setNotes] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const handleRun = async () => {
    setIsRunning(true);
    
    // Simulate run
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Agent Started",
      description: `${agentName} is now running for ${clientName}`,
    });
    
    setIsRunning(false);
    onOpenChange(false);
    setParameters("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Run Agent Now
          </DialogTitle>
          <DialogDescription>
            Execute {agentName} for {clientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client Context */}
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Client: </span>
              <span className="font-medium text-foreground">{clientName}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Agent: </span>
              <span className="font-medium text-foreground">{agentName}</span>
            </div>
          </div>

          {/* Parameters Input */}
          <div className="space-y-2">
            <Label htmlFor="parameters">Custom Parameters (Optional)</Label>
            <Input
              id="parameters"
              placeholder="e.g., date_range=30days, focus=competitors"
              value={parameters}
              onChange={(e) => setParameters(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any context or notes for this run..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isRunning}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRun}
            disabled={isRunning}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {isRunning ? "Running..." : "Run Now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
