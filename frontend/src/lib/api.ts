/**
 * API utility functions for the Romanian Education RAG System
 * Base URL: http://localhost:5000
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export interface Question {
  id: number;
  question: string;
  type: "single-choice" | "yes-no";
  options: string[];
}

export interface GenerateQuestionsRequest {
  title: string;
  subject: string;
  grade: number;
}

export interface GenerateQuestionsResponse {
  success: boolean;
  data: {
    questions: Question[];
  };
}

export interface GenerateLectureRequest {
  title: string;
  subject: string; // lowercase, e.g., "biologie"
  grade: number;
  questions: Question[];
  answers: Record<string, string>; // question ID -> selected answer
}

export interface GenerateLectureResponse {
  success: boolean;
  data: {
    student_version: string; // HTML
    teacher_version: string; // HTML
  };
}

export interface GeneratePresentationRequest {
  student_version: string;
  n_slides?: number;
  language?: string;
  template?: string;
  tone?: string;
  verbosity?: string;
  export_as?: "pptx" | "pdf";
  image_type?: string;
  theme?: string;
}

export interface Slide {
  slide_index: number;
  layout: string;
  html_content: string;
  speaker_note: string;
  content: {
    title?: string;
    subtitle?: string;
    body?: string;
    bullets?: string[];
  };
}

export interface GeneratePresentationResponse {
  success: boolean;
  data: {
    presentation: {
      id: string;
      download_url: string;
      edit_url: string;
      credits_consumed: number;
      n_slides: number;
      language: string;
      title: string;
    };
    slides: Slide[];
  };
}

/**
 * Generate clarifying questions for a lesson
 */
export async function generateQuestions(
  request: GenerateQuestionsRequest
): Promise<Question[]> {
  const response = await fetch(`${API_BASE_URL}/api/generate-questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate questions");
  }

  const data: GenerateQuestionsResponse = await response.json();
  return data.data.questions;
}

/**
 * Generate lecture content (student and teacher versions)
 */
export async function generateLecture(
  request: GenerateLectureRequest
): Promise<GenerateLectureResponse["data"]> {
  const response = await fetch(`${API_BASE_URL}/api/generate-lecture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate lecture");
  }

  const data: GenerateLectureResponse = await response.json();
  return data.data;
}

/**
 * Generate PowerPoint presentation from student version
 */
export async function generatePresentation(
  request: GeneratePresentationRequest
): Promise<GeneratePresentationResponse["data"]> {
  const response = await fetch(`${API_BASE_URL}/api/generate-presentation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate presentation");
  }

  const data: GeneratePresentationResponse = await response.json();
  return data.data;
}

/**
 * Download a file from a URL and return it as a Blob
 */
export async function downloadFile(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  return await response.blob();
}

// ===========================
// Chat API
// ===========================

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface StartChatRequest {
  lesson_content: string;
  user_prompt: string;
  subject: string;
  user_role: "student";
  grade: number;
}

export interface ContinueChatRequest {
  session_id: string;
  user_prompt: string;
}

export interface ChatResponse {
  success: boolean;
  data: {
    session_id: string;
    response: string;
    user_role: string;
    grade: number | null;
    message_count: number;
  };
}

/**
 * Start a new chat session
 */
export async function startChat(
  request: StartChatRequest
): Promise<ChatResponse["data"]> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to start chat");
  }

  const data: ChatResponse = await response.json();
  return data.data;
}

/**
 * Continue an existing chat session
 */
export async function continueChat(
  request: ContinueChatRequest
): Promise<ChatResponse["data"]> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to continue chat");
  }

  const data: ChatResponse = await response.json();
  return data.data;
}

