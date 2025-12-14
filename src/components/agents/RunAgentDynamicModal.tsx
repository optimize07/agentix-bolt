import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Check, ArrowLeft, Loader2 } from "lucide-react";
import { RuntimeField, OutputBehavior } from "@/integrations/n8n/agents";
import ReactMarkdown from "react-markdown";
import { getResultText } from "@/lib/resultText";

interface RunAgentDynamicModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  description?: string;
  fields?: RuntimeField[];
  onRun: (values: Record<string, any>) => Promise<any>;
  running?: boolean;
  outputBehavior?: OutputBehavior;
  progressNote?: string;
}

export function RunAgentDynamicModal({
  open,
  onOpenChange,
  title = "Run Agent",
  description,
  fields = [],
  onRun,
  running = false,
  outputBehavior = "modal_display",
  progressNote,
}: RunAgentDynamicModalProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [phase, setPhase] = useState<"input" | "result">("input");
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const requiredKeys = useMemo(() => (fields || []).filter((f) => f.required).map((f) => f.key), [fields]);
  const invalid = requiredKeys.some((k) => values[k] === undefined || values[k] === "");

  const handleRun = async () => {
    const response = await onRun(values);
    if (outputBehavior === "modal_display" && response) {
      setResult(response);
      setPhase("result");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setPhase("input");
      setResult(null);
      setValues({});
      setCopied(false);
    }, 200);
  };

  const handleBack = () => {
    setPhase("input");
    setResult(null);
  };

  const handleCopy = () => {
    const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderField = (f: RuntimeField) => {
    const value = values[f.key] ?? f.defaultValue ?? "";

    switch (f.type) {
      case "textarea":
        return (
          <div key={f.key} className="space-y-2">
            <Label htmlFor={f.key}>
              {f.label} {f.required && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id={f.key}
              value={value}
              onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              rows={4}
              className="resize-none"
            />
          </div>
        );

      case "select":
        return (
          <div key={f.key} className="space-y-2">
            <Label htmlFor={f.key}>
              {f.label} {f.required && <span className="text-destructive">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
            >
              <SelectTrigger id={f.key}>
                <SelectValue placeholder={f.placeholder || `Select ${f.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {(f.options || []).map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "boolean":
        return (
          <div key={f.key} className="space-y-2">
            <Label htmlFor={f.key}>
              {f.label} {f.required && <span className="text-destructive">*</span>}
            </Label>
            <Select
              value={String(value || "false")}
              onValueChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v === "true" }))}
            >
              <SelectTrigger id={f.key}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">True</SelectItem>
                <SelectItem value="false">False</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case "number":
        return (
          <div key={f.key} className="space-y-2">
            <Label htmlFor={f.key}>
              {f.label} {f.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={f.key}
              type="number"
              value={value}
              onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: Number(e.target.value) }))}
              placeholder={f.placeholder}
            />
          </div>
        );

      default: // text
        return (
          <div key={f.key} className="space-y-2">
            <Label htmlFor={f.key}>
              {f.label} {f.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={f.key}
              type="text"
              value={value}
              onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {phase === "result" && (
              <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {phase === "input" ? title : "Result"}
          </DialogTitle>
          {description && phase === "input" && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          {progressNote && phase === "input" && (
            <p className="text-xs text-muted-foreground">{progressNote}</p>
          )}
        </DialogHeader>

        {phase === "input" ? (
          <>
            <div className="flex-1 overflow-auto py-2">
              {(fields || []).length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  This agent does not require any inputs. Click Run to start.
                </div>
              ) : (
                <div className="grid gap-4">{fields.map(renderField)}</div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" className="border-border" onClick={handleClose} disabled={running}>
                Cancel
              </Button>
              <Button onClick={handleRun} disabled={running || invalid}>
                {running ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  "Run"
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <ScrollArea className="flex-1 max-h-[50vh]">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{getResultText(result)}</ReactMarkdown>
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" className="gap-2" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
