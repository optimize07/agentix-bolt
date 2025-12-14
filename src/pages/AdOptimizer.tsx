import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdvertisingSidebar } from "@/components/AdvertisingSidebar";
import AdOptimizerDashboard from "@/components/advertising/AdOptimizerDashboard";
import AdOptimizerRunCard from "@/components/advertising/AdOptimizerRunCard";
import FacebookConnectButton from "@/components/advertising/FacebookConnectButton";
import GoogleSheetsConnectForm from "@/components/advertising/GoogleSheetsConnectForm";
import ScheduleSettings from "@/components/advertising/ScheduleSettings";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Play, Settings } from "lucide-react";

const AdOptimizer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [runs, setRuns] = useState<any[]>([]);
  const [fbConnected, setFbConnected] = useState(false);
  const [sheetsConnected, setSheetsConnected] = useState(false);

  useEffect(() => {
    checkConnections();
    fetchRuns();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('ad-spy-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ad_spy_runs'
        },
        () => {
          fetchRuns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkConnections = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: fbAccounts } = await supabase
      .from('facebook_ad_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1);

    const { data: sheets } = await supabase
      .from('google_sheets_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1);

    setFbConnected(!!fbAccounts && fbAccounts.length > 0);
    setSheetsConnected(!!sheets && sheets.length > 0);
  };

  const fetchRuns = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('ad_spy_runs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setRuns(data);
    }
  };

  const handleRunAnalysis = async () => {
    if (!fbConnected || !sheetsConnected) {
      toast({
        title: "Setup Required",
        description: "Please connect both Facebook and Google Sheets before running analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);

    try {
      const { data, error } = await supabase.functions.invoke('sentiment-analysis-run', {
        body: {
          timeWindowDays: 7,
          triggerType: 'manual'
        }
      });

      if (error) throw error;

      toast({
        title: "Analysis Started",
        description: data.message || "Your ad analysis is now running.",
      });

      fetchRuns();
    } catch (error) {
      console.error('Error running analysis:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start analysis",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const canRunAnalysis = fbConnected && sheetsConnected;

  return (
    <div className="flex min-h-screen bg-background">
      <AdvertisingSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Ad Optimizer</h1>
              <p className="text-muted-foreground mt-2">
                Automatically find your top-performing creatives and generate new variations that outperform them
              </p>
            </div>
            
            <Button 
              size="lg"
              onClick={handleRunAnalysis}
              disabled={!canRunAnalysis || isRunning}
            >
              <Play className="mr-2 h-5 w-5" />
              {isRunning ? 'Optimizing...' : 'Run Ad Optimization'}
            </Button>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="runs">Analysis Runs</TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <AdOptimizerDashboard runs={runs} />
              
              {!canRunAnalysis && (
                <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Setup Required</h3>
                  <p className="text-muted-foreground">
                    Connect your accounts to start analyzing your ads
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <FacebookConnectButton 
                      isConnected={fbConnected} 
                      onConnect={checkConnections} 
                    />
                    <GoogleSheetsConnectForm 
                      isConnected={sheetsConnected} 
                      onConnect={checkConnections} 
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="runs" className="space-y-4">
              {runs.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-lg">
                  <p className="text-muted-foreground">No analysis runs yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Click "Run Analysis" to get started
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {runs.map((run) => (
                      <AdOptimizerRunCard
                        key={run.id}
                        run={run}
                        onClick={() => navigate(`/advertising/ad-optimizer/run/${run.id}`)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Connected Accounts</h3>
                  <div className="space-y-4">
                    <FacebookConnectButton 
                      isConnected={fbConnected} 
                      onConnect={checkConnections} 
                    />
                    <GoogleSheetsConnectForm 
                      isConnected={sheetsConnected} 
                      onConnect={checkConnections} 
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Automation Schedule</h3>
                  <ScheduleSettings />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdOptimizer;