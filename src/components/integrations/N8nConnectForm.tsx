import { useEffect, useMemo, useState } from "react";
import { N8nScope, connectN8n, listN8nConnections } from "@/integrations/n8n/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function N8nConnectForm({ scope, clientId, onConnected }: { scope: N8nScope; clientId?: string; onConnected?: () => void; }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);

  const [form, setForm] = useState({
    baseUrl: "https://your-workspace.n8n.cloud",
    apiKey: "",
    label: "",
  });

  const scopeLabel = useMemo(() => (scope === "agency" ? "Agency" : "Client"), [scope]);

  const loadConnections = async () => {
    try {
      if (scope === "client") {
        // For client-level settings, also surface agency-level connections (inherited)
        const agency = await listN8nConnections({ scope: "agency" });
        const client = await listN8nConnections({ scope: "client", clientId });
        const merged = [
          ...(agency?.connections || []).map((c: any) => ({ ...c, _source: "agency" })),
          ...(client?.connections || []).map((c: any) => ({ ...c, _source: "client" })),
        ];
        setConnections(merged);
      } else {
        const { connections } = await listN8nConnections({ scope, clientId });
        setConnections((connections || []).map((c: any) => ({ ...c, _source: "agency" })));
      }
    } catch (e) {
      console.error(e);
      setConnections([]);
    }
  };

  useEffect(() => {
    loadConnections();
  }, [scope, clientId]);

  const handleConnect = async () => {
    if (!form.baseUrl || !form.apiKey) {
      toast({ title: "Missing information", description: "Base URL and API Key are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await connectN8n({
        scope,
        clientId,
        baseUrl: form.baseUrl,
        apiKey: form.apiKey,
        label: form.label || undefined,
      });

      if (res?.success) {
        toast({ title: "Connected", description: `${scopeLabel} n8n connection saved and verified.` });
        setIsOpen(false);
        setForm({ baseUrl: form.baseUrl, apiKey: "", label: "" });
        await loadConnections();
        onConnected?.();
      } else {
        toast({ title: "Connection failed", description: "Could not verify n8n instance", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to connect to n8n", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/n8n.svg" alt="n8n" className="h-6 w-11" />
          <CardTitle>n8n Integration ({scopeLabel} level)</CardTitle>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Connect n8n</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect to n8n</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Hosted URL</Label>
                <Input
                  placeholder="https://your-workspace.n8n.cloud"
                  value={form.baseUrl}
                  onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Defaults to n8n hosted. Change only if self-hosted. No trailing slash.
                </p>
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  placeholder="X-N8N-API-KEY"
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Generated in n8n: Settings → n8n API. We'll verify on save.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Label (optional)</Label>
                <Input
                  placeholder="e.g. Agency Primary n8n"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)} className="border-border">Cancel</Button>
              <Button onClick={handleConnect} disabled={loading}>
                {loading ? "Testing & Saving..." : "Test & Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {connections.length === 0 ? (
          <div className="text-sm text-muted-foreground">No connections yet.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {connections.map((c) => (
              <div key={c.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{c.label || "(unnamed connection)"}</div>
                  {c._source ? (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${c._source === 'agency' ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground/70'}`}>
                      {c._source === 'agency' ? 'Agency' : 'Client'}
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground break-all">{c.base_url}</div>
                <div className="text-xs mt-1">{c.is_active ? "Active" : "Inactive"}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


