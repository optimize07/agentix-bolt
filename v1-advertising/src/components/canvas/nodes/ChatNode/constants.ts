// Constants for ChatNode component

// Context limits
export const MAX_TOTAL_CONTEXT = 100000; // ~25k tokens total
export const MAX_BLOCK_CHARS = 10000; // ~2.5k tokens per block

// Rate limiting
export const SEND_COOLDOWN_MS = 1000; // 1 second cooldown between sends

// AI Models - kept for internal use (QuickBatchGenerator)
export const IMAGE_MODELS = [
  'google/gemini-2.5-flash-image', 
  'google/gemini-3-pro-image-preview'
];

// Models that can read/analyze images (vision capability)
export const VISION_MODELS = [
  'openai/gpt-5',
  'openai/gpt-5-mini',
  'google/gemini-3-pro-preview',
  'openrouter/anthropic/claude-sonnet-4.5'
];

// Creative detection keywords
export const CREATIVE_KEYWORDS = [
  'generate creative',
  'create ad',
  'make ad',
  'generate ad',
  'create campaign',
  'make creative',
  'write ad',
  'ad ideas',
  'ad copy',
  'create ads',
  'generate ads',
  'write copy',
  'headline',
  'create content',
  'make content',
  'advertising',
  'creatives for',
  'ad concept',
  'marketing copy'
];

// Smart Auto model routing (kept for compatibility)
export const SMART_AUTO_MODEL = 'smart-auto';

export const MODEL_ROUTING = {
  VISION_KEYWORDS: ['read image', 'analyze image', 'describe image', 'what\'s in this', 'look at this', 'examine', 'identify', 'ocr', 'what do you see'],
  IMAGE_GEN_KEYWORDS: ['generate image', 'create image', 'draw', 'picture of', 'visualize', 'illustration', 'make an image'],
  CREATIVE_KEYWORDS: ['generate creative', 'create ad', 'make ad', 'write copy', 'campaign', 'headline', 'tagline'],
  CODE_KEYWORDS: ['write code', 'function', 'debug', 'typescript', 'javascript', 'api', 'implement', 'fix bug'],
  ANALYSIS_KEYWORDS: ['analyze', 'compare', 'explain why', 'strategy', 'evaluate', 'assess', 'review'],
  SIMPLE_THRESHOLD: 100, // chars - prompts under this are "simple"
};

export const MODEL_FOR_INTENT = {
  image: 'google/gemini-3-pro-image-preview',
  creative: 'google/gemini-3-pro-preview',
  code: 'openai/gpt-5',
  analysis: 'google/gemini-3-pro-preview',
  simple: 'openai/gpt-5-mini',
  default: 'google/gemini-3-pro-preview',
};

// Simplified model selection - only 4 models
export const MODEL_CATEGORIES = [
  {
    id: 'text-models',
    label: 'AI Models',
    description: 'Available text generation models',
    models: [
      { value: 'openai/gpt-5', label: 'GPT-5', description: 'Most powerful GPT model' },
      { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini', description: 'Balanced speed & quality' },
      { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro', description: 'Next-gen Google AI' },
      { value: 'openrouter/anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5', description: 'Best for coding & agents' }
    ]
  }
];
