export type ChapterStatus = "locked" | "unlocked" | "in_progress" | "completed";

export interface Chapter {
  id: string;
  title: string;
  description: string;
  status: ChapterStatus;
  lessonId?: string; // ID of the lesson when clicked
  order: number;
}

export interface LearningPath {
  id: string;
  title: string; // e.g., "Evaluare Națională"
  subject: string;
  subjectStorage?: string; // Storage key for subject
  goal: string; // What they're preparing for
  chapters: Chapter[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  progress: {
    completed: number;
    total: number;
  };
}

