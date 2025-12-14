import { useState } from "react";
import { AdvertisingSidebar } from "@/components/AdvertisingSidebar";
import { MarketResearchForm } from "@/components/advertising/MarketResearchForm";
import { ReportStatusCard } from "@/components/advertising/ReportStatusCard";
import { ResearchReportViewer } from "@/components/advertising/ResearchReportViewer";
import { ReportsList } from "@/components/advertising/ReportsList";
import { Button } from "@/components/ui/button";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { useToast } from "@/hooks/use-toast";

const MarketResearch = () => {
  const { toast } = useToast();
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [viewingReportId, setViewingReportId] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSubmitSuccess = (reportId: string) => {
    setCurrentReportId(reportId);
    setViewingReportId(null);
    setReportContent(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleReportComplete = () => {
    toast({
      title: "Report Complete",
      description: "Your market research report has been generated successfully!",
    });
    setRefreshTrigger(prev => prev + 1);
    // Auto-hide the status card after completion
    setTimeout(() => setCurrentReportId(null), 2000);
  };

  const handleViewReport = async (reportId: string) => {
    try {
      const { data, error } = await supabase
        .from("market_research_reports")
        .select("report_content, company_name")
        .eq("id", reportId)
        .single();

      if (error) throw error;

      if (data && data.report_content) {
        setReportContent(data.report_content);
        setCompanyName(data.company_name);
        setViewingReportId(reportId);
        setCurrentReportId(null);
      } else {
        toast({
          title: "Report not ready",
          description: "This report is still being generated",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast({
        title: "Error",
        description: "Failed to load report",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdvertisingSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Market Research Tool</h1>
            <p className="text-muted-foreground">
              Generate comprehensive 20-40 page market research reports with AI-powered analysis
            </p>
          </div>

          {!viewingReportId && !reportContent && (
            <>
              <MarketResearchForm onSubmitSuccess={handleSubmitSuccess} />
              
              {currentReportId && (
                <ReportStatusCard 
                  reportId={currentReportId} 
                  onComplete={handleReportComplete}
                />
              )}
            </>
          )}

          {viewingReportId && reportContent && (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  setViewingReportId(null);
                  setReportContent(null);
                }}
                className="mb-4"
              >
                ← Back to Reports
              </Button>
              <ResearchReportViewer 
                content={reportContent} 
                companyName={companyName}
                reportId={viewingReportId}
              />
            </>
          )}

          <ReportsList 
            onViewReport={handleViewReport} 
            refreshTrigger={refreshTrigger}
          />
        </div>
      </main>
    </div>
  );
};

export default MarketResearch;