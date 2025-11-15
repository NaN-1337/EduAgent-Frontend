import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentSummaryTab } from "@/components/lesson-editor/StudentSummaryTab";
import { SlidesTab, Slide } from "@/components/lesson-editor/SlidesTab";
import { TeacherGuidelinesTab } from "@/components/lesson-editor/TeacherGuidelinesTab";
import { ExportShareModal } from "@/components/lesson-editor/ExportShareModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle2, AlertTriangle, FileCheck, Trash2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

interface LessonData {
  id: string;
  title: string;
  subject: string;
  grade: string;
  duration: string;
  status: "draft" | "fact-check pending" | "ready";
  studentSummary: string;
  slides: Slide[];
  teacherGuidelines: {
    objectives: string;
    timing: string;
    questions: string;
    differentiation: string;
    assessment: string;
  };
}

export default function LessonEditor() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();
  const { t } = useLanguage();

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(true);
  const [activeTab, setActiveTab] = useState("studentSummary");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExportShareModal, setShowExportShareModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!user || userData?.role !== "teacher")) {
      navigate("/login");
    }
  }, [user, userData, loading, navigate]);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId || !user) {
        setLoadingLesson(false);
        return;
      }

      try {
        setLoadingLesson(true);
        const lessonDocRef = doc(db, "lessons", lessonId);
        const lessonDocSnap = await getDoc(lessonDocRef);

        if (!lessonDocSnap.exists()) {
          console.error("Lesson not found");
          navigate("/teacher/dashboard");
          return;
        }

        const data = lessonDocSnap.data();
        
        // Parse slides from Firestore (could be array or object)
        let slides: Slide[] = [];
        if (data.slides) {
          if (Array.isArray(data.slides)) {
            slides = data.slides;
          } else if (typeof data.slides === 'object') {
            slides = Object.values(data.slides);
          }
        }

        // Parse teacher guidelines
        let teacherGuidelines = {
          objectives: "",
          timing: "",
          questions: "",
          differentiation: "",
          assessment: "",
        };
        
        if (data.teacherGuidelines) {
          if (typeof data.teacherGuidelines === 'string') {
            // If it's a string, try to parse it or use as is
            teacherGuidelines = {
              objectives: data.learningObjectives?.[0] || "",
              timing: "",
              questions: "",
              differentiation: "",
              assessment: "",
            };
          } else {
            teacherGuidelines = {
              objectives: data.teacherGuidelines.objectives || data.learningObjectives?.[0] || "",
              timing: data.teacherGuidelines.timing || "",
              questions: data.teacherGuidelines.questions || "",
              differentiation: data.teacherGuidelines.differentiation || "",
              assessment: data.teacherGuidelines.assessment || "",
            };
          }
        }

        const lessonData: LessonData = {
          id: lessonDocSnap.id,
          title: data.title || "Untitled Lesson",
          subject: data.subject || "Unknown",
          grade: data.grade || "Unknown",
          duration: data.duration || "",
          status: data.status || "draft",
          studentSummary: data.studentSummary || "",
          slides: slides,
          teacherGuidelines: teacherGuidelines,
        };

        setLesson(lessonData);
      } catch (error) {
        console.error("Error fetching lesson:", error);
        navigate("/teacher/dashboard");
      } finally {
        setLoadingLesson(false);
      }
    };

    if (lessonId && user) {
      fetchLesson();
    }
  }, [lessonId, user, navigate]);

  const handleTitleChange = (title: string) => {
    setLesson({ ...lesson, title });
  };

  const handleStatusChange = (status: "draft" | "fact-check pending" | "ready") => {
    setLesson({ ...lesson, status });
    if (status === "ready") {
      setShowExportShareModal(true);
    }
  };

  const handleSave = async () => {
    if (!lesson || !lessonId) return;
    
    setIsSaving(true);
    try {
      const lessonDocRef = doc(db, "lessons", lessonId);
      await updateDoc(lessonDocRef, {
        title: lesson.title,
        status: lesson.status,
        studentSummary: lesson.studentSummary,
        slides: lesson.slides,
        teacherGuidelines: lesson.teacherGuidelines,
        updatedAt: new Date(),
        lastModified: new Date(),
      });
    } catch (error) {
      console.error("Error saving lesson:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!lessonId) return;
    
    try {
      const lessonDocRef = doc(db, "lessons", lessonId);
      await deleteDoc(lessonDocRef);
      navigate("/teacher/dashboard");
    } catch (error) {
      console.error("Error deleting lesson:", error);
    }
  };

  const handleRunFactCheck = () => {
    navigate(`/teacher/lessons/${lessonId}/fact-check`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      case "fact-check pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700";
      default:
        return "";
    }
  };

  if (loading || loadingLesson || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="teacher" />

      <main className="pt-16 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Top Header */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <Input
                  value={lesson.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="text-2xl font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0"
                  placeholder={t.teacher.lessonEditor.placeholder}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {lesson.subject} · {lesson.grade} · {lesson.duration}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={cn(getStatusColor(lesson.status), "border")}>
                  {lesson.status === "ready" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {lesson.status === "fact-check pending" && (
                    <AlertTriangle className="h-3 w-3 mr-1" />
                  )}
                  {t.common.status[lesson.status as keyof typeof t.common.status] || (lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1))}
                </Badge>
                <Button variant="outline" onClick={handleRunFactCheck} size="sm">
                  <FileCheck className="h-4 w-4 mr-2" />
                  {t.teacher.lessonEditor.runFactCheck}
                </Button>
                <Button
                  onClick={() => {
                    handleStatusChange("ready");
                    handleSave();
                  }}
                  disabled={lesson.status === "ready"}
                  size="sm"
                >
                  {t.teacher.lessonEditor.markAsReady}
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="w-full">
              <TabsTrigger value="studentSummary" className="flex-1">
                {t.teacher.lessonEditor.tabs.studentSummary}
              </TabsTrigger>
              <TabsTrigger value="slides" className="flex-1">
                {t.teacher.lessonEditor.tabs.slides}
              </TabsTrigger>
              <TabsTrigger value="teacherGuidelines" className="flex-1">
                {t.teacher.lessonEditor.tabs.teacherGuidelines}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="studentSummary" className="mt-6">
              <StudentSummaryTab
                content={lesson.studentSummary}
                onChange={(content) => setLesson({ ...lesson, studentSummary: content })}
                issues={[]} // In real app, fetch from fact-check data
              />
            </TabsContent>

            <TabsContent value="slides" className="mt-6">
              <SlidesTab
                slides={lesson.slides}
                onChange={(slides) => setLesson({ ...lesson, slides })}
              />
            </TabsContent>

            <TabsContent value="teacherGuidelines" className="mt-6">
              <TeacherGuidelinesTab
                guidelines={lesson.teacherGuidelines}
                onChange={(guidelines) => setLesson({ ...lesson, teacherGuidelines: guidelines })}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Bottom Sticky Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t.common.delete} {t.teacher.myLessons.lesson}
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? t.teacher.lessonEditor.saving : t.teacher.lessonEditor.saveDraft}
              </Button>
              <Button
                onClick={() => {
                  handleStatusChange("ready");
                  handleSave();
                }}
                disabled={lesson.status === "ready"}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {t.teacher.lessonEditor.markReadyForStudents}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.teacher.lessonEditor.deleteTitle}</DialogTitle>
            <DialogDescription>
              {t.teacher.lessonEditor.deleteDescription(lesson.title)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export & Share Modal */}
      <ExportShareModal
        open={showExportShareModal}
        onOpenChange={setShowExportShareModal}
        lesson={{
          id: lesson.id,
          title: lesson.title,
          subject: lesson.subject,
          grade: lesson.grade,
        }}
        onDone={() => {
          setShowExportShareModal(false);
          navigate("/teacher/dashboard");
        }}
        onBack={() => {
          setShowExportShareModal(false);
        }}
      />
    </div>
  );
}

