// Type definitions for ChatNode component

export interface Message {
  id?: string;  // Database UUID for editing
  role: "user" | "assistant";
  content: string;
  images?: string[];
  creatives?: AdCreative[];
}

export interface AdCreative {
  title: string;
  headline: string;
  primary_text: string;
  description_text: string;
  visual_prompt?: string;
  tags: string[];
  image_data?: string;
}

export interface CreativeVariant {
  id: string;
  channel: 'google-ads' | 'tiktok-script' | 'facebook-ig' | 'carousel';
  headlines?: string[];
  descriptions?: string[];
  displayUrl?: string;
  hook?: string;
  body?: { scene: string; description: string; timestamp: string }[];
  cta?: string;
  images?: string[];
  primaryText?: string;
  headline?: string;
  ctaButton?: string;
}

export interface ConnectedBlock {
  id: string;
  type: string;
  title?: string;
  content?: string;
  url?: string;
  file_path?: string;
  instruction_prompt?: string;
}

export interface ChatNodeData {
  title?: string;
  sessionId?: string;
  boardId?: string;
  projectId?: string;
  blockId?: string;
  connectedBlocks?: ConnectedBlock[];
  connectedOutputNodes?: ConnectedBlock[];
  selected?: boolean;
  onUpdateNodeData?: (nodeId: string, newData: Partial<any>) => void;
}

export interface ChatNodeProps {
  data: ChatNodeData;
  selected: boolean;
}

export interface ParsedSection {
  id: string;
  type: 'intro' | 'ad-concept' | 'headline-variants' | 'copy' | 'generic';
  title?: string;
  content: string;
  metadata?: {
    angle?: string;
    headline?: string;
    primaryText?: string;
    cta?: string;
  };
}
