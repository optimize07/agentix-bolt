import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChatSidebar } from "@/components/ChatSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FolderKanban, Plus, Loader2 } from "lucide-react";
import { departmentsData } from "@/data/departments";
import { ClientSwitcher } from "@/components/ClientSwitcher";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProjectWithDepartments = Project & { departmentIds: string[] };

function getStatusBadgeVariant(status: ProjectStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "complete":
      return "default";
    case "blocked":
      return "destructive";
    default:
      return "secondary";
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

const ClientProjects = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // New project form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDepartment, setNewDepartment] = useState("operations");
  const [newOwner, setNewOwner] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  useEffect(() => {
    loadProjects();
  }, [clientId]);

  async function loadProjects() {
    if (!clientId) return;
    setLoading(true);
    try {
      const data = await listProjects(clientId);
      setProjects(data);
    } catch (e) {
      console.error("Failed to load projects:", e);
      // Show empty state instead of error for new users
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
        department_id: newDepartment,
        owner: newOwner || undefined,
        due_date: newDueDate || undefined,
      });
      toast({ title: "Project Created", description: "Your new project has been created." });
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
    setNewDepartment("operations");
    setNewOwner("");
    setNewDueDate("");
  }

  const departmentsById = useMemo(
    () =>
      departmentsData.reduce<Record<string, { title: string }>>((acc, d) => {
        acc[d.id] = { title: d.title };
        return acc;
      }, {}),
    [],
  );

  const projectsWithDepartments = useMemo<ProjectWithDepartments[]>(() => {
    return projects.map((project) => {
      const metadataDepartments = Array.isArray(project.metadata?.departments)
        ? project.metadata.departments.filter((id: unknown): id is string => typeof id === "string")
        : [];
      const tagDepartments = (project.tags || []).filter(
        (tag): tag is string => typeof tag === "string" && Boolean(departmentsById[tag]),
      );
      const departmentIds = Array.from(new Set([project.department_id, ...metadataDepartments, ...tagDepartments]));
      return { ...project, departmentIds };
    });
  }, [projects, departmentsById]);

  const sortedProjects = useMemo(
    () =>
      [...projectsWithDepartments].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      ),
    [projectsWithDepartments],
  );

  const uniqueDepartmentCount = useMemo(() => {
    const set = new Set<string>();
    projectsWithDepartments.forEach((project) => {
      project.departmentIds.forEach((id) => set.add(id));
    });
    return set.size;
  }, [projectsWithDepartments]);

  function handleProjectClick(project: Project) {
    // Navigate to the project detail page under operations
    navigate(`/client/${clientId}/operations/projects/${project.id}`);
  }

  return (
    <div className="flex h-screen w-full bg-background">
      <ChatSidebar />
      <main className="flex-1 overflow-auto">
        <div className="border-b border-border bg-background">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <FolderKanban className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold text-foreground">Projects</h1>
              <span className="text-sm text-muted-foreground">for</span>
              <ClientSwitcher />
            </div>
            <Button 
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        <div className="p-10">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No Projects Yet</h2>
              <p className="text-muted-foreground mb-6">
                Create your first project to get started.
              </p>
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
                <Card className="border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Total Projects</p>
                  <p className="text-2xl font-bold text-foreground">{projectsWithDepartments.length}</p>
                </Card>
                <Card className="border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Departments Involved</p>
                  <p className="text-2xl font-bold text-foreground">{uniqueDepartmentCount}</p>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {sortedProjects.map((p) => (
                  <Card
                    key={p.id}
                    className="border border-border bg-card p-5 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => handleProjectClick(p)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 flex-1">
                        <p className="text-sm font-semibold text-foreground">{p.title}</p>
                        {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                        <div className="flex flex-wrap gap-2">
                          {p.departmentIds.map((deptId) => (
                            <Badge key={deptId} variant="outline">
                              {departmentsById[deptId]?.title || deptId}
                            </Badge>
                          ))}
                          {p.departmentIds.length > 1 && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30">
                              Cross-department
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant={getStatusBadgeVariant(p.status)}>{getStatusLabel(p.status)}</Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-muted-foreground">Owner</p>
                        <p className="text-foreground">{p.owner || "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Due</p>
                        <p className="text-foreground">{p.due_date || "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Progress</p>
                        <p className="text-foreground">{p.progress}%</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Progress value={p.progress} />
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Create Project Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project Title *</Label>
              <Input
                placeholder="e.g., Q1 Marketing Campaign"
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
                <Label>Department</Label>
                <Select value={newDepartment} onValueChange={setNewDepartment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentsData.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Owner</Label>
                <Input
                  placeholder="Who owns this?"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                />
              </div>
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

export default ClientProjects;
