import { useState } from "react";
import { MarketingSidebar } from "@/components/MarketingSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { 
  Loader2, 
  FileEdit, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Lightbulb,
  Target,
  MessageSquare,
  Zap
} from "lucide-react";

interface LandingPageCopy {
  headline: string;
  subheadline: string;
  heroSection: string;
  problemSection: string;
  solutionSection: string;
  benefitsList: string[];
  testimonialPrompts: string[];
  ctaSection: string;
  faqSection: string[];
}

export default function LandingPageCopywriter() {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Step 1: Ingestion
  const [formData, setFormData] = useState({
    productName: "",
    productDescription: "",
    targetAudience: "",
    keyBenefits: "",
    uniqueValue: "",
    competitorDiff: "",
    pricePoint: "",
    urgencyElement: "",
  });

  // Step 2: Generation Result
  const [generatedCopy, setGeneratedCopy] = useState<LandingPageCopy | null>(null);

  const handleGenerate = async () => {
    if (!formData.productName || !formData.productDescription || !formData.targetAudience) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least the product name, description, and target audience.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const prompt = `You are an expert landing page copywriter. Create compelling, high-converting landing page copy based on the following information:

**Product/Service:** ${formData.productName}
**Description:** ${formData.productDescription}
**Target Audience:** ${formData.targetAudience}
**Key Benefits:** ${formData.keyBenefits || "Not specified"}
**Unique Value Proposition:** ${formData.uniqueValue || "Not specified"}
**Competitive Differentiator:** ${formData.competitorDiff || "Not specified"}
**Price Point:** ${formData.pricePoint || "Not specified"}
**Urgency Element:** ${formData.urgencyElement || "Not specified"}

Generate the following sections in JSON format:
{
  "headline": "A powerful, attention-grabbing headline (max 10 words)",
  "subheadline": "A supporting subheadline that expands on the headline",
  "heroSection": "2-3 sentences for the hero section copy",
  "problemSection": "A paragraph agitating the problem the audience faces",
  "solutionSection": "A paragraph positioning the product as the solution",
  "benefitsList": ["Benefit 1", "Benefit 2", "Benefit 3", "Benefit 4", "Benefit 5"],
  "testimonialPrompts": ["Suggested testimonial theme 1", "Suggested testimonial theme 2"],
  "ctaSection": "Compelling call-to-action copy with button text suggestion",
  "faqSection": ["Q: Question 1? A: Answer 1", "Q: Question 2? A: Answer 2", "Q: Question 3? A: Answer 3"]
}

Focus on:
- Emotional triggers and pain points
- Clear value proposition
- Action-oriented language
- Social proof suggestions
- Urgency without being pushy`;

      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { prompt, responseFormat: 'json' }
      });

      if (error) throw error;

      // Parse the response
      let parsed: LandingPageCopy;
      try {
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not parse response");
        }
      } catch {
        // Fallback structure if parsing fails
        parsed = {
          headline: "Transform Your Business Today",
          subheadline: data.response.substring(0, 100),
          heroSection: data.response.substring(0, 200),
          problemSection: "Your current approach isn't working...",
          solutionSection: formData.productDescription,
          benefitsList: ["Benefit 1", "Benefit 2", "Benefit 3"],
          testimonialPrompts: ["Success story about results", "Customer satisfaction testimonial"],
          ctaSection: "Get Started Now",
          faqSection: ["Q: How does it work? A: Simple and effective."]
        };
      }

      setGeneratedCopy(parsed);
      setStep(2);
      toast({
        title: "Copy Generated!",
        description: "Your landing page copy is ready for review.",
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate copy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: "Copied to clipboard!" });
  };

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => copyToClipboard(text, id)}
    >
      {copied === id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <MarketingSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <FileEdit className="h-10 w-10 text-primary" />
              Landing Page Copywriter
            </h1>
            <p className="text-muted-foreground">
              AI-powered tool to create high-converting landing page copy
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div className={`w-16 h-1 mx-2 ${step > s ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
            <span className="text-sm text-muted-foreground ml-4">
              {step === 1 && "Gather Information"}
              {step === 2 && "Review Copy"}
              {step === 3 && "Export & Use"}
            </span>
          </div>

          {/* Step 1: Ingestion */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Tell us about your product
                </CardTitle>
                <CardDescription>
                  The more detail you provide, the better the copy will be
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product/Service Name *</Label>
                    <Input
                      id="productName"
                      placeholder="e.g., Acme Marketing Suite"
                      value={formData.productName}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricePoint">Price Point</Label>
                    <Input
                      id="pricePoint"
                      placeholder="e.g., $99/month, Free trial available"
                      value={formData.pricePoint}
                      onChange={(e) => setFormData({ ...formData, pricePoint: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productDescription">Product Description *</Label>
                  <Textarea
                    id="productDescription"
                    placeholder="Describe what your product does, its main features, and how it helps customers..."
                    rows={3}
                    value={formData.productDescription}
                    onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience *</Label>
                  <Textarea
                    id="targetAudience"
                    placeholder="Who is your ideal customer? What are their demographics, roles, and pain points?"
                    rows={2}
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keyBenefits">Key Benefits</Label>
                  <Textarea
                    id="keyBenefits"
                    placeholder="List the main benefits customers get from using your product..."
                    rows={2}
                    value={formData.keyBenefits}
                    onChange={(e) => setFormData({ ...formData, keyBenefits: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="uniqueValue">Unique Value Proposition</Label>
                    <Textarea
                      id="uniqueValue"
                      placeholder="What makes you different from alternatives?"
                      rows={2}
                      value={formData.uniqueValue}
                      onChange={(e) => setFormData({ ...formData, uniqueValue: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="competitorDiff">Competitive Differentiator</Label>
                    <Textarea
                      id="competitorDiff"
                      placeholder="Why should they choose you over competitors?"
                      rows={2}
                      value={formData.competitorDiff}
                      onChange={(e) => setFormData({ ...formData, competitorDiff: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgencyElement">Urgency Element</Label>
                  <Input
                    id="urgencyElement"
                    placeholder="e.g., Limited time offer, Only 50 spots available"
                    value={formData.urgencyElement}
                    onChange={(e) => setFormData({ ...formData, urgencyElement: e.target.value })}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating Copy...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Landing Page Copy
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Review Generated Copy */}
          {step === 2 && generatedCopy && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back to Edit
                </Button>
                <Button onClick={() => setStep(3)} className="gap-2">
                  Continue to Export <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Headline Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Headline
                  </CardTitle>
                  <CopyButton text={generatedCopy.headline} id="headline" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{generatedCopy.headline}</p>
                  <p className="text-lg text-muted-foreground mt-2">{generatedCopy.subheadline}</p>
                </CardContent>
              </Card>

              {/* Hero Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Hero Section</CardTitle>
                  <CopyButton text={generatedCopy.heroSection} id="hero" />
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{generatedCopy.heroSection}</p>
                </CardContent>
              </Card>

              {/* Problem/Solution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-red-500" />
                      The Problem
                    </CardTitle>
                    <CopyButton text={generatedCopy.problemSection} id="problem" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground">{generatedCopy.problemSection}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-green-500" />
                      The Solution
                    </CardTitle>
                    <CopyButton text={generatedCopy.solutionSection} id="solution" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground">{generatedCopy.solutionSection}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Benefits */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Key Benefits</CardTitle>
                  <CopyButton text={generatedCopy.benefitsList.join("\n• ")} id="benefits" />
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {generatedCopy.benefitsList.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Call to Action
                  </CardTitle>
                  <CopyButton text={generatedCopy.ctaSection} id="cta" />
                </CardHeader>
                <CardContent>
                  <p className="text-foreground font-medium">{generatedCopy.ctaSection}</p>
                </CardContent>
              </Card>

              {/* FAQ */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">FAQ Section</CardTitle>
                  <CopyButton text={generatedCopy.faqSection.join("\n\n")} id="faq" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {generatedCopy.faqSection.map((faq, i) => (
                    <div key={i} className="border-b border-border pb-3 last:border-0">
                      <p className="text-foreground">{faq}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Export */}
          {step === 3 && generatedCopy && (
            <Card>
              <CardHeader>
                <CardTitle>Export Your Copy</CardTitle>
                <CardDescription>
                  Copy individual sections or export everything at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full gap-2"
                  onClick={() => {
                    const fullCopy = `
# ${generatedCopy.headline}

## ${generatedCopy.subheadline}

${generatedCopy.heroSection}

---

## The Problem

${generatedCopy.problemSection}

## The Solution

${generatedCopy.solutionSection}

## Benefits

${generatedCopy.benefitsList.map(b => `• ${b}`).join('\n')}

---

## Call to Action

${generatedCopy.ctaSection}

---

## FAQ

${generatedCopy.faqSection.join('\n\n')}
                    `.trim();
                    copyToClipboard(fullCopy, "full");
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Copy All as Markdown
                </Button>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Review
                  </Button>
                  <Button variant="outline" onClick={() => { setStep(1); setGeneratedCopy(null); }} className="gap-2">
                    <Sparkles className="h-4 w-4" /> Generate New Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}




