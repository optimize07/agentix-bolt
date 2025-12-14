import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdvertisingSidebar } from "@/components/AdvertisingSidebar";
import TopPerformerCard from "@/components/advertising/TopPerformerCard";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

const AdOptimizerRunDetails = () => {
  const { runId } = useParams();
  const navigate = useNavigate();
  const [run, setRun] = useState<any>(null);
  const [performers, setPerformers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRunDetails();
  }, [runId]);

  const fetchRunDetails = async () => {
    if (!runId) return;

    setLoading(true);

    // Fetch run details
    const { data: runData, error: runError } = await supabase
      .from('ad_spy_runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (runError) {
      console.error('Error fetching run:', runError);
      setLoading(false);
      return;
    }

    setRun(runData);

    // Fetch top performers with iterations
    const { data: performersData, error: performersError } = await supabase
      .from('ad_spy_top_performers')
      .select(`
        *,
        ad_spy_script_iterations (*)
      `)
      .eq('run_id', runId)
      .order('rank', { ascending: true });

    if (!performersError && performersData) {
      setPerformers(performersData);
    }

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'analyzing':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdvertisingSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdvertisingSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <p className="text-muted-foreground">Run not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdvertisingSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/advertising/ad-optimizer')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Ad Optimizer
            </Button>

            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-foreground">Ad Optimization Details</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(run.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{format(new Date(run.created_at), 'hh:mm a')}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Badge className={getStatusColor(run.status)}>
                  {run.status}
                </Badge>
                <Badge variant="outline" className="border-border">
                  {run.trigger_type}
                </Badge>
              </div>
            </div>
          </div>

          {run.error_message && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-red-500">{run.error_message}</p>
            </div>
          )}

          {performers.length === 0 && run.status === 'completed' && (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <p className="text-muted-foreground">No top performers found for this run</p>
            </div>
          )}

          <div className="space-y-6">
            {performers.map((performer) => (
              <TopPerformerCard
                key={performer.id}
                performer={performer}
                iteration={performer.ad_spy_script_iterations?.[0]}
                rank={performer.rank}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdOptimizerRunDetails;