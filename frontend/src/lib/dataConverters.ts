/**
 * Utility functions to convert between display format and Firestore storage format
 * 
 * Grades: Display "Grade 5" -> Storage 5 (integer)
 * Teaching Fields: Display "Matematica" -> Storage "matematica" (key)
 */

/**
 * Convert grade from display format ("Grade 5") to storage format (5)
 */
export function gradeToStorage(gradeDisplay: string): number | null {
  if (!gradeDisplay) return null;
  
  // Extract number from "Grade X" format
  const match = gradeDisplay.match(/Grade\s+(\d+)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  // If it's already a number string, convert it
  const num = parseInt(gradeDisplay, 10);
  if (!isNaN(num)) {
    return num;
  }
  
  return null;
}

/**
 * Convert grade from storage format (5) to display format ("Grade 5")
 */
export function gradeFromStorage(gradeStorage: number | string | null | undefined): string | null {
  if (gradeStorage === null || gradeStorage === undefined) return null;
  
  // If it's already a string in "Grade X" format, return as is
  if (typeof gradeStorage === "string" && gradeStorage.match(/Grade\s+\d+/i)) {
    return gradeStorage;
  }
  
  // Convert number to "Grade X" format
  const num = typeof gradeStorage === "number" ? gradeStorage : parseInt(String(gradeStorage), 10);
  if (!isNaN(num) && num > 0) {
    return `Grade ${num}`;
  }
  
  return null;
}

/**
 * Teaching field keys for storage (as specified by user)
 */
export const TEACHING_FIELD_KEYS = [
  "biologie",
  "chimie",
  "comunicare_in_limba_romana",
  "fizica",
  "geografie",
  "informatica",
  "informatica_si_tic",
  "istoria_comunismului_din_romania",
  "istorie",
  "limba_si_literatura_romana",
  "matematica",
  "matematica_si_explorarea_mediului",
  "stiinte",
  "stiinte_ale_naturii",
] as const;

export type TeachingFieldKey = typeof TEACHING_FIELD_KEYS[number];

/**
 * Mapping from display values (English keys from translations) to storage keys
 */
const TEACHING_FIELD_KEY_MAPPING: Record<string, TeachingFieldKey> = {
  "Biology": "biologie",
  "Chemistry": "chimie",
  "Communication in Romanian": "comunicare_in_limba_romana",
  "Physics": "fizica",
  "Geography": "geografie",
  "Computer Science": "informatica",
  "Computer Science and ICT": "informatica_si_tic",
  "History of Communism in Romania": "istoria_comunismului_din_romania",
  "History": "istorie",
  "Romanian Language and Literature": "limba_si_literatura_romana",
  "Mathematics": "matematica",
  "Mathematics and Environment Exploration": "matematica_si_explorarea_mediului",
  "Sciences": "stiinte",
  "Natural Sciences": "stiinte_ale_naturii",
};

/**
 * Reverse mapping from storage keys to display values (English keys)
 */
const TEACHING_FIELD_REVERSE_MAPPING: Record<TeachingFieldKey, string> = {
  "biologie": "Biology",
  "chimie": "Chemistry",
  "comunicare_in_limba_romana": "Communication in Romanian",
  "fizica": "Physics",
  "geografie": "Geography",
  "informatica": "Computer Science",
  "informatica_si_tic": "Computer Science and ICT",
  "istoria_comunismului_din_romania": "History of Communism in Romania",
  "istorie": "History",
  "limba_si_literatura_romana": "Romanian Language and Literature",
  "matematica": "Mathematics",
  "matematica_si_explorarea_mediului": "Mathematics and Environment Exploration",
  "stiinte": "Sciences",
  "stiinte_ale_naturii": "Natural Sciences",
};

/**
 * Convert teaching field from display format to storage format (key)
 */
export function teachingFieldToStorage(teachingFieldDisplay: string): string | null {
  if (!teachingFieldDisplay) return null;
  
  // If it's already a valid storage key, return it
  if (TEACHING_FIELD_KEYS.includes(teachingFieldDisplay as TeachingFieldKey)) {
    return teachingFieldDisplay;
  }
  
  // Try to map from English display key
  if (TEACHING_FIELD_KEY_MAPPING[teachingFieldDisplay]) {
    return TEACHING_FIELD_KEY_MAPPING[teachingFieldDisplay];
  }
  
  // Try case-insensitive match with storage keys
  const normalized = teachingFieldDisplay.toLowerCase().trim();
  for (const key of TEACHING_FIELD_KEYS) {
    if (key.toLowerCase() === normalized) {
      return key;
    }
  }
  
  // Return the original value if no match found (for backward compatibility)
  return teachingFieldDisplay;
}

/**
 * Convert teaching field from storage format (key) to display format (English key for translations)
 */
export function teachingFieldFromStorage(
  teachingFieldStorage: string | null | undefined
): string | null {
  if (!teachingFieldStorage) return null;
  
  // If it's already a display value (English key), return as is
  if (TEACHING_FIELD_REVERSE_MAPPING[teachingFieldStorage as TeachingFieldKey]) {
    return TEACHING_FIELD_REVERSE_MAPPING[teachingFieldStorage as TeachingFieldKey];
  }
  
  // If it's a storage key, convert to English key
  if (TEACHING_FIELD_REVERSE_MAPPING[teachingFieldStorage as TeachingFieldKey]) {
    return TEACHING_FIELD_REVERSE_MAPPING[teachingFieldStorage as TeachingFieldKey];
  }
  
  // Return as is if no mapping found (for backward compatibility)
  return teachingFieldStorage;
}

/**
 * Convert lesson data from Firestore storage format to display format
 */
export function convertLessonFromStorage(lessonData: any, translations: {
  grades: Record<string, string>;
  teachingFields: Record<string, string>;
}): any {
  return {
    ...lessonData,
    grade: lessonData.grade !== undefined
      ? (typeof lessonData.grade === "number"
          ? gradeFromStorage(lessonData.grade)
          : lessonData.grade)
      : undefined,
    subject: lessonData.subject
      ? (() => {
          // Convert storage key to English key, then get translation
          const englishKey = teachingFieldFromStorage(lessonData.subject);
          return englishKey ? (translations.teachingFields[englishKey] || lessonData.subject) : lessonData.subject;
        })()
      : undefined,
  };
}

