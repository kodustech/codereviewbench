export const MODEL_NAMES: Record<string, { slug: string; displayName: string; provider: string }> = {
  'anthropic:messages:claude-sonnet-4-5-20250929': {
    slug: 'claude-sonnet-4-5',
    displayName: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
  },
  'anthropic:messages:claude-haiku-4-5-20251001': {
    slug: 'claude-haiku-4-5',
    displayName: 'Claude Haiku 4.5',
    provider: 'Anthropic',
  },
  'google:gemini-2.5-pro': {
    slug: 'gemini-2-5-pro',
    displayName: 'Gemini 2.5 Pro',
    provider: 'Google',
  },
  'google:gemini-3.1-pro-preview': {
    slug: 'gemini-3-1-pro',
    displayName: 'Gemini 3.1 Pro',
    provider: 'Google',
  },
  'google:gemini-3-flash-preview': {
    slug: 'gemini-3-flash',
    displayName: 'Gemini 3 Flash',
    provider: 'Google',
  },
  'openai:gpt-5.2': {
    slug: 'gpt-5-2',
    displayName: 'GPT-5.2',
    provider: 'OpenAI',
  },
  'openrouter:moonshotai/kimi-k2.5': {
    slug: 'kimi-k2-5',
    displayName: 'Kimi K2.5',
    provider: 'Moonshot AI',
  },
  'openrouter:z-ai/glm-5': {
    slug: 'glm-5',
    displayName: 'GLM-5',
    provider: 'Zhipu AI',
  },
};

export const LANGUAGE_LABELS: Record<string, string> = {
  'typescript/node': 'Node.js',
  'python': 'Python',
  'typescript/react': 'React',
  'ruby': 'Ruby',
  'java': 'Java',
};

export const LANGUAGE_COLORS: Record<string, string> = {
  'typescript/node': '#3178c6',
  'python': '#3572a5',
  'typescript/react': '#61dafb',
  'ruby': '#cc342d',
  'java': '#b07219',
};

export const PROVIDER_COLORS: Record<string, string> = {
  Anthropic: '#d4a27f',
  Google: '#4285f4',
  OpenAI: '#10a37f',
  'Moonshot AI': '#6366f1',
  'Zhipu AI': '#f59e0b',
};

export const CATEGORY_LABELS: Record<string, string> = {
  local: 'Local Logic',
  'cross-file': 'Cross-File',
};

export const ALL_LANGUAGES = Object.keys(LANGUAGE_LABELS);
export const ALL_CATEGORIES = ['local', 'cross-file'];
