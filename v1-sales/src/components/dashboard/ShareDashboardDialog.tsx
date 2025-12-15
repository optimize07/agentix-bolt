import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Share2 } from "lucide-react";

interface ShareDashboardDialogProps {
  dashboardId: string;
  currentUserId: string | null;
  isDefault: boolean;
  onShare: (shareType: 'personal' | 'team' | 'org_default') => void;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

export const ShareDashboardDialog = ({ dashboardId, currentUserId, isDefault, onShare }: ShareDashboardDialogProps) => {
  const { getLabel, organization } = useOrganization();
  const { toast } = useToast();
  const [shareType, setShareType] = useState<'personal' | 'team' | 'org_default'>(
    isDefault ? 'org_default' : currentUserId ? 'personal' : 'team'
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleShare = async () => {
    setIsSaving(true);

    try {
      const updateData: any = {};

      if (shareType === 'personal') {
        updateData.user_id = currentUserId;
        updateData.is_default = false;
      } else if (shareType === 'team') {
        updateData.user_id = null;
        updateData.is_default = false;
      } else if (shareType === 'org_default') {
        updateData.user_id = null;
        updateData.is_default = true;
      }

      const { error } = await supabase
        .from("dashboard_layouts")
        .update(updateData)
        .eq("id", dashboardId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Dashboard sharing settings updated"
      });

      onShare(shareType);
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          {getLabel('dashboard.share')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getLabel('dashboard.share')}</DialogTitle>
          <DialogDescription>
            Choose how you want to share this dashboard
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={shareType} onValueChange={(value: any) => setShareType(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="personal" id="personal" />
              <Label htmlFor="personal" className="cursor-pointer">
                <div>
                  <div className="font-medium">{getLabel('dashboard.personal')}</div>
                  <div className="text-sm text-muted-foreground">
                    Only you can view and edit this dashboard
                  </div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="team" id="team" />
              <Label htmlFor="team" className="cursor-pointer">
                <div>
                  <div className="font-medium">{getLabel('dashboard.team')}</div>
                  <div className="text-sm text-muted-foreground">
                    All team members in your organization can view this dashboard
                  </div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="org_default" id="org_default" />
              <Label htmlFor="org_default" className="cursor-pointer">
                <div>
                  <div className="font-medium">{getLabel('dashboard.org_default')}</div>
                  <div className="text-sm text-muted-foreground">
                    Set as the default dashboard for your organization
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          <Button onClick={handleShare} disabled={isSaving} className="w-full">
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
