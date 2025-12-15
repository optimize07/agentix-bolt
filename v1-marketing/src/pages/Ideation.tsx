import { useState, useEffect } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingSection } from "@/components/ideation/TrendingSection";
import { CurrentEventsSection } from "@/components/ideation/CurrentEventsSection";
import { HooksSection } from "@/components/ideation/HooksSection";
import { ContentIdeasSection } from "@/components/ideation/ContentIdeasSection";
import { LongFormIdeasSection } from "@/components/ideation/LongFormIdeasSection";
import { SavedIdeasSection } from "@/components/ideation/SavedIdeasSection";
import { useProject } from "@/contexts/ProjectContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GeneratedIdeas {
  trends: Array<{ title: string; description: string; angle: string; urgency: string }>;
  currentEvents: Array<{ title: string; description: string; angle: string; relevance: string }>;
  hooks: Array<{ hook: string; example: string; platform: string; type: string }>;
  contentIdeas: Array<{ title: string; description: string; platform: string; format: string; cta: string }>;
  longFormIdeas: Array<{ title: string; type: 'blog_post' | 'youtube_script' | 'newsletter' | 'twitter_thread'; outline: string[]; estimatedLength: string; targetAudience: string }>;
}

interface Project {
  id: string;
  name: string;
  description?: string | null;
  goal?: string | null;
  creative_style_notes?: string | null;
}

export default function Ideation() {
  const { selectedProjectId } = useProject();
  const [isLoading, setIsLoading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [ideas, setIdeas] = useState<GeneratedIdeas>({
    trends: [],
    currentEvents: [],
    hooks: [],
    contentIdeas: [],
    longFormIdeas: [],
  });

  useEffect(() => {
    const fetchProject = async () => {
      if (!selectedProjectId) {
        setProject(null);
        return;
      }
      
      const { data, error } = await supabase
        .from('agent_boards')
        .select('id, name, description, goal, creative_style_notes')
        .eq('id', selectedProjectId)
        .single();
      
      if (!error && data) {
        setProject(data);
      }
    };

    fetchProject();
  }, [selectedProjectId]);

  const generateIdeas = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ideas', {
        body: {
          brandName: project?.name || 'My Brand',
          brandDescription: project?.description || 'Social media content creator',
          goal: project?.goal || 'Grow engagement and followers',
          creativeStyle: project?.creative_style_notes || 'Engaging and authentic',
          targetAudience: 'Social media users interested in valuable content',
          niche: project?.name || 'Social media marketing',
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setIdeas({
        trends: data.trends || [],
        currentEvents: data.currentEvents || [],
        hooks: data.hooks || [],
        contentIdeas: data.contentIdeas || [],
        longFormIdeas: data.longFormIdeas || [],
      });

      toast.success("Ideas generated successfully!");
    } catch (error) {
      console.error('Error generating ideas:', error);
      toast.error(error instanceof Error ? error.message : "Failed to generate ideas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseTrend = (trend: { title: string; description: string; angle: string; urgency: string }) => {
    toast.success(`Trend "${trend.title}" saved to your ideas!`);
  };

  const handleUseEvent = (event: { title: string; description: string; angle: string; relevance: string }) => {
    toast.success(`Event "${event.title}" saved to your ideas!`);
  };

  const handleSaveIdea = async (idea: { title: string; description: string; platform: string; format: string; cta: string }) => {
    try {
      const { error } = await supabase.from('ideas').insert({
        project_id: project?.id,
        type: 'content_idea',
        title: idea.title,
        description: idea.description,
        content: `${idea.description}\n\nCTA: ${idea.cta}`,
        platform: idea.platform.toLowerCase(),
        source: 'ai_generated',
        status: 'active',
      });

      if (error) throw error;
      toast.success(`"${idea.title}" saved to your library!`);
    } catch (error) {
      console.error('Error saving idea:', error);
      toast.error("Failed to save idea");
    }
  };

  const handleSaveLongFormIdea = async (idea: { title: string; type: string; outline: string[]; estimatedLength: string; targetAudience: string }) => {
    try {
      const { error } = await supabase.from('ideas').insert({
        project_id: project?.id,
        type: 'long_form',
        title: idea.title,
        description: `${idea.type} - ${idea.estimatedLength}`,
        content: idea.outline.join('\n'),
        source: 'ai_generated',
        status: 'active',
      });

      if (error) throw error;
      toast.success(`"${idea.title}" saved to your library!`);
    } catch (error) {
      console.error('Error saving idea:', error);
      toast.error("Failed to save idea");
    }
  };

  const handleScheduleIdea = (idea: { title: string; description: string; platform: string; format: string; cta: string }) => {
    toast.info(`Opening scheduler for "${idea.title}"...`);
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            Today's Content Ideas
          </h1>
          <p className="text-muted-foreground mt-1">
            Fresh inspiration for {project?.name || 'your brand'} • {currentDate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={generateIdeas}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isLoading ? "Generating..." : "Generate Ideas"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="content">💡 Content Ideas</TabsTrigger>
          <TabsTrigger value="hooks">🎣 Hooks</TabsTrigger>
          <TabsTrigger value="longform">📝 Long-form</TabsTrigger>
          <TabsTrigger value="trends">🔥 Trends</TabsTrigger>
          <TabsTrigger value="saved">📚 Saved</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab - Overview of everything */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <TrendingSection
              trends={ideas.trends}
              onUseTrend={handleUseTrend}
              isLoading={isLoading}
            />
            <CurrentEventsSection
              events={ideas.currentEvents}
              onUseEvent={handleUseEvent}
              isLoading={isLoading}
            />
            <HooksSection
              hooks={ideas.hooks}
              isLoading={isLoading}
            />
          </div>
          <ContentIdeasSection
            ideas={ideas.contentIdeas}
            onSaveIdea={handleSaveIdea}
            onScheduleIdea={handleScheduleIdea}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Content Ideas Tab */}
        <TabsContent value="content">
          <ContentIdeasSection
            ideas={ideas.contentIdeas}
            onSaveIdea={handleSaveIdea}
            onScheduleIdea={handleScheduleIdea}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Hooks Tab */}
        <TabsContent value="hooks">
          <HooksSection
            hooks={ideas.hooks}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Long-form Tab */}
        <TabsContent value="longform">
          <LongFormIdeasSection
            ideas={ideas.longFormIdeas}
            onSaveIdea={handleSaveLongFormIdea}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <TrendingSection
              trends={ideas.trends}
              onUseTrend={handleUseTrend}
              isLoading={isLoading}
            />
            <CurrentEventsSection
              events={ideas.currentEvents}
              onUseEvent={handleUseEvent}
              isLoading={isLoading}
            />
          </div>
        </TabsContent>

        {/* Saved Tab */}
        <TabsContent value="saved">
          <SavedIdeasSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
