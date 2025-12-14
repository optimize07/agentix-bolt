import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { MarketingSidebar } from "@/components/MarketingSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Variant } from "@/components/advertising/AdKanbanBoard";
import { Star, X, Globe, Check, Bot, BarChart3, ExternalLink, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Step2Loading } from "@/components/advertising/Step2Loading";
import { AdVariantList } from "@/components/advertising/AdVariantList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_BASE = "/functions/v1";

export default function MarketingAdCreator() {
  const AD_OUTPUT_IMAGES = ["/AdOutput1.png", "/AdOutput2.png", "/AdOutput3.png", "/AdOutput4.png", "/AdOutput5.png"];
  type Asset = {
    id: string;
    name?: string;
    url?: string;
    thumbnailLink?: string;
    iconLink?: string;
    preview?: string;
    files?: { id: string }[];
  };
  const { clientId } = useParams();
  const [productContext, setProductContext] = useState({ brand: "", offer: "", audience: "", websiteUrl: "" });
  const [winningExamples, setWinningExamples] = useState<string>("");
  const [numVariants, setNumVariants] = useState(5);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  // Preview lightbox for HTML creatives
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Audience builder (chips + AI helper)
  const [audienceInput, setAudienceInput] = useState<string>("");
  const [audienceChips, setAudienceChips] = useState<string[]>([]);

  // Generation progress (Step 2 loader)
  const phases = [
    "Gathering winning ads",
    "Gathering insights",
    "Chatting with your audience",
    "Finding the hooks",
    "Building assets",
    "Generating copy",
    "Finalizing ads"
  ];
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [skeletonCount, setSkeletonCount] = useState(3);
  const [builtCount, setBuiltCount] = useState(0);
  const phaseTimerRef = useRef<number | null>(null);
  const buildTimerRef = useRef<number | null>(null);

  const approved = useMemo(() => variants.filter(v => v.status === "approved"), [variants]);
  const step2Enabled = isGenerating || variants.length > 0;
  const step3Enabled = approved.length > 0;
  // Publish modal + next steps
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishPhase, setPublishPhase] = useState<"form" | "sending" | "done" | "submittedApproval">("form");
  const [showSchedule, setShowSchedule] = useState(false);
  const [budget, setBudget] = useState<number>(100);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isScraping, setIsScraping] = useState(false);
  // Step 3 modal form state
  const [selectedAdAccount, setSelectedAdAccount] = useState<string>("");
  const [campaignName, setCampaignName] = useState<string>("");
  const [campaignConfirmed, setCampaignConfirmed] = useState<boolean>(false);
  const [adsetName, setAdsetName] = useState<string>("");
  const [adsetConfirmed, setAdsetConfirmed] = useState<boolean>(false);
  const [publishFinalized, setPublishFinalized] = useState<boolean>(false);
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false);

  function startProgress(count: number) {
    setIsGenerating(true);
    setSkeletonCount(count);
    setPhaseIndex(0);
    setBuiltCount(0);

    toast.message("Building ads…", { description: phases[0] });

    const advancePhase = () => {
      setPhaseIndex((i) => {
        const next = Math.min(i + 1, phases.length - 1);
        toast.message("Building ads…", { description: phases[next] });
        return next;
      });
      phaseTimerRef.current = window.setTimeout(advancePhase, 900);
    };
    phaseTimerRef.current = window.setTimeout(advancePhase, 900);

    const advanceBuild = () => {
      setBuiltCount((c) => {
        if (c < count) {
          buildTimerRef.current = window.setTimeout(advanceBuild, 1500);
          return c + 1;
        }
        return c;
      });
    };
    buildTimerRef.current = window.setTimeout(advanceBuild, 1800);
  }

  function stopProgress() {
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    if (buildTimerRef.current) clearTimeout(buildTimerRef.current);
    setIsGenerating(false);
  }

  async function handleGenerate() {
    if (!productContext.brand || !productContext.offer || !productContext.audience) {
      toast.error("Fill in brand, offer and audience first");
      return;
    }
    startProgress(numVariants);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ad-creator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: productContext.brand,
          offer: productContext.offer,
          audience: productContext.audience,
          numVariants
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      const mapped: Variant[] = (json.variants ?? []).map((v: any, i: number) => ({
        id: crypto.randomUUID(),
        name: v.name || `Variant ${i + 1}`,
        type: v.type || "image",
        thumbnail: AD_OUTPUT_IMAGES[i % AD_OUTPUT_IMAGES.length],
        status: "pending" as const,
        headline: v.headline ?? "",
        body: v.body ?? "",
        cta: v.cta ?? ""
      }));
      setVariants(mapped);
      toast.success(`Generated ${mapped.length} variants`);
    } catch (e: any) {
      toast.error(e.message ?? "Generation failed");
    } finally {
      setLoading(false);
      stopProgress();
    }
  }

  function handleApprove(id: number) {
    setVariants(vs => vs.map((v, i) => i === id ? { ...v, status: "approved" as const } : v));
  }
  function handleReject(id: number) {
    setVariants(vs => vs.map((v, i) => i === id ? { ...v, status: "archived" as const } : v));
  }
  function handleReset(id: number) {
    setVariants(vs => vs.map((v, i) => i === id ? { ...v, status: "review" as const } : v));
  }

  async function handlePublish() {
    setPublishPhase("sending");
    try {
      await new Promise(r => setTimeout(r, 1500));
      setPublishPhase("done");
      toast.success("Ad creation request sent successfully!");
    } catch {
      toast.error("Failed to send request");
      setPublishPhase("form");
    }
  }

  function handleAudienceKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && audienceInput.trim()) {
      e.preventDefault();
      const newChip = audienceInput.trim().replace(/,$/, "");
      if (newChip && !audienceChips.includes(newChip)) {
        setAudienceChips(prev => [...prev, newChip]);
      }
      setAudienceInput("");
    }
  }
  function removeAudienceChip(chip: string) {
    setAudienceChips(prev => prev.filter(c => c !== chip));
  }

  useEffect(() => {
    const combined = audienceChips.join(", ");
    setProductContext(prev => ({ ...prev, audience: combined }));
  }, [audienceChips]);

  return (
    <div className="flex h-screen w-full bg-background">
      <MarketingSidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground">Ad Creator</h1>
        </div>

        {/* Step 1: Product Context */}
        <Card className="mb-8">
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <span className="rounded-full bg-primary text-primary-foreground w-7 h-7 flex items-center justify-center text-sm font-bold">1</span>
            <CardTitle className="text-lg">Product Context</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Brand</label>
                <Input placeholder="Your brand name" value={productContext.brand} onChange={e => setProductContext(p => ({ ...p, brand: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Offer / Product</label>
                <Input placeholder="What you're selling" value={productContext.offer} onChange={e => setProductContext(p => ({ ...p, offer: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Website URL</label>
                <Input placeholder="https://yoursite.com" value={productContext.websiteUrl} onChange={e => setProductContext(p => ({ ...p, websiteUrl: e.target.value }))} />
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-4">
                <label className="text-sm font-medium text-muted-foreground">Target Audience</label>
                <div className="flex flex-wrap items-center gap-2 border border-input rounded-md p-2 min-h-[42px] bg-background">
                  {audienceChips.map(chip => (
                    <span key={chip} className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                      {chip}
                      <button type="button" className="hover:text-destructive" onClick={() => removeAudienceChip(chip)}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                  <Input
                    className="flex-1 border-none shadow-none focus-visible:ring-0 min-w-[120px] p-0 h-auto"
                    placeholder={audienceChips.length ? "Add more…" : "Type audience traits, comma or enter to add"}
                    value={audienceInput}
                    onChange={e => setAudienceInput(e.target.value)}
                    onKeyDown={handleAudienceKeyDown}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-muted-foreground">Winning Examples (optional)</label>
              <Textarea placeholder="Paste winning ad copy or describe style..." value={winningExamples} onChange={e => setWinningExamples(e.target.value)} className="mt-1" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground whitespace-nowrap"># Variants</label>
                <Input type="number" min={1} max={20} value={numVariants} onChange={e => setNumVariants(Number(e.target.value))} className="w-20" />
              </div>
              <Button onClick={handleGenerate} disabled={loading}>{loading ? "Generating…" : "Generate Ads"}</Button>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Review Variants */}
        <Card className={`mb-8 transition-opacity ${step2Enabled ? "" : "opacity-40 pointer-events-none"}`}>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <span className="rounded-full bg-primary text-primary-foreground w-7 h-7 flex items-center justify-center text-sm font-bold">2</span>
            <CardTitle className="text-lg">Review & Approve Variants</CardTitle>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <Step2Loading
                phases={phases}
                phaseIndex={phaseIndex}
                skeletonCount={skeletonCount}
                builtCount={builtCount}
              />
            ) : variants.length === 0 ? (
              <p className="text-sm text-muted-foreground">Generate ads first to see variants here.</p>
            ) : (
              <AdVariantList
                variants={variants}
                onChange={setVariants}
              />
            )}
          </CardContent>
        </Card>

        {/* Step 3: Publish */}
        <Card className={`transition-opacity ${step3Enabled ? "" : "opacity-40 pointer-events-none"}`}>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <span className="rounded-full bg-primary text-primary-foreground w-7 h-7 flex items-center justify-center text-sm font-bold">3</span>
            <CardTitle className="text-lg">Launch Ads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {approved.length} variant{approved.length !== 1 && "s"} approved. Ready to push to ad manager.
            </p>
            <Button onClick={() => setPublishOpen(true)} disabled={approved.length === 0} className="gap-2">
              <ExternalLink className="h-4 w-4" /> Publish to Ad Manager
            </Button>
          </CardContent>
        </Card>

        {/* Publish Dialog */}
        <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Publish Approved Ads</DialogTitle>
            </DialogHeader>
            {publishPhase === "form" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Select Ad Account</label>
                  <Select value={selectedAdAccount} onValueChange={setSelectedAdAccount}>
                    <SelectTrigger><SelectValue placeholder="Choose ad account..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account-1">Main Ad Account</SelectItem>
                      <SelectItem value="account-2">Secondary Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Campaign Name</label>
                    <Input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="Enter campaign name" disabled={campaignConfirmed} />
                  </div>
                  {!campaignConfirmed ? (
                    <Button variant="outline" onClick={() => setCampaignConfirmed(true)} disabled={!campaignName}><Check className="h-4 w-4" /></Button>
                  ) : (
                    <Button variant="ghost" size="icon"><CheckCircle2 className="h-5 w-5 text-green-500" /></Button>
                  )}
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Ad Set Name</label>
                    <Input value={adsetName} onChange={e => setAdsetName(e.target.value)} placeholder="Enter ad set name" disabled={adsetConfirmed} />
                  </div>
                  {!adsetConfirmed ? (
                    <Button variant="outline" onClick={() => setAdsetConfirmed(true)} disabled={!adsetName}><Check className="h-4 w-4" /></Button>
                  ) : (
                    <Button variant="ghost" size="icon"><CheckCircle2 className="h-5 w-5 text-green-500" /></Button>
                  )}
                </div>
                <div className="flex gap-4 pt-2">
                  <Button variant="secondary" onClick={() => setPublishOpen(false)}>Cancel</Button>
                  <Button onClick={handlePublish} disabled={!selectedAdAccount || !campaignConfirmed || !adsetConfirmed}>Send for Approval</Button>
                </div>
              </div>
            )}
            {publishPhase === "sending" && (
              <div className="flex flex-col items-center py-8 gap-4">
                <Bot className="h-10 w-10 animate-bounce text-primary" />
                <p className="text-muted-foreground">Submitting ads for approval…</p>
              </div>
            )}
            {publishPhase === "done" && (
              <div className="flex flex-col items-center py-8 gap-4">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <p className="text-lg font-semibold">Request Submitted!</p>
                <p className="text-sm text-muted-foreground text-center">Your ads have been sent for approval. You'll be notified when they're live.</p>
                <Button onClick={() => { setPublishOpen(false); setPublishPhase("form"); }}>Close</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* HTML Preview Lightbox */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>Creative Preview</DialogTitle>
            </DialogHeader>
            {previewUrl && <iframe src={previewUrl} className="w-full h-full rounded" />}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}




