import { format, isToday, isTomorrow, addDays, isBefore } from "date-fns";
import { Plus, Facebook, Instagram, Video, MoreHorizontal, Pencil, Calendar, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ScheduledPost {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  status: string;
  platform: string;
  image_url: string | null;
  color: string | null;
}

interface UpcomingPostsProps {
  posts: ScheduledPost[];
  onAddClick: () => void;
  onEditClick: (post: ScheduledPost) => void;
  onStatusChange: (postId: string, status: string) => void;
}

const platformIcons: Record<string, React.ReactNode> = {
  facebook: <Facebook className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
  tiktok: <Video className="h-4 w-4" />,
};

const statusColors: Record<string, string> = {
  published: "bg-green-500/10 text-green-500 border-green-500/20",
  scheduled: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  draft: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

function formatDateLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEEE, MMM d");
}

export function UpcomingPosts({ posts, onAddClick, onEditClick, onStatusChange }: UpcomingPostsProps) {
  const now = new Date();
  const weekFromNow = addDays(now, 7);

  // Filter to next 7 days and scheduled/draft posts only
  const upcomingPosts = posts
    .filter((post) => {
      const postDate = new Date(post.scheduled_at);
      return (
        (post.status === "scheduled" || post.status === "draft") &&
        postDate >= now &&
        isBefore(postDate, weekFromNow)
      );
    })
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  // Group by date
  const groupedPosts = upcomingPosts.reduce((groups, post) => {
    const dateKey = format(new Date(post.scheduled_at), "yyyy-MM-dd");
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(post);
    return groups;
  }, {} as Record<string, ScheduledPost[]>);

  return (
    <div className="bg-card rounded-lg border border-border h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Upcoming Posts</h3>
        <Button size="sm" onClick={onAddClick}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {upcomingPosts.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No upcoming posts</p>
            <p className="text-xs text-muted-foreground mt-1">
              Schedule your first post to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedPosts).map(([dateKey, datePosts]) => (
              <div key={dateKey}>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  {formatDateLabel(new Date(dateKey))}
                </h4>
                <div className="space-y-2">
                  {datePosts.map((post) => (
                    <div
                      key={post.id}
                      className={cn(
                        "p-3 rounded-lg border border-border bg-background/50",
                        "hover:bg-accent/30 transition-colors cursor-pointer"
                      )}
                      onClick={() => onEditClick(post)}
                    >
                      <div className="flex items-start gap-3">
                        {post.image_url ? (
                          <img
                            src={post.image_url}
                            alt=""
                            className="w-12 h-12 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: post.color || "hsl(var(--muted))" }}
                          >
                            {platformIcons[post.platform] || <Calendar className="h-5 w-5 text-muted-foreground" />}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{post.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(post.scheduled_at), "h:mm a")}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge
                              variant="outline"
                              className={cn("text-[10px] px-1.5 py-0", statusColors[post.status])}
                            >
                              {post.status}
                            </Badge>
                            <span className="text-muted-foreground">
                              {platformIcons[post.platform]}
                            </span>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditClick(post); }}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {post.status === "draft" && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(post.id, "scheduled"); }}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Schedule
                              </DropdownMenuItem>
                            )}
                            {post.status === "scheduled" && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(post.id, "cancelled"); }}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

