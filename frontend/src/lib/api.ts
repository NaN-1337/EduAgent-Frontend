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
  needs_recap?: boolean; // optional: if true, generates recap from previous lecture
  previous_student_version?: string; // required if needs_recap=true: HTML content of previous lecture's student version
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

export interface GeneratePodcastRequest {
  student_version: string;
  teacher_version: string;
  grade: number;
  subject: string;
  teacher_id: string;
  lecture_id: string;
  target_duration?: number;
  return_dialogue?: boolean;
  silence_between_turns?: number;
  upload_to_firebase?: boolean;
}

export interface GeneratePodcastResponse {
  success: boolean;
  data: {
    audio_base64?: string;
    audio_size_bytes: number;
    duration_seconds: number;
    dialogue?: Array<{
      speaker: string;
      text: string;
    }>;
    firebase?: {
      path: string;
      download_url: string;
      size_bytes: number;
    };
    metadata: {
      grade: number;
      subject: string;
      teacher_id: string;
      lecture_id: string;
      duration_target: number;
      turns_count: number;
    };
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

/**
 * Generate educational podcast from lecture content
 */
export async function generatePodcast(
  request: GeneratePodcastRequest
): Promise<GeneratePodcastResponse["data"]> {
  const response = await fetch(`${API_BASE_URL}/api/generate-podcast`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...request,
      target_duration: request.target_duration || 300,
      return_dialogue: request.return_dialogue !== false,
      silence_between_turns: request.silence_between_turns || 500,
      upload_to_firebase: request.upload_to_firebase !== false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate podcast");
  }

  const data: GeneratePodcastResponse = await response.json();
  return data.data;
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

// ===========================
// Quiz API
// ===========================

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
  correctAnswerId: string;
}

export interface GenerateQuizRequest {
  student_version: string;
  num_questions?: number;
}

export interface GenerateQuizResponse {
  success: boolean;
  data: {
    questions: QuizQuestion[];
  };
}

/**
 * Generate quiz from lecture content
 */
export async function generateQuiz(
  request: GenerateQuizRequest
): Promise<GenerateQuizResponse["data"]> {
  const response = await fetch(`${API_BASE_URL}/api/generate-quiz`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      student_version: request.student_version,
      num_questions: request.num_questions || 10,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate quiz");
  }

  const data: GenerateQuizResponse = await response.json();
  return data.data;
}

/**
 * Homework Generation
 */

export interface GenerateHomeworkQuestionsRequest {
  lesson_content: string;
  num_exercises: number;
  subject: string;
  grade: number;
}

export interface HomeworkQuestion {
  id: number;
  question: string;
  type: "single-choice" | "multiple-choice" | "yes-no";
  options: string[];
}

export interface GenerateHomeworkQuestionsResponse {
  success: boolean;
  data: {
    questions: HomeworkQuestion[];
  };
}

export async function generateHomeworkQuestions(
  request: GenerateHomeworkQuestionsRequest
): Promise<GenerateHomeworkQuestionsResponse["data"]> {
  const response = await fetch(`${API_BASE_URL}/api/generate-homework-questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate homework questions");
  }

  const data: GenerateHomeworkQuestionsResponse = await response.json();
  return data.data;
}

export interface GenerateHomeworkRequest {
  lesson_content: string;
  num_exercises: number;
  subject: string;
  grade: number;
  questions: HomeworkQuestion[];
  answers: Record<string, string>;
}

export interface GenerateHomeworkResponse {
  success: boolean;
  data: {
    homework: string; // HTML content
  };
}

export async function generateHomework(
  request: GenerateHomeworkRequest
): Promise<GenerateHomeworkResponse["data"]> {
  const response = await fetch(`${API_BASE_URL}/api/generate-homework`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate homework");
  }

  const data: GenerateHomeworkResponse = await response.json();
  return data.data;
}

/**
 * Flashcards Generation
 */

export interface Flashcard {
  flashcard_text: string;
  answer: string;
}

export interface GenerateFlashcardsRequest {
  student_version: string;
  num_flashcards: number;
  subject?: string;
  grade?: number;
}

export interface GenerateFlashcardsResponse {
  success: boolean;
  data: {
    flashcards: Flashcard[];
    count: number;
    subject?: string;
    grade?: number;
  };
}

export async function generateFlashcards(
  request: GenerateFlashcardsRequest
): Promise<GenerateFlashcardsResponse["data"]> {
  const response = await fetch(`${API_BASE_URL}/api/generate-flashcards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate flashcards");
  }

  const data: GenerateFlashcardsResponse = await response.json();
  return data.data;
}

// ===========================
// Homework Submission API
// ===========================

export interface ParseSubmissionRequest {
  submission_url: string;
}

export interface ParseSubmissionResponse {
  success: boolean;
  data: {
    parsed_text: string;
    page_count: number;
    pages: string[];
  };
}

export async function parseSubmission(
  request: ParseSubmissionRequest
): Promise<ParseSubmissionResponse["data"]> {
  const response = await fetch(`${API_BASE_URL}/api/parse-submission`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to parse submission");
  }

  const data: ParseSubmissionResponse = await response.json();
  return data.data;
}

export interface GradeHomeworkRequest {
  homework_html: string;
  parsed_submission: string;
  subject?: string;
  grade?: number;
}

export interface GradeHomeworkResponse {
  success: boolean;
  data: {
    total_points_earned: number;
    total_points_possible: number;
    final_grade_percentage: number;
    exercises: Array<{
      exercise_number: number;
      exercise_content: string;
      student_solution: string;
      points_earned: number;
      max_points: number;
      percentage: number;
      feedback: string;
      is_correct: boolean;
      is_partial: boolean;
    }>;
    overall_feedback: string;
    subject?: string;
    grade_level?: number;
  };
}

export async function gradeHomework(
  request: GradeHomeworkRequest
): Promise<GradeHomeworkResponse["data"]> {
  const response = await fetch(`${API_BASE_URL}/api/grade-homework`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to grade homework");
  }

  const data: GradeHomeworkResponse = await response.json();
  return data.data;
}

