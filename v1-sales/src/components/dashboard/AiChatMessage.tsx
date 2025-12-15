import { User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface AiChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

export const AiChatMessage = ({ role, content, isLoading }: AiChatMessageProps) => {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-3 mb-4", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary" : "bg-muted"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Sparkles className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div
        className={cn(
          "flex-1 rounded-lg px-4 py-3 text-sm",
          isUser
            ? "bg-primary text-primary-foreground ml-12"
            : "bg-muted text-muted-foreground mr-12"
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full animate-pulse" />
            <Skeleton className="h-4 w-32 animate-pulse" />
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words">{content}</div>
        )}
      </div>
    </div>
  );
};
