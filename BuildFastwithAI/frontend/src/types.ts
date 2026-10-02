export interface User {
  id: string;
  name: string;
  email: string;
  preferred_language: string;
  role?: string;
  profile_details?: Record<string, string> | null;
  created_at: string;
}

export interface BharatDocument {
  id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
  error_message: string | null;
  page_count: number;
  created_at: string;
}

export interface CitationItem {
  id: string;
  document_id: string;
  document_name: string | null;
  page_number: number;
  snippet: string;
}

export interface EligibilityResponse {
  status: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'UNCERTAIN';
  conditions_met: string[];
  conditions_unmet: string[];
  missing_info: string[];
  summary: string | null;
}

export interface ActionStep {
  step_number: number;
  title: string;
  description: string;
  portal_or_url: string | null;
}

export interface RequiredDoc {
  name: string;
  mandatory: boolean;
  purpose: string | null;
}

export interface DeadlineDetail {
  date_text: string | null;
  is_deadline_found: boolean;
  source_page: number | null;
  description: string | null;
}

export interface ActionPlan {
  steps: ActionStep[];
  deadline: DeadlineDetail | null;
  required_documents: RequiredDoc[];
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  language: string;
  confidence_score: number;
  needs_verification: boolean;
  created_at: string;
  citations: CitationItem[];
  eligibility: EligibilityResponse | null;
  action_plan: ActionPlan | null;
}

export interface ConversationSummary {
  id: string;
  title: string;
  document_id: string | null;
  created_at: string;
  message_count: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  name: string;
  email: string;
  preferred_language: string;
  role: string;
}

export const LANGUAGES: Record<string, string> = {
  en: 'English',
  hi: 'हिन्दी',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  bn: 'বাংলা',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  pa: 'ਪੰਜਾਬੀ',
  ur: 'اردو',
  or: 'ଓଡ଼ିଆ',
  as: 'অসমীয়া',
};

export const LANG_BCP47: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  ur: 'ur-IN',
  or: 'or-IN',
  as: 'as-IN',
};
