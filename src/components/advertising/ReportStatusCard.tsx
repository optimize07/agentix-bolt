import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

interface ReportStatusCardProps {
  reportId: string;
  onComplete?: () => void;
}

export const ReportStatusCard = ({ reportId, onComplete }: ReportStatusCardProps) => {
  const [status, setStatus] = useState<string>("pending");
  const [progress, setProgress] = useState(0);
  const [hasCalledComplete, setHasCalledComplete] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from("market_research_reports")
        .select("status")
        .eq("id", reportId)
        .single();

      if (!error && data) {
        setStatus(data.status);
        
        if (data.status === "completed") {
          setProgress(100);
          if (!hasCalledComplete) {
            setHasCalledComplete(true);
            onComplete?.();
          }
        } else if (data.status === "processing") {
          setProgress(50);
        } else if (data.status === "failed") {
          setProgress(0);
        }
      }
    };

    fetchStatus();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`report-${reportId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "market_research_reports",
          filter: `id=eq.${reportId}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          setStatus(newStatus);
          
          if (newStatus === "completed") {
            setProgress(100);
            if (!hasCalledComplete) {
              setHasCalledComplete(true);
              onComplete?.();
            }
          } else if (newStatus === "processing") {
            setProgress(50);
          } else if (newStatus === "failed") {
            setProgress(0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reportId]);

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "processing":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "processing":
        return <Badge variant="secondary">Processing</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "completed":
        return "Your market research report is ready!";
      case "failed":
        return "Failed to generate report. Please try again.";
      case "processing":
        return "Analyzing company, competitors, market, and creating psychographic profile...";
      default:
        return "Your report is queued for processing...";
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="font-semibold">Report Status</h3>
              <p className="text-sm text-muted-foreground">{getStatusMessage()}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {(status === "processing" || status === "pending") && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground text-center">
              This usually takes 5-10 minutes
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};