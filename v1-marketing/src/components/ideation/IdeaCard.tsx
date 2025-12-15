import { Sparkles, Calendar, Bookmark, Instagram, Facebook, Twitter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ContentIdea {
  title: string;
  description: string;
  platform: string;
  format: string;
  cta: string;
}

interface IdeaCardProps {
  idea: ContentIdea;
  onSave: (idea: ContentIdea) => void;
  onSchedule: (idea: ContentIdea) => void;
}

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-3 h-3" />,
  facebook: <Facebook className="w-3 h-3" />,
  twitter: <Twitter className="w-3 h-3" />,
  tiktok: <span className="text-xs font-bold">TT</span>,
  linkedin: <span className="text-xs font-bold">in</span>,
};

const formatColors: Record<string, string> = {
  reel: 'bg-pink-500/20 text-pink-400',
  carousel: 'bg-blue-500/20 text-blue-400',
  story: 'bg-purple-500/20 text-purple-400',
  post: 'bg-green-500/20 text-green-400',
  thread: 'bg-orange-500/20 text-orange-400',
};

export function IdeaCard({ idea, onSave, onSchedule }: IdeaCardProps) {
  const platformKey = idea.platform?.toLowerCase() || 'instagram';
  const formatKey = idea.format?.toLowerCase() || 'post';

  return (
    <Card className="hover:border-primary/30 transition-colors group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <h4 className="font-medium text-sm line-clamp-1">{idea.title}</h4>
          </div>
          <div className="flex items-center gap-1">
            {platformIcons[platformKey] || platformIcons.instagram}
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
          {idea.description}
        </p>
        
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-xs capitalize">
            {idea.platform}
          </Badge>
          <Badge className={`text-xs capitalize ${formatColors[formatKey] || formatColors.post}`}>
            {idea.format}
          </Badge>
        </div>
        
        <div className="bg-muted/30 rounded p-2 mb-3">
          <p className="text-xs">
            <span className="font-medium text-primary">CTA:</span> {idea.cta}
          </p>
        </div>
        
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7 text-xs flex-1"
            onClick={() => onSave(idea)}
          >
            <Bookmark className="w-3 h-3 mr-1" />
            Save
          </Button>
          <Button 
            size="sm" 
            className="h-7 text-xs flex-1"
            onClick={() => onSchedule(idea)}
          >
            <Calendar className="w-3 h-3 mr-1" />
            Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
