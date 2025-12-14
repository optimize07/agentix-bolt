import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Calendar as CalendarIcon, Lock } from "lucide-react";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { toast } from "sonner";
import { CalendarView } from "@/components/calendar/CalendarView";
import { UpcomingPosts } from "@/components/calendar/UpcomingPosts";
import { ScheduledPostDialog } from "@/components/calendar/ScheduledPostDialog";
import { useAllFeatureToggles } from "@/hooks/useFeatureToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ScheduledPost {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  status: string;
  platform: string;
  content: string | null;
  image_url: string | null;
  color: string | null;
}

export default function Calendar() {
  const { clientId } = useParams<{ clientId: string }>();
  const { isEnabled, loading: loadingFeatures } = useAllFeatureToggles(clientId);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Check if feature is enabled
  const featureEnabled = loadingFeatures || isEnabled("feature.calendar");

  if (!loadingFeatures && !featureEnabled) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>Feature Disabled</CardTitle>
            <CardDescription>
              The Calendar feature is currently disabled for this client. Contact your administrator to enable it.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const fetchPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      let query = supabase
        .from("scheduled_posts")
        .select("*")
        .eq("user_id", user.id)
        .order("scheduled_at", { ascending: true });

      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load scheduled posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [clientId]);

  const handleDayClick = (date: Date) => {
    setSelectedPost(null);
    setSelectedDate(date);
    setDialogOpen(true);
  };

  const handlePostClick = (post: ScheduledPost) => {
    setSelectedPost(post);
    setSelectedDate(undefined);
    setDialogOpen(true);
  };

  const handleAddClick = () => {
    setSelectedPost(null);
    setSelectedDate(new Date());
    setDialogOpen(true);
  };

  const handleSave = async (postData: Omit<ScheduledPost, "id"> & { id?: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      if (postData.id) {
        // Update existing post
        const { error } = await supabase
          .from("scheduled_posts")
          .update({
            title: postData.title,
            description: postData.description,
            scheduled_at: postData.scheduled_at,
            status: postData.status,
            platform: postData.platform,
            content: postData.content,
            image_url: postData.image_url,
            color: postData.color,
          })
          .eq("id", postData.id)
          .eq("user_id", user.id);

        if (error) throw error;
        toast.success("Post updated");
      } else {
        // Create new post
        const { error } = await supabase.from("scheduled_posts").insert({
          title: postData.title,
          description: postData.description,
          scheduled_at: postData.scheduled_at,
          status: postData.status,
          platform: postData.platform,
          content: postData.content,
          image_url: postData.image_url,
          color: postData.color,
          client_id: clientId || null,
          user_id: user.id,
        });

        if (error) throw error;
        toast.success("Post scheduled");
      }

      fetchPosts();
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Failed to save post");
      throw error;
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { error } = await supabase
        .from("scheduled_posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Post deleted");
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
      throw error;
    }
  };

  const handleStatusChange = async (postId: string, status: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { error } = await supabase
        .from("scheduled_posts")
        .update({ status })
        .eq("id", postId)
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success(`Post ${status}`);
      fetchPosts();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <CalendarIcon className="h-8 w-8" />
          Calendar
        </h1>
        <p className="text-muted-foreground">Schedule and manage your campaigns</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-100px)]">
        {/* Calendar View - takes 2/3 on large screens */}
        <div className="lg:col-span-2">
          <CalendarView
            posts={posts}
            onDayClick={handleDayClick}
            onPostClick={handlePostClick}
          />
        </div>

        {/* Upcoming Posts Sidebar - takes 1/3 on large screens */}
        <div className="lg:col-span-1 h-full max-h-[600px]">
          <UpcomingPosts
            posts={posts}
            onAddClick={handleAddClick}
            onEditClick={handlePostClick}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <ScheduledPostDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        post={selectedPost}
        initialDate={selectedDate}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}

