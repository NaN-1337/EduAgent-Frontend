import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { storage } from "@/lib/firebaseConfig";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { TemplatePreviewDialog } from "./TemplatePreviewDialog";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { generatePdfThumbnail } from "@/lib/pdfThumbnail";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { teachingFieldToStorage } from "@/lib/dataConverters";

interface Step1Data {
  title: string;
  grade: string;
  subject: string;
  numberOfSlides: number;
  template?: string;
  needsRecap?: boolean;
  previousStudentVersion?: string;
}

interface Template {
  name: string;
  url: string;
  thumbnail?: string;
}

interface Step1DefineLessonProps {
  data: Step1Data;
  onChange: (data: Partial<Step1Data>) => void;
}

export function Step1DefineLesson({ data, onChange }: Step1DefineLessonProps) {
  const { userData, user } = useAuth();
  const { t, language } = useLanguage();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showRecapCheckbox, setShowRecapCheckbox] = useState(false);
  const [loadingRecapCheck, setLoadingRecapCheck] = useState(false);
  const [previousLessonTitle, setPreviousLessonTitle] = useState<string | null>(null);

  // Auto-populate subject from teacher's teaching field
  useEffect(() => {
    if (userData?.teachingField && !data.subject) {
      onChange({ subject: userData.teachingField });
    }
  }, [userData?.teachingField, data.subject, onChange]);

  // Check for previous lesson with poor quiz performance
  useEffect(() => {
    const checkPreviousLessonPerformance = async () => {
      if (!user || !data.subject || !data.grade) {
        console.log("Missing required data for recap check:", { user: !!user, subject: data.subject, grade: data.grade });
        setShowRecapCheckbox(false);
        return;
      }

      try {
        setLoadingRecapCheck(true);
        const subjectStorage = teachingFieldToStorage(data.subject);
        if (!subjectStorage) {
          console.log("Could not convert subject to storage format:", data.subject);
          setShowRecapCheckbox(false);
          return;
        }

        // Get grade number (assuming format "Grade X")
        const gradeMatch = data.grade.match(/\d+/);
        const gradeNum = gradeMatch ? parseInt(gradeMatch[0], 10) : null;
        if (!gradeNum) {
          console.log("Could not parse grade number from:", data.grade);
          setShowRecapCheckbox(false);
          return;
        }

        console.log("Checking for previous lesson:", { subject: subjectStorage, grade: gradeNum, teacherId: user.uid });

        // Find previous lessons with same subject and grade
        // Note: We query without orderBy to avoid requiring a composite index
        // We'll sort in memory instead
        const lessonsQuery = query(
          collection(db, "lessons"),
          where("teacherId", "==", user.uid),
          where("subject", "==", subjectStorage),
          where("grade", "==", gradeNum)
        );

        const lessonsSnapshot = await getDocs(lessonsQuery);
        console.log("Found previous lessons:", lessonsSnapshot.size);
        if (lessonsSnapshot.empty) {
          console.log("No previous lessons found");
          setShowRecapCheckbox(false);
          return;
        }

        // Sort by createdAt in memory to get the most recent lesson
        const lessons = lessonsSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            data: doc.data(),
            createdAt: doc.data().createdAt?.toMillis() || doc.data().lastModified?.toMillis() || 0,
          }))
          .sort((a, b) => b.createdAt - a.createdAt);

        if (lessons.length === 0) {
          setShowRecapCheckbox(false);
          return;
        }

        const previousLesson = lessons[0];
        const previousLessonData = previousLesson.data;
        const previousLessonId = previousLesson.id;

        // Check if previous lesson has a quiz
        if (!previousLessonData.quizId) {
          console.log("Previous lesson has no quizId");
          setShowRecapCheckbox(false);
          return;
        }

        // Get all quiz submissions for the previous lesson's quiz
        const submissionsQuery = query(
          collection(db, "quiz_submissions"),
          where("quizId", "==", previousLessonData.quizId),
          where("lectureId", "==", previousLessonId)
        );

        const submissionsSnapshot = await getDocs(submissionsQuery);
        if (submissionsSnapshot.empty) {
          console.log("No quiz submissions found for previous lesson");
          setShowRecapCheckbox(false);
          return;
        }

        // Calculate class performance
        let totalCorrect = 0;
        let totalIncorrect = 0;
        let totalQuestions = 0;

        submissionsSnapshot.forEach((doc) => {
          const submission = doc.data();
          const correct = submission.correctAnswers || 0;
          const incorrect = submission.incorrectAnswers || 0;
          totalCorrect += correct;
          totalIncorrect += incorrect;
          // Calculate total questions from this submission
          const submissionTotal = correct + incorrect;
          if (submissionTotal > totalQuestions) {
            totalQuestions = submissionTotal;
          }
        });

        const totalAnswers = totalCorrect + totalIncorrect;
        console.log("Quiz performance check:", {
          previousLessonId,
          quizId: previousLessonData.quizId,
          submissionsCount: submissionsSnapshot.size,
          totalCorrect,
          totalIncorrect,
          totalAnswers,
          totalQuestions,
        });

        if (totalAnswers === 0) {
          console.log("No answers found in submissions");
          setShowRecapCheckbox(false);
          return;
        }

        // Calculate success rate: correct answers / total answers
        const classSuccessRate = totalCorrect / totalAnswers;
        console.log("Class success rate:", classSuccessRate, "Threshold: 0.6", "Show checkbox:", classSuccessRate < 0.6);

        // Show checkbox if performance < 60%
        if (classSuccessRate < 0.6) {
          setShowRecapCheckbox(true);
          setPreviousLessonTitle(previousLessonData.title || "Previous Lesson");
          
          // Always fetch previous lesson's student version when checkbox is shown
          // It will be used if the teacher checks the box
          // The student version is stored in Firestore as 'studentSummary'
          if (previousLessonData.studentSummary) {
            // Only update if we don't already have it or if it's different
            if (!data.previousStudentVersion || data.previousStudentVersion !== previousLessonData.studentSummary) {
              onChange({ previousStudentVersion: previousLessonData.studentSummary });
            }
          }
        } else {
          setShowRecapCheckbox(false);
          // Clear previous student version if performance is good
          if (data.previousStudentVersion || data.needsRecap) {
            onChange({ previousStudentVersion: undefined, needsRecap: false });
          }
        }
      } catch (error) {
        console.error("Error checking previous lesson performance:", error);
        setShowRecapCheckbox(false);
      } finally {
        setLoadingRecapCheck(false);
      }
    };

    checkPreviousLessonPerformance();
  }, [user, data.subject, data.grade, data.needsRecap, onChange]);

  // Fetch templates from Firebase Storage
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const templatesRef = ref(storage, "presentation_templates");
        const listResult = await listAll(templatesRef);
        
        // First, get all template URLs
        const templatePromises = listResult.items
          .filter((item) => item.name.toLowerCase().endsWith(".pdf"))
          .map(async (item) => {
            const url = await getDownloadURL(item);
            return {
              name: item.name,
              url: url,
            };
          });
        
        const fetchedTemplates = await Promise.all(templatePromises);
        
        // Generate thumbnails for each template
        const templatesWithThumbnails = await Promise.all(
          fetchedTemplates.map(async (template) => {
            try {
              const thumbnail = await generatePdfThumbnail(template.url, 200);
              return {
                ...template,
                thumbnail: thumbnail || undefined,
              };
            } catch (error) {
              console.error(`Error generating thumbnail for ${template.name}:`, error);
              return template;
            }
          })
        );
        
        setTemplates(templatesWithThumbnails);
        
        // Set default template if none selected
        if (!data.template && templatesWithThumbnails.length > 0) {
          onChange({ template: templatesWithThumbnails[0].name });
        }
      } catch (error) {
        console.error("Error fetching templates:", error);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  // Format template name: remove .pdf, capitalize first letter
  const formatTemplateName = (name: string): string => {
    const nameWithoutExt = name.replace(/\.pdf$/i, "");
    return nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1).toLowerCase();
  };

  // Get translated template name
  const getTranslatedTemplateName = (name: string): string => {
    const formattedName = formatTemplateName(name);
    // Create translation key: lowercase, remove spaces and special chars, add template_ prefix
    const templateKey = formattedName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const translationKey = `template_${templateKey}`;
    
    // Check if translation exists
    if (translations[language].templates && translationKey in translations[language].templates) {
      return translations[language].templates[translationKey];
    }
    
    // Fallback to formatted name if no translation found
    return formattedName;
  };

  const grades = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`);
  const slideNumbers = Array.from({ length: 14 }, (_, i) => i + 2); // 2 to 15

  const isValid = data.title.trim() && data.grade && data.subject;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left main form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-base font-semibold">
            {t.teacher.newLesson.step1.titleLabel} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={data.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder={t.teacher.newLesson.step1.titlePlaceholder}
            className="text-base h-12"
            aria-required="true"
            aria-invalid={!data.title.trim()}
          />
          {!data.title.trim() && (
            <p className="text-sm text-destructive" role="alert">
              {t.teacher.newLesson.step1.titleRequired}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="grade" className="text-base font-semibold">
              {t.teacher.newLesson.step1.gradeLabel} <span className="text-destructive">*</span>
            </Label>
            <Select value={data.grade} onValueChange={(value) => onChange({ grade: value })}>
              <SelectTrigger id="grade" className="h-12" aria-required="true">
                <SelectValue placeholder={t.teacher.newLesson.step1.gradePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {grades.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {translations[language].grades[grade as keyof typeof translations.ro.grades] || grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!data.grade && (
              <p className="text-sm text-destructive" role="alert">
                {t.teacher.newLesson.step1.gradeRequired}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject" className="text-base font-semibold">
              {t.teacher.newLesson.step1.subjectLabel} <span className="text-destructive">*</span>
            </Label>
            <Select value={data.subject} onValueChange={(value) => onChange({ subject: value })} disabled={!!userData?.teachingField}>
              <SelectTrigger id="subject" className="h-12" aria-required="true">
                <SelectValue placeholder={t.teacher.newLesson.step1.subjectPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {userData?.teachingField && (
                  <SelectItem value={userData.teachingField}>
                    {translations[language].teachingFields[userData.teachingField as keyof typeof translations.ro.teachingFields] || userData.teachingField}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {!data.subject && (
              <p className="text-sm text-destructive" role="alert">
                {t.teacher.newLesson.step1.subjectRequired}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="numberOfSlides" className="text-base font-semibold">
            {t.teacher.newLesson.step1.numberOfSlidesLabel} <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={data.numberOfSlides?.toString() || "10"} 
            onValueChange={(value) => onChange({ numberOfSlides: parseInt(value, 10) })}
          >
            <SelectTrigger id="numberOfSlides" className="h-12" aria-required="true">
              <SelectValue placeholder={t.teacher.newLesson.step1.numberOfSlidesPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {slideNumbers.map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {t.teacher.newLesson.step1.slides}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="template" className="text-base font-semibold">
            {t.teacher.newLesson.step1.templateLabel} <span className="text-destructive">*</span>
          </Label>
          {loadingTemplates ? (
            <div className="h-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {templates.map((template) => {
                  const isSelected = data.template === template.name;
                  return (
                    <div key={template.name} className="flex flex-col gap-2">
                      <div className="relative">
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "h-auto py-3 px-4 flex flex-col items-center gap-3 border-2 transition-all w-full",
                            isSelected
                              ? "border-primary bg-primary/5 hover:bg-primary/10"
                              : "border-border hover:border-primary/50"
                          )}
                          onClick={() => onChange({ template: template.name })}
                        >
                          {template.thumbnail ? (
                            <div className="w-full aspect-[4/3] bg-muted rounded-md overflow-hidden border relative group">
                              <img
                                src={template.thumbnail}
                                alt={getTranslatedTemplateName(template.name)}
                                className="w-full h-full object-contain"
                              />
                              {/* Preview button overlay */}
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreview(template);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                {t.teacher.newLesson.step1.previewTemplate}
                              </Button>
                            </div>
                          ) : (
                            <div className="w-full aspect-[4/3] bg-muted rounded-md flex items-center justify-center border">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            </div>
                          )}
                          <span className="font-medium text-sm">
                            {getTranslatedTemplateName(template.name)}
                          </span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right helper panel */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="border-2 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t.teacher.newLesson.step1.exampleTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">{t.teacher.newLesson.step1.exampleTitleLabel}:</p>
              <p className="text-sm text-muted-foreground">
                {t.teacher.newLesson.step1.exampleTitleText}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recap Checkbox - Only shown if previous lesson had poor performance */}
        {loadingRecapCheck ? (
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        ) : showRecapCheckbox ? (
          <Card className="border-2 border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-950/10">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                {t.teacher.newLesson.step1.recapTitle || "Review Previous Lesson"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {previousLessonTitle && t.teacher.newLesson.step1.recapDescription 
                  ? t.teacher.newLesson.step1.recapDescription(previousLessonTitle)
                  : `Your class had difficulty with the previous lesson "${previousLessonTitle}". Would you like to include a recap section?`}
              </p>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="needsRecap"
                  checked={data.needsRecap || false}
                  onCheckedChange={(checked) => {
                    onChange({ 
                      needsRecap: checked as boolean,
                      // Ensure previousStudentVersion is set when enabling recap
                      previousStudentVersion: checked ? data.previousStudentVersion : undefined
                    });
                  }}
                />
                <Label
                  htmlFor="needsRecap"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {t.teacher.newLesson.step1.recapCheckboxLabel || "Include recap from previous lesson"}
                </Label>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Template Preview Dialog */}
      {previewTemplate && (
        <TemplatePreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          templateUrl={previewTemplate.url}
          templateName={getTranslatedTemplateName(previewTemplate.name)}
        />
      )}
    </div>
  );
}

