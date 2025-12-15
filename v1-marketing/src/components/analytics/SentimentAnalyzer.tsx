import { useState } from "react";
import { Brain, Sparkles, ThumbsUp, ThumbsDown, Minus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SentimentResult {
  overallSentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  audienceReaction: string;
  emotionalTriggers: string[];
  suggestions: string[];
  engagementPrediction: 'low' | 'medium' | 'high';
}

export function SentimentAnalyzer() {
  const [content, setContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SentimentResult | null>(null);

  const analyzeSentiment = async () => {
    if (!content.trim()) {
      toast.error("Please enter content to analyze");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-sentiment', {
        body: { content }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data);
      toast.success("Analysis complete!");
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze content");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="w-5 h-5 text-green-500" />;
      case 'negative': return <ThumbsDown className="w-5 h-5 text-red-500" />;
      default: return <Minus className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500/20 text-green-400';
      case 'negative': return 'bg-red-500/20 text-red-400';
      default: return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-red-500/20 text-red-400';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          AI Sentiment Analyzer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Paste your caption or content here to analyze how your audience might react..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          <Button 
            onClick={analyzeSentiment} 
            disabled={isAnalyzing || !content.trim()}
            className="w-full gap-2"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isAnalyzing ? "Analyzing..." : "Analyze Sentiment"}
          </Button>
        </div>

        {result && (
          <div className="space-y-4 pt-4 border-t border-border">
            {/* Sentiment Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getSentimentIcon(result.overallSentiment)}
                <span className="font-medium text-foreground capitalize">
                  {result.overallSentiment} Sentiment
                </span>
              </div>
              <Badge className={getSentimentColor(result.overallSentiment)}>
                Score: {Math.round((result.score + 1) * 50)}%
              </Badge>
            </div>

            {/* Sentiment Bar */}
            <div className="space-y-1">
              <Progress 
                value={(result.score + 1) * 50} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Negative</span>
                <span>Neutral</span>
                <span>Positive</span>
              </div>
            </div>

            {/* Engagement Prediction */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Engagement Prediction</span>
              <Badge className={getEngagementColor(result.engagementPrediction)}>
                {result.engagementPrediction.toUpperCase()}
              </Badge>
            </div>

            {/* Audience Reaction */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Predicted Audience Reaction</p>
              <p className="text-sm text-muted-foreground">{result.audienceReaction}</p>
            </div>

            {/* Emotional Triggers */}
            {result.emotionalTriggers.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Emotional Triggers</p>
                <div className="flex flex-wrap gap-1">
                  {result.emotionalTriggers.map((trigger, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {trigger}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Suggestions to Improve</p>
                <ul className="space-y-1">
                  {result.suggestions.map((suggestion, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
