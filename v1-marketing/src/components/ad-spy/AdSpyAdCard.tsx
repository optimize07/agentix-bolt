import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Download, ExternalLink, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { SaveToBoardModal } from "./SaveToBoardModal";

interface AdSpyAdCardProps {
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
    competitor?: {
      name: string;
      logo_url?: string;
    };
  };
  onSaveToBoard?: (adId: string) => void;
}

export function AdSpyAdCard({ ad, onSaveToBoard }: AdSpyAdCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const handleSave = () => {
    setIsSaveModalOpen(true);
  };

  return (
    <Card
      className="group overflow-hidden transition-all hover:shadow-lg border-border"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square bg-muted overflow-hidden">
        {ad.media_url || ad.thumbnail_url ? (
          ad.media_type === "video" ? (
            <video
              src={ad.media_url}
              poster={ad.thumbnail_url}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={ad.media_url || ad.thumbnail_url}
              alt={ad.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No media
          </div>
        )}

        {/* Hover overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-background/80 flex items-center justify-center gap-2 transition-opacity",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <Button size="sm" variant="secondary">
            <Copy className="w-4 h-4 mr-2" />
            Clone Ad
          </Button>
          <Button size="sm" variant="secondary">
            <ExternalLink className="w-4 h-4 mr-2" />
            Details
          </Button>
        </div>

        {/* Top badges */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          <div className="flex gap-2">
            {ad.status === "active" && (
              <Badge variant="default" className="bg-secondary text-secondary-foreground">
                Active
              </Badge>
            )}
            {ad.media_type === "video" && (
              <Badge variant="outline" className="bg-background/90">
                Video
              </Badge>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 bg-background/90 hover:bg-background"
            onClick={handleSave}
          >
            <Heart className="w-4 h-4" />
          </Button>
        </div>

        {/* Duration badge */}
        {ad.duration_days && ad.duration_days > 0 && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="bg-background/90">
              {ad.duration_days}d running
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground line-clamp-2">{ad.title}</h3>
          {ad.hook && (
            <p className="text-sm text-muted-foreground line-clamp-2">{ad.hook}</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          {ad.competitor && (
            <div className="flex items-center gap-2">
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
              <span className="text-sm text-muted-foreground">{ad.competitor.name}</span>
            </div>
          )}

          <Button size="icon" variant="ghost" className="h-8 w-8">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>

      <SaveToBoardModal
        open={isSaveModalOpen}
        onOpenChange={setIsSaveModalOpen}
        adId={ad.id}
      />
    </Card>
  );
}
