import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Sheet } from "lucide-react";

interface GoogleSheetsConnectFormProps {
  isConnected: boolean;
  onConnect: () => void;
}

const GoogleSheetsConnectForm = ({ isConnected, onConnect }: GoogleSheetsConnectFormProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    spreadsheetId: '',
    spreadsheetName: 'Ad Generator',
  });

  const handleConnect = async () => {
    if (!formData.spreadsheetId) {
      toast({
        title: "Missing Information",
        description: "Please enter a spreadsheet ID or URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-connect', {
        body: formData
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message || "Google Sheets connected successfully",
      });

      if (data.instructions) {
        toast({
          title: "Important",
          description: data.instructions,
          duration: 10000,
        });
      }

      setIsOpen(false);
      setFormData({ spreadsheetId: '', spreadsheetName: 'Ad Generator' });
      onConnect();
    } catch (error) {
      console.error('Error connecting Google Sheets:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect Google Sheets",
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
            <p className="font-medium text-foreground">Google Sheets Connected</p>
            <p className="text-sm text-muted-foreground">Ad Generator sheet is linked</p>
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
            <Sheet className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="font-medium text-foreground">Connect Google Sheets</p>
              <p className="text-sm text-muted-foreground">Link your Ad Generator</p>
            </div>
            <Button size="sm">Connect</Button>
          </div>
        </Card>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Connect Google Sheets</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Link your Ad Generator spreadsheet to enable script analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="spreadsheetName" className="text-foreground">Sheet Name</Label>
            <Input
              id="spreadsheetName"
              placeholder="Ad Generator"
              value={formData.spreadsheetName}
              onChange={(e) => setFormData({ ...formData, spreadsheetName: e.target.value })}
              className="bg-background border-border text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="spreadsheetId" className="text-foreground">Spreadsheet URL or ID</Label>
            <Input
              id="spreadsheetId"
              placeholder="https://docs.google.com/spreadsheets/d/XXXXXXXXXX/edit"
              value={formData.spreadsheetId}
              onChange={(e) => setFormData({ ...formData, spreadsheetId: e.target.value })}
              className="bg-background border-border text-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Paste the full URL or just the spreadsheet ID
            </p>
          </div>

          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Setup Instructions:</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Make sure your sheet has a tab named "Ad Generator"</li>
              <li>Column A should contain ad names/codes</li>
              <li>Include columns for Script, Hooks, and CTA</li>
              <li>Share the sheet with the service account email (shown after connection)</li>
            </ol>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} className="border-border">
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={loading}>
            {loading ? 'Connecting...' : 'Connect Sheet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GoogleSheetsConnectForm;