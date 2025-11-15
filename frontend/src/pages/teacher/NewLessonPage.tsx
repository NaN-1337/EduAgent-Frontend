import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "@/components/lesson-wizard/ProgressIndicator";
import { Step1DefineLesson } from "@/components/lesson-wizard/Step1DefineLesson";
import { Step2Sources } from "@/components/lesson-wizard/Step2Sources";
import { Step3Generation } from "@/components/lesson-wizard/Step3Generation";
import { Step4FactCheck } from "@/components/lesson-wizard/Step4FactCheck";
import { Step5Review } from "@/components/lesson-wizard/Step5Review";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { uploadFile, isPDF, MOCK_PRESENTATION_FILE_URL, MOCK_PRESENTATION_FILE_TYPE, getMockPresentationFileURL } from "@/lib/storage";
import { gradeToStorage, teachingFieldToStorage } from "@/lib/dataConverters";

interface Step1Data {
  title: string;
  grade: string;
  subject: string;
}

interface Step2Data {
  files: File[];
  textContent: string;
  presentationFile?: File | null;
}

export default function NewLessonPage() {
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);

  const steps = [
    { number: 1, label: t.teacher.newLesson.steps.defineLesson },
    { number: 2, label: t.teacher.newLesson.steps.sources },
    { number: 3, label: t.teacher.newLesson.steps.generation },
    { number: 4, label: t.teacher.newLesson.steps.factCheck },
    { number: 5, label: t.teacher.newLesson.steps.reviewFinish },
  ];

  const [step1Data, setStep1Data] = useState<Step1Data>({
    title: "",
    grade: "",
    subject: "",
  });

  const [step2Data, setStep2Data] = useState<Step2Data>({
    files: [],
    textContent: "",
    presentationFile: null,
  });

  useEffect(() => {
    if (!loading && (!user || userData?.role !== "teacher")) {
      navigate("/login");
    }
  }, [user, userData, loading, navigate]);

  const handleStep1Change = (data: Partial<Step1Data>) => {
    setStep1Data((prev) => ({ ...prev, ...data }));
  };

  const handleStep2Change = (data: Partial<Step2Data>) => {
    setStep2Data((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < 5) {
      if (currentStep === 2) {
        // After step 2, move to generation
        setCurrentStep(3);
        setGenerationComplete(false);
      } else if (currentStep === 3) {
        // Step 3 auto-advances when complete, but allow manual continue
        if (generationComplete) {
          setCurrentStep(4);
        }
      } else if (currentStep === 4) {
        // Step 4 continues to Step 5
        setCurrentStep(5);
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && currentStep !== 3) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleGenerationComplete = async () => {
    // Prevent duplicate lesson creation
    if (lessonId || isCreatingLesson) {
      setGenerationComplete(true);
      return;
    }

    setGenerationComplete(true);
    setIsCreatingLesson(true);
    
    // Create the lesson in Firestore
    if (!user || !userData) {
      console.error("User not authenticated");
      setIsCreatingLesson(false);
      return;
    }

    try {
      // Convert grade to integer and subject to storage key
      const gradeStorage = gradeToStorage(step1Data.grade);
      const subjectStorage = teachingFieldToStorage(step1Data.subject);

      // Generate mock slides based on the lesson data
      const mockSlides = [
        {
          id: `slide-${Date.now()}-0`,
          title: step1Data.title,
          content: `Introducere în ${step1Data.subject}\n\n- Concepte de bază\n- Importanța subiectului\n- Obiectivele lecției`,
        },
        {
          id: `slide-${Date.now()}-1`,
          title: "Dezvoltarea conceptului",
          content: `Dezvoltarea principală a subiectului\n\n- Explicații detaliate\n- Exemple practice\n- Aplicații în viața reală`,
        },
        {
          id: `slide-${Date.now()}-2`,
          title: "Consolidare și aplicare",
          content: `Recapitulare și aplicare\n\n- Rezumatul conceptelor\n- Exerciții practice\n- Întrebări de verificare`,
        },
      ];

      // Create lesson document in Firestore first to get the lessonId
      const lessonData: any = {
        teacherId: user.uid,
        title: step1Data.title,
        grade: gradeStorage !== null ? gradeStorage : step1Data.grade,
        subject: subjectStorage || step1Data.subject,
        status: "draft",
        studentSummary: `Rezumat pentru elevi despre ${step1Data.title}. ${step2Data.textContent || "Conținut generat automat."}`,
        slides: mockSlides,
        teacherGuidelines: {
          objectives: `Obiectivele lecției pentru ${step1Data.title}`,
          timing: "45 minute",
          questions: "Întrebări de discuție și verificare",
          differentiation: "Strategii de diferențiere",
          assessment: "Modalități de evaluare",
        },
        sources: {
          files: [],
          textContent: step2Data.textContent,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastModified: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "lessons"), lessonData);
      const finalLessonId = docRef.id;
      
      // MOCK: Use the same presentation file for all lessons
      let presentationFileUrl: string | undefined;
      let presentationFileType: "pdf" | undefined;
      
      if (MOCK_PRESENTATION_FILE_URL) {
        // Use the mock URL directly (must include the token)
        presentationFileUrl = MOCK_PRESENTATION_FILE_URL;
        presentationFileType = MOCK_PRESENTATION_FILE_TYPE;
      } else {
        // Try to automatically find the PDF file in the folder
        try {
          const foundURL = await getMockPresentationFileURL();
          if (foundURL) {
            presentationFileUrl = foundURL;
            presentationFileType = MOCK_PRESENTATION_FILE_TYPE;
            console.log("Found mock presentation file:", foundURL);
          } else {
            console.warn("No PDF file found in the mock folder. Skipping presentation file.");
            console.warn("To use a mock presentation file:");
            console.warn("1. Go to Firebase Console → Storage");
            console.warn("2. Navigate to: 1jTUyxRHWcN0OH9ybEuwI1K0dSD2/6/");
            console.warn("3. Click on the PDF file");
            console.warn("4. Copy the COMPLETE download URL (must include ?alt=media&token=...)");
            console.warn("5. Paste it into MOCK_PRESENTATION_FILE_URL in frontend/src/lib/storage.ts");
          }
        } catch (error) {
          console.warn("Could not automatically find mock presentation file:", error);
          console.warn("Please set MOCK_PRESENTATION_FILE_URL in storage.ts with the complete download URL");
        }
      }
      
      // If we have a mock URL, always add it to the lesson
      if (presentationFileUrl) {
        await updateDoc(docRef, {
          presentationFileUrl,
          presentationFileType,
          updatedAt: serverTimestamp(),
        });
      }
      
      // Original upload logic (commented out for now - using mock instead)
      // if (step2Data.presentationFile) {
      //   const fileType = isPDF(step2Data.presentationFile.name) ? "pdf" : undefined;
      //   
      //   if (fileType && gradeStorage !== null) {
      //     // Storage path: {teacherUid}/{grade}/{lessonId}/presentation.pdf
      //     const filePath = `${user.uid}/${gradeStorage}/${finalLessonId}/presentation.pdf`;
      //     presentationFileUrl = await uploadFile(step2Data.presentationFile, filePath);
      //     presentationFileType = fileType;
      //     
      //     // Update the lesson document with the file URL
      //     await updateDoc(docRef, {
      //       presentationFileUrl,
      //       presentationFileType,
      //       updatedAt: serverTimestamp(),
      //     });
      //   }
      // }
      
      setLessonId(finalLessonId);
      setIsCreatingLesson(false);
      
      // Auto-advance to fact-check after a brief delay
      setTimeout(() => {
        setCurrentStep(4);
      }, 1000);
    } catch (error) {
      console.error("Error creating lesson:", error);
      setIsCreatingLesson(false);
      // Still set a mock ID so the flow can continue
      setLessonId("mock-lesson-id-" + Date.now());
      setTimeout(() => {
        setCurrentStep(4);
      }, 1000);
    }
  };

  const handleLessonComplete = () => {
    // Navigate to dashboard when lesson is marked as ready
    navigate("/teacher/dashboard");
  };

  const isStep1Valid = step1Data.title.trim() && step1Data.grade && step1Data.subject;
  const isStep2Valid = step2Data.files.length > 0 || step2Data.textContent.trim();

  const canProceed =
    (currentStep === 1 && isStep1Valid) ||
    (currentStep === 2 && isStep2Valid) ||
    (currentStep === 3 && generationComplete) ||
    currentStep === 4 ||
    currentStep === 5;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="teacher" />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Progress indicator */}
          <ProgressIndicator currentStep={currentStep} steps={steps} />

          {/* Step content */}
          <div className="mb-8">
            {currentStep === 1 && (
              <Step1DefineLesson data={step1Data} onChange={handleStep1Change} />
            )}
            {currentStep === 2 && (
              <Step2Sources data={step2Data} onChange={handleStep2Change} />
            )}
            {currentStep === 3 && (
              <Step3Generation
                onComplete={handleGenerationComplete}
                onContinue={() => setCurrentStep(4)}
                canContinue={generationComplete}
              />
            )}
            {currentStep === 4 && (
              <Step4FactCheck
                onContinue={() => setCurrentStep(5)}
                onRegenerate={() => {
                  setGenerationComplete(false);
                  setCurrentStep(2);
                }}
                onBack={() => setCurrentStep(3)}
              />
            )}
            {currentStep === 5 && (
              <Step5Review lessonId={lessonId || ""} onComplete={handleLessonComplete} />
            )}
          </div>

          {/* Bottom navigation bar (steps 1-2 only, steps 3-5 have their own controls) */}
          {currentStep < 3 && (
            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                {t.teacher.newLesson.back}
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="ml-auto"
              >
                {t.teacher.newLesson.next}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

