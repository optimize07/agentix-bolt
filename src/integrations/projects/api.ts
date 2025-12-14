// Projects API - Data access layer for project management

import { supabase } from "@/integrations/supabase/client";
import type {
  Project,
  ProjectWithDetails,
  ProjectAsset,
  ProjectAssetStatus,
  ProjectTask,
  ProjectAgent,
  ProjectComment,
  CreateProjectInput,
  UpdateProjectInput,
  CreateAssetInput,
  CreateTaskInput,
  AssignAgentInput,
  TaskStatus,
  ProjectStatus,
} from "./types";

// =============================================================================
// PROJECTS
// =============================================================================

export async function listProjects(clientId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as Project[];
}

export async function getProject(projectId: string): Promise<ProjectWithDetails | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data as unknown as ProjectWithDetails;
}

export async function getProjectWithDetails(projectId: string): Promise<ProjectWithDetails | null> {
  // Fetch project
  const project = await getProject(projectId);
  if (!project) return null;

  // Fetch related data in parallel
  const [tasksRes, assetsRes, agentsRes, commentsRes] = await Promise.all([
    supabase.from("project_tasks").select("*").eq("project_id", projectId).order("created_at", { ascending: true }),
    supabase.from("project_assets").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
    supabase.from("project_agents").select("*").eq("project_id", projectId),
    supabase.from("project_comments").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(50),
  ]);

  return {
    ...project,
    tasks: (tasksRes.data || []) as unknown as ProjectTask[],
    assets: (assetsRes.data || []) as unknown as ProjectAsset[],
    agents: (agentsRes.data || []) as unknown as ProjectAgent[],
    comments: (commentsRes.data || []) as unknown as ProjectComment[],
  };
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userData.user.id,
      client_id: input.client_id,
      title: input.title,
      description: input.description || null,
      department_id: input.department_id,
      owner: input.owner || null,
      due_date: input.due_date || null,
      tags: input.tags || [],
      status: "not_started",
      progress: 0,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as Project;
}

export async function updateProject(projectId: string, input: UpdateProjectInput): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as Project;
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus): Promise<Project> {
  const updates: any = { status, updated_at: new Date().toISOString() };
  
  if (status === "in_progress" && !updates.started_at) {
    updates.started_at = new Date().toISOString();
  }
  if (status === "complete") {
    updates.completed_at = new Date().toISOString();
    updates.progress = 100;
  }

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as Project;
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
}

// =============================================================================
// ASSET STATUSES (Kanban columns)
// =============================================================================

export async function listAssetStatuses(clientId?: string): Promise<ProjectAssetStatus[]> {
  // First try client-specific, fallback to agency defaults
  let query = supabase
    .from("project_asset_statuses")
    .select("*")
    .order("sort_order", { ascending: true });

  if (clientId) {
    query = query.or(`client_id.eq.${clientId},client_id.is.null`);
  } else {
    query = query.is("client_id", null);
  }

  const { data, error } = await query;
  if (error) throw error;

  // If we have client-specific and defaults, prefer client-specific
  const statuses = (data || []) as unknown as ProjectAssetStatus[];
  const clientStatuses = statuses.filter(s => s.client_id === clientId);
  return clientStatuses.length > 0 ? clientStatuses : statuses.filter(s => !s.client_id);
}

export async function ensureDefaultAssetStatuses(clientId?: string): Promise<ProjectAssetStatus[]> {
  let statuses = await listAssetStatuses(clientId);
  if (statuses.length > 0) return statuses;

  const defaults = [
    { name: "Draft", color: "#6366f1", sort_order: 0, is_default: true, is_final: false },
    { name: "Client Review", color: "#f59e0b", sort_order: 1, is_default: false, is_final: false },
    { name: "Approved", color: "#10b981", sort_order: 2, is_default: false, is_final: true },
  ];

  for (const status of defaults) {
    await createAssetStatus({
      client_id: clientId,
      name: status.name,
      color: status.color,
      sort_order: status.sort_order,
      is_default: status.is_default,
      is_final: status.is_final,
    });
  }

  statuses = await listAssetStatuses(clientId);
  return statuses;
}

export async function createAssetStatus(input: {
  client_id?: string;
  name: string;
  color?: string;
  sort_order: number;
  is_default?: boolean;
  is_final?: boolean;
}): Promise<ProjectAssetStatus> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("project_asset_statuses")
    .insert({
      user_id: userData.user.id,
      client_id: input.client_id || null,
      name: input.name,
      color: input.color || "#6366f1",
      sort_order: input.sort_order,
      is_default: input.is_default || false,
      is_final: input.is_final || false,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as ProjectAssetStatus;
}

// =============================================================================
// ASSETS
// =============================================================================

export async function listProjectAssets(projectId: string): Promise<ProjectAsset[]> {
  const { data, error } = await supabase
    .from("project_assets")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as ProjectAsset[];
}

export async function createAsset(input: CreateAssetInput): Promise<ProjectAsset> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) throw new Error("Not authenticated");

  // Get default status if not provided
  let statusId = input.status_id;
  let statusName = "Draft";

  if (!statusId) {
    const statuses = await ensureDefaultAssetStatuses(input.client_id);
    const defaultStatus = statuses.find(s => s.is_default) || statuses[0];
    if (defaultStatus) {
      statusId = defaultStatus.id;
      statusName = defaultStatus.name;
    }
  }

  const { data, error } = await supabase
    .from("project_assets")
    .insert({
      user_id: userData.user.id,
      project_id: input.project_id,
      title: input.title,
      asset_type: input.asset_type,
      content: input.content || null,
      file_path: input.file_path || null,
      file_url: input.file_url || null,
      status_id: statusId || null,
      status_name: statusName,
      source_agent_config_id: input.source_agent_config_id || null,
      source_kb_item_id: input.source_kb_item_id || null,
      metadata: input.metadata || {},
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as ProjectAsset;
}

export async function updateAssetStatus(assetId: string, statusId: string, statusName: string): Promise<ProjectAsset> {
  const { data, error } = await supabase
    .from("project_assets")
    .update({
      status_id: statusId,
      status_name: statusName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", assetId)
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as ProjectAsset;
}

export async function approveAsset(assetId: string, approverName: string): Promise<ProjectAsset> {
  const { data, error } = await supabase
    .from("project_assets")
    .update({
      approved_by: approverName,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", assetId)
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as ProjectAsset;
}

export async function deleteAsset(assetId: string): Promise<void> {
  const { error } = await supabase.from("project_assets").delete().eq("id", assetId);
  if (error) throw error;
}

// =============================================================================
// TASKS
// =============================================================================

export async function listProjectTasks(projectId: string): Promise<ProjectTask[]> {
  const { data, error } = await supabase
    .from("project_tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("due_date", { ascending: true });

  if (error) throw error;
  return (data || []) as unknown as ProjectTask[];
}

export async function createTask(input: CreateTaskInput): Promise<ProjectTask> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("project_tasks")
    .insert({
      user_id: userData.user.id,
      project_id: input.project_id,
      title: input.title,
      description: input.description || null,
      assignee: input.assignee || null,
      priority: input.priority || "medium",
      due_date: input.due_date || null,
      related_asset_id: input.related_asset_id || null,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as ProjectTask;
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<ProjectTask> {
  const updates: any = { status, updated_at: new Date().toISOString() };
  if (status === "complete") {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("project_tasks")
    .update(updates)
    .eq("id", taskId)
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as ProjectTask;
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from("project_tasks").delete().eq("id", taskId);
  if (error) throw error;
}

// =============================================================================
// AGENTS (Project assignments)
// =============================================================================

export async function listProjectAgents(projectId: string): Promise<ProjectAgent[]> {
  const { data, error } = await supabase
    .from("project_agents")
    .select("*")
    .eq("project_id", projectId);

  if (error) throw error;
  return (data || []) as unknown as ProjectAgent[];
}

export async function assignAgent(input: AssignAgentInput): Promise<ProjectAgent> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("project_agents")
    .insert({
      user_id: userData.user.id,
      project_id: input.project_id,
      agent_type: input.agent_type,
      agent_name: input.agent_name,
      agent_role: input.agent_role || null,
      agent_config_id: input.agent_config_id || null,
      can_edit: input.can_edit ?? true,
      can_approve: input.can_approve ?? false,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as ProjectAgent;
}

export async function removeAgent(assignmentId: string): Promise<void> {
  const { error } = await supabase.from("project_agents").delete().eq("id", assignmentId);
  if (error) throw error;
}

// =============================================================================
// COMMENTS
// =============================================================================

export async function listProjectComments(projectId: string, limit = 50): Promise<ProjectComment[]> {
  const { data, error } = await supabase
    .from("project_comments")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as unknown as ProjectComment[];
}

export async function addComment(input: {
  project_id: string;
  content: string;
  author_name?: string;
  related_asset_id?: string;
  related_task_id?: string;
}): Promise<ProjectComment> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("project_comments")
    .insert({
      user_id: userData.user.id,
      project_id: input.project_id,
      content: input.content,
      author_name: input.author_name || "User",
      related_asset_id: input.related_asset_id || null,
      related_task_id: input.related_task_id || null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as ProjectComment;
}

// =============================================================================
// HELPER: Save agent output as asset
// =============================================================================

export async function saveAgentOutputAsAsset(params: {
  projectId: string;
  clientId: string;
  agentConfigId: string;
  agentName: string;
  title: string;
  content: string;
  assetType?: "text" | "document";
}): Promise<ProjectAsset> {
  return createAsset({
    project_id: params.projectId,
    client_id: params.clientId,
    title: params.title,
    asset_type: params.assetType || "text",
    content: params.content,
    source_agent_config_id: params.agentConfigId,
    metadata: {
      generated_by: params.agentName,
      generated_at: new Date().toISOString(),
    },
  });
}

