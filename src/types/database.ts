export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  college: string | null;
  branch: string | null;
  year: number | null;
  avatar_url: string | null;
  queries_used: number;
  queries_limit: number;
  plan: "free" | "pro";
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  page_count: number | null;
  status: "processing" | "ready" | "failed";
  summary: string | null;
  extracted_text: string | null;
  subject: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  type: "mcq" | "true_false" | "fill_blank" | "short_answer" | "assertion_reason";
  question: string;
  options?: string[];
  correct_answer: string | number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
}

export interface Quiz {
  id: string;
  user_id: string;
  document_id: string;
  title: string;
  questions: QuizQuestion[];
  difficulty: "easy" | "medium" | "hard" | "mixed";
  question_count: number;
  created_at: string;
}