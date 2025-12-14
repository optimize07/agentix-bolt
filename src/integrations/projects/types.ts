// Project Types

export type ProjectStatus = "not_started" | "in_progress" | "blocked" | "complete";
export type TaskStatus = "pending" | "in_progress" | "review" | "complete" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type AssetType = "image" | "video" | "document" | "text" | "link" | "audio" | "other";
export type AgentType = "human" | "automation";

export interface Project {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  description: string | null;
  department_id: string;
  owner: string | null;
  status: ProjectStatus;
  progress: number;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  cover_image_url: string | null;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProjectAssetStatus {
  id: string;
  user_id: string;
  client_id: string | null;
  name: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  is_final: boolean;
  created_at: string;
}

export interface ProjectAsset {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  asset_type: AssetType;
  content: string | null;
  file_path: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  status_id: string | null;
  status_name: string;
  owner_id: string | null;
  reviewer_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  source_agent_config_id: string | null;
  source_kb_item_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProjectTask {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  description: string | null;
  assignee: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  related_asset_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectAgent {
  id: string;
  user_id: string;
  project_id: string;
  agent_type: AgentType;
  agent_name: string;
  agent_role: string | null;
  agent_config_id: string | null;
  can_edit: boolean;
  can_approve: boolean;
  created_at: string;
}

export interface ProjectComment {
  id: string;
  user_id: string;
  project_id: string;
  content: string;
  author_name: string | null;
  related_asset_id: string | null;
  related_task_id: string | null;
  created_at: string;
}

// Extended types with relations
export interface ProjectWithDetails extends Project {
  tasks?: ProjectTask[];
  assets?: ProjectAsset[];
  agents?: ProjectAgent[];
  comments?: ProjectComment[];
}

// Input types for mutations
export interface CreateProjectInput {
  client_id: string;
  title: string;
  description?: string;
  department_id: string;
  owner?: string;
  due_date?: string;
  tags?: string[];
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  owner?: string;
  status?: ProjectStatus;
  progress?: number;
  due_date?: string;
  tags?: string[];
}

export interface CreateAssetInput {
  project_id: string;
  client_id?: string;
  title: string;
  asset_type: AssetType;
  content?: string;
  file_path?: string;
  file_url?: string;
  status_id?: string;
  source_agent_config_id?: string;
  source_kb_item_id?: string;
  metadata?: Record<string, any>;
}

export interface CreateTaskInput {
  project_id: string;
  title: string;
  description?: string;
  assignee?: string;
  priority?: TaskPriority;
  due_date?: string;
  related_asset_id?: string;
}

export interface AssignAgentInput {
  project_id: string;
  agent_type: AgentType;
  agent_name: string;
  agent_role?: string;
  agent_config_id?: string;
  can_edit?: boolean;
  can_approve?: boolean;
}

