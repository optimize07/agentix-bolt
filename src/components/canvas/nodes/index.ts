// Canvas Node Components
export { default as BaseNode } from './BaseNode';
export { default as TextNode } from './TextNode';
export { default as ImageNode } from './ImageNode';
export { default as UrlNode } from './UrlNode';
export { default as DocumentNode } from './DocumentNode';
export { default as VideoNode } from './VideoNode';
export { default as GroupNode } from './GroupNode';
export { default as BrainNode } from './BrainNode';
export { default as ChatNode } from './ChatNode';
export { default as CreativeNode } from './CreativeNode';

// Node type mapping for ReactFlow
import TextNode from './TextNode';
import ImageNode from './ImageNode';
import UrlNode from './UrlNode';
import DocumentNode from './DocumentNode';
import VideoNode from './VideoNode';
import GroupNode from './GroupNode';
import BrainNode from './BrainNode';
import ChatNode from './ChatNode';
import CreativeNode from './CreativeNode';

export const nodeTypes = {
  text: TextNode,
  image: ImageNode,
  url: UrlNode,
  document: DocumentNode,
  video: VideoNode,
  group: GroupNode,
  brain: BrainNode,
  chat: ChatNode,
  creative: CreativeNode,
};
