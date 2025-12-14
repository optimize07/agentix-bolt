import { useMemo } from 'react';
import { CanvasBlock, CanvasEdge, ConnectedContext } from '@/types/canvas';

/**
 * Builds AI context from blocks connected to a target node (typically a ChatNode)
 */
export function useContextBuilder(
  targetBlockId: string | undefined,
  blocks: CanvasBlock[],
  edges: CanvasEdge[]
) {
  const connectedBlocks = useMemo(() => {
    if (!targetBlockId) return [];

    // Find all edges where target is this block (incoming connections)
    const incomingEdges = edges.filter(e => e.target_block_id === targetBlockId);
    const sourceBlockIds = incomingEdges.map(e => e.source_block_id);

    // Get the source blocks
    const sourceBlocks = blocks.filter(b => sourceBlockIds.includes(b.id));

    // Expand groups to include their children
    const expandedBlocks: CanvasBlock[] = [];
    
    for (const block of sourceBlocks) {
      if (block.type === 'group') {
        // Add group itself
        expandedBlocks.push(block);
        // Add all children of this group
        const children = blocks.filter(b => b.group_id === block.id);
        expandedBlocks.push(...children);
      } else {
        expandedBlocks.push(block);
      }
    }

    return expandedBlocks;
  }, [targetBlockId, blocks, edges]);

  const contextString = useMemo(() => {
    if (connectedBlocks.length === 0) return '';

    const contextParts: string[] = [];

    for (const block of connectedBlocks) {
      const context = buildBlockContext(block);
      if (context) {
        contextParts.push(context);
      }
    }

    return contextParts.join('\n\n---\n\n');
  }, [connectedBlocks]);

  const contextItems = useMemo((): ConnectedContext[] => {
    return connectedBlocks
      .map(block => {
        const label = getBlockLabel(block);
        const content = getBlockContent(block);
        
        if (!content && block.type !== 'image') return null;

        return {
          type: block.type,
          label,
          content: content || '',
          imageUrl: block.type === 'image' ? (block.file_url || block.url || undefined) : undefined,
          instructionPrompt: block.instruction_prompt || undefined,
        };
      })
      .filter(Boolean) as ConnectedContext[];
  }, [connectedBlocks]);

  // Get image URLs for multimodal AI
  const imageUrls = useMemo(() => {
    return connectedBlocks
      .filter(b => b.type === 'image')
      .map(b => b.file_url || b.url)
      .filter(Boolean) as string[];
  }, [connectedBlocks]);

  return {
    connectedBlocks,
    contextString,
    contextItems,
    imageUrls,
  };
}

function buildBlockContext(block: CanvasBlock): string | null {
  const label = getBlockLabel(block);
  const content = getBlockContent(block);
  const instruction = block.instruction_prompt ? `\n[INSTRUCTION: ${block.instruction_prompt}]` : '';

  switch (block.type) {
    case 'text':
      return content ? `[${label}]${instruction}\n${content}` : null;

    case 'document':
      return content ? `[DOCUMENT: ${block.title || 'Untitled'}]${instruction}\n${content}` : null;

    case 'url':
      return content ? `[URL: ${block.title || block.url}]${instruction}\n${content}` : null;

    case 'image':
      return `[IMAGE REFERENCE: ${block.title || 'Reference Image'}]${instruction}\n(Image URL: ${block.file_url || block.url})`;

    case 'video':
      return content ? `[VIDEO: ${block.title || block.url}]${instruction}\n${content}` : null;

    case 'group':
      return block.title ? `[GROUP: ${block.title}]${instruction}` : null;

    case 'brain':
      return content ? `[CENTRAL BRAIN: ${block.title || 'Knowledge'}]${instruction}\n${content}` : null;

    default:
      return content ? `[${label}]${instruction}\n${content}` : null;
  }
}

function getBlockLabel(block: CanvasBlock): string {
  const baseLabel = block.type.toUpperCase();
  if (block.title) {
    return `${baseLabel} - ${block.title}`;
  }
  return baseLabel;
}

function getBlockContent(block: CanvasBlock): string | null {
  return block.content || null;
}

/**
 * Formats context for AI system prompt
 */
export function formatContextForAI(contextItems: ConnectedContext[]): string {
  if (contextItems.length === 0) return '';

  const sections: string[] = [
    '=== CONNECTED CONTEXT ===',
    'The following content is connected to this chat and should inform your responses:',
    '',
  ];

  for (const item of contextItems) {
    sections.push(`--- ${item.label} ---`);
    if (item.instructionPrompt) {
      sections.push(`[Use as: ${item.instructionPrompt}]`);
    }
    if (item.content) {
      sections.push(item.content);
    }
    if (item.imageUrl) {
      sections.push(`(Reference image provided)`);
    }
    sections.push('');
  }

  sections.push('=== END CONTEXT ===');
  
  return sections.join('\n');
}
