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

export default function NewLearningPathPage() {
  const navigate = useNavigate();
  const { user, userData, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const [evaluationType, setEvaluationType] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<{ evaluationType?: string; subject?: string }>({});

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
      // All subjects except Romanian and Mathematics for Bacalaureat
      return allSubjects.filter((subj) => 
        !EVALUARE_NATIONALA_SUBJECTS.includes(subj.key)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: { evaluationType?: string; subject?: string } = {};
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
      // TODO: Replace with actual API call to backend
      // const response = await fetch('http://localhost:5000/generateLearningPath', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     goal: evaluationType, // Send evaluation type as goal
      //     subject: teachingFieldToStorage(subject),
      //     userId: user?.uid,
      //     role: userData?.role, // Send role to backend
      //   }),
      // });
      // const data = await response.json();
      // When backend is ready, it will generate chapters and return the learning path
      // Then redirect to dashboard with the new learning path in the list

      // Mock response - simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Get evaluation type display name
      const evaluationTypeDisplay = EVALUATION_TYPES[language][evaluationType as keyof typeof EVALUATION_TYPES.ro];
      const subjectDisplay = translations[language].teachingFields[subject] || subject;
      // Convert subject key (from teachingFields) to storage key
      const subjectStorage = teachingFieldToStorage(subject) || subject;
      
      // Create mock learning path with chapters
      // TODO: This will come from backend API response
      const mockChapters = evaluationType === "evaluare_nationala" 
        ? [
            { id: `${Date.now()}-1`, title: "Pregătire inițială", description: "Capitol introductiv", status: "unlocked" as const, order: 1 },
            { id: `${Date.now()}-2`, title: "Exerciții practice", description: "Exerciții de aplicare", status: "locked" as const, order: 2 },
            { id: `${Date.now()}-3`, title: "Simulări", description: "Simulări de examen", status: "locked" as const, order: 3 },
          ]
        : [
            { id: `${Date.now()}-1`, title: "Noțiuni fundamentale", description: "Bazele materiei", status: "unlocked" as const, order: 1 },
            { id: `${Date.now()}-2`, title: "Capitol avansat 1", description: "Concepte avansate", status: "locked" as const, order: 2 },
            { id: `${Date.now()}-3`, title: "Capitol avansat 2", description: "Aplicații practice", status: "locked" as const, order: 3 },
            { id: `${Date.now()}-4`, title: "Pregătire finală", description: "Recapitulare și teste", status: "locked" as const, order: 4 },
          ];
      
      const newLearningPath = {
        id: `path-${Date.now()}`,
        title: evaluationTypeDisplay,
        subject: subjectDisplay,
        subjectStorage: subjectStorage,
        goal: evaluationTypeDisplay,
        chapters: mockChapters,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user?.uid || "user1",
        progress: {
          completed: 0,
          total: mockChapters.length,
        },
      };
      
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
                      if (errors.evaluationType) setErrors({ ...errors, evaluationType: undefined });
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
                      if (errors.subject) setErrors({ ...errors, subject: undefined });
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

