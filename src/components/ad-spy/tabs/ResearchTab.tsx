import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { untypedSupabase as supabase } from "@/integrations/supabase/untyped-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Play, Pause, Trash2, Clock, TrendingUp } from "lucide-react";

type AgentType = 'industry' | 'brand' | 'keyword' | 'category';

export function ResearchTab() {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [agentName, setAgentName] = useState("");
  const [agentType, setAgentType] = useState<AgentType>('industry');
  const [query, setQuery] = useState("");
  const [description, setDescription] = useState("");
  const [schedule, setSchedule] = useState('daily');
  const queryClient = useQueryClient();

  const { data: agents = [] } = useQuery({
    queryKey: ['ad-spy-research-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_spy_research_agents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const createAgentMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('ad_spy_research_agents')
        .insert({
          name: agentName,
          type: agentType,
          query,
          description: description || null,
          schedule,
          status: 'active'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-spy-research-agents'] });
      toast({ title: "Research agent created successfully" });
      setView('list');
      resetForm();
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === 'active' ? 'paused' : 'active';
      const { error } = await supabase
        .from('ad_spy_research_agents')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-spy-research-agents'] });
      toast({ title: "Agent status updated" });
    }
  });

  const deleteAgentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ad_spy_research_agents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-spy-research-agents'] });
      toast({ title: "Agent deleted successfully" });
    }
  });

  const resetForm = () => {
    setAgentName("");
    setAgentType('industry');
    setQuery("");
    setDescription("");
    setSchedule('daily');
  };

  const handleCreateAgent = () => {
    if (!agentName.trim() || !query.trim()) {
      toast({ 
        title: "Please fill in all required fields", 
        variant: "destructive" 
      });
      return;
    }
    createAgentMutation.mutate();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'industry': return 'bg-primary';
      case 'brand': return 'bg-secondary';
      case 'keyword': return 'bg-accent';
      case 'category': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  const getTypeExamples = (type: AgentType) => {
    switch (type) {
      case 'industry': return 'e.g., "Pet Food", "SaaS Tools"';
      case 'brand': return 'e.g., "organic skincare", "fitness tech"';
      case 'keyword': return 'e.g., "AI writing", "meal prep"';
      case 'category': return 'e.g., "Supplements", "Home Decor"';
    }
  };

  if (view === 'create') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Create Research Agent</h2>
          <Button variant="outline" onClick={() => setView('list')}>
            Cancel
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label htmlFor="agent-name">Agent Name *</Label>
              <Input
                id="agent-name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g., Q4 Holiday Trends"
              />
            </div>

            <div>
              <Label htmlFor="agent-type">Type *</Label>
              <Select value={agentType} onValueChange={(v) => setAgentType(v as AgentType)}>
                <SelectTrigger id="agent-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="industry">Industry</SelectItem>
                  <SelectItem value="brand">Brand</SelectItem>
                  <SelectItem value="keyword">Keyword</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Track an entire industry, discover brands, or monitor keywords
              </p>
            </div>

            <div>
              <Label htmlFor="query">Search Query *</Label>
              <Input
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={getTypeExamples(agentType)}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes about what you're tracking"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="schedule">Schedule</Label>
              <Select value={schedule} onValueChange={setSchedule}>
                <SelectTrigger id="schedule">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleCreateAgent}
              disabled={createAgentMutation.isPending}
              className="w-full"
            >
              {createAgentMutation.isPending ? "Creating..." : "Create Agent"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Research Agents</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track industries, brands, keywords, and categories automatically
          </p>
        </div>
        <Button onClick={() => setView('create')}>
          Create Agent
        </Button>
      </div>

      {agents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No research agents yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first agent to start tracking competitors, industries, or keywords
            </p>
            <Button onClick={() => setView('create')}>
              Create Your First Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent: any) => (
            <Card key={agent.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base mb-2">{agent.name}</CardTitle>
                    <div className="flex gap-2 mb-2">
                      <Badge variant="secondary" className={getTypeColor(agent.type)}>
                        {agent.type}
                      </Badge>
                      <Badge variant="outline">
                        {agent.status === 'active' ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Query</p>
                  <p className="text-sm text-muted-foreground">{agent.query}</p>
                </div>

                {agent.description && (
                  <div>
                    <p className="text-sm font-medium">Description</p>
                    <p className="text-sm text-muted-foreground">{agent.description}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {agent.schedule} • {agent.results_count || 0} results
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleStatusMutation.mutate({ 
                      id: agent.id, 
                      status: agent.status 
                    })}
                  >
                    {agent.status === 'active' ? (
                      <Pause className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteAgentMutation.mutate(agent.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}



