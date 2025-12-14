import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Sparkles, Star } from "lucide-react";
import { BusinessSearchModal } from "./BusinessSearchModal";
import { BusinessDetailsDisplay } from "./BusinessDetailsDisplay";

interface FormData {
  companyName: string;
  companyWebsite: string;
  competitor1: string;
  competitor2: string;
  competitor3: string;
  productDescription: string;
  clientAvatarDescription: string;
}

interface MarketResearchFormProps {
  onSubmitSuccess: (reportId: string) => void;
}

export const MarketResearchForm = ({ onSubmitSuccess }: MarketResearchFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isMiningWebsite, setIsMiningWebsite] = useState(false);
  const [miningCompetitors, setMiningCompetitors] = useState<{ [key: number]: boolean }>({});
  const [analyzedCompetitors, setAnalyzedCompetitors] = useState<{ [key: number]: boolean }>({});
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    companyWebsite: "",
    competitor1: "",
    competitor2: "",
    competitor3: "",
    productDescription: "",
    clientAvatarDescription: "",
  });

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleBusinessSelected = (business: any) => {
    setSelectedBusiness(business);
    setFormData({
      ...formData,
      companyWebsite: business.website || ""
    });
  };

  const handleMineWebsite = async () => {
    if (!formData.companyWebsite || !validateUrl(formData.companyWebsite)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid website URL first",
        variant: "destructive"
      });
      return;
    }

    setIsMiningWebsite(true);
    
    // Progress messages shown every 5 seconds
    const progressMessages = [
      "Starting website analysis...",
      "Extracting product information from website...",
      "Analyzing business model and services...",
      "Researching competitor landscape...",
      "Identifying direct competitors...",
      "Almost done, finalizing results..."
    ];
    
    let progressIndex = 0;
    toast({
      title: "Mining Website",
      description: progressMessages[0],
    });
    
    const progressInterval = setInterval(() => {
      progressIndex++;
      if (progressIndex < progressMessages.length) {
        toast({
          title: "Mining Website",
          description: progressMessages[progressIndex],
        });
      }
    }, 5000); // Show progress every 5 seconds

    try {
      const { data, error } = await supabase.functions.invoke('scrape-website-details', {
        body: { url: formData.companyWebsite.trim() }
      });

      clearInterval(progressInterval);

      if (error) throw error;

      if (data?.data) {
        const extracted = data.data;
        const competitors = extracted.competitors || [];
        
        setFormData({
          ...formData,
          competitor1: competitors[0] || formData.competitor1,
          competitor2: competitors[1] || formData.competitor2,
          competitor3: competitors[2] || formData.competitor3,
          productDescription: typeof extracted.product_service_description === 'string' 
            ? extracted.product_service_description 
            : String(extracted.product_service_description || formData.productDescription)
        });
        
        toast({
          title: "Website Analyzed Successfully",
          description: `Found ${competitors.length} competitors and extracted product description using AI search`
        });
      } else {
        toast({
          title: "Partial Success",
          description: "Data extracted but results may be incomplete",
          variant: "destructive"
        });
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error mining website:', error);
      toast({
        title: "Mining Failed",
        description: "Failed to extract data. The operation may have timed out - please try again.",
        variant: "destructive"
      });
    } finally {
      setIsMiningWebsite(false);
    }
  };

  const handleAnalyzeCompetitor = async (competitorIndex: number) => {
    // Get all unanalyzed competitors starting from this one
    const competitorsToAnalyze: number[] = [];
    
    for (let i = 1; i <= 3; i++) {
      const competitorUrl = formData[`competitor${i}` as keyof FormData];
      if (competitorUrl && validateUrl(competitorUrl) && !analyzedCompetitors[i]) {
        competitorsToAnalyze.push(i);
      }
    }

    if (competitorsToAnalyze.length === 0) {
      toast({
        title: "No Competitors to Analyze",
        description: "All competitors have been analyzed or no valid URLs found",
      });
      return;
    }

    toast({
      title: "Analyzing Competitors",
      description: `Starting analysis of ${competitorsToAnalyze.length} competitor${competitorsToAnalyze.length > 1 ? 's' : ''}...`,
    });

    // Analyze each competitor sequentially
    for (const num of competitorsToAnalyze) {
      const competitorUrl = formData[`competitor${num}` as keyof FormData];
      
      setMiningCompetitors(prev => ({ ...prev, [num]: true }));
      
      // Progress messages shown every 5 seconds
      const progressMessages = [
        `Analyzing competitor ${num}...`,
        "Extracting market insights...",
        "Understanding their positioning...",
        "Synthesizing client profile data...",
        "Creating ideal client avatar...",
        "Almost done, finalizing insights..."
      ];
      
      let progressIndex = 0;
      toast({
        title: `Analyzing Competitor ${num}`,
        description: progressMessages[0],
      });
      
      const progressInterval = setInterval(() => {
        progressIndex++;
        if (progressIndex < progressMessages.length) {
          toast({
            title: `Analyzing Competitor ${num}`,
            description: progressMessages[progressIndex],
          });
        }
      }, 5000);

      try {
        const { data, error } = await supabase.functions.invoke('scrape-competitor-avatar', {
          body: { 
            url: competitorUrl.trim(),
            existingAvatarDescription: formData.clientAvatarDescription,
            productDescription: formData.productDescription,
            companyName: formData.companyName
          }
        });

        clearInterval(progressInterval);

        if (error) throw error;

        if (data?.ideal_client_avatar) {
          // Ensure the value is always a string
          const avatarDescription = typeof data.ideal_client_avatar === 'string' 
            ? data.ideal_client_avatar 
            : String(data.ideal_client_avatar || '');
          
          // Replace the entire description with the synthesized version
          setFormData(prev => ({
            ...prev,
            clientAvatarDescription: avatarDescription
          }));
          
          setAnalyzedCompetitors(prev => ({ ...prev, [num]: true }));
          
          toast({
            title: `Competitor ${num} Analyzed`,
            description: "Ideal client avatar has been updated with new insights"
          });
        }
      } catch (error) {
        clearInterval(progressInterval);
        console.error(`Error analyzing competitor ${num}:`, error);
        toast({
          title: `Analysis Failed for Competitor ${num}`,
          description: "Failed to analyze competitor. Continuing with others...",
          variant: "destructive"
        });
      } finally {
        setMiningCompetitors(prev => ({ ...prev, [num]: false }));
      }
    }

    toast({
      title: "Analysis Complete",
      description: `Analyzed ${competitorsToAnalyze.length} competitor${competitorsToAnalyze.length > 1 ? 's' : ''} successfully`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authentication first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate market research reports.",
        variant: "destructive",
      });
      return;
    }

    // Validation - only company website, product description, and client avatar are required
    if (!formData.companyName.trim()) {
      toast({
        title: "Validation Error",
        description: "Company name is required",
        variant: "destructive",
      });
      return;
    }

    if (!validateUrl(formData.companyWebsite)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid company website URL",
        variant: "destructive",
      });
      return;
    }

    if ((formData.productDescription || '').trim().length < 50) {
      toast({
        title: "Validation Error",
        description: "Product description must be at least 50 characters",
        variant: "destructive",
      });
      return;
    }

    if ((formData.clientAvatarDescription || '').trim().length < 50) {
      toast({
        title: "Validation Error",
        description: "Client avatar description must be at least 50 characters",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Skip authentication check for testing
      // const { data: { user } } = await supabase.auth.getUser();
      // if (!user) {
      //   toast({
      //     title: "Authentication Required",
      //     description: "Please log in to create market research reports. Contact your administrator for access.",
      //     variant: "destructive",
      //   });
      //   setIsSubmitting(false);
      //   return;
      // }

      // For testing, use a placeholder user_id or get from session if available
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || '00000000-0000-0000-0000-000000000000'; // Placeholder for testing

      // Build competitors array - only include valid URLs
      const competitors = [
        formData.competitor1,
        formData.competitor2,
        formData.competitor3
      ].filter(url => url && validateUrl(url));

      // Create the report record
      const { data: report, error: insertError } = await supabase
        .from("market_research_reports")
        .insert({
          user_id: userId,
          company_name: formData.companyName,
          company_website: formData.companyWebsite,
          competitor_links: competitors,
          product_description: formData.productDescription,
          client_avatar_description: formData.clientAvatarDescription,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Trigger the edge function to process the research
      const { error: functionError } = await supabase.functions.invoke("market-research", {
        body: {
          reportId: report.id,
          companyName: formData.companyName,
          companyWebsite: formData.companyWebsite,
          competitorLinks: [formData.competitor1, formData.competitor2, formData.competitor3],
          productDescription: formData.productDescription,
          clientAvatarDescription: formData.clientAvatarDescription,
        },
      });

      if (functionError) {
        console.error("Function error:", functionError);
        toast({
          title: "Processing Error",
          description: "Failed to start research processing. The report was created but processing could not begin.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Research Started",
          description: "Your market research report is being generated. This will take a few minutes.",
        });
      }

      onSubmitSuccess(report.id);
      
      // Reset form
      setFormData({
        companyName: "",
        companyWebsite: "",
        competitor1: "",
        competitor2: "",
        competitor3: "",
        productDescription: "",
        clientAvatarDescription: "",
      });
      setSelectedBusiness(null);
      setAnalyzedCompetitors({});

    } catch (error) {
      console.error("Error creating market research report:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create market research report",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <div className="relative">
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g., Acme Corporation"
                required
              />
              {formData.companyName.length >= 3 && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-accent hover:scale-110 transition-all duration-200"
                  onClick={() => setIsSearchModalOpen(true)}
                >
                  <Search 
                    className="h-5 w-5 text-accent-foreground" 
                    style={{ 
                      animation: 'scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), pulse 1.5s cubic-bezier(0.4,0,0.6,1) 4',
                      transformOrigin: 'center'
                    }} 
                  />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyWebsite">Company Website *</Label>
            <div className="relative">
              <Input
                id="companyWebsite"
                type="url"
                value={formData.companyWebsite}
                onChange={(e) => {
                  let value = e.target.value;
                  // Auto-prepend https:// if user types a domain without protocol
                  if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
                    value = 'https://' + value;
                  }
                  setFormData({ ...formData, companyWebsite: value });
                }}
                placeholder="https://example.com"
                required
              />
              {formData.companyWebsite && validateUrl(formData.companyWebsite) && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-accent hover:scale-110 transition-all duration-200"
                  onClick={handleMineWebsite}
                  disabled={isMiningWebsite}
                >
                  {isMiningWebsite ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles 
                      className="h-5 w-5 text-yellow-500"
                      style={{ 
                        animation: 'scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), pulse 1.5s cubic-bezier(0.4,0,0.6,1) 4',
                        transformOrigin: 'center',
                        filter: 'drop-shadow(0 0 4px rgb(234 179 8 / 0.5))'
                      }}
                    />
                  )}
                </Button>
              )}
            </div>
          </div>

          {selectedBusiness && <BusinessDetailsDisplay business={selectedBusiness} />}

          <div className="space-y-4">
            <Label>Top 3 Competitor Websites (optional)</Label>
            {[1, 2, 3].map((num) => (
              <div key={num} className="relative">
                <Input
                  value={formData[`competitor${num}` as keyof FormData]}
                  onChange={(e) => setFormData({ ...formData, [`competitor${num}`]: e.target.value })}
                  placeholder={`Competitor ${num}: https://competitor${num}.com`}
                />
                {formData[`competitor${num}` as keyof FormData] && 
                 validateUrl(formData[`competitor${num}` as keyof FormData]) && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-accent hover:scale-110 transition-all duration-200"
                    onClick={() => handleAnalyzeCompetitor(num)}
                    disabled={miningCompetitors[num]}
                  >
                    {miningCompetitors[num] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : analyzedCompetitors[num] ? (
                      <Star
                        className="h-5 w-5 text-green-500 fill-green-500"
                        style={{ 
                          filter: 'drop-shadow(0 0 6px rgb(34 197 94 / 0.6))'
                        }}
                      />
                    ) : (
                      <Star
                        className="h-5 w-5 text-yellow-400 fill-yellow-400"
                        style={{ 
                          animation: 'scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), pulse 1.5s cubic-bezier(0.4,0,0.6,1) 4',
                          transformOrigin: 'center',
                          filter: 'drop-shadow(0 0 6px rgb(250 204 21 / 0.6))'
                        }}
                      />
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="productDescription">Product/Service Description * (min 50 characters)</Label>
            <Textarea
              id="productDescription"
              value={formData.productDescription}
              onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
              placeholder="Describe your product or service in detail. What problems does it solve? What makes it unique?"
              rows={4}
              required
            />
            <p className="text-sm text-muted-foreground">
              {(formData.productDescription || '').length} / 50 minimum characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientAvatarDescription">Ideal Client Avatar Description * (min 50 characters)</Label>
            <Textarea
              id="clientAvatarDescription"
              value={formData.clientAvatarDescription}
              onChange={(e) => setFormData({ ...formData, clientAvatarDescription: e.target.value })}
              placeholder="Describe your ideal customer in detail. Who are they? What do they care about? What are their pain points?"
              rows={4}
              required
            />
            <p className="text-sm text-muted-foreground">
              {(formData.clientAvatarDescription || '').length} / 50 minimum characters
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={
              isSubmitting || 
              !formData.companyWebsite || 
              !validateUrl(formData.companyWebsite) ||
              formData.productDescription.trim().length < 50 ||
              formData.clientAvatarDescription.trim().length < 50
            } 
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Research Report...
              </>
            ) : (
              "Generate Market Research Report"
            )}
          </Button>
        </form>
      </Card>

      <BusinessSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        companyName={formData.companyName}
        onBusinessSelected={handleBusinessSelected}
      />
    </>
  );
};
