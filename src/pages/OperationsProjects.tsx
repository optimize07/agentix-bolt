import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { OperationsSidebar } from "@/components/OperationsSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Plus, 
  Loader2, 
  FolderKanban,
  Calendar,
  User,
} from "lucide-react";
import { listProjects, createProject } from "@/integrations/projects";
import type { Project, ProjectStatus } from "@/integrations/projects";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

function getStatusColor(status: ProjectStatus) {
  switch (status) {
    case "complete":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "in_progress":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "blocked":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case "not_started":
      return "Not Started";
    case "in_progress":
      return "In Progress";
    case "blocked":
      return "Blocked";
    case "complete":
      return "Complete";
    default:
      return status;
  }
}

const OperationsProjects = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  useEffect(() => {
    loadProjects();
  }, [clientId]);

  async function loadProjects() {
    if (!clientId) return;
    setLoading(true);
    try {
      const allProjects = await listProjects(clientId);
      // Filter to only operations projects
      const opsProjects = allProjects.filter(p => p.department_id === "operations");
      setProjects(opsProjects);
    } catch (e) {
      console.error("Failed to load projects:", e);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject() {
    if (!newTitle || !clientId) return;
    setCreating(true);
    try {
      await createProject({
        client_id: clientId,
        title: newTitle,
        description: newDescription || undefined,
        department_id: "operations", // Always operations for this page
        owner: newOwner || undefined,
        due_date: newDueDate || undefined,
      });
      toast({ title: "Project Created", description: "Your new operations project has been created." });
      setCreateOpen(false);
      resetForm();
      loadProjects();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to create project", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  function resetForm() {
    setNewTitle("");
    setNewDescription("");
    setNewOwner("");
    setNewDueDate("");
  }

  function handleProjectClick(project: Project) {
    navigate(`/client/${clientId}/operations/projects/${project.id}`);
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <OperationsSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(`/client/${clientId}`)}
          className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Client Dashboard
        </Button>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Operations Projects</h1>
            <p className="text-sm text-muted-foreground">
              Track automation rollouts, optimization initiatives, and QA efforts.
            </p>
          </div>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No Operations Projects</h2>
            <p className="text-muted-foreground mb-6">
              Create your first operations project to track automation and optimization work.
            </p>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="border border-border bg-card p-5 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleProjectClick(project)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-foreground">{project.title}</h3>
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>
                
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{project.owner || "Unassigned"}</span>
                  </div>
                  {project.due_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{project.due_date}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Operations Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project Title *</Label>
              <Input
                placeholder="e.g., Workflow Automation Phase 2"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What is this project about?"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Owner</Label>
                <Input
                  placeholder="Who owns this?"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={!newTitle || creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OperationsProjects;
