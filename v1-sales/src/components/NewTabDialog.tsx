import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LayoutGrid } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";

interface NewTabDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTab: (name: string) => void;
}

export const NewTabDialog = ({ open, onOpenChange, onCreateTab }: NewTabDialogProps) => {
  const { getLabel } = useOrganization();
  const [name, setName] = useState("");

  const handleCreate = () => {
    if (name.trim()) {
      onCreateTab(name.trim());
      setName("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid size={20} />
            {getLabel('action.create')} {getLabel('entity.canvas')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            {getLabel('action.create')} a blank {getLabel('entity.canvas')} where you can add tables, charts, and widgets
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="canvas-name">{getLabel('entity.canvas')} {getLabel('field.name')}</Label>
            <Input
              id="canvas-name"
              placeholder={`${getLabel('action.enter')} ${getLabel('entity.canvas')} ${getLabel('field.name')}...`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {getLabel('action.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim()}>
              {getLabel('action.create')} {getLabel('entity.canvas')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
