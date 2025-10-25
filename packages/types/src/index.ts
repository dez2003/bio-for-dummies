export type CaptionMessage = 
  | { type: 'partial'; text: string }
  | { type: 'final'; text: string };

export type AnswerMessage = {
  type: 'answer';
  summary: string;
  sources?: { title: string; url: string }[];
  mode: 'ELI5' | 'Scientific';
};

export type UserPreferences = {
  mode: 'ELI5' | 'Scientific';
  detail: 'summary' | 'summary+sources';
};

export type PageContext = {
  url: string;
  title: string;
  selection?: string;
  surroundingText?: string;
};

export type AgentStatus = 'idle' | 'connecting' | 'recording' | 'thinking' | 'speaking';

export type Source = {
  title: string;
  url: string;
  snippet?: string;
};

export type RetrievalResult = {
  summary: string;
  sources: Source[];
};

