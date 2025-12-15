import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Download, ExternalLink, Copy, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SaveToBoardModal } from "./SaveToBoardModal";

interface AdSpyAdLineProps {
  ad: {
    id: string;
    title: string;
    hook?: string;
    media_type: string;
    media_url?: string;
    thumbnail_url?: string;
    landing_page_url?: string;
    duration_days?: number;
    status: string;
    channel?: string;
    competitor?: {
      name: string;
      logo_url?: string;
    };
  };
}

export function AdSpyAdLine({ ad }: AdSpyAdLineProps) {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  return (
    <Card className="p-3 hover:bg-muted/50 transition-colors border-border">
      <div className="flex items-center gap-4">
        {/* Thumbnail */}
        <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
          {ad.media_url || ad.thumbnail_url ? (
            ad.media_type === "video" ? (
              <video
                src={ad.media_url}
                poster={ad.thumbnail_url}
                className="w-full h-full object-cover"
                muted
              />
            ) : (
              <img
                src={ad.media_url || ad.thumbnail_url}
                alt={ad.title}
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
              No media
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="font-semibold text-sm text-foreground truncate flex-1">
              {ad.title}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              {ad.status === "active" && (
                <Badge variant="default" className="bg-secondary text-secondary-foreground text-xs">
                  Active
                </Badge>
              )}
              {ad.duration_days && ad.duration_days > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {ad.duration_days}d
                </Badge>
              )}
            </div>
          </div>
          {ad.hook && (
            <p className="text-xs text-muted-foreground truncate mt-1">
              {ad.hook}
            </p>
          )}
        </div>

        {/* Competitor */}
        <div className="flex items-center gap-2 flex-shrink-0 min-w-[120px]">
          {ad.competitor && (
            <>
              {ad.competitor.logo_url ? (
                <img
                  src={ad.competitor.logo_url}
                  alt={ad.competitor.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                  {ad.competitor.name.charAt(0)}
                </div>
              )}
              <span className="text-sm text-muted-foreground truncate">
                {ad.competitor.name}
              </span>
            </>
          )}
        </div>

        {/* Channel Badge */}
        {ad.channel && (
          <Badge variant="outline" className="flex-shrink-0 text-xs">
            {ad.channel}
          </Badge>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setIsSaveModalOpen(true)}
          >
            <Heart className="w-4 h-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Copy className="w-4 h-4 mr-2" />
                Clone Ad
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ExternalLink className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <SaveToBoardModal
        open={isSaveModalOpen}
        onOpenChange={setIsSaveModalOpen}
        adId={ad.id}
      />
    </Card>
  );
}
