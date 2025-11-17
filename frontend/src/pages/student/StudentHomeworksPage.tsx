import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, ChevronRight, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs, doc, getDoc, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { gradeToStorage } from "@/lib/dataConverters";
import { uploadFile } from "@/lib/storage";
import { parseSubmission, gradeHomework } from "@/lib/api";

interface Homework {
  id: string;
  lectureId: string;
  teacherId: string;
  title: string;
  subject: string;
  grade: number;
  numExercises: number;
  htmlContent: string;
  createdAt: any;
}

interface Lesson {
  id: string;
  title: string;
  subject: string;
  grade: string;
}

export default function StudentHomeworksPage() {
  const { user, userData, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson>>({});
  const [loadingHomeworks, setLoadingHomeworks] = useState(true);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [showHomeworkDialog, setShowHomeworkDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{
    status: "idle" | "uploading" | "parsing" | "grading" | "success" | "error";
    message?: string;
    grade?: { 
      earned: number; 
      total: number; 
      percentage: number;
      exercises?: Array<{
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
      overallFeedback?: string;
    };
  }>({ status: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && (!user || userData?.role !== "student")) {
      navigate("/login");
    }
  }, [user, userData, loading, navigate]);

  useEffect(() => {
    const fetchHomeworks = async () => {
      if (!user || !userData?.enrolledTeachers || userData.enrolledTeachers.length === 0) {
        setLoadingHomeworks(false);
        return;
      }

      // Get student's grade and convert to number for comparison
      const studentGradeStorage = gradeToStorage(userData.grade || "");
      if (studentGradeStorage === null) {
        console.log("Student grade not found or invalid, skipping homework fetch");
        setLoadingHomeworks(false);
        return;
      }

      try {
        setLoadingHomeworks(true);

        // Fetch all lessons from enrolled teachers
        const lessonsQuery = query(
          collection(db, "lessons"),
          where("teacherId", "in", userData.enrolledTeachers.slice(0, 10))
        );
        const lessonsSnapshot = await getDocs(lessonsQuery);

        const lessonsMap: Record<string, Lesson> = {};
        const homeworkIds: string[] = [];

        lessonsSnapshot.forEach((lessonDoc) => {
          const lessonData = lessonDoc.data();
          if (lessonData.homeworkId) {
            homeworkIds.push(lessonData.homeworkId);
            lessonsMap[lessonDoc.id] = {
              id: lessonDoc.id,
              title: lessonData.title || "Untitled Lesson",
              subject: lessonData.subject || "",
              grade: lessonData.grade || "",
            };
          }
        });

        // Handle more than 10 teachers by batching
        if (userData.enrolledTeachers.length > 10) {
          for (let i = 10; i < userData.enrolledTeachers.length; i += 10) {
            const batch = userData.enrolledTeachers.slice(i, i + 10);
            const batchQuery = query(
              collection(db, "lessons"),
              where("teacherId", "in", batch)
            );
            const batchSnapshot = await getDocs(batchQuery);
            batchSnapshot.forEach((lessonDoc) => {
              const lessonData = lessonDoc.data();
              if (lessonData.homeworkId) {
                homeworkIds.push(lessonData.homeworkId);
                lessonsMap[lessonDoc.id] = {
                  id: lessonDoc.id,
                  title: lessonData.title || "Untitled Lesson",
                  subject: lessonData.subject || "",
                  grade: lessonData.grade || "",
                };
              }
            });
          }
        }

        // Remove duplicates
        const uniqueHomeworkIds = Array.from(new Set(homeworkIds));

        // Fetch all homeworks and filter by student's grade
        const homeworksData: Homework[] = [];
        for (const homeworkId of uniqueHomeworkIds) {
          try {
            const homeworkDoc = await getDoc(doc(db, "homeworks", homeworkId));
            if (homeworkDoc.exists()) {
              const homeworkData = homeworkDoc.data();
              const homework = {
                id: homeworkDoc.id,
                ...homeworkData,
              } as Homework;
              
              // Only include homework if the grade matches the student's grade
              if (homework.grade === studentGradeStorage) {
                homeworksData.push(homework);
                
                if (homework.lectureId && !lessonsMap[homework.lectureId]) {
                  try {
                    const lessonDoc = await getDoc(doc(db, "lessons", homework.lectureId));
                    if (lessonDoc.exists()) {
                      const lessonData = lessonDoc.data();
                      lessonsMap[homework.lectureId] = {
                        id: lessonDoc.id,
                        title: lessonData.title || "Untitled Lesson",
                        subject: lessonData.subject || "",
                        grade: lessonData.grade || "",
                      };
                    }
                  } catch (error) {
                    console.error(`Error fetching lesson ${homework.lectureId}:`, error);
                  }
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching homework ${homeworkId}:`, error);
          }
        }

        setHomeworks(homeworksData);
        setLessons(lessonsMap);
      } catch (error) {
        console.error("Error fetching homeworks:", error);
      } finally {
        setLoadingHomeworks(false);
      }
    };

    if (user && userData) {
      fetchHomeworks();
    }
  }, [user, userData]);

  const handleViewHomework = async (homework: Homework) => {
    setSelectedHomework(homework);
    setShowHomeworkDialog(true);
    setSelectedFile(null);
    
    // Check if there's an existing submission for this homework
    if (user) {
      try {
        const submissionsQuery = query(
          collection(db, "homework_submissions"),
          where("homeworkId", "==", homework.id),
          where("studentId", "==", user.uid)
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        
        if (!submissionsSnapshot.empty) {
          // Get the most recent submission
          const submissionDoc = submissionsSnapshot.docs[0];
          const submissionData = submissionDoc.data();
          
          // Set the submission status to show existing feedback
          setSubmissionStatus({
            status: "success",
            grade: {
              earned: submissionData.totalPointsEarned || 0,
              total: submissionData.totalPointsPossible || 0,
              percentage: submissionData.finalGradePercentage || 0,
              exercises: submissionData.exercises || [],
              overallFeedback: submissionData.overallFeedback || "",
            },
          });
        } else {
          // No existing submission, reset to idle
          setSubmissionStatus({ status: "idle" });
        }
      } catch (error) {
        console.error("Error fetching existing submission:", error);
        setSubmissionStatus({ status: "idle" });
      }
    } else {
      setSubmissionStatus({ status: "idle" });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF, JPEG, PNG)
      const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        alert("Please select a PDF, JPEG, or PNG file");
        return;
      }
      setSelectedFile(file);
      // Don't clear submission status when selecting a new file - keep existing feedback visible
      // It will be replaced when the new submission is successful
    }
  };

  const handleSubmitHomework = async () => {
    if (!selectedFile || !selectedHomework || !user) return;

    try {
      setIsSubmitting(true);
      setSubmissionStatus({ status: "uploading", message: "Uploading file..." });

      // Step 1: Upload file to Firebase Storage
      const timestamp = Date.now();
      const fileExtension = selectedFile.name.split(".").pop();
      const storagePath = `homework_submissions/${user.uid}/${selectedHomework.id}/${timestamp}.${fileExtension}`;
      const downloadURL = await uploadFile(selectedFile, storagePath);

      setSubmissionStatus({ status: "parsing", message: "Parsing submission..." });

      // Step 2: Parse the submission
      const parseData = await parseSubmission({ submission_url: downloadURL });

      setSubmissionStatus({ status: "grading", message: "Grading homework..." });

      // Step 3: Grade the homework
      const gradeData = await gradeHomework({
        homework_html: selectedHomework.htmlContent,
        parsed_submission: parseData.parsed_text,
        subject: selectedHomework.subject,
        grade: selectedHomework.grade,
      });

      // Step 4: Delete existing submission if any (one submission per homework)
      const existingSubmissionsQuery = query(
        collection(db, "homework_submissions"),
        where("homeworkId", "==", selectedHomework.id),
        where("studentId", "==", user.uid)
      );
      const existingSubmissionsSnapshot = await getDocs(existingSubmissionsQuery);
      
      // Delete existing submissions (should only be one, but handle multiple just in case)
      for (const docSnapshot of existingSubmissionsSnapshot.docs) {
        await deleteDoc(doc(db, "homework_submissions", docSnapshot.id));
      }

      // Step 5: Save new submission to Firestore
      const submissionData = {
        homeworkId: selectedHomework.id,
        lectureId: selectedHomework.lectureId,
        studentId: user.uid,
        teacherId: selectedHomework.teacherId,
        submissionUrl: downloadURL,
        submissionPath: storagePath,
        parsedText: parseData.parsed_text,
        totalPointsEarned: gradeData.total_points_earned,
        totalPointsPossible: gradeData.total_points_possible,
        finalGradePercentage: gradeData.final_grade_percentage,
        exercises: gradeData.exercises,
        overallFeedback: gradeData.overall_feedback,
        status: "graded", // or "pending_teacher_review"
        createdAt: serverTimestamp(),
        gradedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "homework_submissions"), submissionData);

      // Clear the selected file and update status with new feedback
      setSelectedFile(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSubmissionStatus({
        status: "success",
        grade: {
          earned: gradeData.total_points_earned,
          total: gradeData.total_points_possible,
          percentage: gradeData.final_grade_percentage,
          exercises: gradeData.exercises,
          overallFeedback: gradeData.overall_feedback,
        },
      });
    } catch (error: any) {
      console.error("Error submitting homework:", error);
      setSubmissionStatus({
        status: "error",
        message: error.message || "Failed to submit homework. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || loadingHomeworks) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="student" />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {t.student.homeworks?.title || "Temele mele"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t.student.homeworks?.description || "Completează temele pentru lecțiile tale"}
            </p>
          </div>

          {/* Available Homeworks */}
          {homeworks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {homeworks.map((homework) => {
                const lesson = lessons[homework.lectureId];
                return (
                  <Card key={homework.id} className="hover:shadow-lg transition-shadow border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg mb-1">{homework.title}</CardTitle>
                      <CardDescription>
                        {lesson?.title || "Unknown Lesson"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Exerciții
                          </span>
                          <span className="font-medium">{homework.numExercises}</span>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => handleViewHomework(homework)}
                        >
                          Vezi tema
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">
                    {t.student.homeworks?.emptyTitle || "Nicio temă disponibilă"}
                  </p>
                  <p className="text-muted-foreground">
                    {t.student.homeworks?.emptyDescription || 
                     "Temele vor apărea aici când profesorii tăi le vor crea pentru lecții"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Homework Dialog */}
      <Dialog open={showHomeworkDialog} onOpenChange={setShowHomeworkDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedHomework?.title || "Homework"}
            </DialogTitle>
            <DialogDescription>
              {lessons[selectedHomework?.lectureId || ""]?.title || "Lesson homework"}
            </DialogDescription>
          </DialogHeader>

          {selectedHomework && (
            <div className="mt-4 space-y-6">
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: selectedHomework.htmlContent }}
              />

              {/* File Upload Section */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-semibold">Încarcă tema rezolvată</h3>
                <div className="space-y-4">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {selectedFile ? selectedFile.name : "Selectează fișier (PDF, JPEG, PNG)"}
                    </Button>
                  </div>

                  {selectedFile && (
                    <Button
                      onClick={handleSubmitHomework}
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {submissionStatus.message || "Se procesează..."}
                        </>
                      ) : (
                        "Trimite tema"
                      )}
                    </Button>
                  )}

                  {/* Status Messages */}
                  {submissionStatus.status === "success" && submissionStatus.grade && (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                              Tema trimisă cu succes!
                            </h4>
                            <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                              Puncte obținute: <strong>{submissionStatus.grade.earned}</strong> / {submissionStatus.grade.total} ({submissionStatus.grade.percentage.toFixed(1)}%)
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-300 italic">
                              Nota: Punctajul este supus revizuirii de către profesor.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Exercise-by-Exercise Feedback */}
                      {submissionStatus.grade.exercises && submissionStatus.grade.exercises.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-lg">Feedback pe exerciții:</h4>
                          {submissionStatus.grade.exercises.map((exercise, index) => (
                            <Card key={index} className="border-2">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <span className="font-medium">Exercițiul {exercise.exercise_number}</span>
                                  <span className={`text-sm font-semibold ${
                                    exercise.is_correct 
                                      ? "text-green-600 dark:text-green-400" 
                                      : exercise.is_partial
                                      ? "text-yellow-600 dark:text-yellow-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}>
                                    {exercise.points_earned} / {exercise.max_points} puncte
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{exercise.exercise_content}</p>
                                <p className="text-sm mb-2">
                                  <strong>Răspunsul tău:</strong> {exercise.student_solution || "Nu ai răspuns"}
                                </p>
                                <div className={`p-3 rounded-lg mt-2 ${
                                  exercise.is_correct 
                                    ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800" 
                                    : exercise.is_partial
                                    ? "bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800"
                                    : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                                }`}>
                                  <p className="text-sm font-medium mb-1">
                                    {exercise.is_correct 
                                      ? "✓ Corect!" 
                                      : exercise.is_partial
                                      ? "⚠ Parțial corect"
                                      : "✗ Incorect"}
                                  </p>
                                  <p className="text-sm whitespace-pre-wrap">{exercise.feedback}</p>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* Overall Feedback */}
                      {submissionStatus.grade.overallFeedback && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            Feedback general:
                          </h4>
                          <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                            {submissionStatus.grade.overallFeedback}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {submissionStatus.status === "error" && (
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                            Eroare
                          </h4>
                          <p className="text-sm text-red-800 dark:text-red-200">
                            {submissionStatus.message || "A apărut o eroare. Te rugăm să încerci din nou."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
