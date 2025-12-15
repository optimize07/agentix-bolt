import { ReactNode } from "react";
import { format } from "date-fns";
import { Plus, Facebook, Instagram, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScheduledPost {
  id: string;
  title: string;
  scheduled_at: string;
  status: string;
  platform: string;
  color: string | null;
}

interface DayEventsPopoverProps {
  children: ReactNode;
  day: Date;
  posts: ScheduledPost[];
  isOpen: boolean;
  onPostClick: (post: ScheduledPost) => void;
  onAddClick: () => void;
}

const platformIcons: Record<string, ReactNode> = {
  facebook: <Facebook className="h-3 w-3" />,
  instagram: <Instagram className="h-3 w-3" />,
  tiktok: <Video className="h-3 w-3" />,
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  published: "default",
  scheduled: "secondary",
  draft: "outline",
  cancelled: "destructive",
};

export function DayEventsPopover({
  children,
  day,
  posts,
  isOpen,
  onPostClick,
  onAddClick,
}: DayEventsPopoverProps) {
  if (posts.length === 0) {
    return <>{children}</>;
  }

  return (
    <Popover open={isOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">
              {format(day, "EEEE, MMM d")}
            </h4>
            <Button variant="ghost" size="sm" onClick={onAddClick}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => onPostClick(post)}
                className={cn(
                  "w-full text-left p-2 rounded-md border border-border",
                  "hover:bg-accent/50 transition-colors"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{post.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(post.scheduled_at), "h:mm a")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {platformIcons[post.platform] || null}
                    <Badge variant={statusVariants[post.status] || "outline"} className="text-[10px] px-1.5 py-0">
                      {post.status}
                    </Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
