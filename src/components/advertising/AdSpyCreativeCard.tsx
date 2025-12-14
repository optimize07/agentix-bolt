import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AdSpyAnalysisView from "./AdSpyAnalysisView";

interface AdSpyCreativeCardProps {
  ad: any;
}

const AdSpyCreativeCard = ({ ad }: AdSpyCreativeCardProps) => {
  const [isRecreating, setIsRecreating] = useState(false);
  const { toast } = useToast();
  const analysis = ad.ad_spy_analysis?.[0];

  const handleRecreate = async () => {
    setIsRecreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ad-spy-recreate', {
        body: { adId: ad.id }
      });

      if (error) throw error;

      toast({
        title: "Recreation started",
        description: "AI is creating a new version for your offer",
      });
    } catch (error: any) {
      console.error('Recreate error:', error);
      toast({
        title: "Recreation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRecreating(false);
    }
  };

  return (
    <Card className="overflow-hidden bg-card border-border hover:border-primary/50 transition-colors">
      <div className="aspect-video bg-muted relative">
        {ad.video_url ? (
          <video
            src={ad.video_url}
            className="w-full h-full object-cover"
            controls
          />
        ) : ad.image_url ? (
          <img
            src={ad.image_url}
            alt="Ad creative"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No preview available
          </div>
        )}
        {analysis && (
          <Badge className="absolute top-2 right-2 bg-accent">
            Analyzed
          </Badge>
        )}
      </div>

      <div className="p-4 space-y-4">
        {ad.ad_copy && (
          <p className="text-sm text-foreground line-clamp-3">
            {ad.ad_copy}
          </p>
        )}

        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1" size="sm">
                View Analysis
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ad Analysis</DialogTitle>
              </DialogHeader>
              <AdSpyAnalysisView ad={ad} analysis={analysis} />
            </DialogContent>
          </Dialog>

          <Button
            onClick={handleRecreate}
            disabled={isRecreating || !analysis}
            size="sm"
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Recreate
          </Button>
        </div>

        {ad.ad_library_url && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2"
            onClick={() => window.open(ad.ad_library_url, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            View on Facebook
          </Button>
        )}
      </div>
    </Card>
  );
};

export default AdSpyCreativeCard;
