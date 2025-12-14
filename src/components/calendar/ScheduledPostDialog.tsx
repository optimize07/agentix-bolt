import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface ScheduledPost {
  id?: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  status: string;
  platform: string;
  content: string | null;
  image_url: string | null;
  color: string | null;
}

interface ScheduledPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: ScheduledPost | null;
  initialDate?: Date;
  onSave: (post: Omit<ScheduledPost, "id"> & { id?: string }) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
}

const platforms = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "twitter", label: "Twitter/X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "youtube", label: "YouTube" },
];

const statuses = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "cancelled", label: "Cancelled" },
];

const colors = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#22c55e", label: "Green" },
  { value: "#eab308", label: "Yellow" },
  { value: "#ef4444", label: "Red" },
  { value: "#a855f7", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#f97316", label: "Orange" },
];

export function ScheduledPostDialog({
  open,
  onOpenChange,
  post,
  initialDate,
  onSave,
  onDelete,
}: ScheduledPostDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<ScheduledPost, "id"> & { id?: string }>({
    title: "",
    description: null,
    scheduled_at: new Date().toISOString(),
    status: "scheduled",
    platform: "facebook",
    content: null,
    image_url: null,
    color: null,
  });

  useEffect(() => {
    if (post) {
      setFormData(post);
    } else {
      const date = initialDate || new Date();
      // Set time to 9 AM if no time specified
      date.setHours(9, 0, 0, 0);
      setFormData({
        title: "",
        description: null,
        scheduled_at: date.toISOString(),
        status: "scheduled",
        platform: "facebook",
        content: null,
        image_url: null,
        color: null,
      });
    }
  }, [post, initialDate, open]);

  const handleSave = async () => {
    if (!formData.title.trim()) return;
    setLoading(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!post?.id || !onDelete) return;
    setLoading(true);
    try {
      await onDelete(post.id);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    const currentDate = new Date(formData.scheduled_at);
    date.setHours(currentDate.getHours(), currentDate.getMinutes(), 0, 0);
    setFormData({ ...formData, scheduled_at: date.toISOString() });
  };

  const handleTimeChange = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const date = new Date(formData.scheduled_at);
    date.setHours(hours, minutes, 0, 0);
    setFormData({ ...formData, scheduled_at: date.toISOString() });
  };

  const isEditing = !!post?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Post" : "Schedule New Post"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Post title"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(new Date(formData.scheduled_at), "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={new Date(formData.scheduled_at)}
                    onSelect={handleDateChange}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={format(new Date(formData.scheduled_at), "HH:mm")}
                onChange={(e) => handleTimeChange(e.target.value)}
              />
            </div>
          </div>

          {/* Platform & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select
                value={formData.platform}
                onValueChange={(value) => setFormData({ ...formData, platform: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
              placeholder="Brief description"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content / Copy</Label>
            <Textarea
              id="content"
              value={formData.content || ""}
              onChange={(e) => setFormData({ ...formData, content: e.target.value || null })}
              placeholder="Post content or copy..."
              rows={3}
            />
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              value={formData.image_url || ""}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value || null })}
              placeholder="https://..."
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Calendar Color</Label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c.value })}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                    formData.color === c.value ? "border-foreground scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, color: null })}
                className={cn(
                  "w-8 h-8 rounded-full border-2 bg-muted transition-transform hover:scale-110",
                  formData.color === null ? "border-foreground scale-110" : "border-transparent"
                )}
                title="Default"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isEditing && onDelete && (
            <Button variant="destructive" onClick={handleDelete} disabled={loading} className="sm:mr-auto">
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !formData.title.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Schedule Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

