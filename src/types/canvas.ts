// Canvas 2 Type Definitions

export type CanvasBlockType = 
  | 'text' 
  | 'image' 
  | 'url' 
  | 'document' 
  | 'video' 
  | 'group' 
  | 'chat' 
  | 'brain' 
  | 'creative';

export type ParsingStatus = 'none' | 'pending' | 'processing' | 'completed' | 'failed';

export interface CanvasBlock {
  id: string;
  user_id: string;
  agent_board_id: string;
  type: CanvasBlockType;
  title: string | null;
  content: string | null;
  url: string | null;
  file_path: string | null;
  file_url: string | null;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  color: string | null;
  instruction_prompt: string | null;
  group_id: string | null;
  parsing_status: ParsingStatus;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CanvasEdge {
  id: string;
  user_id: string;
  agent_board_id: string;
  source_block_id: string;
  target_block_id: string;
  edge_type: string;
  color: string | null;
  created_at: string;
}

// ReactFlow Node Data
export interface CanvasNodeData {
  id: string;
  type: CanvasBlockType;
  title: string;
  content: string;
  url: string;
  filePath: string;
  fileUrl: string;
  color: string;
  instructionPrompt: string;
  groupId: string | null;
  parsingStatus: ParsingStatus;
  metadata: Record<string, any>;
  // Connected blocks for ChatNode context
  connectedBlocks?: CanvasBlock[];
  // Callbacks
  onContentChange?: (content: string) => void;
  onTitleChange?: (title: string) => void;
  onInstructionChange?: (instruction: string) => void;
  onDelete?: () => void;
  onResize?: (width: number, height: number) => void;
  onPushToCreative?: (content: string, contentType: string) => void;
}

// Input types for mutations
export interface CreateBlockInput {
  agent_board_id: string;
  type: CanvasBlockType;
  title?: string;
  content?: string;
  url?: string;
  file_path?: string;
  file_url?: string;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  color?: string;
  instruction_prompt?: string;
  group_id?: string;
  metadata?: Record<string, any>;
}

export interface UpdateBlockInput {
  title?: string;
  content?: string;
  url?: string;
  file_path?: string;
  file_url?: string;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  color?: string;
  instruction_prompt?: string;
  group_id?: string;
  parsing_status?: ParsingStatus;
  metadata?: Record<string, any>;
}

export interface CreateEdgeInput {
  agent_board_id: string;
  source_block_id: string;
  target_block_id: string;
  edge_type?: string;
  color?: string;
}

// Context building for AI
export interface ConnectedContext {
  type: CanvasBlockType;
  label: string;
  content: string;
  imageUrl?: string;
  instructionPrompt?: string;
}

// Convert database block to ReactFlow node
export function blockToNode(block: CanvasBlock): { id: string; type: string; position: { x: number; y: number }; data: CanvasNodeData } {
  return {
    id: block.id,
    type: block.type,
    position: { x: block.position_x, y: block.position_y },
    data: {
      id: block.id,
      type: block.type,
      title: block.title || '',
      content: block.content || '',
      url: block.url || '',
      filePath: block.file_path || '',
      fileUrl: block.file_url || '',
      color: block.color || '',
      instructionPrompt: block.instruction_prompt || '',
      groupId: block.group_id,
      parsingStatus: block.parsing_status,
      metadata: block.metadata || {},
    },
  };
}

// Convert database edge to ReactFlow edge
export function edgeToReactFlowEdge(edge: CanvasEdge): { id: string; source: string; target: string; type?: string; style?: Record<string, any> } {
  return {
    id: edge.id,
    source: edge.source_block_id,
    target: edge.target_block_id,
    type: edge.edge_type || 'default',
    style: edge.color ? { stroke: edge.color } : undefined,
  };
}
