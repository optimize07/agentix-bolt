import { useState, useEffect } from "react";
import { MarketingSidebar } from "@/components/MarketingSidebar";
import { MarketResearchForm } from "@/components/advertising/MarketResearchForm";
import { ResearchReportViewer } from "@/components/advertising/ResearchReportViewer";
import { ReportsList } from "@/components/advertising/ReportsList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Report {
  id: string;
  company_name: string;
  status: string;
  created_at: string;
  report_content?: string;
}

const MarketingMarketResearch = () => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  const handleReportCreated = async (reportId: string) => {
    // Poll for updates until report is complete
    const pollInterval = setInterval(async () => {
      const { data, error } = await supabase
        .from("market_research_reports")
        .select("id, company_name, status, created_at, report_content")
        .eq("id", reportId)
        .single();

      if (error) {
        console.error("Error polling report:", error);
        return;
      }

      if (data.status === "completed" || data.status === "failed") {
        clearInterval(pollInterval);
        setRefreshTrigger(prev => prev + 1);
        if (data.status === "completed") {
          setSelectedReport(data);
          toast({
            title: "Report Complete",
            description: "Your market research report is ready to view",
          });
        }
      }
    }, 5000);

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 300000);
  };

  const handleViewReport = async (reportId: string) => {
    const { data, error } = await supabase
      .from("market_research_reports")
      .select("id, company_name, status, created_at, report_content")
      .eq("id", reportId)
      .single();

    if (error) {
      console.error("Error fetching report:", error);
      toast({
        title: "Error",
        description: "Failed to fetch report",
        variant: "destructive",
      });
      return;
    }

    setSelectedReport(data);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <MarketingSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Market Research</h1>
            <p className="text-muted-foreground">
              AI-powered market analysis with competitor insights and client avatar profiling
            </p>
          </div>

          <Tabs defaultValue="new" className="space-y-6">
            <TabsList>
              <TabsTrigger value="new">New Research</TabsTrigger>
              <TabsTrigger value="reports">Past Reports</TabsTrigger>
              {selectedReport && selectedReport.report_content && (
                <TabsTrigger value="view">View Report</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="new">
              <MarketResearchForm onSubmitSuccess={handleReportCreated} />
            </TabsContent>

            <TabsContent value="reports">
              <ReportsList 
                onViewReport={handleViewReport}
                refreshTrigger={refreshTrigger}
              />
            </TabsContent>

            {selectedReport && selectedReport.report_content && (
              <TabsContent value="view">
                <ResearchReportViewer 
                  content={selectedReport.report_content}
                  companyName={selectedReport.company_name}
                  reportId={selectedReport.id}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default MarketingMarketResearch;

