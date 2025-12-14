import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChatSidebar } from "@/components/ChatSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Loader2,
  User,
  Users,
  Key,
  Plug,
  Mail,
  UserPlus,
  Trash2,
  Shield,
  CheckCircle2,
  AlertCircle,
  Brush,
  Bot,
} from "lucide-react";
import { ThemesSettings } from "@/components/settings/ThemesSettings";
import { useFeatureToggle } from "@/hooks/useFeatureToggle";
import { ClientSwitcher } from "@/components/ClientSwitcher";
import { ConnectionsButtons } from "@/components/advertising/ConnectionsButtons";
import { useToast } from "@/hooks/use-toast";
import { useUser, usePermissions } from "@/contexts/UserContext";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { getClient, type Client } from "@/integrations/clients/api";
import {
  getClientMembers,
  removeClientMember,
  updateClientMemberRole,
  type ClientMemberWithDetails,
  type ClientMemberRole,
} from "@/integrations/user-profiles/api";
import {
  listPendingInvitations,
  createInvitation,
  revokeInvitation,
  type ClientInvitation,
  type InvitationRole,
} from "@/integrations/invitations/api";
import { Textarea } from "@/components/ui/textarea";

const ClientSettings = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useUser();
  const { canManageClient, canInviteToClient } = usePermissions();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Team management state
  const [members, setMembers] = useState<ClientMemberWithDetails[]>([]);
  const [invitations, setInvitations] = useState<ClientInvitation[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InvitationRole>("member");
  const [inviteMessage, setInviteMessage] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const canManage = clientId ? canManageClient(clientId) : false;
  const canInvite = clientId ? canInviteToClient(clientId) : false;
  const { enabled: themeBuilderEnabled } = useFeatureToggle("feature.theme-builder");

  useEffect(() => {
    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  useEffect(() => {
    if (client?.id) {
      loadTeam();
    }
  }, [client?.id]);

  async function loadClient() {
    if (!clientId) return;
    setLoading(true);
    try {
      const data = await getClient(clientId);
      setClient(data);
    } catch (e) {
      console.error("Failed to load client:", e);
      toast({ title: "Error", description: "Failed to load client", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function loadTeam() {
    if (!client?.id) return;
    setLoadingTeam(true);
    try {
      const [membersData, invitationsData] = await Promise.all([
        getClientMembers(client.id),
        listPendingInvitations(client.id),
      ]);
      setMembers(membersData);
      setInvitations(invitationsData);
    } catch (e) {
      console.error("Failed to load team:", e);
    } finally {
      setLoadingTeam(false);
    }
  }

  async function handleInvite() {
    if (!client?.id || !inviteEmail) return;
    setSendingInvite(true);
    try {
      const result = await createInvitation(
        client.id,
        inviteEmail,
        inviteRole,
        inviteMessage || undefined
      );
      if (result.success) {
        toast({
          title: "Invitation Sent",
          description: `Invitation sent to ${inviteEmail}`,
        });
        setInviteOpen(false);
        setInviteEmail("");
        setInviteRole("member");
        setInviteMessage("");
        loadTeam();
      } else {
        toast({
          title: "Failed to Send",
          description: result.error || "Could not send invitation",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      console.error("Failed to send invite:", e);
      toast({
        title: "Error",
        description: e?.message || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setSendingInvite(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    try {
      await removeClientMember(memberId);
      toast({ title: "Member Removed" });
      loadTeam();
    } catch (e) {
      console.error("Failed to remove member:", e);
      toast({ title: "Error", description: "Failed to remove member", variant: "destructive" });
    }
  }

  async function handleChangeRole(memberId: string, newRole: ClientMemberRole) {
    try {
      await updateClientMemberRole(memberId, newRole);
      toast({ title: "Role Updated" });
      loadTeam();
    } catch (e) {
      console.error("Failed to update role:", e);
      toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
    }
  }

  async function handleRevokeInvitation(invitationId: string) {
    try {
      await revokeInvitation(invitationId);
      toast({ title: "Invitation Revoked" });
      loadTeam();
    } catch (e) {
      console.error("Failed to revoke invitation:", e);
      toast({ title: "Error", description: "Failed to revoke invitation", variant: "destructive" });
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your new passwords match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      console.error("Failed to change password:", e);
      toast({
        title: "Error",
        description: e?.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  }

  function getRoleBadgeVariant(role: string) {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      default:
        return "outline";
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-background">
        <ChatSidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background">
      <ChatSidebar />
      <main className="flex-1 overflow-auto">
        <div className="border-b border-border bg-background">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <span className="text-sm text-muted-foreground">for</span>
              <ClientSwitcher />
            </div>
          </div>
        </div>

        <div className="p-6">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="team" className="gap-2">
                <Users className="h-4 w-4" />
                Team
              </TabsTrigger>
              <TabsTrigger value="integrations" className="gap-2">
                <Plug className="h-4 w-4" />
                Integrations
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Key className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="agents" className="gap-2">
                <Bot className="h-4 w-4" />
                Agent Controller
              </TabsTrigger>
              {themeBuilderEnabled && (
                <TabsTrigger value="themes" className="gap-2">
                  <Brush className="h-4 w-4" />
                  Themes
                </TabsTrigger>
              )}
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Your Profile</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={user?.email || ""} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Display Name</Label>
                      <Input value={profile?.display_name || ""} placeholder="Your name" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {profile?.role || "client_user"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {profile?.role === "agency_admin"
                          ? "Full access to all clients and admin features"
                          : "Access to assigned clients only"}
                      </span>
                    </div>
                  </div>
                  <Button disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Team Members</h3>
                  {canInvite && (
                    <Button className="gap-2" onClick={() => setInviteOpen(true)}>
                      <UserPlus className="h-4 w-4" />
                      Invite Member
                    </Button>
                  )}
                </div>

                {loadingTeam ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Current Members */}
                    {members.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No team members yet</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          {members.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-3 rounded-lg border border-border"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {member.user_profile?.display_name || "Team Member"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Joined {new Date(member.joined_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {canManage && member.user_id !== user?.id ? (
                                  <Select
                                    value={member.role}
                                    onValueChange={(v) =>
                                      handleChangeRole(member.id, v as ClientMemberRole)
                                    }
                                  >
                                    <SelectTrigger className="w-[120px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="member">Member</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="owner">Owner</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge variant={getRoleBadgeVariant(member.role)} className="capitalize">
                                    {member.role}
                                  </Badge>
                                )}
                                {canManage && member.user_id !== user?.id && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    onClick={() => handleRemoveMember(member.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}

                    {/* Pending Invitations */}
                    {invitations.length > 0 && (
                      <>
                        <Separator className="my-4" />
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                          Pending Invitations
                        </h4>
                        <div className="space-y-2">
                          {invitations.map((invitation) => (
                            <div
                              key={invitation.id}
                              className="flex items-center justify-between p-3 rounded-lg border border-dashed border-border"
                            >
                              <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm">{invitation.email}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Expires {new Date(invitation.expires_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="capitalize text-xs">
                                  {invitation.role}
                                </Badge>
                                {canManage && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive"
                                    onClick={() => handleRevokeInvitation(invitation.id)}
                                  >
                                    Revoke
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Integrations Tab */}
            <TabsContent value="integrations">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Connected Services</h3>
                <ConnectionsButtons />
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={!newPassword || !confirmPassword || changingPassword}
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>

                <Separator className="my-6" />

                <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Agent Controller Tab */}
            <TabsContent value="agents">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Agent Controller</h3>
                <p className="text-muted-foreground mb-6">
                  Manage your AI agents, configure workflows, and monitor agent activity.
                </p>
                <Button onClick={() => navigate(`/client/${clientId}/agent-controller`)}>
                  <Bot className="h-4 w-4 mr-2" />
                  Open Agent Controller
                </Button>
              </Card>
            </TabsContent>

            {/* Themes Tab - Inline Theme Builder */}
            {themeBuilderEnabled && (
              <TabsContent value="themes">
                <ThemesSettings />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite Team Member
            </DialogTitle>
            <DialogDescription>
              Send an invitation to add a new member to {client?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input
                type="email"
                placeholder="colleague@example.com"
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
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Personal Message (Optional)</Label>
              <Textarea
                placeholder="Add a personal message..."
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
            <Button onClick={handleInvite} disabled={!inviteEmail || sendingInvite} className="gap-2">
              {sendingInvite ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientSettings;
