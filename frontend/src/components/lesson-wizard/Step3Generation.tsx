import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { generateLecture, generatePresentation, downloadFile, Question } from "@/lib/api";
import { gradeToStorage, teachingFieldToStorage } from "@/lib/dataConverters";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { storage } from "@/lib/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface GenerationStep {
  id: string;
  label: string;
  description?: string;
  status: "pending" | "in-progress" | "completed" | "failed";
}

interface Step3GenerationProps {
  title: string;
  subject: string;
  grade: string;
  numberOfSlides: number;
  template?: string;
  questions: Question[];
  answers: Record<string, string>;
  onComplete: (lessonId: string) => void;
  onContinue?: () => void;
  canContinue?: boolean;
}

export function Step3Generation({
  title,
  subject,
  grade,
  numberOfSlides,
  template,
  questions,
  answers,
  onComplete,
  onContinue,
  canContinue,
}: Step3GenerationProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);

  const initialSteps = useMemo<GenerationStep[]>(
    () => [
      {
        id: "analyzing",
        label: t.teacher.newLesson.step3.steps?.analyzing || "Thinking about student needs",
        status: "pending",
      },
      {
        id: "lecture",
        label: t.teacher.newLesson.step3.steps?.lecture || "Crafting lesson content",
        status: "pending",
      },
      {
        id: "presentation",
        label: t.teacher.newLesson.step3.steps?.presentation || "Designing presentation slides",
        status: "pending",
      },
      {
        id: "finalizing",
        label: t.teacher.newLesson.step3.steps?.finalizing || "Finalizing your lesson",
        status: "pending",
      },
    ],
    [t]
  );

  const stepDescriptions = useMemo<Record<string, string>>(
    () => ({
      analyzing:
        t.teacher.newLesson.step3.descriptions?.analyzing ||
        "Analyzing educational objectives and student context...",
      lecture:
        t.teacher.newLesson.step3.descriptions?.lecture ||
        "Generating engaging content for students and comprehensive teacher guidelines...",
      presentation:
        t.teacher.newLesson.step3.descriptions?.presentation ||
        "Creating beautiful slides with your selected template...",
      finalizing:
        t.teacher.newLesson.step3.descriptions?.finalizing ||
        "Uploading files and preparing your lesson for review...",
    }),
    [t]
  );

  const [steps, setSteps] = useState<GenerationStep[]>(initialSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const hasStartedRef = useRef(false);

  // Update steps when language changes
  useEffect(() => {
    setSteps(initialSteps);
  }, [initialSteps]);

  // Start generation when component mounts
  useEffect(() => {
    if (hasCompleted || !user || questions.length === 0 || hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    const runGeneration = async () => {
      try {
        setError(null);

        // Convert grade and subject
        const gradeNum = gradeToStorage(grade);
        const subjectStorage = teachingFieldToStorage(subject);

        if (gradeNum === null || !subjectStorage) {
          throw new Error("Invalid grade or subject");
        }

        // Step 0: Analyzing (visual only, shows briefly)
        setCurrentStepIndex(0);
        setSteps((prev) => {
          const newSteps = [...prev];
          newSteps[0] = {
            ...newSteps[0],
            status: "in-progress",
            description: stepDescriptions.analyzing,
          };
          return newSteps;
        });

        // Small delay for visual effect
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Mark analyzing as completed
        setSteps((prev) => {
          const newSteps = [...prev];
          newSteps[0] = {
            ...newSteps[0],
            status: "completed",
            description: undefined,
          };
          return newSteps;
        });

        // Step 1: Generate lecture
        setCurrentStepIndex(1);
        setSteps((prev) => {
          const newSteps = [...prev];
          newSteps[1] = {
            ...newSteps[1],
            status: "in-progress",
            description: stepDescriptions.lecture,
          };
          return newSteps;
        });

        const lectureData = await generateLecture({
          title,
          subject: subjectStorage,
          grade: gradeNum,
          questions,
          answers,
        });

        // Mark lecture step as completed
        setSteps((prev) => {
          const newSteps = [...prev];
          newSteps[1] = {
            ...newSteps[1],
            status: "completed",
            description: undefined,
          };
          return newSteps;
        });

        // Step 2: Generate presentation
        setCurrentStepIndex(2);
        setSteps((prev) => {
          const newSteps = [...prev];
          newSteps[2] = {
            ...newSteps[2],
            status: "in-progress",
            description: stepDescriptions.presentation,
          };
          return newSteps;
        });

        // Extract template name without .pdf extension
        const templateName = template ? template.replace(/\.pdf$/i, "") : "modern";
        
        const presentationData = await generatePresentation({
          student_version: lectureData.student_version,
          n_slides: numberOfSlides,
          language: "Romanian",
          template: templateName,
          tone: "educational",
          verbosity: "standard",
          export_as: "pdf",
        });

        // Mark presentation step as completed
        setSteps((prev) => {
          const newSteps = [...prev];
          newSteps[2] = {
            ...newSteps[2],
            status: "completed",
            description: undefined,
          };
          return newSteps;
        });

        // Step 3: Download PDF and upload to Firebase Storage
        setCurrentStepIndex(3);
        setSteps((prev) => {
          const newSteps = [...prev];
          newSteps[3] = {
            ...newSteps[3],
            status: "in-progress",
            description: stepDescriptions.finalizing,
          };
          return newSteps;
        });

        // Download PDF from presentation API
        const pdfBlob = await downloadFile(presentationData.presentation.download_url);
        const pdfFile = new File([pdfBlob], "presentation.pdf", { type: "application/pdf" });

        // Create lesson document in Firestore first
        const lessonData: any = {
          teacherId: user.uid,
          title,
          grade: gradeNum,
          subject: subjectStorage,
          status: "draft",
          studentSummary: lectureData.student_version, // Store HTML
          teacherGuidelines: {
            content: lectureData.teacher_version, // Store HTML
          },
          slides: presentationData.slides.map((slide, index) => ({
            id: `slide-${index}`,
            title: slide.content.title || `Slide ${index + 1}`,
            content: slide.content.body || "",
            speakerNote: slide.speaker_note,
            slideIndex: slide.slide_index,
          })),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastModified: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, "lessons"), lessonData);
        const finalLessonId = docRef.id;

        // Upload PDF to Firebase Storage
        const storagePath = `${user.uid}/${gradeNum}/${finalLessonId}/presentation.pdf`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, pdfFile);
        const downloadURL = await getDownloadURL(storageRef);

        // Update lesson with presentation file URL
        await updateDoc(docRef, {
          presentationFileUrl: downloadURL,
          presentationFileType: "pdf",
          updatedAt: serverTimestamp(),
        });

        // Mark finalizing step as completed
        setSteps((prev) => {
          const newSteps = [...prev];
          newSteps[3] = {
            ...newSteps[3],
            status: "completed",
            description: undefined,
          };
          return newSteps;
        });

        setLessonId(finalLessonId);
        setHasCompleted(true);
        onComplete(finalLessonId);
      } catch (err: any) {
        console.error("Error during generation:", err);
        setError(err.message || "An error occurred during generation");
        
        // Mark current step as failed
        setSteps((prev) => {
          const newSteps = [...prev];
          if (currentStepIndex < newSteps.length) {
            newSteps[currentStepIndex] = {
              ...newSteps[currentStepIndex],
              status: "failed",
              description: err.message || "Failed",
            };
          }
          return newSteps;
        });
      }
    };

    runGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - dependencies are checked inside

  const getStepIcon = (status: GenerationStep["status"]) => {
    switch (status) {
      case "in-progress":
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return (
          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
        );
    }
  };

  const allCompleted = steps.every((step) => step.status === "completed");

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">
            {t.teacher.newLesson.step3.title}
          </CardTitle>
          <CardDescription className="text-center">
            {t.teacher.newLesson.step3.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg transition-colors",
                  step.status === "in-progress" && "bg-primary/5 border border-primary/20"
                )}
              >
                <div className="mt-0.5 shrink-0">{getStepIcon(step.status)}</div>
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "font-semibold text-base",
                      step.status === "completed" && "text-muted-foreground",
                      step.status === "in-progress" && "text-primary",
                      step.status === "failed" && "text-destructive"
                    )}
                  >
                    {step.label}
                  </div>
                  {step.description && (
                    <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {allCompleted && (
            <>
              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground text-center">
                  {t.teacher.newLesson.step3.completedMessage ||
                    "Generation complete! You can review and adjust all content before sharing with students."}
                </p>
              </div>
              {onContinue && (
                <div className="mt-6 flex justify-end">
                  <Button onClick={onContinue} size="lg" disabled={!canContinue}>
                    {t.teacher.newLesson.step3.continueButton}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
