import { useState } from "react";
import { Bookmark, Trash2, Calendar, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";
import { toast } from "sonner";

interface SavedIdea {
  id: string;
  title: string;
  description: string | null;
  type: string;
  platform: string | null;
  status: string | null;
  created_at: string | null;
}

export function SavedIdeasSection() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: ideas, isLoading } = useQuery({
    queryKey: ["saved-ideas", selectedProjectId, typeFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("ideas")
        .select("*")
        .order("created_at", { ascending: false });

      if (selectedProjectId) {
        query = query.eq("project_id", selectedProjectId);
      }
      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SavedIdea[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ideas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-ideas"] });
      toast.success("Idea deleted");
    },
  });

  const statusColors: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    used: "bg-blue-500/20 text-blue-400",
    archived: "bg-muted text-muted-foreground",
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-primary" />
            Saved Ideas
          </h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-primary" />
          Saved Ideas
          {ideas && ideas.length > 0 && (
            <Badge variant="secondary">{ideas.length}</Badge>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="content_idea">Content</SelectItem>
              <SelectItem value="trend">Trend</SelectItem>
              <SelectItem value="hook">Hook</SelectItem>
              <SelectItem value="long_form">Long-form</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="used">Used</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!ideas || ideas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No saved ideas yet</p>
            <p className="text-sm mt-1">Generate and save ideas to see them here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ideas.map((idea) => (
            <Card key={idea.id} className="group hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground truncate">{idea.title}</h3>
                      <Badge className={statusColors[idea.status || "active"] || statusColors.active}>
                        {idea.status || "active"}
                      </Badge>
                    </div>
                    {idea.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{idea.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="capitalize">{idea.type.replace("_", " ")}</span>
                      {idea.platform && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{idea.platform}</span>
                        </>
                      )}
                      {idea.created_at && (
                        <>
                          <span>•</span>
                          <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Calendar className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(idea.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
