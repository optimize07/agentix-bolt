import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SalesSidebar } from "@/components/SalesSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Settings, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { toast } from "sonner";
import GlossaryCustomization from "@/components/sales/GlossaryCustomization";
import FormTemplatePresets from "@/components/sales/FormTemplatePresets";

interface SalesNiche {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface SalesProcess {
  id: string;
  name: string;
  slug: string;
  stages: Array<{ id: string; name: string; order: number; color: string }>;
  is_default: boolean;
  niche_id: string;
}

const SalesSettings = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data from Supabase
  const [niches, setNiches] = useState<SalesNiche[]>([]);
  const [selectedNicheId, setSelectedNicheId] = useState<string | null>(null);
  const [salesProcesses, setSalesProcesses] = useState<SalesProcess[]>([]);
  const [enabledProcessIds, setEnabledProcessIds] = useState<Set<string>>(new Set());

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load niches
        const { data: nichesData, error: nichesError } = await supabase
          .from("sales_niches")
          .select("*")
          .eq("is_system_template", true)
          .order("name");

        if (nichesError) throw nichesError;
        setNiches(nichesData || []);

        // Load client's current niche selection
        if (clientId) {
          const { data: clientData, error: clientError } = await supabase
            .from("clients")
            .select("sales_niche_id")
            .eq("id", clientId)
            .single();

          if (!clientError && clientData?.sales_niche_id) {
            setSelectedNicheId(clientData.sales_niche_id);
          } else if (nichesData && nichesData.length > 0) {
            // Default to High Ticket Sales or first niche
            const defaultNiche = nichesData.find((n) => n.slug === "high-ticket-sales") || nichesData[0];
            setSelectedNicheId(defaultNiche.id);
          }

          // Load client's enabled sales processes
          const { data: processData, error: processError } = await supabase
            .from("client_sales_processes")
            .select("sales_process_id")
            .eq("client_id", clientId)
            .eq("is_active", true);

          if (!processError && processData) {
            setEnabledProcessIds(new Set(processData.map((p) => p.sales_process_id)));
          }
        }
      } catch (error) {
        console.error("Failed to load sales settings:", error);
        toast.error("Failed to load sales settings");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [clientId]);

  // Load sales processes when niche changes
  useEffect(() => {
    const loadSalesProcesses = async () => {
      if (!selectedNicheId) {
        setSalesProcesses([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("sales_processes")
          .select("*")
          .eq("niche_id", selectedNicheId)
          .order("name");

        if (error) throw error;
        setSalesProcesses((data as SalesProcess[]) || []);
      } catch (error) {
        console.error("Failed to load sales processes:", error);
      }
    };

    loadSalesProcesses();
  }, [selectedNicheId]);

  const handleNicheChange = useCallback(
    async (nicheId: string) => {
      if (!clientId || saving) return;

      setSaving(true);
      try {
        const { error } = await supabase.from("clients").update({ sales_niche_id: nicheId }).eq("id", clientId);

        if (error) throw error;

        setSelectedNicheId(nicheId);
        toast.success("Industry updated successfully");
      } catch (error) {
        console.error("Failed to update niche:", error);
        toast.error("Failed to update industry");
      } finally {
        setSaving(false);
      }
    },
    [clientId, saving]
  );

  const handleProcessToggle = useCallback(
    async (processId: string) => {
      if (!clientId || saving) return;

      const isEnabled = enabledProcessIds.has(processId);
      setSaving(true);

      try {
        if (isEnabled) {
          // Disable
          const { error } = await supabase
            .from("client_sales_processes")
            .delete()
            .eq("client_id", clientId)
            .eq("sales_process_id", processId);

          if (error) throw error;

          setEnabledProcessIds((prev) => {
            const next = new Set(prev);
            next.delete(processId);
            return next;
          });
        } else {
          // Enable
          const { error } = await supabase.from("client_sales_processes").insert({
            client_id: clientId,
            sales_process_id: processId,
            is_active: true,
          });

          if (error) throw error;

          setEnabledProcessIds((prev) => new Set([...prev, processId]));
        }

        toast.success(isEnabled ? "Sales process disabled" : "Sales process enabled");
      } catch (error) {
        console.error("Failed to toggle sales process:", error);
        toast.error("Failed to update sales process");
      } finally {
        setSaving(false);
      }
    },
    [clientId, saving, enabledProcessIds]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen w-full" style={{ background: "var(--page-bg)" }}>
        <SalesSidebar />
        <main className="flex-1 p-6 lg:p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full" style={{ background: "var(--page-bg)" }}>
      <SalesSidebar />

      <main className="flex-1 p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Settings className="h-4 w-4" />
              Sales Settings
            </div>
            <h1 className="text-3xl font-bold text-foreground leading-tight">Configure Sales Experience</h1>
            <p className="text-sm text-muted-foreground">
              Customize terminology, forms, and sales process templates used by Sales dashboards and widgets.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate(`/client/${clientId}/sales`)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Sales
          </Button>
        </div>

        {/* Industry selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Industry &amp; Niche Configuration</CardTitle>
            <CardDescription>
              Select your organization's industry vertical to load relevant terminology
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {niches.map((niche) => {
              const isActive = selectedNicheId === niche.id;
              return (
                <Card
                  key={niche.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isActive ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => handleNicheChange(niche.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-1">{niche.name}</h4>
                        {niche.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{niche.description}</p>
                        )}
                      </div>
                      {isActive && <CheckCircle2 className="h-5 w-5 text-primary ml-2 flex-shrink-0" />}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>

        {/* Form template presets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Form Template Presets</CardTitle>
            <CardDescription>
              Toggle on the form templates you want to use as quick starting points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormTemplatePresets clientId={clientId} nicheId={selectedNicheId} />
          </CardContent>
        </Card>

        {/* Sales process models */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Sales Process Models</CardTitle>
            <CardDescription>
              Enable multiple sales processes for different departments or workflows
            </CardDescription>
          </CardHeader>
          <CardContent>
            {salesProcesses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales processes available for this niche</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {salesProcesses.map((process) => {
                  const isEnabled = enabledProcessIds.has(process.id);
                  const stages = Array.isArray(process.stages) ? process.stages : [];

                  return (
                    <Card
                      key={process.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        isEnabled ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleProcessToggle(process.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-base mb-1">{process.name}</h4>
                            <p className="text-sm text-muted-foreground">{stages.length} stages</p>
                          </div>
                          <Switch
                            checked={isEnabled}
                            onClick={(e) => e.stopPropagation()}
                            onCheckedChange={() => handleProcessToggle(process.id)}
                            className="ml-2"
                          />
                        </div>
                        {isEnabled && stages.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t">
                            {stages.slice(0, 3).map((stage) => (
                              <Badge key={stage.id} variant="secondary" className="text-xs">
                                {stage.name}
                              </Badge>
                            ))}
                            {stages.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{stages.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Terminology Quick Reference */}
        <Card className="bg-accent/30 border-accent">
          <CardHeader>
            <CardTitle className="text-lg">Understanding Your Glossary Terms</CardTitle>
            <CardDescription>
              Common terminology questions and how terms relate to each other
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">What's the difference between...</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium">Lead vs Contact</p>
                    <p className="text-muted-foreground">
                      All leads are contacts, but not all contacts are leads. A contact is anyone in your database; a
                      lead is someone who might buy.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Lead vs Prospect</p>
                    <p className="text-muted-foreground">
                      Leads are unqualified opportunities. Prospects are qualified leads you're actively working with.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Customer vs Client</p>
                    <p className="text-muted-foreground">
                      Customer is transactional. Client implies an ongoing relationship with repeat business.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Typical Contact Journey</h4>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      1
                    </Badge>
                    <span className="text-muted-foreground">Contact → Lead (shows interest)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      2
                    </Badge>
                    <span className="text-muted-foreground">Lead → Qualified Lead (meets criteria)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      3
                    </Badge>
                    <span className="text-muted-foreground">Qualified Lead → Prospect (active engagement)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      4
                    </Badge>
                    <span className="text-muted-foreground">Prospect → Customer (purchase made)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      5
                    </Badge>
                    <span className="text-muted-foreground">Customer → Client (ongoing relationship)</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Glossary customization */}
        <GlossaryCustomization clientId={clientId} nicheId={selectedNicheId} />
      </main>
    </div>
  );
};

export default SalesSettings;
