import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Clock, Calendar } from "lucide-react";

const ScheduleSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<any>(null);
  const [isActive, setIsActive] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState('0');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [timeWindowDays, setTimeWindowDays] = useState('7');

  const daysOfWeek = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
  ];

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('ad_spy_schedules')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!error && data) {
      setSchedule(data);
      setIsActive(data.is_active);
      setDayOfWeek(data.day_of_week.toString());
      setTimeOfDay(data.time_of_day);
      setTimeWindowDays(data.time_window_days.toString());
    }
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);

    try {
      const scheduleData = {
        user_id: user.id,
        is_active: isActive,
        day_of_week: parseInt(dayOfWeek),
        time_of_day: timeOfDay,
        time_window_days: parseInt(timeWindowDays),
      };

      const { error } = schedule
        ? await supabase
            .from('ad_spy_schedules')
            .update(scheduleData)
            .eq('id', schedule.id)
        : await supabase
            .from('ad_spy_schedules')
            .insert(scheduleData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Schedule settings saved successfully",
      });

      fetchSchedule();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label htmlFor="automation" className="text-foreground">Enable Automation</Label>
          <p className="text-sm text-muted-foreground">
            Run analysis automatically on a schedule
          </p>
        </div>
        <Switch
          id="automation"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </div>

      {isActive && (
        <div className="space-y-4 pt-4 border-t border-border">
          {schedule?.last_executed_at && (
            <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Last Run:</span>
                <span className="text-foreground font-medium">
                  {format(new Date(schedule.last_executed_at), "PPp")}
                </span>
              </div>
              {schedule?.next_execution_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Next Run:</span>
                  <span className="text-foreground font-medium">
                    {format(new Date(schedule.next_execution_at), "PPp")}
                  </span>
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-2">
            <Label className="text-foreground">Day of Week</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {daysOfWeek.map((day) => (
                  <SelectItem key={day.value} value={day.value} className="text-foreground">
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Time of Day</Label>
            <input
              type="time"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Analysis Window</Label>
            <Select value={timeWindowDays} onValueChange={setTimeWindowDays}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="7" className="text-foreground">Last 7 days</SelectItem>
                <SelectItem value="14" className="text-foreground">Last 14 days</SelectItem>
                <SelectItem value="30" className="text-foreground">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <Button onClick={handleSave} disabled={loading} className="w-full">
        {loading ? 'Saving...' : 'Save Schedule'}
      </Button>
    </div>
  );
};

export default ScheduleSettings;