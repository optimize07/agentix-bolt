import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings2,
  Calendar,
  Link2,
  RotateCcw,
  Save,
  Loader2,
  Clock,
  BookOpen,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getAgentSettings,
  upsertAgentSettings,
  deleteAgentSettings,
  toggleFavorite,
  type UserAgentSettings,
} from "@/integrations/user-agent-settings/api";
import type { Agent, Department } from "@/data/departments";

interface AgentSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent;
  department: Department;
  clientId?: string;
  onSettingsChange?: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export function AgentSettingsModal({
  open,
  onOpenChange,
  agent,
  department,
  clientId,
  onSettingsChange,
}: AgentSettingsModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserAgentSettings | null>(null);

  // Form state
  const [customName, setCustomName] = useState("");
  const [personalNotes, setPersonalNotes] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleType, setScheduleType] = useState<"daily" | "weekly" | "monthly" | "custom">("daily");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState(1);
  const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState(1);
  const [scheduleCron, setScheduleCron] = useState("");
  const [scheduleTimezone, setScheduleTimezone] = useState("UTC");
  const [isFavorite, setIsFavorite] = useState(false);

  // Load existing settings
  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open, agent.name, department.id, clientId]);

  async function loadSettings() {
    setLoading(true);
    try {
      const data = await getAgentSettings({
        departmentId: department.id,
        agentName: agent.name,
        clientId,
      });

      setSettings(data);

      // Populate form with existing settings or defaults
      setCustomName(data?.custom_name || "");
      setPersonalNotes(data?.personal_notes || "");
      setScheduleEnabled(data?.schedule_enabled || false);
      setScheduleType(data?.schedule_type || "daily");
      setScheduleTime(data?.schedule_time || "09:00");
      setScheduleDayOfWeek(data?.schedule_day_of_week ?? 1);
      setScheduleDayOfMonth(data?.schedule_day_of_month ?? 1);
      setScheduleCron(data?.schedule_cron || "");
      setScheduleTimezone(data?.schedule_timezone || "UTC");
      setIsFavorite(data?.is_favorite || false);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await upsertAgentSettings({
        departmentId: department.id,
        agentName: agent.name,
        clientId,
        customName: customName || null,
        personalNotes: personalNotes || null,
        scheduleEnabled,
        scheduleType: scheduleEnabled ? scheduleType : null,
        scheduleTime: scheduleEnabled ? scheduleTime : null,
        scheduleDayOfWeek: scheduleEnabled && scheduleType === "weekly" ? scheduleDayOfWeek : null,
        scheduleDayOfMonth: scheduleEnabled && scheduleType === "monthly" ? scheduleDayOfMonth : null,
        scheduleCron: scheduleEnabled && scheduleType === "custom" ? scheduleCron : null,
        scheduleTimezone: scheduleEnabled ? scheduleTimezone : null,
        isFavorite,
      });

      toast({
        title: "Settings Saved",
        description: `Your settings for ${customName || agent.name} have been saved.`,
      });

      onSettingsChange?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleRestoreDefaults() {
    setSaving(true);
    try {
      await deleteAgentSettings({
        departmentId: department.id,
        agentName: agent.name,
        clientId,
      });

      // Reset form
      setCustomName("");
      setPersonalNotes("");
      setScheduleEnabled(false);
      setScheduleType("daily");
      setScheduleTime("09:00");
      setScheduleDayOfWeek(1);
      setScheduleDayOfMonth(1);
      setScheduleCron("");
      setScheduleTimezone("UTC");
      setIsFavorite(false);
      setSettings(null);

      toast({
        title: "Defaults Restored",
        description: `Settings for ${agent.name} have been reset to defaults.`,
      });

      onSettingsChange?.();
    } catch (error) {
      console.error("Error restoring defaults:", error);
      toast({
        title: "Error",
        description: "Failed to restore defaults. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleFavorite() {
    const newStatus = await toggleFavorite({
      departmentId: department.id,
      agentName: agent.name,
      clientId,
    });
    setIsFavorite(newStatus);
    onSettingsChange?.();
  }

  const displayName = customName || agent.name;
  const hasCustomizations = Boolean(
    settings?.custom_name ||
    settings?.personal_notes ||
    settings?.schedule_enabled ||
    settings?.is_favorite
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Settings2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">{displayName}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {department.title}
                  </Badge>
                  {agent.source && (
                    <Badge variant="secondary" className="text-xs">
                      {agent.source}
                    </Badge>
                  )}
                  {hasCustomizations && (
                    <Badge className="text-xs bg-amber-500/10 text-amber-500">
                      Customized
                    </Badge>
                  )}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFavorite}
              className="text-muted-foreground hover:text-amber-500"
            >
              {isFavorite ? (
                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
              ) : (
                <StarOff className="h-5 w-5" />
              )}
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full flex-shrink-0">
              <TabsTrigger value="general" className="flex-1 gap-2">
                <Settings2 className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex-1 gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="connections" className="flex-1 gap-2">
                <Link2 className="h-4 w-4" />
                Connections
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4">
              <TabsContent value="general" className="mt-0 space-y-6 pr-4">
                {/* Custom Name */}
                <div className="space-y-2">
                  <Label htmlFor="customName">Display Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="customName"
                      placeholder={agent.name}
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                    />
                    {customName && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCustomName("")}
                        title="Restore default name"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Give this agent a custom name. Leave empty to use the default.
                  </p>
                </div>

                {/* Personal Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Personal Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add notes about how you use this agent, special instructions, etc."
                    value={personalNotes}
                    onChange={(e) => setPersonalNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Stats */}
                {settings && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <h4 className="text-sm font-medium mb-3">Usage Statistics</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Runs:</span>
                        <span className="ml-2 font-medium">{settings.run_count}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Run:</span>
                        <span className="ml-2 font-medium">
                          {settings.last_run_at
                            ? new Date(settings.last_run_at).toLocaleDateString()
                            : "Never"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="schedule" className="mt-0 space-y-6 pr-4">
                {/* Schedule Enable */}
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="scheduleEnabled" className="text-base">
                      Automatic Scheduling
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Run this agent automatically on a schedule
                    </p>
                  </div>
                  <Switch
                    id="scheduleEnabled"
                    checked={scheduleEnabled}
                    onCheckedChange={setScheduleEnabled}
                  />
                </div>

                {scheduleEnabled && (
                  <>
                    {/* Schedule Type */}
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select
                        value={scheduleType}
                        onValueChange={(v) => setScheduleType(v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="custom">Custom (Cron)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Time */}
                    <div className="space-y-2">
                      <Label htmlFor="scheduleTime">Time of Day</Label>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="scheduleTime"
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="w-32"
                        />
                      </div>
                    </div>

                    {/* Day of Week (for weekly) */}
                    {scheduleType === "weekly" && (
                      <div className="space-y-2">
                        <Label>Day of Week</Label>
                        <Select
                          value={scheduleDayOfWeek.toString()}
                          onValueChange={(v) => setScheduleDayOfWeek(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((day) => (
                              <SelectItem key={day.value} value={day.value.toString()}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Day of Month (for monthly) */}
                    {scheduleType === "monthly" && (
                      <div className="space-y-2">
                        <Label>Day of Month</Label>
                        <Select
                          value={scheduleDayOfMonth.toString()}
                          onValueChange={(v) => setScheduleDayOfMonth(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                              <SelectItem key={day} value={day.toString()}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Custom Cron */}
                    {scheduleType === "custom" && (
                      <div className="space-y-2">
                        <Label htmlFor="cron">Cron Expression</Label>
                        <Input
                          id="cron"
                          placeholder="0 9 * * 1-5"
                          value={scheduleCron}
                          onChange={(e) => setScheduleCron(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Example: <code>0 9 * * 1-5</code> = 9 AM on weekdays
                        </p>
                      </div>
                    )}

                    {/* Timezone */}
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select
                        value={scheduleTimezone}
                        onValueChange={setScheduleTimezone}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Next Run Preview */}
                    <div className="rounded-lg border border-border bg-primary/5 p-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Next scheduled run:</span>
                        <span className="font-medium text-primary">
                          {getNextRunPreview(scheduleType, scheduleTime, scheduleDayOfWeek, scheduleDayOfMonth)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="connections" className="mt-0 space-y-6 pr-4">
                {/* Knowledge Base Connection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Knowledge Base
                  </Label>
                  <div className="rounded-lg border border-dashed border-border p-6 text-center">
                    <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Connect knowledge base items to provide context
                    </p>
                    <Button variant="outline" size="sm" disabled>
                      <Link2 className="h-4 w-4 mr-2" />
                      Connect Knowledge Base
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Coming soon - link FAQ, documents, and context
                    </p>
                  </div>
                </div>

                {/* Input Integration */}
                <div className="space-y-2">
                  <Label>Input Source</Label>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Configure where this agent gets its input data
                    </p>
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Manual input (default)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual input</SelectItem>
                        <SelectItem value="webhook">Webhook trigger</SelectItem>
                        <SelectItem value="schedule">Scheduled with defaults</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Output Integration */}
                <div className="space-y-2">
                  <Label>Output Destination</Label>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Configure where results are sent after the agent runs
                    </p>
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Display in app (default)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="display">Display in app</SelectItem>
                        <SelectItem value="email">Send via email</SelectItem>
                        <SelectItem value="webhook">Send to webhook</SelectItem>
                        <SelectItem value="slack">Post to Slack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    <strong>Note:</strong> Integration connections are coming in a future update. 
                    These settings will allow you to automate agent workflows with external systems.
                  </p>
                </div>
              </TabsContent>
            </ScrollArea>

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border flex-shrink-0">
              <Button
                variant="ghost"
                onClick={handleRestoreDefaults}
                disabled={saving || !hasCustomizations}
                className="text-muted-foreground"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Restore Defaults
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Settings
                </Button>
              </div>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Helper to preview the next scheduled run
function getNextRunPreview(
  type: string,
  time: string,
  dayOfWeek: number,
  dayOfMonth: number
): string {
  const now = new Date();
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  switch (type) {
    case "daily":
      break;
    case "weekly":
      while (next.getDay() !== dayOfWeek) {
        next.setDate(next.getDate() + 1);
      }
      break;
    case "monthly":
      next.setDate(dayOfMonth);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      break;
    case "custom":
      return "Based on cron expression";
  }

  return next.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

