// Constants for ChatNode component

// Context limits
export const MAX_TOTAL_CONTEXT = 100000; // ~25k tokens total
export const MAX_BLOCK_CHARS = 10000; // ~2.5k tokens per block

// Rate limiting
export const SEND_COOLDOWN_MS = 1000; // 1 second cooldown between sends

// AI Models
export const IMAGE_MODELS = [
  'google/gemini-2.5-flash-image', 
  'google/gemini-3-pro-image-preview'
];

// Models that can read/analyze images (vision capability)
export const VISION_MODELS = [
  'smart-auto',
  'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite', 
  'google/gemini-2.5-pro',
  'google/gemini-3-pro-preview',
  'openai/gpt-5',
  'openai/gpt-5-mini',
  'openai/gpt-5-nano',
  'openrouter/anthropic/claude-sonnet-4.5',
  'openrouter/anthropic/claude-sonnet-4',
  'openrouter/anthropic/claude-opus-4',
  'openrouter/anthropic/claude-3.5-sonnet'
];

// Creative detection keywords
export const CREATIVE_KEYWORDS = [
  'generate creative',
  'create ad',
  'make ad',
  'generate ad',
  'create campaign',
  'make creative',
  'write ad'
];

// Smart Auto model routing
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
  creative: 'google/gemini-2.5-pro',
  code: 'openai/gpt-5',
  analysis: 'google/gemini-2.5-pro',
  simple: 'google/gemini-2.5-flash-lite',
  default: 'google/gemini-2.5-flash',
};

// Categorized model menu structure
export const MODEL_CATEGORIES = [
  {
    id: 'smart',
    label: '🧠 Smart',
    description: 'Auto-selects best model',
    models: [
      { value: 'smart-auto', label: 'Smart Auto', description: 'Routes to optimal model' }
    ]
  },
  {
    id: 'text-fast',
    label: '⚡ Fast Text',
    description: 'Quick responses, can analyze images',
    models: [
      { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Fast & capable' },
      { value: 'google/gemini-2.5-flash-lite', label: 'Gemini Flash Lite', description: 'Ultra-fast, simple tasks' },
      { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini', description: 'Balanced speed & quality' },
      { value: 'openai/gpt-5-nano', label: 'GPT-5 Nano', description: 'Fastest GPT' }
    ]
  },
  {
    id: 'text-powerful',
    label: '🔥 Powerful Text',
    description: 'Complex reasoning, can analyze images',
    models: [
      { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Best reasoning & large context' },
      { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro', description: 'Next-gen, experimental' },
      { value: 'openai/gpt-5', label: 'GPT-5', description: 'Most powerful GPT' }
    ]
  },
  {
    id: 'claude',
    label: '🟣 Claude',
    description: 'Anthropic models via OpenRouter',
    models: [
      { value: 'openrouter/anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5', description: 'Best coding & agents' },
      { value: 'openrouter/anthropic/claude-opus-4', label: 'Claude Opus 4', description: 'Complex long-running tasks' },
      { value: 'openrouter/anthropic/claude-sonnet-4', label: 'Claude Sonnet 4', description: 'High-performance reasoning' },
      { value: 'openrouter/anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', description: 'Fast & smart' }
    ]
  },
  {
    id: 'image-gen',
    label: '🎨 Image Generation',
    description: 'Creates images from prompts',
    models: [
      { value: 'google/gemini-2.5-flash-image', label: 'Gemini Image', description: 'Fast image creation' },
      { value: 'google/gemini-3-pro-image-preview', label: 'Gemini 3 Image', description: 'Highest quality' }
    ]
  }
];
