export interface ParsedItem {
  id: string;
  label: string;
  content: string;
  type: 'headline' | 'copy' | 'cta' | 'angle' | 'description' | 'generic';
}

export interface ParsedSection {
  id: string;
  type: 'intro' | 'ad-concept' | 'headline-variants' | 'copy' | 'generic';
  title?: string;
  content: string;
  items?: ParsedItem[];
  metadata?: {
    angle?: string;
    headline?: string;
    primaryText?: string;
    cta?: string;
  };
}

/**
 * Parse AI response into sections based on markdown headers, dividers, numbered lists, and bold headers
 */
export function parseAIResponse(content: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  
  // Split by markdown headers (## or ###), dividers (--- or ===), numbered items, and bold headers
  const lines = content.split('\n');
  let currentSection: { title?: string; content: string[]; startLine: number } | null = null;
  let sectionCounter = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Detect section headers
    const isHeader = /^#{2,3}\s+(.+)/.test(trimmedLine);
    const isDivider = /^(---+|===+)$/.test(trimmedLine);
    const isNumberedItem = /^(\d+)\.\s+(.+)/.test(trimmedLine) && trimmedLine.length > 10; // At least substantial content
    const isBoldHeader = /^\*\*(.+?):\*\*/.test(trimmedLine);
    
    if (isHeader || isDivider || (isNumberedItem && currentSection) || (isBoldHeader && currentSection)) {
      // Save previous section if exists
      if (currentSection && currentSection.content.length > 0) {
        const sectionContent = currentSection.content.join('\n').trim();
        if (sectionContent) {
          sections.push(createSection(
            sectionCounter++,
            currentSection.title,
            sectionContent
          ));
        }
      }
      
      // Start new section
      if (isHeader) {
        const match = trimmedLine.match(/^#{2,3}\s+(.+)/);
        currentSection = {
          title: match ? match[1] : undefined,
          content: [],
          startLine: i
        };
      } else if (isNumberedItem) {
        const match = trimmedLine.match(/^(\d+)\.\s+(.+)/);
        currentSection = {
          title: match ? match[2].substring(0, 50) : undefined, // Use first part as title
          content: [line],
          startLine: i
        };
      } else if (isBoldHeader) {
        const match = trimmedLine.match(/^\*\*(.+?):\*\*/);
        currentSection = {
          title: match ? match[1] : undefined,
          content: [line],
          startLine: i
        };
      } else {
        // Divider without title
        currentSection = {
          content: [],
          startLine: i
        };
      }
    } else if (currentSection) {
      // Add line to current section
      currentSection.content.push(line);
    } else {
      // No section started yet, create intro section
      if (!currentSection) {
        currentSection = {
          content: [],
          startLine: i
        };
      }
      currentSection.content.push(line);
    }
  }
  
  // Save last section
  if (currentSection && currentSection.content.length > 0) {
    const sectionContent = currentSection.content.join('\n').trim();
    if (sectionContent) {
      sections.push(createSection(
        sectionCounter++,
        currentSection.title,
        sectionContent
      ));
    }
  }
  
  // If no sections were detected, return single section
  if (sections.length === 0) {
    return [{
      id: 'section-0',
      type: 'generic',
      content: content.trim()
    }];
  }
  
  // Detect section types and extract items
  return sections.map(section => {
    const typedSection = detectSectionType(section);
    typedSection.items = extractItems(typedSection);
    return typedSection;
  });
}

/**
 * Create a section object
 */
function createSection(index: number, title: string | undefined, content: string): ParsedSection {
  return {
    id: `section-${index}`,
    type: 'generic',
    title,
    content
  };
}

/**
 * Detect section type based on title and content patterns
 */
function detectSectionType(section: ParsedSection): ParsedSection {
  const titleLower = section.title?.toLowerCase() || '';
  const contentLower = section.content.toLowerCase();
  
  // Detect intro sections (usually first, short, no structured ad content)
  if (!section.title && section.content.length < 200 && !hasAdPattern(section.content)) {
    return { ...section, type: 'intro' };
  }
  
  // Detect ad concepts
  if (
    titleLower.includes('ad concept') ||
    titleLower.includes('angle') ||
    titleLower.includes('variant') ||
    hasAdPattern(section.content)
  ) {
    return {
      ...section,
      type: 'ad-concept',
      metadata: extractAdMetadata(section.content)
    };
  }
  
  // Detect headline variants
  if (
    titleLower.includes('headline') ||
    (contentLower.includes('headline') && hasNumberedList(section.content))
  ) {
    return { ...section, type: 'headline-variants' };
  }
  
  // Detect copy sections
  if (
    titleLower.includes('copy') ||
    titleLower.includes('primary text') ||
    titleLower.includes('body')
  ) {
    return { ...section, type: 'copy' };
  }
  
  return section;
}

/**
 * Extract individual items from section content (numbered lists, bullet lists, labeled items)
 */
function extractItems(section: ParsedSection): ParsedItem[] {
  const items: ParsedItem[] = [];
  const lines = section.content.split('\n');
  let itemCounter = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Match numbered items: "1. Content" or "1) Content"
    const numberedMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);
    if (numberedMatch) {
      const content = numberedMatch[2].trim();
      const itemType = detectItemType(content, section.type);
      items.push({
        id: `${section.id}-item-${itemCounter++}`,
        label: `#${numberedMatch[1]}`,
        content: cleanItemContent(content),
        type: itemType
      });
      continue;
    }
    
    // Match bullet items: "- Content" or "• Content" or "* Content"
    const bulletMatch = trimmed.match(/^[-•*]\s+(.+)/);
    if (bulletMatch) {
      const content = bulletMatch[1].trim();
      const itemType = detectItemType(content, section.type);
      items.push({
        id: `${section.id}-item-${itemCounter++}`,
        label: '',
        content: cleanItemContent(content),
        type: itemType
      });
      continue;
    }
    
    // Match labeled items: "**Headline:** Content" or "Headline: Content"
    const labeledMatch = trimmed.match(/^\*\*(.+?):\*\*\s*(.+)/) || trimmed.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?):\s+(.+)/);
    if (labeledMatch) {
      const label = labeledMatch[1].trim();
      const content = labeledMatch[2].trim();
      const itemType = detectItemTypeFromLabel(label);
      items.push({
        id: `${section.id}-item-${itemCounter++}`,
        label,
        content: cleanItemContent(content),
        type: itemType
      });
      continue;
    }
  }
  
  return items;
}

/**
 * Detect item type from content and section context
 */
function detectItemType(content: string, sectionType: ParsedSection['type']): ParsedItem['type'] {
  const contentLower = content.toLowerCase();
  
  // Check for CTA patterns
  if (/^(get|start|try|buy|shop|claim|discover|join|sign up|learn more|click|order|download)/i.test(content)) {
    return 'cta';
  }
  
  // Check for angle/hook patterns
  if (contentLower.includes('angle:') || contentLower.includes('hook:')) {
    return 'angle';
  }
  
  // Use section type as hint
  if (sectionType === 'headline-variants') {
    return 'headline';
  }
  if (sectionType === 'copy') {
    return 'copy';
  }
  
  // Short content = likely headline, long = copy
  if (content.length < 80 && !content.includes('.')) {
    return 'headline';
  }
  if (content.length > 150) {
    return 'copy';
  }
  
  return 'generic';
}

/**
 * Detect item type from label
 */
function detectItemTypeFromLabel(label: string): ParsedItem['type'] {
  const labelLower = label.toLowerCase();
  
  if (labelLower.includes('headline') || labelLower.includes('title')) return 'headline';
  if (labelLower.includes('copy') || labelLower.includes('body') || labelLower.includes('text') || labelLower.includes('primary')) return 'copy';
  if (labelLower.includes('cta') || labelLower.includes('call to action') || labelLower.includes('button')) return 'cta';
  if (labelLower.includes('angle') || labelLower.includes('hook')) return 'angle';
  if (labelLower.includes('description') || labelLower.includes('desc')) return 'description';
  
  return 'generic';
}

/**
 * Clean item content (remove leading bold markers, quotes, etc.)
 */
function cleanItemContent(content: string): string {
  return content
    .replace(/^\*\*(.+?)\*\*\s*[-–:]\s*/, '') // Remove bold prefix with separator
    .replace(/^[""]|[""]$/g, '') // Remove smart quotes
    .replace(/^"|"$/g, '') // Remove regular quotes
    .trim();
}

/**
 * Check if content has ad patterns (Angle, Headline, Primary Text, CTA, etc.)
 */
function hasAdPattern(content: string): boolean {
  const adKeywords = [
    /\*\*angle:\*\*/i,
    /\*\*headline:\*\*/i,
    /\*\*primary text:\*\*/i,
    /\*\*primary:\*\*/i,
    /\*\*cta:\*\*/i,
    /\*\*call to action:\*\*/i,
    /\*\*description:\*\*/i
  ];
  
  return adKeywords.some(pattern => pattern.test(content));
}

/**
 * Check if content has numbered list (1., 2., 3., etc.)
 */
function hasNumberedList(content: string): boolean {
  return /^\d+\.\s+/m.test(content);
}

/**
 * Extract ad metadata from content (Angle, Headline, Primary Text, CTA)
 */
function extractAdMetadata(content: string): ParsedSection['metadata'] {
  const metadata: ParsedSection['metadata'] = {};
  
  // Extract angle
  const angleMatch = content.match(/\*\*angle:\*\*\s*(.+?)(?:\n|$)/i);
  if (angleMatch) metadata.angle = angleMatch[1].trim();
  
  // Extract headline
  const headlineMatch = content.match(/\*\*headline:\*\*\s*(.+?)(?:\n|$)/i);
  if (headlineMatch) metadata.headline = headlineMatch[1].trim();
  
  // Extract primary text
  const primaryMatch = content.match(/\*\*(?:primary text|primary):\*\*\s*(.+?)(?:\n\*\*|\n\n|$)/is);
  if (primaryMatch) metadata.primaryText = primaryMatch[1].trim();
  
  // Extract CTA
  const ctaMatch = content.match(/\*\*(?:cta|call to action):\*\*\s*(.+?)(?:\n|$)/i);
  if (ctaMatch) metadata.cta = ctaMatch[1].trim();
  
  return metadata;
}
