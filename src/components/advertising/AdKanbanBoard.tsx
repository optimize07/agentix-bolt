import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export type Variant = {
  headline?: string;
  primaryText: string;
  cta?: string;
  websiteUrl?: string;
  rationale?: string;
  status?: "review" | "needs_edits" | "approved" | "archived";
  imageUrl?: string;
};

type Props = {
  variants: Variant[];
  onChange: (v: Variant[]) => void;
  onAskAIUpdate?: (v: Variant, instruction: string) => Promise<Variant | null>;
};

export function AdKanbanBoard({ variants, onChange, onAskAIUpdate }: Props) {
  const grouped = useMemo(() => ({
    review: variants.filter(v => !v.status || v.status === "review"),
    needs_edits: variants.filter(v => v.status === "needs_edits"),
    approved: variants.filter(v => v.status === "approved"),
    archived: variants.filter(v => v.status === "archived"),
  }), [variants]);

  function setStatus(target: Variant, status: Variant["status"]) {
    const idx = variants.indexOf(target);
    if (idx >= 0) {
      const next = variants.slice();
      next[idx] = { ...next[idx], status };
      onChange(next);
    }
  }

  function removeVariant(target: Variant) {
    const idx = variants.indexOf(target);
    if (idx >= 0) {
      const next = variants.slice();
      next.splice(idx, 1);
      onChange(next);
    }
  }

  function updateVariant(target: Variant, patch: Partial<Variant>) {
    const idx = variants.indexOf(target);
    if (idx >= 0) {
      const next = variants.slice();
      next[idx] = { ...next[idx], ...patch };
      onChange(next);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Column title="Review" items={grouped.review} color="text-foreground" actions={(v) => (
        <RowActions
          v={v}
          onApprove={() => setStatus(v, "approved")}
          onNeedsEdits={() => setStatus(v, "needs_edits")}
          onArchive={() => setStatus(v, "archived")}
          onDelete={() => removeVariant(v)}
          onEdit={(patch) => updateVariant(v, patch)}
          onAsk={(instruction) => onAskAIUpdate?.(v, instruction)}
        />
      )} />

      <Column title="Needs Edits" items={grouped.needs_edits} color="text-yellow-500" actions={(v) => (
        <RowActions
          v={v}
          onApprove={() => setStatus(v, "approved")}
          onNeedsEdits={() => setStatus(v, "needs_edits")}
          onArchive={() => setStatus(v, "archived")}
          onDelete={() => removeVariant(v)}
          onEdit={(patch) => updateVariant(v, patch)}
          onAsk={(instruction) => onAskAIUpdate?.(v, instruction)}
        />
      )} />

      <Column title="Approved" items={grouped.approved} color="text-emerald-500" actions={(v) => (
        <RowActions
          v={v}
          onApprove={() => setStatus(v, "approved")}
          onNeedsEdits={() => setStatus(v, "needs_edits")}
          onArchive={() => setStatus(v, "archived")}
          onDelete={() => removeVariant(v)}
          onEdit={(patch) => updateVariant(v, patch)}
          onAsk={(instruction) => onAskAIUpdate?.(v, instruction)}
        />
      )} />

      <Column title="Archived" items={grouped.archived} color="text-muted-foreground" actions={(v) => (
        <RowActions
          v={v}
          onApprove={() => setStatus(v, "approved")}
          onNeedsEdits={() => setStatus(v, "needs_edits")}
          onArchive={() => setStatus(v, "archived")}
          onDelete={() => removeVariant(v)}
          onEdit={(patch) => updateVariant(v, patch)}
          onAsk={(instruction) => onAskAIUpdate?.(v, instruction)}
        />
      )} />
    </div>
  );
}

function Column({ title, items, color, actions }: { title: string; items: Variant[]; color: string; actions: (v: Variant) => JSX.Element }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <span className={`text-xs ${color}`}>{items.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((v, i) => (
          <Card key={i} className="border-border">
            <CardContent className="pt-4 space-y-3">
              {v.imageUrl && (
                <img src={v.imageUrl} alt={v.headline || "ad"} className="w-full h-36 object-cover rounded-md border border-border" />
              )}
              <div className="text-sm font-medium">{v.headline || "Ad Variant"}</div>
              <div className="text-sm whitespace-pre-wrap text-muted-foreground">{v.primaryText}</div>
              <div className="text-xs text-muted-foreground">CTA: {v.cta || "LEARN_MORE"} {v.websiteUrl ? `· ${v.websiteUrl}` : ""}</div>
              <div className="flex gap-2 flex-wrap">
                {actions(v)}
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}

function RowActions({
  v,
  onApprove,
  onNeedsEdits,
  onArchive,
  onDelete,
  onEdit,
  onAsk,
}: {
  v: Variant;
  onApprove: () => void;
  onNeedsEdits: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onEdit: (patch: Partial<Variant>) => void;
  onAsk?: (instruction: string) => Promise<Variant | null> | undefined;
}) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openAsk, setOpenAsk] = useState(false);
  const [tmp, setTmp] = useState<Variant>(v);
  const [instruction, setInstruction] = useState("");
  const [loadingAsk, setLoadingAsk] = useState(false);

  return (
    <>
      <Dialog open={openView} onOpenChange={setOpenView}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">View</Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{v.headline || "Ad Variant"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {v.imageUrl && <img src={v.imageUrl} alt="ad" className="w-full max-h-[300px] object-cover rounded-md border border-border" />}
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Primary text</div>
              <div className="text-sm whitespace-pre-wrap">{v.primaryText}</div>
            </div>
            <div className="text-xs text-muted-foreground">CTA: {v.cta || "LEARN_MORE"} {v.websiteUrl ? `· ${v.websiteUrl}` : ""}</div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={() => { onApprove(); setOpenView(false); }}>Approve</Button>
              <Button size="sm" variant="outline" onClick={() => { onNeedsEdits(); setOpenView(false); }}>Needs Edits</Button>
              <Button size="sm" variant="ghost" onClick={() => { onArchive(); setOpenView(false); }}>Archive</Button>
              <Button size="sm" variant="destructive" onClick={() => { onDelete(); setOpenView(false); }}>Delete</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">Edit</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Variant</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Headline" value={tmp.headline || ""} onChange={(e) => setTmp({ ...tmp, headline: e.target.value })} />
            <Textarea rows={6} placeholder="Primary text" value={tmp.primaryText} onChange={(e) => setTmp({ ...tmp, primaryText: e.target.value })} />
            <Input placeholder="CTA (LEARN_MORE)" value={tmp.cta || ""} onChange={(e) => setTmp({ ...tmp, cta: e.target.value })} />
            <Input placeholder="Website URL" value={tmp.websiteUrl || ""} onChange={(e) => setTmp({ ...tmp, websiteUrl: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpenEdit(false)}>Cancel</Button>
              <Button onClick={() => { onEdit(tmp); setOpenEdit(false); }}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {onAsk && (
        <Dialog open={openAsk} onOpenChange={setOpenAsk}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">Ask AI Update</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ask AI to update this variant</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Textarea rows={5} placeholder="E.g., make hook more emotional and highlight the 30-day guarantee" value={instruction} onChange={(e) => setInstruction(e.target.value)} />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpenAsk(false)}>Cancel</Button>
                <Button disabled={loadingAsk} onClick={async () => {
                  setLoadingAsk(true);
                  try {
                    const res = await onAsk(instruction);
                    if (res) onEdit(res);
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

      <Button size="sm" onClick={onApprove}>Approve</Button>
      <Button size="sm" variant="outline" onClick={onNeedsEdits}>Decline</Button>
      <Button size="sm" variant="ghost" onClick={onArchive}>Archive</Button>
      <Button size="sm" variant="ghost" onClick={onDelete}>Delete</Button>
    </>
  );
}


