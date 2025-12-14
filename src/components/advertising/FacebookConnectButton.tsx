import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Facebook } from "lucide-react";

interface FacebookConnectButtonProps {
  isConnected: boolean;
  onConnect: () => void;
}

const FacebookConnectButton = ({ isConnected, onConnect }: FacebookConnectButtonProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    accessToken: '',
    accountId: '',
    accountName: '',
  });

  const handleConnect = async () => {
    if (!formData.accessToken || !formData.accountId || !formData.accountName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('facebook-connect', {
        body: formData
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message || "Facebook account connected successfully",
      });

      setIsOpen(false);
      setFormData({ accessToken: '', accountId: '', accountName: '' });
      onConnect();
    } catch (error) {
      console.error('Error connecting Facebook:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect Facebook account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isConnected) {
    return (
      <Card className="p-4 bg-green-500/10 border-green-500/20">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <div className="flex-1">
            <p className="font-medium text-foreground">Facebook Connected</p>
            <p className="text-sm text-muted-foreground">Ad account is connected</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="p-4 border-border hover:border-primary/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <Facebook className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="font-medium text-foreground">Connect Facebook</p>
              <p className="text-sm text-muted-foreground">Link your ad account</p>
            </div>
            <Button size="sm">Connect</Button>
          </div>
        </Card>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Connect Facebook Ad Account</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter your Facebook ad account details to enable ad analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="accountName" className="text-foreground">Account Name</Label>
            <Input
              id="accountName"
              placeholder="My Ad Account"
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              className="bg-background border-border text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId" className="text-foreground">Ad Account ID</Label>
            <Input
              id="accountId"
              placeholder="123456789"
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              className="bg-background border-border text-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Find this in your Facebook Ads Manager URL (act_XXXXXXXXX)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accessToken" className="text-foreground">Access Token</Label>
            <Input
              id="accessToken"
              type="password"
              placeholder="Enter your Facebook access token"
              value={formData.accessToken}
              onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
              className="bg-background border-border text-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Generate a long-lived token from Facebook's Graph API Explorer
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} className="border-border">
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={loading}>
            {loading ? 'Connecting...' : 'Connect Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FacebookConnectButton;