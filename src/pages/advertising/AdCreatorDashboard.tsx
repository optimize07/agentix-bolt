import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { AdvertisingSidebar } from "@/components/AdvertisingSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Variant } from "@/components/advertising/AdKanbanBoard";
import { Star, X, Globe, Check, Bot, BarChart3, ExternalLink, CheckCircle2, FolderOpen, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Step2Loading } from "@/components/advertising/Step2Loading";
import { AdVariantList } from "@/components/advertising/AdVariantList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KnowledgeBaseBrowser, type KBItem } from "@/components/knowledge-base";

const API_BASE = "/functions/v1";

export default function AdCreatorDashboard() {
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
  const [adPlatform, setAdPlatform] = useState<string>("facebook");
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

  // Knowledge Base integration
  const [kbBrowserOpen, setKbBrowserOpen] = useState(false);
  const [kbSelectedItems, setKbSelectedItems] = useState<KBItem[]>([]);

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
      setBuiltCount((c) => Math.min(c + 1, count));
      buildTimerRef.current = window.setTimeout(advanceBuild, 1100);
    };
    buildTimerRef.current = window.setTimeout(advanceBuild, 1100);
  }

  function stopProgress() {
    if (phaseTimerRef.current) { clearTimeout(phaseTimerRef.current); phaseTimerRef.current = null; }
    if (buildTimerRef.current) { clearTimeout(buildTimerRef.current); buildTimerRef.current = null; }
    setIsGenerating(false);
    setPhaseIndex(phases.length - 1);
  }
  function sleep(ms: number) {
    return new Promise<void>((resolve) => { window.setTimeout(resolve, ms); });
  }

  async function fetchDriveImages() {
    try {
      const r = await fetch(`${API_BASE}/drive-list?q=${encodeURIComponent("mimeType contains 'image/'")}`, {
        headers: { "Content-Type": "application/json" }
      });
      const data = await r.json();
      const files = data?.via === "proxy" ? data?.proxyData : data?.files;
      setAssets(files ?? []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to list Drive assets");
    }
  }

  async function handleScrape() {
    const url = productContext.websiteUrl;
    if (!url) {
      toast.info("Please enter a website URL first.");
      return;
    }
    try {
      setIsScraping(true);
      const r = await fetch(`${API_BASE}/scrape-website-details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await r.json();
      if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success("Website scraped successfully! Added to context.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to scrape website");
    } finally {
      setIsScraping(false);
    }
  }

  function loadExamples() {
    const EXS = [
      // HTML examples with preview thumbnails
      { id: "html1", name: "HTML Example 1", url: "/ad-examples/AdExample1.html", preview: "/AdOutput1.png" },
      { id: "html2", name: "HTML Example 2", url: "/ad-examples/AdExample2.html", preview: "/AdOutput2.png" },
      { id: "html3", name: "HTML Example 3", url: "/ad-examples/AdExample3.html", preview: "/AdOutput3.png" }
    ];
    setAssets((prev: Asset[]) => {
      // de-dupe by id
      const map = new Map<string, Asset>();
      [...prev, ...EXS].forEach(a => map.set(a.id, a));
      return Array.from(map.values());
    });
    setSelectedAssetIds((prev) => Array.from(new Set([...prev, ...EXS.map(a => a.id)])));
    toast.success("Example creatives loaded");
  }

  function getAssetById(id?: string): Asset | undefined {
    if (!id) return undefined;
    return assets.find((x) => x.id === id || x?.files?.[0]?.id === id);
  }
  function isImageUrl(url?: string): boolean {
    if (!url) return false;
    return /\.(png|jpg|jpeg|webp|gif)$/i.test(url);
  }
  function assetImageUrlById(id?: string): string | undefined {
    const a = getAssetById(id);
    if (!a) return undefined;
    // Prefer explicit preview field; else use url if it is an image
    if (a.preview) return a.preview as string;
    if (isImageUrl(a.url)) return a.url as string;
    return a.thumbnailLink || a.iconLink;
  }

  async function onGenerate() {
    setLoading(true);
    setVariants([]);
    startProgress(numVariants);
    try {
      // Build Knowledge Base context if items are selected
      const kbContext = kbSelectedItems.length > 0 ? kbSelectedItems.map(item => ({
        title: item.title,
        category: item.category,
        description: item.description || "",
        tags: item.tags || [],
      })) : undefined;

      const body = {
        productContext: {
          ...productContext,
          audience: audienceChips.length ? audienceChips.join(", ") : productContext.audience,
          platform: adPlatform,
        },
        winningExamples: winningExamples.split("\n").filter(Boolean),
        numVariants,
        knowledgeBaseContext: kbContext, // Pass KB context to generation
      };
      const r = await fetch(`${API_BASE}/generate-copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await r.json();
      let v: Variant[] = (data?.variants ?? []).map((x: Variant) => ({ ...x, status: "review" as const }));

      // Generate images using Gemini for each variant
      const variantsWithImages = await Promise.all(
        v.map(async (variant, idx) => {
          try {
            // Check if user selected custom assets
            const sel = selectedAssetIds.filter(Boolean);
            if (sel.length > 0) {
              // Use selected assets in rotation
              const rotation = sel.map(id => assetImageUrlById(id)).filter(Boolean) as string[];
              return { ...variant, imageUrl: rotation[idx % rotation.length] || `https://placehold.co/600x400?text=Ad+${idx+1}` };
            }

            // Otherwise, generate image with Gemini
            const imageResp = await fetch(`${API_BASE}/generate-ad-images`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                campaignContext: {
                  brand: productContext.brand,
                  offer: productContext.offer,
                  audience: audienceChips.join(", ") || productContext.audience,
                  platform: adPlatform,
                },
                adCopy: {
                  headline: variant.headline,
                  primaryText: variant.primaryText,
                },
                numImages: 1,
              })
            });
            const imageData = await imageResp.json();
            const imageUrl = imageData?.images?.[0]?.imageUrl || AD_OUTPUT_IMAGES[idx % AD_OUTPUT_IMAGES.length];
            return { ...variant, imageUrl };
          } catch (imageError) {
            console.error("Image generation failed for variant", idx, imageError);
            return { ...variant, imageUrl: AD_OUTPUT_IMAGES[idx % AD_OUTPUT_IMAGES.length] };
          }
        })
      );

      setVariants(variantsWithImages);
      toast.success(`Generated ${variantsWithImages.length} variants with AI images`);
    } catch (e) {
      console.error(e);
      toast.error("Generation failed");
    } finally {
      stopProgress();
      setLoading(false);
    }
  }

  function addAudienceChipFromInput() {
    const text = audienceInput.trim();
    if (!text) return;
    const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
    setAudienceChips((prev) => Array.from(new Set([...prev, ...parts])));
    setAudienceInput("");
  }

  function removeChip(v: string) {
    setAudienceChips((prev) => prev.filter((c) => c !== v));
  }

  function mockAudienceFromAI() {
    const base = [
      "US residents",
      "Drivers 25-65",
      "Recently searched car insurance",
      "Homeowners",
      "High vehicle mileage",
      "Interested in savings & safety"
    ];
    setAudienceChips(base);
  }

  async function runMock() {
    // Reset UI state
    setVariants([]);
    setLoading(false);
    setIsGenerating(false);
    setAudienceChips([]);
    setWinningExamples("");
    setSelectedAssetIds([]);
    setProductContext({ brand: "", offer: "", audience: "", websiteUrl: "" });

    // 1) Winning ad URLs
    setWinningExamples([
      "https://www.facebook.com/ads/library/?id=1234567890",
      "https://www.facebook.com/ads/library/?id=2345678901",
      "https://www.facebook.com/ads/library/?id=3456789012"
    ].join("\n"));
    await sleep(1000);

    // 2) Load example creatives (selects them)
    loadExamples();
    await sleep(1000);

    // 3) Website URL
    setProductContext((prev) => ({ ...prev, websiteUrl: "https://autocarinsure.example.com" }));
    await sleep(1000);

    // 4) Simulate SCRAPE click (spinner 3s), then populate Brand & Offer
    setIsScraping(true);
    await sleep(3000);
    setProductContext((prev) => ({ ...prev, brand: "Auto Car Insurance", offer: "20% Off BFCM" }));
    setIsScraping(false);
    toast.success("Website scraped successfully! Added to context.");
    await sleep(1000);

    // 5) Audience and chips
    setAudienceChips([
      "US residents",
      "Drivers 25-65",
      "Recently searched car insurance",
      "Homeowners",
      "Interested in savings"
    ]);
    setProductContext((prev) => ({
      ...prev,
      audience: "Drivers 25-65, US, recently searched for auto insurance"
    }));
    await sleep(1000);

    // 6) Simulate clicking "Generate variants" → start Step 2
    setLoading(true);
    startProgress(5);
    window.setTimeout(() => {
      const mockVariants: Variant[] = [
        {
          headline: "Save 20% on Auto Insurance",
          primaryText: "Drive with confidence and keep more in your pocket. Our BFCM sale gives drivers 20% off premiums—get a fast quote and switch in minutes.",
          cta: "LEARN_MORE",
          websiteUrl: "https://autocarinsure.example.com",
          status: "review",
          imageUrl: "/AdOutput1.png"
        },
        {
          headline: "Protect Your Family & Your Wallet",
          primaryText: "Smart coverage for real life. Lock in 20% off this BFCM and enjoy top-rated support, fast claims, and peace of mind on every trip.",
          cta: "LEARN_MORE",
          websiteUrl: "https://autocarinsure.example.com",
          status: "review",
          imageUrl: "/AdOutput2.png"
        },
        {
          headline: "BFCM Auto Insurance: 20% Off",
          primaryText: "Switch in minutes and save. Bundle options, roadside assistance, and flexible plans built around your budget.",
          cta: "LEARN_MORE",
          websiteUrl: "https://autocarinsure.example.com",
          status: "review",
          imageUrl: "/AdOutput3.png"
        },
        {
          headline: "Limited-Time 20% Savings",
          primaryText: "Time is running out to lock in your 20% discount. Secure a lower rate today and start saving immediately.",
          cta: "LEARN_MORE",
          websiteUrl: "https://autocarinsure.example.com",
          status: "review",
          imageUrl: "/AdOutput4.png"
        },
        {
          headline: "Coverage Built Around You",
          primaryText: "From basic to comprehensive protection—find the plan that fits your life and save 20% this season.",
          cta: "LEARN_MORE",
          websiteUrl: "https://autocarinsure.example.com",
          status: "review",
          imageUrl: "/AdOutput5.png"
        }
      ];
      setVariants(mockVariants);
      stopProgress();
      setLoading(false);
      toast.success("Mock data loaded");
    }, 3500);
  }

  async function onPublish() {
    if (approved.length === 0) {
      toast.info("Approve at least one variant before publishing");
      return;
    }
    try {
      // Platform-specific publish logic
      const publishEndpoint = adPlatform === 'facebook' || adPlatform === 'instagram'
        ? 'metaads-publish'
        : adPlatform === 'tiktok'
        ? 'tiktok-publish'
        : adPlatform === 'youtube'
        ? 'youtube-publish'
        : adPlatform === 'google'
        ? 'google-ads-publish'
        : adPlatform === 'linkedin'
        ? 'linkedin-publish'
        : 'metaads-publish'; // Default fallback

      const payload = {
        platform: adPlatform,
        accountId: "ACT_ID_HERE",
        pageId: adPlatform === 'facebook' || adPlatform === 'instagram' ? "PAGE_ID_HERE" : undefined,
        campaign: {
          name: campaignName || "AdCreator Campaign",
          objective: "CONVERSIONS"
        },
        adset: {
          name: adsetName || "AdCreator Set",
          optimization_goal: "LINK_CLICKS",
          billing_event: "IMPRESSIONS",
          bid_amount: 50
        },
        creatives: approved.map(a => ({
          headline: a.headline,
          primaryText: a.primaryText,
          cta: a.cta ?? "LEARN_MORE",
          websiteUrl: a.websiteUrl ?? productContext.websiteUrl,
          imageUrl: a.imageUrl,
          assetRefs: []
        })),
        dryRun: true
      };

      // Only call metaads-publish for now (other platforms can be implemented later)
      if (adPlatform === 'facebook' || adPlatform === 'instagram') {
        const r = await fetch(`${API_BASE}/metaads-publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await r.json();
        if (data?.error) throw new Error(data.error);
        toast.success("Publish request prepared (dry run). Configure COMPOSIO_PROXY_URL to execute.");
      } else {
        toast.info(`Publishing to ${adPlatform} will be available soon. Campaign data saved.`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Publish failed");
    }
  }

  async function askAIUpdate(target: Variant, instruction: string): Promise<Variant | null> {
    try {
      const body = {
        productContext: { ...productContext, audience: audienceChips.join(", "), instruction, current: target },
        winningExamples: winningExamples.split("\n").filter(Boolean),
        numVariants: 1
      };
      const r = await fetch(`${API_BASE}/generate-copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await r.json();
      const v = (data?.variants ?? [])[0];
      if (!v) return null;
      return {
        headline: v.headline ?? target.headline,
        primaryText: v.primaryText ?? target.primaryText,
        cta: v.cta ?? target.cta,
        websiteUrl: v.websiteUrl ?? target.websiteUrl,
        rationale: v.rationale ?? target.rationale,
        status: target.status,
        imageUrl: target.imageUrl
      } as Variant;
    } catch (e) {
      console.error(e);
      toast.error("AI update failed");
      return null;
    }
  }

  async function retryImage(target: Variant): Promise<string | null> {
    try {
      toast.message("Regenerating image...");
      const imageResp = await fetch(`${API_BASE}/generate-ad-images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignContext: {
            brand: productContext.brand,
            offer: productContext.offer,
            audience: audienceChips.join(", ") || productContext.audience,
            platform: adPlatform,
          },
          adCopy: {
            headline: target.headline,
            primaryText: target.primaryText,
          },
          numImages: 1,
          existingImageUrl: target.imageUrl, // Signal this is a retry
        })
      });
      const imageData = await imageResp.json();
      const imageUrl = imageData?.images?.[0]?.imageUrl;
      if (imageUrl) {
        toast.success("Image regenerated!");
        return imageUrl;
      }
      toast.error("Failed to generate new image");
      return null;
    } catch (e) {
      console.error(e);
      toast.error("Image regeneration failed");
      return null;
    }
  }

  useEffect(() => {
    fetchDriveImages();
    return () => stopProgress();
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AdvertisingSidebar />

      <main className="flex-1 p-6 lg:p-8">
        {/* Preview Lightbox */}
        <LightboxPreview open={previewOpen} onOpenChange={setPreviewOpen} url={previewUrl} />

        {/* Knowledge Base Browser */}
        <KnowledgeBaseBrowser
          open={kbBrowserOpen}
          onOpenChange={setKbBrowserOpen}
          clientId={clientId}
          categoryFilter={["winning_ad", "brand_asset", "playbook", "script", "image"]}
          maxSelect={5}
          onConfirm={(items) => setKbSelectedItems(items)}
          title="Select Assets from Knowledge Base"
          description="Choose winning ads, brand assets, or playbooks to inform your ad generation."
        />

        {/* Publish modal */}
        <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {publishPhase === "form"
                  ? "Select destination in your ad account"
                  : publishPhase === "sending"
                  ? "Sending to ad account…"
                  : publishPhase === "submittedApproval"
                  ? "Submitted for approval"
                  : "Your campaign is on its way"}
              </DialogTitle>
            </DialogHeader>
            {publishPhase === "form" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Select Your Ad Account</label>
                  <Select
                    value={selectedAdAccount}
                    onValueChange={(v) => {
                      setSelectedAdAccount(v);
                      setCampaignConfirmed(false);
                      setAdsetConfirmed(false);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client-1">Client Name — Account 1</SelectItem>
                      <SelectItem value="client-2">Client Name — Account 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedAdAccount && (
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Campaign name</label>
                    {campaignConfirmed ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">“{campaignName}”</span>
                        <Button variant="ghost" size="sm" onClick={() => setCampaignConfirmed(false)}>Edit</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Enter campaign name" />
                        <Button disabled={!campaignName.trim()} onClick={() => setCampaignConfirmed(true)} title="Confirm campaign name"><Check className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>
                )}

                {selectedAdAccount && campaignConfirmed && (
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Ad set name</label>
                    {adsetConfirmed ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">“{adsetName}”</span>
                        <Button variant="ghost" size="sm" onClick={() => setAdsetConfirmed(false)}>Edit</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input value={adsetName} onChange={(e) => setAdsetName(e.target.value)} placeholder="Enter ad set name" />
                        <Button disabled={!adsetName.trim()} onClick={() => setAdsetConfirmed(true)} title="Confirm ad set name"><Check className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>
                )}

                {selectedAdAccount && campaignConfirmed && adsetConfirmed && (
                  <div className="flex justify-end">
                    <Button onClick={() => { setPublishPhase("sending"); setTimeout(() => setPublishPhase("done"), 1800); }}>Send To Ad Account</Button>
                  </div>
                )}
              </div>
            ) : publishPhase === "sending" ? (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="text-sm text-muted-foreground">Please wait while we save and publish your ads.</div>
              </div>
            ) : publishPhase === "submittedApproval" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <div className="font-medium">Submitted for approval (mock)</div>
                </div>
                <div className="text-sm text-muted-foreground">We’ll notify you if any changes are requested.</div>
                <div className="flex justify-end">
                  <Button onClick={() => setPublishOpen(false)}>Close</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">You can move on to another task.</div>
                <div className="text-sm">
                  <div className="text-foreground">Your ad is now available to the Ad AI CMO and will be tracked in Campaign Manager.</div>
                </div>
                <div className="grid gap-2">
                  <a href="#" className="inline-flex items-center gap-2 text-sm underline hover:no-underline">
                    <Bot className="h-4 w-4" />
                    Open Ad AI CMO
                    <ExternalLink className="h-3 w-3 opacity-70" />
                  </a>
                  <a href="#" className="inline-flex items-center gap-2 text-sm underline hover:no-underline">
                    <BarChart3 className="h-4 w-4" />
                    View in Campaign Manager
                    <ExternalLink className="h-3 w-3 opacity-70" />
                  </a>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => toast.message("Progress opened (mock)")}>Check progress</Button>
                  <Button onClick={() => { setPublishOpen(false); setShowSchedule(true); setPublishFinalized(true); }}>Next</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Ad Creator</h1>
          <p className="text-muted-foreground">Generate, review, and publish ads for {adPlatform === 'facebook' ? 'Facebook/Meta' : adPlatform === 'tiktok' ? 'TikTok' : adPlatform === 'youtube' ? 'YouTube' : adPlatform === 'google' ? 'Google' : adPlatform === 'instagram' ? 'Instagram' : adPlatform === 'linkedin' ? 'LinkedIn' : 'multiple platforms'} - Client: {clientId}</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-1 relative">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="text-primary">①</span>
                <CardTitle>Step 1 · Add creatives & inputs</CardTitle>
              </div>
              <Button title="Run mock" variant="ghost" size="icon" className="absolute right-3 top-3" onClick={runMock}>
                <Star className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[70vh] overflow-auto pr-1 scroll-dark">
              <div>
                <label className="text-sm text-muted-foreground">Ad Platform</label>
                <Select value={adPlatform} onValueChange={setAdPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook / Meta Ads</SelectItem>
                    <SelectItem value="tiktok">TikTok Ads</SelectItem>
                    <SelectItem value="youtube">YouTube Ads</SelectItem>
                    <SelectItem value="google">Google Ads</SelectItem>
                    <SelectItem value="instagram">Instagram Ads</SelectItem>
                    <SelectItem value="linkedin">LinkedIn Ads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Winning ad URLs or notes (one per line)</label>
                <Textarea value={winningExamples} onChange={(e) => setWinningExamples(e.target.value)} rows={4} placeholder="https://www.facebook.com/ads/library/?id=..." />
              </div>
              <div>
                <div className="mb-2 text-sm text-muted-foreground">Creatives</div>
                <div className="space-y-2 max-h-60 overflow-auto pr-1 scroll-dark">
                  {assets?.slice(0, 50).map((f: Asset) => {
                    const id = f.id ?? f?.files?.[0]?.id ?? String(Math.random());
                    const checked = selectedAssetIds.includes(id);
                    const thumb = f?.preview || (isImageUrl(f?.url) ? f?.url : undefined) || f?.thumbnailLink || f?.iconLink || `https://placehold.co/80x60?text=Img`;
                    return (
                      <div key={id} className="flex items-center gap-3 text-sm">
                        <label className="flex items-center gap-3 text-sm flex-1">
                          <input type="checkbox" checked={checked} onChange={(e) => {
                            setSelectedAssetIds(prev => e.target.checked ? [...prev, id] : prev.filter(x => x !== id));
                          }} />
                          <img src={thumb} alt={f?.name || "asset"} className="h-10 w-14 object-cover rounded border border-border" />
                          <span className="truncate">{f?.name ?? JSON.stringify(f)}</span>
                        </label>
                        {f?.url && f.url.endsWith('.html') && (
                          <button
                            className="text-xs underline text-muted-foreground hover:text-foreground"
                            onClick={() => { setPreviewUrl(f.url as string); setPreviewOpen(true); }}
                          >
                            Preview
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex gap-2">
                  <Button variant="outline" onClick={fetchDriveImages}>Upload/Refresh</Button>
                  <Button variant="outline" onClick={loadExamples}>Load Examples</Button>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Website URL</label>
                <div className="flex items-center gap-2">
                  <Input value={productContext.websiteUrl} onChange={(e) => setProductContext({ ...productContext, websiteUrl: e.target.value })} placeholder="https://..." />
                  <Button title="Scrape site" variant="outline" onClick={handleScrape} disabled={isScraping}>
                    {isScraping ? <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Globe className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Brand</label>
                <Input value={productContext.brand} onChange={(e) => setProductContext({ ...productContext, brand: e.target.value })} placeholder="Brand name" />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Offer</label>
                <Input value={productContext.offer} onChange={(e) => setProductContext({ ...productContext, offer: e.target.value })} placeholder="Offer" />
              </div>

              {/* Knowledge Base Assets Section */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Knowledge Base Assets (optional)
                  </label>
                  <Button variant="outline" size="sm" onClick={() => setKbBrowserOpen(true)} className="gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Browse KB
                  </Button>
                </div>
                {kbSelectedItems.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-auto pr-1 scroll-dark">
                    {kbSelectedItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 text-sm bg-secondary/50 rounded-lg p-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="flex-1 truncate">{item.title}</span>
                        <span className="text-xs text-muted-foreground">{item.category.replace("_", " ")}</span>
                        <button
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => setKbSelectedItems(kbSelectedItems.filter((i) => i.id !== item.id))}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Add playbooks, winning ads, or brand assets from your Knowledge Base to inform ad generation.
                  </p>
                )}
              </div>

              

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Or, have AI Find Your Audience:</label>
                <div className="flex gap-2">
                  <Input value={audienceInput} onChange={(e) => setAudienceInput(e.target.value)} placeholder="Who are you selling to..." />
                  <Button variant="outline" onClick={mockAudienceFromAI}>AI</Button>
                  <Button variant="secondary" onClick={addAudienceChipFromInput}>Add</Button>
                </div>
                {audienceChips.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {audienceChips.map((chip) => (
                      <span key={chip} className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs">
                        {chip}
                        <button className="ml-1 text-muted-foreground hover:text-foreground" onClick={() => removeChip(chip)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Input className="w-28" type="number" min={1} max={10} value={numVariants} onChange={(e) => setNumVariants(parseInt(e.target.value || "5", 10))} />
                <Button onClick={onGenerate} disabled={loading}>{loading ? "Generating..." : "Generate variants"}</Button>
              </div>
            </CardContent>
          </Card>

          <Card className={step2Enabled ? "" : "opacity-50 pointer-events-none"}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="text-primary">②</span>
                <CardTitle>Step 2 · Set ad copy & tracking</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[70vh] overflow-auto pr-1 scroll-dark">
              {isGenerating ? (
                <Step2Loading phases={phases} phaseIndex={phaseIndex} skeletonCount={skeletonCount} builtCount={builtCount} />
              ) : variants.length === 0 ? (
                <div className="text-sm text-muted-foreground">Generate variants in Step 1 to populate the board.</div>
              ) : (
                <AdVariantList variants={variants} onChange={setVariants} onAskAIUpdate={askAIUpdate} onRetryImage={retryImage} />
              )}
            </CardContent>
          </Card>

          {/* n8n integration intentionally not used for Ad Creator per product decision. */}

          <Card className={step3Enabled ? "" : "opacity-50 pointer-events-none"}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="text-primary">③</span>
                <CardTitle>Step 3 · Publish to {adPlatform === 'facebook' ? 'Facebook/Meta' : adPlatform === 'tiktok' ? 'TikTok' : adPlatform === 'youtube' ? 'YouTube' : adPlatform === 'google' ? 'Google' : adPlatform === 'instagram' ? 'Instagram' : adPlatform === 'linkedin' ? 'LinkedIn' : 'ad platform'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[70vh] overflow-auto pr-1 scroll-dark">
              {approved.length > 0 && (
                <div className="text-sm text-muted-foreground">Approved: {approved.length}</div>
              )}
              {/* Approved variants preview */}
              <div className="space-y-4">
                {approved.map((a, i) => (
                  <div key={i} className="border border-border rounded-lg overflow-hidden">
                    <img src={a.imageUrl || `https://placehold.co/800x450?text=Ad`} className="w-full aspect-video object-cover" alt="approved ad" />
                    <div className="p-3 space-y-1">
                      <div className="font-medium">{a.headline || "Ad Variant"}</div>
                      <div className="text-sm text-muted-foreground">{a.primaryText}</div>
                      <div className="text-xs text-muted-foreground">CTA: {a.cta || "LEARN_MORE"} {a.websiteUrl ? `· ${a.websiteUrl}` : ""}</div>
                    </div>
                  </div>
                ))}
              </div>

              {!publishFinalized && (
                <div className="flex justify-center">
                  <Button onClick={() => {
                    // reset modal form
                    setSelectedAdAccount("");
                    setCampaignName("");
                    setCampaignConfirmed(false);
                    setAdsetName("");
                    setAdsetConfirmed(false);
                    setPublishOpen(true);
                    setPublishPhase("form");
                  }}>
                    Save & Publish (MOCK)
                  </Button>
                </div>
              )}

              {/* Budget & schedule inputs appear after user proceeds from modal */}
              {showSchedule && (
                <div className="mt-4 space-y-3 border-t border-border pt-4">
                  <div className="text-sm font-medium">Budget & Schedule</div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Daily budget</label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">USD</span>
                        <Input
                          type="number"
                          value={budget}
                          onChange={(e) => setBudget(parseFloat(e.target.value || "0"))}
                          className="pl-12"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Start</label>
                      <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">End (optional)</label>
                      <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                  </div>
                  {!approvalSubmitted ? (
                    <div className="flex justify-end">
                      <Button onClick={() => {
                        setApprovalSubmitted(true);
                        setPublishOpen(true);
                        setPublishPhase("submittedApproval");
                      }}>Submit for Approval</Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-muted-foreground">Status</div>
                      <div className="inline-flex items-center gap-2 rounded-md border border-border px-2 py-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                        </span>
                        <span className="text-sm text-foreground">Awaiting approval</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


{/* Lightbox for HTML creative previews */}
export function LightboxPreview({ open, onOpenChange, url }: { open: boolean; onOpenChange: (v: boolean) => void; url: string | null }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] top-[5vh] translate-y-0 p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Preview</DialogTitle>
        </DialogHeader>
        {url ? (
          <iframe src={url} className="w-full flex-1 min-h-0 border-t border-border" />
        ) : (
          <div className="p-4 text-sm text-muted-foreground">No preview</div>
        )}
      </DialogContent>
    </Dialog>
  );
}


