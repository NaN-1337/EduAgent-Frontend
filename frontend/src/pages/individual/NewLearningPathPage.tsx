import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, Loader2 } from "lucide-react";
import { translations } from "@/lib/translations";
import { teachingFieldToStorage } from "@/lib/dataConverters";
import { LearningPath } from "@/types/learningPath";
import { ExamData, examDataToLearningPath, findBestExamSubjectMatch, findExamData, findExamDataFromPath } from "@/utils/learningPathMapper";
import examDataJSON from "../../../learning_paths.json";

// Evaluation types - hardcoded
const EVALUATION_TYPES = {
  ro: {
    "evaluare_nationala": "Evaluare Națională",
    "bacalaureat": "Bacalaureat",
  },
  en: {
    "evaluare_nationala": "National Exam",
    "bacalaureat": "Baccalaureate",
  },
};

// Subject keys for Evaluare Națională (only Romanian and Mathematics)
// These are the keys from teachingFields translations (English keys)
const EVALUARE_NATIONALA_SUBJECTS = ["Romanian Language and Literature", "Mathematics"];

// Subject keys for Bacalaureat - only those that exist in JSON
const BACALAUREAT_SUBJECTS = [
  "Romanian Language and Literature",
  "Mathematics",
  "Biology",
  "History",
  "Geography"
  // Computer Science removed - not available for selection
];

export default function NewLearningPathPage() {
  const navigate = useNavigate();
  const { user, userData, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const [evaluationType, setEvaluationType] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<{ evaluationType?: string; subject?: string; general?: string }>({});

  // Determine base path based on role
  const basePath = userData?.role === "student" ? "/student/learning-paths" : "/individual/learning-paths";

  // Get available subjects from translations, filtered by evaluation type
  const getAllSubjects = () => {
    return Object.entries(translations[language].teachingFields).map(([key, value]) => ({
      key,
      value,
    }));
  };

  // Filter subjects based on evaluation type
  const getFilteredSubjects = () => {
    const allSubjects = getAllSubjects();
    
    if (!evaluationType) {
      return [];
    }

    if (evaluationType === "evaluare_nationala") {
      // Only Romanian and Mathematics for Evaluare Națională
      return allSubjects.filter((subj) => 
        EVALUARE_NATIONALA_SUBJECTS.includes(subj.key)
      );
    } else if (evaluationType === "bacalaureat") {
      // Only subjects that exist in JSON for Bacalaureat
      return allSubjects.filter((subj) => 
        BACALAUREAT_SUBJECTS.includes(subj.key)
      );
    }

    return [];
  };

  const availableSubjects = getFilteredSubjects();
  const evaluationTypes = Object.entries(EVALUATION_TYPES[language]).map(([key, value]) => ({
    key,
    value,
  }));

  useEffect(() => {
    if (!authLoading && (!user || (userData?.role !== "individual" && userData?.role !== "student"))) {
      navigate("/login");
    }
  }, [user, userData, authLoading, navigate]);

  // Reset subject when evaluation type changes
  useEffect(() => {
    setSubject("");
    setErrors({});
  }, [evaluationType]);
  
  // Reset general error when subject or evaluationType changes
  useEffect(() => {
    if (errors.general) {
      setErrors({ ...errors, general: undefined });
    }
  }, [subject, evaluationType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: { evaluationType?: string; subject?: string; general?: string } = {};
    if (!evaluationType) {
      newErrors.evaluationType = t.individual.learningPaths.createPath.errors.goalRequired;
    }
    if (!subject) {
      newErrors.subject = t.individual.learningPaths.createPath.errors.subjectRequired;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsCreating(true);
    setErrors({});

    try {
      // Get evaluation type display name
      const evaluationTypeDisplay = EVALUATION_TYPES[language][evaluationType as keyof typeof EVALUATION_TYPES.ro];
      const subjectDisplay = translations[language].teachingFields[subject] || subject;
      
      // Map evaluation type to exam_name in JSON
      const examName = evaluationType === "evaluare_nationala"
        ? "Evaluarea Națională pentru Absolvenții Clasei a VIII-a"
        : "Examenul de Bacalaureat din România";
      
      // Load exam data from JSON
      const examDataList = examDataJSON as ExamData[];
      
      // Map teachingField key to exam_subject from JSON (with special handling for History of Communism)
      const examSubject = findBestExamSubjectMatch(subject, examName, examDataList);
      
      if (!examSubject) {
        throw new Error(`Could not map subject ${subject} to exam_subject for ${examName}`);
      }
      
      // Find matching exam data
      const examData = findExamData(examName, examSubject, examDataList);
      
      if (!examData) {
        throw new Error(`Could not find exam data for ${examName} - ${examSubject}`);
      }
      
      // Load existing paths to check if path already exists
      const storageKey = `learning_paths_${user?.uid || "default"}`;
      const stored = localStorage.getItem(storageKey);
      let existingPaths: LearningPath[] = [];
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          existingPaths = parsed.map((path: any) => ({
            ...path,
            createdAt: new Date(path.createdAt),
            updatedAt: new Date(path.updatedAt),
          }));
        } catch (e) {
          console.error("Error parsing stored learning paths:", e);
        }
      }
      
      // Check if a learning path already exists for this exam type and subject
      // Use subjectStorage and exam type to check, not translated titles (language-independent check)
      const tLearningPaths = translations[language].individual.learningPaths;
      const testPath = examDataToLearningPath(examData, user?.uid || "user1", [], tLearningPaths, language);
      
      // Determine exam type from examName
      const examType = examName.includes("Evaluarea Națională") || examName.includes("Evaluarea Nationala")
        ? "evaluare_nationala"
        : "bacalaureat";
      
      // Check if path exists by matching exam type and subjectStorage (language-independent)
      // Compare directly using exam_subject from JSON to avoid translation issues
      const existingPath = existingPaths.find((path) => {
        // Check if exam type matches (by checking title patterns, works in both languages)
        const pathExamType = (path.title.includes("Evaluare") || path.title.includes("National Evaluation") || path.title.includes("National"))
          ? "evaluare_nationala"
          : "bacalaureat";
        
        if (pathExamType !== examType) {
          return false;
        }
        
        // First try: Check if subjectStorage matches (most reliable if both are set)
        if (path.subjectStorage && testPath.subjectStorage) {
          if (path.subjectStorage === testPath.subjectStorage) {
            return true;
          }
          // If subjectStorage doesn't match, continue to next check
        }
        
        // Second: Try to find examData for the existing path and compare with current examData
        // This compares the actual exam_subject from JSON, which is the most reliable
        const existingPathExamData = findExamDataFromPath(path, examDataList);
        if (existingPathExamData) {
          // Direct comparison of exam_subject from JSON - most reliable
          // This works regardless of language or translation
          if (existingPathExamData.exam_subject === examData.exam_subject) {
            return true;
          }
        }
        
        // If we couldn't find examData for existing path, it means it doesn't match
        return false;
      });
      
      if (existingPath) {
        setErrors({ general: t.individual.learningPaths.createPath.errors.alreadyExists });
        setIsCreating(false);
        return;
      }
      
      // Get translations
      // Convert exam data to LearningPath with translations
      const newLearningPath = examDataToLearningPath(examData, user?.uid || "user1", existingPaths, tLearningPaths, language);
      
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Store new learning path in sessionStorage to be picked up by dashboard
      sessionStorage.setItem('newLearningPath', JSON.stringify(newLearningPath));
      
      // Navigate back to dashboard - the new learning path should appear in the list
      navigate(basePath);
    } catch (error) {
      console.error("Error creating learning path:", error);
      setErrors({ evaluationType: "A apărut o eroare. Te rugăm să încerci din nou." });
    } finally {
      setIsCreating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role={userData?.role === "student" ? "student" : "individual"} />
      
      <main className="pt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate(basePath)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.common.back}
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t.individual.learningPaths.createPath.title}</CardTitle>
              <CardDescription>
                {t.individual.learningPaths.createPath.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="evaluationType">{t.individual.learningPaths.createPath.selectGoal}</Label>
                  <Select
                    value={evaluationType}
                    onValueChange={(value) => {
                      setEvaluationType(value);
                      setErrors({ ...errors, evaluationType: undefined, general: undefined });
                    }}
                  >
                    <SelectTrigger className={errors.evaluationType ? "border-destructive" : ""}>
                      <SelectValue placeholder={t.individual.learningPaths.createPath.goalPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {evaluationTypes.map((evalType) => (
                        <SelectItem key={evalType.key} value={evalType.key}>
                          {evalType.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.evaluationType && (
                    <p className="text-sm text-destructive">{errors.evaluationType}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">{t.individual.learningPaths.createPath.selectSubject}</Label>
                  <Select
                    value={subject}
                    onValueChange={(value) => {
                      setSubject(value);
                      setErrors({ ...errors, subject: undefined, general: undefined });
                    }}
                    disabled={!evaluationType}
                  >
                    <SelectTrigger className={errors.subject ? "border-destructive" : ""} disabled={!evaluationType}>
                      <SelectValue placeholder={evaluationType ? t.individual.learningPaths.createPath.subjectPlaceholder : t.individual.learningPaths.createPath.subjectPlaceholderSelectFirst} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubjects.map((subj) => (
                        <SelectItem key={subj.key} value={subj.key}>
                          {subj.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.subject && (
                    <p className="text-sm text-destructive">{errors.subject}</p>
                  )}
                </div>

                {errors.general && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{errors.general}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(basePath)}
                    className="flex-1"
                  >
                    {t.common.cancel}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t.individual.learningPaths.createPath.creating}
                      </>
                    ) : (
                      t.individual.learningPaths.createPath.createButton
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

