import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarView } from "@/components/calendar/CalendarView";
import { UpcomingPosts } from "@/components/calendar/UpcomingPosts";
import { ScheduledPostDialog } from "@/components/calendar/ScheduledPostDialog";

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
  agent_board_id: string | null;
}

export default function Calendar() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("scheduled_posts")
        .select("*")
        .order("scheduled_at", { ascending: true });

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
  }, []);

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
            agent_board_id: postData.agent_board_id,
          })
          .eq("id", postData.id);

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
          agent_board_id: postData.agent_board_id,
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
      const { error } = await supabase
        .from("scheduled_posts")
        .delete()
        .eq("id", postId);

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
      const { error } = await supabase
        .from("scheduled_posts")
        .update({ status })
        .eq("id", postId);

      if (error) throw error;
      toast.success(`Post ${status}`);
      fetchPosts();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

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
