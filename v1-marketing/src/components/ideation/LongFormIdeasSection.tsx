import { FileText, Clock, Users, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface LongFormIdea {
  title: string;
  type: 'blog_post' | 'youtube_script' | 'newsletter' | 'twitter_thread';
  outline: string[];
  estimatedLength: string;
  targetAudience: string;
}

interface LongFormIdeasSectionProps {
  ideas: LongFormIdea[];
  onSaveIdea?: (idea: LongFormIdea) => void;
  isLoading?: boolean;
}

const typeColors: Record<string, string> = {
  blog_post: 'bg-blue-500/20 text-blue-400',
  youtube_script: 'bg-red-500/20 text-red-400',
  newsletter: 'bg-purple-500/20 text-purple-400',
  twitter_thread: 'bg-sky-500/20 text-sky-400',
};

const typeLabels: Record<string, string> = {
  blog_post: 'Blog Post',
  youtube_script: 'YouTube Script',
  newsletter: 'Newsletter',
  twitter_thread: 'Twitter Thread',
};

export function LongFormIdeasSection({ ideas, onSaveIdea, isLoading }: LongFormIdeasSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Long-Form Content Ideas
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!ideas || ideas.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Long-Form Content Ideas
        </h2>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Click "Generate Ideas" to get long-form content suggestions
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        Long-Form Content Ideas
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {ideas.map((idea, index) => (
          <Card key={index} className="group hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-medium">{idea.title}</CardTitle>
                <Badge className={typeColors[idea.type] || 'bg-muted text-muted-foreground'}>
                  {typeLabels[idea.type] || idea.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {idea.estimatedLength}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {idea.targetAudience}
                </span>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Outline:</p>
                <ul className="text-sm space-y-1">
                  {idea.outline.slice(0, 4).map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-primary font-medium">{i + 1}.</span>
                      {point}
                    </li>
                  ))}
                  {idea.outline.length > 4 && (
                    <li className="text-xs text-muted-foreground/70">
                      +{idea.outline.length - 4} more points...
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => onSaveIdea?.(idea)}
                >
                  Save Idea
                </Button>
                <Button size="sm" variant="ghost">
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
