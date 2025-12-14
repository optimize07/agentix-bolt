import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import { DayEventsPopover } from "./DayEventsPopover";

interface ScheduledPost {
  id: string;
  title: string;
  scheduled_at: string;
  status: string;
  platform: string;
  color: string | null;
}

interface CalendarViewProps {
  posts: ScheduledPost[];
  onDayClick: (date: Date) => void;
  onPostClick: (post: ScheduledPost) => void;
}

const statusColors: Record<string, string> = {
  published: "bg-green-500",
  scheduled: "bg-blue-500",
  draft: "bg-yellow-500",
  cancelled: "bg-red-500",
};

export function CalendarView({ posts, onDayClick, onPostClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getPostsForDay = (date: Date) => {
    return posts.filter((post) =>
      isSameDay(new Date(post.scheduled_at), date)
    );
  };

  const handleDayClick = (day: Date, dayPosts: ScheduledPost[]) => {
    if (dayPosts.length === 0) {
      onDayClick(day);
    } else {
      setSelectedDay(selectedDay && isSameDay(selectedDay, day) ? null : day);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayPosts = getPostsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDay && isSameDay(day, selectedDay);

          return (
            <DayEventsPopover
              key={day.toISOString()}
              day={day}
              posts={dayPosts}
              isOpen={isSelected || false}
              onPostClick={onPostClick}
              onAddClick={() => onDayClick(day)}
            >
              <button
                onClick={() => handleDayClick(day, dayPosts)}
                className={cn(
                  "relative aspect-square p-1 rounded-md transition-colors",
                  "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring",
                  !isCurrentMonth && "text-muted-foreground/50",
                  isToday(day) && "bg-primary/10 font-bold",
                  isSelected && "ring-2 ring-primary"
                )}
              >
                <span
                  className={cn(
                    "text-sm",
                    isToday(day) && "text-primary"
                  )}
                >
                  {format(day, "d")}
                </span>

                {/* Event dots */}
                {dayPosts.length > 0 && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {dayPosts.slice(0, 3).map((post) => (
                      <div
                        key={post.id}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          post.color ? "" : statusColors[post.status] || "bg-muted-foreground"
                        )}
                        style={post.color ? { backgroundColor: post.color } : undefined}
                      />
                    ))}
                    {dayPosts.length > 3 && (
                      <span className="text-[8px] text-muted-foreground ml-0.5">
                        +{dayPosts.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            </DayEventsPopover>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
        <span className="text-xs text-muted-foreground">Status:</span>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground">Published</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-xs text-muted-foreground">Scheduled</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-xs text-muted-foreground">Draft</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs text-muted-foreground">Cancelled</span>
        </div>
      </div>
    </div>
  );
}

