import { useState } from "react";
import { MarketingSidebar } from "@/components/MarketingSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { 
  Loader2, 
  Mail, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Plus,
  Trash2
} from "lucide-react";

interface GeneratedEmail {
  subject: string;
  preheader: string;
  body: string;
  cta: string;
}

export default function EmailCopywriter() {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Step 1: Ingestion
  const [formData, setFormData] = useState({
    emailType: "broadcast",
    purpose: "",
    productService: "",
    targetAudience: "",
    keyMessage: "",
    cta: "",
    tone: "professional",
    urgency: "",
  });

  // For sequence emails
  const [sequenceCount, setSequenceCount] = useState(3);
  
  // Step 2: Generation Result
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([]);

  const handleGenerate = async () => {
    if (!formData.purpose || !formData.productService || !formData.targetAudience) {
      toast({
        title: "Missing Information",
        description: "Please fill in purpose, product/service, and target audience.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const emailCount = formData.emailType === "sequence" ? sequenceCount : 1;
      
      const prompt = `You are an expert email copywriter. Create ${emailCount} high-converting ${formData.emailType === "sequence" ? "email sequence" : "email"} based on the following:

**Email Type:** ${formData.emailType === "sequence" ? `${sequenceCount}-email nurture sequence` : "Single broadcast email"}
**Purpose:** ${formData.purpose}
**Product/Service:** ${formData.productService}
**Target Audience:** ${formData.targetAudience}
**Key Message:** ${formData.keyMessage || "Not specified"}
**Desired CTA:** ${formData.cta || "Not specified"}
**Tone:** ${formData.tone}
**Urgency Element:** ${formData.urgency || "None"}

Generate the email(s) in this JSON format:
{
  "emails": [
    {
      "subject": "Compelling subject line (max 60 chars)",
      "preheader": "Preview text that appears after subject (max 90 chars)",
      "body": "Full email body with paragraphs, personalization placeholders like {{first_name}}, and formatting",
      "cta": "Call-to-action button text"
    }
  ]
}

${formData.emailType === "sequence" ? `
For the sequence:
- Email 1: Introduction/Value hook
- Email 2: Build trust/Share proof
- Email 3: Address objections
${sequenceCount > 3 ? `- Email 4+: Additional value and urgency` : ""}
` : ""}

Focus on:
- Attention-grabbing subject lines
- Personalization opportunities
- Clear value proposition
- Emotional connection
- Strong call-to-action
- Mobile-friendly formatting (short paragraphs)`;

      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { prompt, responseFormat: 'json' }
      });

      if (error) throw error;

      // Parse the response
      let parsed: { emails: GeneratedEmail[] };
      try {
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not parse response");
        }
      } catch {
        // Fallback
        parsed = {
          emails: [{
            subject: "Your Exclusive Invitation",
            preheader: "Something special awaits you inside...",
            body: data.response.substring(0, 500),
            cta: "Learn More"
          }]
        };
      }

      setGeneratedEmails(parsed.emails);
      setStep(2);
      toast({
        title: "Emails Generated!",
        description: `Created ${parsed.emails.length} email${parsed.emails.length > 1 ? 's' : ''} for review.`,
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate emails. Please try again.",
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
              <Mail className="h-10 w-10 text-primary" />
              Email Copywriter
            </h1>
            <p className="text-muted-foreground">
              AI-powered tool to create high-converting email copy for broadcasts and automations
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-4">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s}
                </div>
                {s < 2 && (
                  <div className={`w-16 h-1 mx-2 ${step > s ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
            <span className="text-sm text-muted-foreground ml-4">
              {step === 1 && "Configure Email"}
              {step === 2 && "Review & Export"}
            </span>
          </div>

          {/* Step 1: Ingestion */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  Tell us about your email campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email Type</Label>
                    <Select
                      value={formData.emailType}
                      onValueChange={(v) => setFormData({ ...formData, emailType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="broadcast">Single Broadcast</SelectItem>
                        <SelectItem value="sequence">Email Sequence</SelectItem>
                        <SelectItem value="welcome">Welcome Email</SelectItem>
                        <SelectItem value="promotional">Promotional</SelectItem>
                        <SelectItem value="nurture">Nurture/Educational</SelectItem>
                        <SelectItem value="reengagement">Re-engagement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.emailType === "sequence" && (
                    <div className="space-y-2">
                      <Label>Number of Emails</Label>
                      <Select
                        value={sequenceCount.toString()}
                        onValueChange={(v) => setSequenceCount(parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 emails</SelectItem>
                          <SelectItem value="5">5 emails</SelectItem>
                          <SelectItem value="7">7 emails</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <Select
                      value={formData.tone}
                      onValueChange={(v) => setFormData({ ...formData, tone: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly & Casual</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="storytelling">Storytelling</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="humorous">Humorous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Email Purpose *</Label>
                  <Textarea
                    id="purpose"
                    placeholder="What's the goal of this email? e.g., Announce new product launch, Nurture cold leads, Drive webinar registrations..."
                    rows={2}
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productService">Product/Service *</Label>
                  <Input
                    id="productService"
                    placeholder="What are you promoting or discussing?"
                    value={formData.productService}
                    onChange={(e) => setFormData({ ...formData, productService: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience *</Label>
                  <Textarea
                    id="targetAudience"
                    placeholder="Who is receiving this email? What's their relationship with your brand?"
                    rows={2}
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyMessage">Key Message</Label>
                    <Textarea
                      id="keyMessage"
                      placeholder="What's the main takeaway?"
                      rows={2}
                      value={formData.keyMessage}
                      onChange={(e) => setFormData({ ...formData, keyMessage: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cta">Desired Call-to-Action</Label>
                    <Input
                      id="cta"
                      placeholder="e.g., Sign up now, Book a call, Shop the sale"
                      value={formData.cta}
                      onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency Element</Label>
                  <Input
                    id="urgency"
                    placeholder="e.g., Offer expires Friday, Limited spots available"
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating Emails...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Email{formData.emailType === "sequence" ? "s" : ""}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Review Generated Emails */}
          {step === 2 && generatedEmails.length > 0 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back to Edit
                </Button>
                <Button
                  onClick={() => {
                    const allEmails = generatedEmails.map((email, i) => `
## Email ${i + 1}

**Subject:** ${email.subject}
**Preheader:** ${email.preheader}

${email.body}

**CTA:** ${email.cta}
                    `).join('\n\n---\n\n');
                    copyToClipboard(allEmails, "all");
                  }}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" /> Copy All Emails
                </Button>
              </div>

              {generatedEmails.map((email, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        Email {index + 1}
                      </CardTitle>
                      <CopyButton 
                        text={`Subject: ${email.subject}\nPreheader: ${email.preheader}\n\n${email.body}\n\nCTA: ${email.cta}`}
                        id={`email-${index}`}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Subject:</span>
                        <span className="font-medium">{email.subject}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Preheader:</span>
                        <span className="text-sm text-muted-foreground">{email.preheader}</span>
                      </div>
                    </div>
                    
                    <div className="prose prose-sm max-w-none">
                      {email.body.split('\n').map((paragraph, pIndex) => (
                        <p key={pIndex} className="text-foreground">{paragraph}</p>
                      ))}
                    </div>

                    <div className="pt-2">
                      <Button className="gap-2">
                        {email.cta}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex gap-4 justify-center pt-4">
                <Button variant="outline" onClick={() => { setStep(1); setGeneratedEmails([]); }} className="gap-2">
                  <Sparkles className="h-4 w-4" /> Generate New Emails
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}




