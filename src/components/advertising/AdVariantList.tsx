import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, Pencil, Archive, Trash2, Wand2, AlertTriangle, Image as ImageIcon, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { Variant } from "./AdKanbanBoard";

export function AdVariantList({
  variants,
  onChange,
  onAskAIUpdate,
  onRetryImage,
}: {
  variants: Variant[];
  onChange: (v: Variant[]) => void;
  onAskAIUpdate?: (v: Variant, instruction: string) => Promise<Variant | null>;
  onRetryImage?: (v: Variant) => Promise<string | null>;
}) {
  function mutate(target: Variant, patch: Partial<Variant>) {
    const idx = variants.indexOf(target);
    if (idx >= 0) {
      const next = variants.slice();
      next[idx] = { ...next[idx], ...patch };
      onChange(next);
    }
  }
  function remove(target: Variant) {
    const idx = variants.indexOf(target);
    if (idx >= 0) {
      const next = variants.slice();
      next.splice(idx, 1);
      onChange(next);
    }
  }

  return (
    <div className="space-y-4">
      {variants.map((v, i) => (
        <Row key={i} v={v} onMutate={mutate} onRemove={remove} onAskAIUpdate={onAskAIUpdate} onRetryImage={onRetryImage} />
      ))}
    </div>
  );
}

function Row({
  v,
  onMutate,
  onRemove,
  onAskAIUpdate,
  onRetryImage,
}: {
  v: Variant;
  onMutate: (v: Variant, patch: Partial<Variant>) => void;
  onRemove: (v: Variant) => void;
  onAskAIUpdate?: (v: Variant, instruction: string) => Promise<Variant | null>;
  onRetryImage?: (v: Variant) => Promise<string | null>;
}) {
  const [openEdit, setOpenEdit] = useState(false);
  const [tmp, setTmp] = useState<Variant>(v);
  const [openAsk, setOpenAsk] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [loadingAsk, setLoadingAsk] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openArchive, setOpenArchive] = useState(false);
  const [retryingImage, setRetryingImage] = useState(false);

  const statusColor: Record<string, string> = {
    review: "bg-zinc-700",
    "needs_edits": "bg-amber-600",
    approved: "bg-emerald-600",
    archived: "bg-zinc-600",
  };

  return (
    <Card>
      <CardContent className="p-0">
        {/* Full-width media with retry button */}
        <div className="relative group">
          <img src={v.imageUrl || `https://placehold.co/800x450?text=Ad`} alt="ad" className="w-full object-cover rounded-t-md border-b border-border aspect-video" />
          {onRetryImage && (
            <button
              onClick={async () => {
                setRetryingImage(true);
                try {
                  const newImageUrl = await onRetryImage(v);
                  if (newImageUrl) {
                    onMutate(v, { imageUrl: newImageUrl });
                  }
                } finally {
                  setRetryingImage(false);
                }
              }}
              disabled={retryingImage}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              title="Regenerate image"
            >
              <RefreshCw className={`h-4 w-4 ${retryingImage ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
        {/* Body */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Badge className={statusColor[v.status || "review"]}>{v.status || "review"}</Badge>
            <div className="font-medium truncate">{v.headline || "Ad Variant"}</div>
          </div>
          <div className="text-sm text-muted-foreground">{v.primaryText}</div>
          <div className="text-xs text-muted-foreground">CTA: {v.cta || "LEARN_MORE"} {v.websiteUrl ? `· ${v.websiteUrl}` : ""}</div>
        </div>
        {/* Icon-only actions */}
        <TooltipProvider>
          {/* Row 1: Approve, Ask AI, Needs Edit, Edit */}
          <div className="px-4 flex items-center justify-between gap-2 pb-2">
            <div className="flex items-center gap-2">
              <Tooltip><TooltipTrigger asChild><Button size="icon" onClick={() => onMutate(v, { status: "approved" })}><Check className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Approve</TooltipContent></Tooltip>
              {onAskAIUpdate && (
                <Dialog open={openAsk} onOpenChange={setOpenAsk}>
                  <Tooltip><TooltipTrigger asChild><DialogTrigger asChild><Button size="icon" variant="outline"><Wand2 className="h-4 w-4" /></Button></DialogTrigger></TooltipTrigger><TooltipContent>Ask AI</TooltipContent></Tooltip>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Ask AI to update this variant</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <Textarea rows={5} placeholder="E.g., make hook more emotional and highlight the 30-day guarantee" value={instruction} onChange={(e) => setInstruction(e.target.value)} />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setOpenAsk(false)}>Cancel</Button>
                        <Button disabled={loadingAsk} onClick={async () => {
                          setLoadingAsk(true);
                          try {
                            const res = await onAskAIUpdate(v, instruction);
                            if (res) onMutate(v, res);
                            setOpenAsk(false);
                          } finally {
                            setLoadingAsk(false);
                          }
                        }}>{loadingAsk ? "Thinking..." : "Apply"}</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <Tooltip><TooltipTrigger asChild><Button size="icon" variant="outline" onClick={() => onMutate(v, { status: "needs_edits" })}><AlertTriangle className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Needs Edits</TooltipContent></Tooltip>
              <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                <Tooltip><TooltipTrigger asChild><DialogTrigger asChild><Button size="icon" variant="outline"><Pencil className="h-4 w-4" /></Button></DialogTrigger></TooltipTrigger><TooltipContent>Edit</TooltipContent></Tooltip>
                <DialogContent>
                  <DialogHeader><DialogTitle>Edit Variant</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    {/* Image with hover pencil to upload */}
                    <div className="relative group">
                      <img src={tmp.imageUrl || v.imageUrl || `https://placehold.co/800x450?text=Ad`} alt="ad" className="w-full aspect-video object-cover rounded-md border border-border" />
                      <label className="absolute top-2 right-2 inline-flex items-center justify-center rounded-md bg-black/50 text-white p-1 opacity-0 group-hover:opacity-100 cursor-pointer">
                        <ImageIcon className="h-4 w-4" />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setTmp({ ...tmp, imageUrl: url });
                          }
                        }} />
                      </label>
                    </div>
                    <Input placeholder="Headline" value={tmp.headline || ""} onChange={(e) => setTmp({ ...tmp, headline: e.target.value })} />
                    <Textarea rows={6} placeholder="Primary text" value={tmp.primaryText} onChange={(e) => setTmp({ ...tmp, primaryText: e.target.value })} />
                    <Input placeholder="CTA (LEARN_MORE)" value={tmp.cta || ""} onChange={(e) => setTmp({ ...tmp, cta: e.target.value })} />
                    <Input placeholder="Website URL" value={tmp.websiteUrl || ""} onChange={(e) => setTmp({ ...tmp, websiteUrl: e.target.value })} />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setOpenEdit(false)}>Cancel</Button>
                      <Button onClick={() => { onMutate(v, tmp); setOpenEdit(false); }}>Save</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          {/* Row 2: Delete, Archive right-aligned */}
          <div className="px-4 pb-4 flex items-center gap-2 justify-end">
            <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="destructive"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this variant?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onRemove(v)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={openArchive} onOpenChange={setOpenArchive}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost"><Archive className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Archive</TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive this variant?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You can unarchive later by changing the status.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onMutate(v, { status: "archived" })}>Archive</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}


