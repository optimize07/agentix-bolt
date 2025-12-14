import { FileText, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface LongFormIdea {
  title: string;
  type: "blog_post" | "youtube_script" | "newsletter" | "twitter_thread" | string;
  outline: string[];
  estimatedLength: string;
  targetAudience: string;
}

interface LongFormIdeasSectionProps {
  ideas: LongFormIdea[];
  onSaveIdea: (idea: LongFormIdea) => void;
  isLoading?: boolean;
}

export function LongFormIdeasSection({ ideas, onSaveIdea, isLoading }: LongFormIdeasSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-purple-500" />
            Long-form Ideas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-3 rounded-lg bg-muted/50 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-full mb-1" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="w-5 h-5 text-purple-500" />
          Long-form Ideas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ideas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Generate long-form ideas to see suggestions</p>
        ) : (
          ideas.map((idea, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {idea.type.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Clock className="w-3 h-3" />
                    {idea.estimatedLength}
                  </Badge>
                </div>
                <Badge variant="outline">{idea.targetAudience}</Badge>
              </div>
              <h4 className="text-sm font-semibold mb-2">{idea.title}</h4>
              <div className="space-y-2">
                {idea.outline.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <Button size="sm" variant="ghost" className="gap-2" onClick={() => onSaveIdea(idea)}>
                  Save to Library <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
