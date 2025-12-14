import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  Globe,
  Edit,
  Trash2,
  Loader2,
  MoreVertical,
  UserPlus,
  ToggleLeft,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  RefreshCw,
  Users,
  Settings2,
} from "lucide-react";
import { listClients, createClient, deleteClient, type Client } from "@/integrations/clients/api";
import {
  listFeatureDefinitions,
  listClientToggles,
  setClientToggle,
  type FeatureDefinition,
  type ClientFeatureToggle,
} from "@/integrations/feature-toggles/api";
import {
  listClientInvitations,
  createInvitation,
  revokeInvitation,
  getInviteUrl,
  formatExpiresAt,
  type ClientInvitation,
  type InvitationRole,
} from "@/integrations/invitations/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listProjects } from "@/integrations/projects";
import { Textarea } from "@/components/ui/textarea";

export default function AdminClients() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [projectCounts, setProjectCounts] = useState<Record<string, number>>({});

  // Create client form state
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newWebsite, setNewWebsite] = useState("");

  // Edit client state
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [features, setFeatures] = useState<FeatureDefinition[]>([]);
  const [clientToggles, setClientToggles] = useState<ClientFeatureToggle[]>([]);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [savingToggle, setSavingToggle] = useState<string | null>(null);

  // Invite state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteClientId, setInviteClientId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InvitationRole>("member");
  const [inviteMessage, setInviteMessage] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [invitations, setInvitations] = useState<ClientInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  useEffect(() => {
    loadClients();
    loadFeatureDefinitions();
  }, []);

  useEffect(() => {
    loadProjectCounts();
  }, [clients]);

  async function loadClients() {
    setLoading(true);
    try {
      const data = await listClients();
      setClients(data);
    } catch (e) {
      console.error("Failed to load clients:", e);
      toast({ title: "Error", description: "Failed to load clients", variant: "destructive" });
      setClients([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadFeatureDefinitions() {
    try {
      const data = await listFeatureDefinitions();
      setFeatures(data);
    } catch (e) {
      console.error("Failed to load features:", e);
    }
  }

  async function loadProjectCounts() {
    const counts: Record<string, number> = {};
    for (const client of clients) {
      try {
        const projects = await listProjects(client.slug);
        counts[client.slug] = projects.length;
      } catch (e) {
        counts[client.slug] = 0;
      }
    }
    setProjectCounts(counts);
  }

  async function loadClientToggles(clientId: string) {
    setLoadingFeatures(true);
    try {
      const toggles = await listClientToggles(clientId);
      setClientToggles(toggles);
    } catch (e) {
      console.error("Failed to load client toggles:", e);
      setClientToggles([]);
    } finally {
      setLoadingFeatures(false);
    }
  }

  async function loadClientInvitations(clientId: string) {
    setLoadingInvitations(true);
    try {
      const data = await listClientInvitations(clientId);
      setInvitations(data);
    } catch (e) {
      console.error("Failed to load invitations:", e);
      setInvitations([]);
    } finally {
      setLoadingInvitations(false);
    }
  }

  async function handleCreateClient() {
    if (!newSlug || !newName) {
      toast({ title: "Missing fields", description: "Slug and name are required", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      await createClient({
        slug: newSlug,
        name: newName,
        type: newType || undefined,
        description: newDescription || undefined,
        contact_email: newEmail || undefined,
        contact_phone: newPhone || undefined,
        website_url: newWebsite || undefined,
      });
      toast({ title: "Client Created", description: `${newName} has been added.` });
      setCreateOpen(false);
      resetForm();
      loadClients();
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Error",
        description: e?.message || "Failed to create client",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteClient(client: Client) {
    if (!confirm(`Are you sure you want to delete ${client.name}? This cannot be undone.`)) return;
    try {
      await deleteClient(client.id);
      toast({ title: "Client Deleted", description: `${client.name} has been removed.` });
      loadClients();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to delete client", variant: "destructive" });
    }
  }

  async function handleToggleFeature(featureKey: string, enabled: boolean | null) {
    if (!editingClient) return;
    setSavingToggle(featureKey);
    try {
      await setClientToggle(editingClient.id, featureKey, enabled);
      
      // Update local state
      if (enabled === null) {
        setClientToggles(prev => prev.filter(t => t.feature_key !== featureKey));
      } else {
        setClientToggles(prev => {
          const existing = prev.find(t => t.feature_key === featureKey);
          if (existing) {
            return prev.map(t => t.feature_key === featureKey ? { ...t, enabled } : t);
          }
          return [...prev, {
            id: crypto.randomUUID(),
            client_id: editingClient.id,
            feature_key: featureKey,
            enabled,
            updated_by: null,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          }];
        });
      }
      
      toast({
        title: enabled === null ? "Reset to Default" : enabled ? "Feature Enabled" : "Feature Disabled",
        description: `${featureKey} has been updated for ${editingClient.name}.`,
      });
    } catch (e) {
      console.error("Failed to update toggle:", e);
      toast({ title: "Error", description: "Failed to update feature toggle", variant: "destructive" });
    } finally {
      setSavingToggle(null);
    }
  }

  async function handleSendInvite() {
    if (!inviteClientId || !inviteEmail) return;
    setSendingInvite(true);
    try {
      const result = await createInvitation(inviteClientId, inviteEmail, inviteRole, inviteMessage || undefined);
      if (result.success) {
        toast({
          title: "Invitation Sent",
          description: `Invitation sent to ${inviteEmail}`,
        });
        setInviteOpen(false);
        setInviteEmail("");
        setInviteRole("member");
        setInviteMessage("");
        
        // Reload invitations if we're viewing this client
        if (editingClient?.id === inviteClientId) {
          loadClientInvitations(inviteClientId);
        }
      } else {
        toast({
          title: "Failed to Send",
          description: result.error || "Could not create invitation",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      console.error("Failed to send invite:", e);
      toast({ title: "Error", description: e?.message || "Failed to send invitation", variant: "destructive" });
    } finally {
      setSendingInvite(false);
    }
  }

  async function handleRevokeInvitation(invitationId: string) {
    try {
      await revokeInvitation(invitationId);
      toast({ title: "Invitation Revoked" });
      if (editingClient) {
        loadClientInvitations(editingClient.id);
      }
    } catch (e) {
      console.error("Failed to revoke invitation:", e);
      toast({ title: "Error", description: "Failed to revoke invitation", variant: "destructive" });
    }
  }

  function copyInviteLink(token: string) {
    navigator.clipboard.writeText(getInviteUrl(token));
    toast({ title: "Link Copied", description: "Invitation link copied to clipboard" });
  }

  function openEditClient(client: Client) {
    setEditingClient(client);
    loadClientToggles(client.id);
    loadClientInvitations(client.id);
  }

  function openInviteDialog(client: Client) {
    setInviteClientId(client.id);
    setInviteOpen(true);
  }

  function resetForm() {
    setNewSlug("");
    setNewName("");
    setNewType("");
    setNewDescription("");
    setNewEmail("");
    setNewPhone("");
    setNewWebsite("");
  }

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.type && c.type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get toggle state for a feature
  function getToggleState(featureKey: string): boolean | null {
    const toggle = clientToggles.find(t => t.feature_key === featureKey);
    return toggle?.enabled ?? null;
  }

  // Group features by category
  const departmentFeatures = features.filter(f => f.category === "department");
  const coreFeatures = features.filter(f => f.category === "feature" && !f.parent_key);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--page-bg)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-border" style={{ background: 'var(--page-bg)' }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Client Management</h1>
                <p className="text-sm text-muted-foreground">
                  Manage all agency clients, their details, features, and team access
                </p>
              </div>
              <Button className="gap-2" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                New Client
              </Button>
            </div>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                className="pl-10 bg-sidebar border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {searchQuery ? "No clients found" : "No Clients Yet"}
              </h2>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Create your first client to get started."}
              </p>
              {!searchQuery && (
                <Button onClick={() => setCreateOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Client
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((client) => (
                <Card
                  key={client.id}
                  className="border border-border bg-card p-5 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{client.name}</h3>
                      {client.type && (
                        <Badge variant="secondary" className="text-xs">
                          {client.type}
                        </Badge>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/client/${client.slug}`)}>
                          <Globe className="h-4 w-4 mr-2" />
                          View Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditClient(client)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Client
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openInviteDialog(client)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteClient(client)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {client.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {client.description}
                    </p>
                  )}

                  <div className="space-y-2 text-xs text-muted-foreground">
                    {client.contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{client.contact_email}</span>
                      </div>
                    )}
                    {client.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span>{client.contact_phone}</span>
                      </div>
                    )}
                    {client.website_url && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        <a
                          href={client.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate"
                        >
                          {client.website_url}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {projectCounts[client.slug] || 0} Projects
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openInviteDialog(client)}
                        className="h-7 px-2"
                      >
                        <UserPlus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/client/${client.slug}`)}
                        className="h-7"
                      >
                        View →
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Client Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input
                  placeholder="techstart-solutions"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                />
                <p className="text-xs text-muted-foreground">URL-friendly identifier</p>
              </div>
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  placeholder="TechStart Solutions"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Type/Industry</Label>
              <Input
                placeholder="B2B SaaS"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Brief description of the client"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  placeholder="contact@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input
                  placeholder="+1 (555) 123-4567"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input
                type="url"
                placeholder="https://example.com"
                value={newWebsite}
                onChange={(e) => setNewWebsite(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreateClient} disabled={!newSlug || !newName || creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Client"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {editingClient?.name}
              </div>
            </DialogTitle>
            <DialogDescription>
              Configure features and manage team access for this client
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="features" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="features" className="gap-2">
                <ToggleLeft className="h-4 w-4" />
                Feature Toggles
              </TabsTrigger>
              <TabsTrigger value="team" className="gap-2">
                <Users className="h-4 w-4" />
                Team & Invites
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="features" className="mt-4">
              {loadingFeatures ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-6">
                    {/* Departments */}
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Departments
                      </h4>
                      <div className="space-y-2">
                        {departmentFeatures.map((feature) => {
                          const toggleState = getToggleState(feature.key);
                          const isOverridden = toggleState !== null;
                          const effectiveState = toggleState ?? feature.default_enabled;
                          
                          return (
                            <div
                              key={feature.key}
                              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{feature.name}</span>
                                  {isOverridden && (
                                    <Badge variant="outline" className="text-xs">
                                      Overridden
                                    </Badge>
                                  )}
                                </div>
                                {feature.description && (
                                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {isOverridden && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => handleToggleFeature(feature.key, null)}
                                  >
                                    Reset
                                  </Button>
                                )}
                                <Switch
                                  checked={effectiveState}
                                  onCheckedChange={(checked) => handleToggleFeature(feature.key, checked)}
                                  disabled={savingToggle === feature.key}
                                />
                                {savingToggle === feature.key && (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Core Features */}
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        Core Features
                      </h4>
                      <div className="space-y-2">
                        {coreFeatures.map((feature) => {
                          const toggleState = getToggleState(feature.key);
                          const isOverridden = toggleState !== null;
                          const effectiveState = toggleState ?? feature.default_enabled;
                          
                          return (
                            <div
                              key={feature.key}
                              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{feature.name}</span>
                                  {isOverridden && (
                                    <Badge variant="outline" className="text-xs">
                                      Overridden
                                    </Badge>
                                  )}
                                </div>
                                {feature.description && (
                                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {isOverridden && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => handleToggleFeature(feature.key, null)}
                                  >
                                    Reset
                                  </Button>
                                )}
                                <Switch
                                  checked={effectiveState}
                                  onCheckedChange={(checked) => handleToggleFeature(feature.key, checked)}
                                  disabled={savingToggle === feature.key}
                                />
                                {savingToggle === feature.key && (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
            
            <TabsContent value="team" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">Pending Invitations</h4>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => editingClient && openInviteDialog(editingClient)}
                  >
                    <UserPlus className="h-4 w-4" />
                    Invite User
                  </Button>
                </div>
                
                {loadingInvitations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : invitations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No invitations yet</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {invitations.map((invitation) => (
                        <div
                          key={invitation.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{invitation.email}</span>
                              <Badge
                                variant={
                                  invitation.status === "pending"
                                    ? "secondary"
                                    : invitation.status === "accepted"
                                    ? "default"
                                    : "destructive"
                                }
                                className="text-xs"
                              >
                                {invitation.status}
                              </Badge>
                              <Badge variant="outline" className="text-xs capitalize">
                                {invitation.role}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {invitation.status === "pending" 
                                ? formatExpiresAt(invitation.expires_at)
                                : invitation.status === "accepted"
                                ? `Accepted ${new Date(invitation.accepted_at!).toLocaleDateString()}`
                                : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {invitation.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => copyInviteLink(invitation.token)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleRevokeInvitation(invitation.id)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {invitation.status === "accepted" && (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite User
            </DialogTitle>
            <DialogDescription>
              Send an invitation email to add a user to this client
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as InvitationRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member - View and use features</SelectItem>
                  <SelectItem value="admin">Admin - Manage team and settings</SelectItem>
                  <SelectItem value="owner">Owner - Full control</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Personal Message (Optional)</Label>
              <Textarea
                placeholder="Add a personal message to the invitation..."
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={sendingInvite}>
              Cancel
            </Button>
            <Button onClick={handleSendInvite} disabled={!inviteEmail || sendingInvite} className="gap-2">
              {sendingInvite ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
