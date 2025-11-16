import { LearningPath, Chapter } from "@/types/learningPath";
import { Translations } from "@/lib/translations";
import { getTranslatedChapter } from "./chapterTranslations";

// Type for the exam data from JSON
export interface ExamData {
  exam_name: string;
  exam_subject: string;
  chapters: {
    number: number;
    title: string;
    description: string;
  }[];
}

// Map exam_subject from JSON to teachingFields key
function mapExamSubjectToTeachingField(examSubject: string): string {
  const subject = examSubject.toLowerCase();
  
  // Map exam_subject to teachingFields key
  if (subject.includes("limba") && subject.includes("literatura") && subject.includes("română")) {
    return "Romanian Language and Literature";
  }
  if (subject.includes("limba") && subject.includes("literatura") && subject.includes("romana")) {
    return "Romanian Language and Literature";
  }
  if (subject.includes("matematică") || subject.includes("matematica")) {
    return "Mathematics";
  }
  if (subject.includes("biologie") || subject.includes("biology")) {
    return "Biology";
  }
  if (subject.includes("istorie") || subject.includes("history")) {
    if (subject.includes("comunism") || subject.includes("holocaust") || subject.includes("evreilor")) {
      return "History of Communism in Romania";
    }
    return "History";
  }
  if (subject.includes("geografie") || subject.includes("geography")) {
    return "Geography";
  }
  if (subject.includes("informatică") || subject.includes("informatica") || subject.includes("computer")) {
    return "Computer Science";
  }
  if (subject.includes("stiinte") && subject.includes("naturii")) {
    return "Natural Sciences";
  }
  if (subject.includes("stiinte") || subject.includes("sciences")) {
    return "Sciences";
  }
  
  // Default fallback
  return "Mathematics";
}

// Map exam_name to display title with translation
function mapExamNameToTitle(examName: string, translations?: Translations["individual"]["learningPaths"]): string {
  if (examName.includes("Evaluarea Națională") || examName.includes("Evaluarea Nationala")) {
    return translations?.examTypes.evaluareNationala || "Evaluare Națională";
  }
  if (examName.includes("Bacalaureat") || examName.includes("Baccalaureate")) {
    return translations?.examTypes.bacalaureat || "Bacalaureat";
  }
  return examName;
}

// Map exam_subject to translated subject name
function mapExamSubjectToTranslatedName(examSubject: string, translations?: Translations["individual"]["learningPaths"]): string {
  const subject = examSubject.toLowerCase();
  
  if (subject.includes("matematică") || subject.includes("matematica") || subject.includes("mathematics")) {
    return translations?.subjects.matematica || examSubject;
  }
  if ((subject.includes("limba") && subject.includes("literatura") && subject.includes("română")) ||
      (subject.includes("limba") && subject.includes("literatura") && subject.includes("romana")) ||
      subject.includes("romanian language")) {
    return translations?.subjects.limbaSiLiteraturaRomana || examSubject;
  }
  if (subject.includes("istorie") || subject.includes("history")) {
    if (subject.includes("comunism") || subject.includes("communism")) {
      return translations?.subjects.istoriaComunismului || examSubject;
    }
    return translations?.subjects.istorie || examSubject;
  }
  if (subject.includes("biologie") || subject.includes("biology")) {
    return translations?.subjects.biologie || examSubject;
  }
  if (subject.includes("geografie") || subject.includes("geography")) {
    return translations?.subjects.geografie || examSubject;
  }
  if (subject.includes("informatică") || subject.includes("informatica") || subject.includes("computer")) {
    return translations?.subjects.informatica || examSubject;
  }
  if (subject.includes("stiinte") && subject.includes("naturii")) {
    return translations?.subjects.stiinteAleNaturii || examSubject;
  }
  if (subject.includes("stiinte") || subject.includes("sciences")) {
    return translations?.subjects.stiinte || examSubject;
  }
  
  return examSubject;
}

// Convert exam data to LearningPath
export function examDataToLearningPath(
  examData: ExamData,
  userId: string,
  existingPaths: LearningPath[] = [],
  translations?: Translations["individual"]["learningPaths"],
  language: "ro" | "en" = "ro"
): LearningPath {
  const teachingFieldKey = mapExamSubjectToTeachingField(examData.exam_subject);
  const title = mapExamNameToTitle(examData.exam_name, translations);
  
  // Get subject display name with translation
  const subjectDisplay = mapExamSubjectToTranslatedName(examData.exam_subject, translations);
  
  // Get subjectStorage from mapping
  const subjectStorageMap: Record<string, string> = {
    "Romanian Language and Literature": "limba_si_literatura_romana",
    "Mathematics": "matematica",
    "Biology": "biologie",
    "History": "istorie",
    "History of Communism in Romania": "istoria_comunismului_din_romania",
    "Geography": "geografie",
    "Computer Science": "informatica",
    "Natural Sciences": "stiinte_ale_naturii",
    "Sciences": "stiinte",
  };
  const subjectStorage = subjectStorageMap[teachingFieldKey] || teachingFieldKey.toLowerCase();
  
  // Convert chapters from JSON to Chapter format with translations
  const chapters: Chapter[] = examData.chapters.map((ch, index) => {
    // First chapter is unlocked, rest are locked initially
    let status: "locked" | "unlocked" | "in_progress" | "completed" = index === 0 ? "unlocked" : "locked";
    
    // Get translation if language is English
    const translation = getTranslatedChapter(examData.exam_subject, ch.number, language, examData.exam_name);
    
    return {
      id: `${Date.now()}-${ch.number}`,
      title: translation?.title || ch.title, // Use translation if available, otherwise Romanian
      description: translation?.description || ch.description, // Use translation if available, otherwise Romanian
      status: status,
      order: ch.number,
    };
  });
  
  // Find existing path with same title and subject to preserve progress
  const existingPath = existingPaths.find(
    (p) => p.title === title && p.subject === subjectDisplay
  );
  
  // If exists, preserve progress
  let completed = 0;
  if (existingPath) {
    completed = existingPath.progress.completed;
    // Update chapter statuses based on progress
    chapters.forEach((ch, index) => {
      const existingChapter = existingPath.chapters.find((ec) => ec.order === ch.order);
      if (existingChapter) {
        ch.status = existingChapter.status;
      } else if (index <= completed) {
        ch.status = index < completed ? "completed" : "in_progress";
      }
    });
  }
  
  // Generate unique ID
  const pathId = existingPath?.id || `path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: pathId,
    title: title,
    subject: subjectDisplay,
    subjectStorage: subjectStorage,
    goal: title,
    chapters: chapters,
    createdAt: existingPath?.createdAt || new Date(),
    updatedAt: new Date(),
    userId: userId,
    progress: {
      completed: completed,
      total: chapters.length,
    },
  };
}

// Find exam data from JSON by exam_name and exam_subject
export function findExamData(
  examName: string,
  examSubject: string,
  examDataList: ExamData[]
): ExamData | null {
  return examDataList.find(
    (data) =>
      data.exam_name === examName &&
      data.exam_subject === examSubject
  ) || null;
}

// Map teachingField key to exam_subject from JSON
export function mapTeachingFieldToExamSubject(teachingFieldKey: string, examName: string): string | null {
  // For Evaluare Națională
  if (examName.includes("Evaluarea Națională") || examName.includes("Evaluarea Nationala")) {
    if (teachingFieldKey === "Romanian Language and Literature") {
      return "Limba și Literatura Română";
    }
    if (teachingFieldKey === "Mathematics") {
      return "Matematică";
    }
  }
  
  // For Bacalaureat
  if (examName.includes("Bacalaureat") || examName.includes("Baccalaureate")) {
    const subjectMap: Record<string, string> = {
      "Romanian Language and Literature": "Limba și Literatura Română",
      "Mathematics": "Matematică (M_mate-info)",
      "Biology": "Biologie (Anatomie și Fiziologie Umană, Genetică și Ecologie Umană)",
      "History": "Istorie",
      "History of Communism in Romania": "Istorie", // Will check if exam_subject contains "comunism"
      "Geography": "Geografie",
      "Computer Science": "Informatică (specializarea matematică-informatică)",
      "Natural Sciences": "Stiinte ale naturii",
      "Sciences": "Stiinte",
    };
    
    return subjectMap[teachingFieldKey] || null;
  }
  
  return null;
}

// Helper to find the best matching exam_subject for History of Communism
export function findBestExamSubjectMatch(
  teachingFieldKey: string,
  examName: string,
  examDataList: ExamData[]
): string | null {
  const baseSubject = mapTeachingFieldToExamSubject(teachingFieldKey, examName);
  
  if (!baseSubject) {
    return null;
  }
  
  // Special handling for "History of Communism in Romania"
  if (teachingFieldKey === "History of Communism in Romania") {
    // Look for exam_subject that contains "comunism" or "communism"
    const communismMatch = examDataList.find(
      (data) =>
        data.exam_name === examName &&
        (data.exam_subject.toLowerCase().includes("comunism") ||
         data.exam_subject.toLowerCase().includes("communism"))
    );
    
    if (communismMatch) {
      return communismMatch.exam_subject;
    }
  }
  
  return baseSubject;
}

// Find examData from a LearningPath (by matching title and subject)
export function findExamDataFromPath(
  path: { title: string; subject: string; subjectStorage?: string },
  examDataList: ExamData[]
): ExamData | null {
  // Determine the original exam_name from title
  let examName: string | null = null;
  if (path.title.includes("Evaluare") || path.title.includes("National Evaluation") || path.title.includes("National")) {
    examName = "Evaluarea Națională pentru Absolvenții Clasei a VIII-a";
  } else if (path.title.includes("Bacalaureat") || path.title.includes("Baccalaureate")) {
    examName = "Examenul de Bacalaureat din România";
  }
  
  if (!examName) {
    return null;
  }
  
  // Try to find exam_subject by matching the translated or original subject
  // First, try to match by subjectStorage if available
  if (path.subjectStorage) {
    const subjectStorageMap: Record<string, string[]> = {
      "limba_si_literatura_romana": ["Limba și Literatura Română"],
      "matematica": ["Matematică", "Matematică (M_mate-info)"],
      "biologie": ["Biologie (Anatomie și Fiziologie Umană, Genetică și Ecologie Umană)"],
      "istorie": ["Istorie", "Istoria comunismului din România"],
      "istoria_comunismului_din_romania": ["Istoria comunismului din România"],
      "geografie": ["Geografie"],
      "informatica": ["Informatică (specializarea matematică-informatică)"],
      "stiinte_ale_naturii": ["Stiinte ale naturii"],
      "stiinte": ["Stiinte"],
    };
    
    const possibleSubjects = subjectStorageMap[path.subjectStorage];
    if (possibleSubjects) {
      for (const possibleSubject of possibleSubjects) {
        const examData = findExamData(examName, possibleSubject, examDataList);
        if (examData) {
          return examData;
        }
      }
    }
  }
  
  // Fallback: try to match by subject name (could be translated or original)
  const subjectLower = path.subject.toLowerCase();
  
  // Try to find by matching subject keywords
  const matchedExamData = examDataList.find((data) => {
    if (data.exam_name !== examName) return false;
    
    const dataSubjectLower = data.exam_subject.toLowerCase();
    
    // Check for various subject matches
    if ((subjectLower.includes("matematică") || subjectLower.includes("mathematics")) &&
        (dataSubjectLower.includes("matematică") || dataSubjectLower.includes("matematica"))) {
      return true;
    }
    if ((subjectLower.includes("romanian") || subjectLower.includes("limba") || subjectLower.includes("literatura")) &&
        (dataSubjectLower.includes("limba") && dataSubjectLower.includes("literatura"))) {
      return true;
    }
    if ((subjectLower.includes("istorie") || subjectLower.includes("history")) &&
        (dataSubjectLower.includes("istorie"))) {
      if (subjectLower.includes("comunism") || subjectLower.includes("communism")) {
        return dataSubjectLower.includes("comunism");
      }
      return !dataSubjectLower.includes("comunism");
    }
    if ((subjectLower.includes("biologie") || subjectLower.includes("biology")) &&
        (dataSubjectLower.includes("biologie"))) {
      return true;
    }
    if ((subjectLower.includes("geografie") || subjectLower.includes("geography")) &&
        (dataSubjectLower.includes("geografie"))) {
      return true;
    }
    if ((subjectLower.includes("informatică") || subjectLower.includes("computer")) &&
        (dataSubjectLower.includes("informatică") || dataSubjectLower.includes("informatica"))) {
      return true;
    }
    
    return false;
  });
  
  return matchedExamData || null;
}

