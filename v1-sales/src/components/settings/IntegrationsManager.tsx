import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plug, RefreshCw, Settings, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface IntegrationProvider {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  auth_type: string;
  config_schema: any;
}

interface OrganizationIntegration {
  id: string;
  provider_id: string;
  status: string;
  last_sync_at: string | null;
  config: any;
  provider: IntegrationProvider;
}

interface GlossaryTerm {
  id: string;
  term_key: string;
  default_label: string;
}

export const IntegrationsManager = () => {
  const { getLabel, organization } = useOrganization();
  const { toast } = useToast();
  const [providers, setProviders] = useState<IntegrationProvider[]>([]);
  const [integrations, setIntegrations] = useState<OrganizationIntegration[]>([]);
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadProviders();
    loadIntegrations();
    loadGlossaryTerms();
  }, []);

  const loadProviders = async () => {
    const { data, error } = await supabase
      .from("integration_providers")
      .select("*")
      .eq("is_active", true);

    if (error) {
      toast({ title: "Error", description: "Failed to load providers", variant: "destructive" });
      return;
    }

    setProviders(data || []);
  };

  const loadIntegrations = async () => {
    if (!organization?.id) return;

    const { data, error } = await supabase
      .from("organization_integrations")
      .select(`
        *,
        provider:integration_providers(*)
      `)
      .eq("organization_id", organization.id);

    if (error) {
      toast({ title: "Error", description: "Failed to load integrations", variant: "destructive" });
      return;
    }

    setIntegrations(data as any || []);
  };

  const loadGlossaryTerms = async () => {
    const { data, error } = await supabase
      .from("glossary_terms")
      .select("id, term_key, default_label")
      .order("term_key");

    if (error) {
      toast({ title: "Error", description: "Failed to load glossary terms", variant: "destructive" });
      return;
    }

    setGlossaryTerms(data || []);
  };

  const handleConnect = async () => {
    if (!selectedProvider || !organization?.id) return;

    setIsConnecting(true);

    try {
      // Create integration
      const { data: integration, error: integrationError } = await supabase
        .from("organization_integrations")
        .insert({
          organization_id: organization.id,
          provider_id: selectedProvider.id,
          credentials_encrypted: apiKey, // In production, encrypt this
          status: "active",
          config: {}
        })
        .select()
        .single();

      if (integrationError) throw integrationError;

      // Create field mappings
      const mappings = Object.entries(fieldMappings).map(([externalField, glossaryTermId]) => ({
        integration_id: integration.id,
        external_field_name: externalField,
        glossary_term_id: glossaryTermId,
        mapping_config: {}
      }));

      if (mappings.length > 0) {
        const { error: mappingError } = await supabase
          .from("integration_field_mappings")
          .insert(mappings);

        if (mappingError) throw mappingError;
      }

      toast({ title: "Success", description: `${selectedProvider.name} connected successfully` });
      setIsDialogOpen(false);
      setApiKey("");
      setFieldMappings({});
      loadIntegrations();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    const { error } = await supabase
      .from("organization_integrations")
      .delete()
      .eq("id", integrationId);

    if (error) {
      toast({ title: "Error", description: "Failed to disconnect", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Integration disconnected" });
    loadIntegrations();
  };

  const handleSync = async (integrationId: string) => {
    const { error } = await supabase
      .from("organization_integrations")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", integrationId);

    if (error) {
      toast({ title: "Error", description: "Sync failed", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Sync completed" });
    loadIntegrations();
  };

  const isConnected = (providerId: string) => {
    return integrations.some(i => i.provider_id === providerId && i.status === "active");
  };

  const getIntegration = (providerId: string) => {
    return integrations.find(i => i.provider_id === providerId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Connect external systems and sync data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider) => {
              const connected = isConnected(provider.id);
              const integration = getIntegration(provider.id);

              return (
                <Card key={provider.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {provider.logo_url ? (
                          <img src={provider.logo_url} alt={provider.name} className="w-10 h-10 rounded" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                            <Plug className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-base">{provider.name}</CardTitle>
                          {connected && (
                            <Badge variant="outline" className="mt-1">
                              Connected
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {connected && integration ? (
                      <>
                        {integration.last_sync_at && (
                          <p className="text-sm text-muted-foreground">
                            Last sync: {format(new Date(integration.last_sync_at), "PPp")}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSync(integration.id)}
                            className="flex-1"
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Sync Now
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDisconnect(integration.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Dialog open={isDialogOpen && selectedProvider?.id === provider.id} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setSelectedProvider(provider)}
                          >
                            <Plug className="w-4 h-4 mr-2" />
                            Connect
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Connect {provider.name}</DialogTitle>
                            <DialogDescription>
                              Configure your {provider.name} integration and map fields to your glossary
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="api-key">API Key</Label>
                              <Input
                                id="api-key"
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter API key"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Field Mapping</Label>
                              <p className="text-sm text-muted-foreground">
                                Map {provider.name} fields to your glossary terms
                              </p>
                              <div className="space-y-2">
                                {['contact_name', 'email', 'phone', 'company'].map((field) => (
                                  <div key={field} className="flex items-center gap-2">
                                    <span className="text-sm w-32">{field}</span>
                                    <Select
                                      value={fieldMappings[field] || ""}
                                      onValueChange={(value) => setFieldMappings({ ...fieldMappings, [field]: value })}
                                    >
                                      <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select glossary term" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {glossaryTerms.map((term) => (
                                          <SelectItem key={term.id} value={term.id}>
                                            {term.default_label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <Button
                              onClick={handleConnect}
                              disabled={isConnecting || !apiKey}
                              className="w-full"
                            >
                              {isConnecting ? "Connecting..." : "Connect"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
