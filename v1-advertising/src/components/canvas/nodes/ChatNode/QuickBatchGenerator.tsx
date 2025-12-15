import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ImagePlus,
  Loader2,
  Download,
  Copy,
  ArrowRight,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Eye,
  Plus,
  Palette,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { ConnectedBlock } from "./types";

interface QuickBatchGeneratorProps {
  connectedBlocks: ConnectedBlock[];
  connectedCreativeNodes?: { id: string; title?: string }[];
  onPushImageToCreative?: (imageUrl: string, targetNodeId?: string) => void;
  onCreateImageBlock?: (imageUrl: string, position?: { x: number; y: number }) => Promise<string | void>;
  nodePosition?: { x: number; y: number };
  projectId?: string;
}

interface ExtractedColor {
  hex: string;
  name: string;
  percentage?: number;
}

export function QuickBatchGenerator({
  connectedBlocks,
  connectedCreativeNodes,
  onPushImageToCreative,
  onCreateImageBlock,
  nodePosition,
  projectId,
}: QuickBatchGeneratorProps) {
  const [imageCount, setImageCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [extractedColors, setExtractedColors] = useState<ExtractedColor[]>([]);
  const [isAnalyzingColors, setIsAnalyzingColors] = useState(false);

  // Count connected context
  const totalContext = connectedBlocks.filter(
    (b) => b.type === "image" || b.type === "document" || b.type === "url" || b.type === "text"
  ).length;

  const hasCreativeNode = connectedCreativeNodes && connectedCreativeNodes.length > 0;

  // Build context from connected blocks
  const buildContext = (): string => {
    let context = "";

    for (const block of connectedBlocks) {
      if (block.type === "image") continue; // Images handled separately

      const title = block.title || "Untitled";
      context += `\n[${block.type}: ${title}]\n`;

      if (block.content) {
        context += block.content.slice(0, 2000) + "\n";
      }
      if (block.instruction_prompt) {
        context += `Instructions: ${block.instruction_prompt}\n`;
      }
    }

    return context;
  };

  // Get image URLs for style reference (supports 100+ images)
  const getImageUrls = (): string[] => {
    return connectedBlocks
      .filter((b) => b.type === "image" && (b.url || b.file_path))
      .map((b) => b.url || b.file_path || "")
      .filter(Boolean)
      .slice(0, 100); // Support up to 100 reference images
  };

  const handleGenerate = async () => {
    if (totalContext === 0) {
      toast.error("Connect some blocks first to provide context");
      return;
    }

    setIsGenerating(true);
    setProgress({ current: 0, total: imageCount });
    setGeneratedImages([]);

    const context = buildContext();
    const imageUrls = getImageUrls();
    
    console.log('[QuickBatchGenerator] Image URLs being sent:', imageUrls);

    const prompt = `CRITICAL INSTRUCTION: You MUST analyze the reference images and MATCH their EXACT visual style and color palette.

BEFORE generating, you MUST:
1. IDENTIFY the exact colors in the reference images (list each specific color you see - e.g., "burnt orange #D35400", "cream white #F5F5DC")
2. NOTE the color temperature (warm/cool), saturation levels, and dominant hues
3. ONLY use colors that appear in the reference images - DO NOT use generic corporate colors like blue or teal unless they are clearly present in the references

Reference Context (text):
${context}

${imageUrls.length > 0 ? `
REFERENCE IMAGES PROVIDED: ${imageUrls.length} image(s)
You MUST analyze these images and extract:
- Primary colors (the dominant colors - BE SPECIFIC)
- Secondary colors (supporting colors)
- Accent colors (highlights, CTAs, buttons)
- Background tones and gradients
- Overall mood, lighting style, and color temperature

STRICT COLOR MATCHING RULE: Your generated image must use ONLY colors extracted from the reference images. 
- If references show warm orange/red/yellow tones → use those warm tones
- If references show earth tones (brown, tan, beige) → use those earth tones  
- If references show cool blues/greens → only then use cool tones
- NEVER default to generic "corporate blue" or "professional teal" unless explicitly present in references
- List the colors you observe BEFORE you generate
` : "No reference images provided - use the text context to determine appropriate brand colors."}

Requirements:
- Create a visually striking, high-quality ad creative
- MATCH the EXACT brand colors and aesthetic from reference materials
- Make this variation unique while maintaining strict color consistency
- Social media ready, professional quality
- Ultra high resolution`;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/batch-generate-images`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            imageUrls,
            count: imageCount,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast.error("Rate limited - please wait a moment");
          if (errorData.images?.length) {
            setGeneratedImages(errorData.images);
            setProgress({ current: errorData.images.length, total: imageCount });
          }
          return;
        }
        if (response.status === 402) {
          toast.error("AI credits required - please add funds");
          if (errorData.images?.length) {
            setGeneratedImages(errorData.images);
            setProgress({ current: errorData.images.length, total: imageCount });
          }
          return;
        }
        throw new Error(errorData.error || `Generation failed: ${response.status}`);
      }

      const data = await response.json();
      setGeneratedImages(data.images || []);
      setProgress({ current: data.images?.length || 0, total: imageCount });
      toast.success(`Generated ${data.images?.length || 0}/${imageCount} images`);
    } catch (error: any) {
      console.error("Batch generation error:", error);
      toast.error(error.message || "Failed to generate images");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      toast.success("Image copied to clipboard");
    } catch {
      // Fallback: copy URL
      navigator.clipboard.writeText(imageUrl);
      toast.success("Image URL copied");
    }
  };

  const handleDownloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `generated-image-${index + 1}.png`;
    link.click();
  };

  const handleDownloadAll = () => {
    generatedImages.forEach((url, idx) => {
      setTimeout(() => handleDownloadImage(url, idx), idx * 200);
    });
    toast.success(`Downloading ${generatedImages.length} images`);
  };

  const handlePushAll = async () => {
    if (hasCreativeNode && onPushImageToCreative) {
      // Push to connected creative node
      const targetNode = connectedCreativeNodes![0];
      generatedImages.forEach((url) => {
        onPushImageToCreative(url, targetNode.id);
      });
      toast.success(`Pushed ${generatedImages.length} images to ${targetNode.title || "Creative"}`);
    } else if (onCreateImageBlock) {
      // Create new image blocks on canvas
      const basePos = nodePosition || { x: 100, y: 100 };
      const gridCols = 3;
      const spacing = 220;

      for (let i = 0; i < generatedImages.length; i++) {
        const col = i % gridCols;
        const row = Math.floor(i / gridCols);
        const position = {
          x: basePos.x + 450 + col * spacing,
          y: basePos.y + row * spacing,
        };
        await onCreateImageBlock(generatedImages[i], position);
      }
      toast.success(`Created ${generatedImages.length} image blocks on canvas`);
    } else {
      toast.error("No target available - connect a Creative node");
    }
  };

  const handleCreateSingleBlock = async (imageUrl: string) => {
    if (!onCreateImageBlock) {
      toast.error("Cannot create block");
      return;
    }
    const basePos = nodePosition || { x: 100, y: 100 };
    await onCreateImageBlock(imageUrl, { x: basePos.x + 450, y: basePos.y });
    toast.success("Created image block");
    setPreviewImage(null);
  };

  const clearImages = () => {
    setGeneratedImages([]);
    setProgress({ current: 0, total: 0 });
  };

  // Analyze colors from reference images using edge function
  const handleAnalyzeColors = async () => {
    const imageUrls = getImageUrls();
    if (imageUrls.length === 0) {
      toast.error("No reference images connected");
      return;
    }

    setIsAnalyzingColors(true);
    setExtractedColors([]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-colors`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageUrls }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Rate limited - please try again later");
          return;
        }
        if (response.status === 402) {
          toast.error("AI credits required - please add funds");
          return;
        }
        throw new Error("Failed to analyze colors");
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.colors && data.colors.length > 0) {
        setExtractedColors(data.colors);
        const sampledNote = data.totalCount > data.sampledCount 
          ? ` (sampled ${data.sampledCount} of ${data.totalCount} images)`
          : "";
        toast.success(`Extracted ${data.colors.length} colors${sampledNote}`);
      } else {
        throw new Error("No colors extracted");
      }
    } catch (error: any) {
      console.error("Color analysis error:", error);
      toast.error(error.message || "Failed to analyze colors");
    } finally {
      setIsAnalyzingColors(false);
    }
  };

  const referenceImages = getImageUrls();

  return (
    <>
      <div className="border-t border-border bg-muted/30">
        {/* Collapsed Header */}
        <button
          className="w-full flex items-center justify-between p-2 hover:bg-muted/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ImagePlus className="w-3.5 h-3.5" />
            <span className="font-medium">Quick Image Generator</span>
            {generatedImages.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {generatedImages.length} images
              </Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-3 pt-0 space-y-3">
            {/* No context message */}
            {totalContext === 0 && (
              <span className="text-xs text-muted-foreground">
                Connect blocks for context
              </span>
            )}

            {/* Reference Images Preview */}
            {referenceImages.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Reference Images ({referenceImages.length})
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] px-2 gap-1"
                    onClick={handleAnalyzeColors}
                    disabled={isAnalyzingColors}
                  >
                    {isAnalyzingColors ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Palette className="w-3 h-3" />
                    )}
                    {isAnalyzingColors ? "Analyzing..." : "Extract Colors"}
                  </Button>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {referenceImages.map((url, idx) => (
                    <div
                      key={idx}
                      className="flex-shrink-0 w-12 h-12 rounded border border-border overflow-hidden bg-muted"
                    >
                      <img
                        src={url}
                        alt={`Reference ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted Color Palette */}
            {extractedColors.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">
                  Extracted Color Palette
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {extractedColors.map((color, idx) => (
                    <Tooltip key={idx}>
                      <TooltipTrigger asChild>
                        <button
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-card hover:bg-muted transition-colors"
                          onClick={() => {
                            navigator.clipboard.writeText(color.hex);
                            toast.success(`Copied ${color.hex}`);
                          }}
                        >
                          <div
                            className="w-4 h-4 rounded-sm border border-border/50"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="text-[10px] font-mono">
                            {color.hex}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-medium">{color.name}</p>
                        {color.percentage && (
                          <p className="text-muted-foreground">
                            ~{color.percentage}% of image
                          </p>
                        )}
                        <p className="text-muted-foreground">Click to copy</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}

            {/* Count Selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Generate
              </span>
              <Select
                value={String(imageCount)}
                onValueChange={(v) => setImageCount(Number(v))}
                disabled={isGenerating}
              >
                <SelectTrigger className="w-16 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((n) => (
                    <SelectItem key={n} value={String(n)} className="text-xs">
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">images</span>

              <Button
                size="sm"
                className="ml-auto h-7 text-xs gap-1.5"
                onClick={handleGenerate}
                disabled={isGenerating || totalContext === 0}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {progress.current}/{progress.total}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Generate
                  </>
                )}
              </Button>
            </div>

            {/* Progress Bar */}
            {isGenerating && (
              <Progress
                value={(progress.current / progress.total) * 100}
                className="h-1.5"
              />
            )}

            {/* Generated Images Grid */}
            {generatedImages.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Generated Images ({generatedImages.length})
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] px-2"
                      onClick={handleDownloadAll}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      All
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] px-2"
                      onClick={handlePushAll}
                      disabled={!hasCreativeNode && !onCreateImageBlock}
                    >
                      <ArrowRight className="w-3 h-3 mr-1" />
                      {hasCreativeNode ? "Push All" : "Create All"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] px-2 text-destructive hover:text-destructive"
                      onClick={clearImages}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <ScrollArea className="max-h-[200px]">
                  <div className="grid grid-cols-4 gap-2">
                    {generatedImages.map((url, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-square rounded-md overflow-hidden bg-muted border border-border cursor-pointer"
                        onClick={() => setPreviewImage(url)}
                      >
                        <img
                          src={url}
                          alt={`Generated ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(url);
                            }}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyImage(url);
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadImage(url, idx);
                            }}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="space-y-4">
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-auto rounded-lg max-h-[60vh] object-contain"
              />
              <div className="flex justify-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => handleCopyImage(previewImage)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownloadImage(previewImage, 0)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                {hasCreativeNode && onPushImageToCreative ? (
                  <Button
                    onClick={() => {
                      onPushImageToCreative(previewImage, connectedCreativeNodes![0].id);
                      toast.success(`Pushed to ${connectedCreativeNodes![0].title || "Creative"}`);
                      setPreviewImage(null);
                    }}
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Push to Creative
                  </Button>
                ) : onCreateImageBlock ? (
                  <Button onClick={() => handleCreateSingleBlock(previewImage)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create as Block
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
