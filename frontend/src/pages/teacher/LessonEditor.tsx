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
import { CheckCircle2, AlertTriangle, FileCheck, Trash2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data - replace with actual data fetching from Firestore
const mockLessonData = {
  id: "lesson_123",
  title: "Introduction to Photosynthesis",
  subject: "Science",
  grade: "Grade 5",
  duration: "45 minutes",
  status: "draft" as "draft" | "fact-check pending" | "ready",
  studentSummary: `Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create their own food. This amazing process happens in the leaves of plants, specifically in structures called chloroplasts.

During photosynthesis, plants absorb sunlight through their leaves. The green pigment called chlorophyll captures the light energy. Plants also take in water through their roots and carbon dioxide from the air through tiny openings in their leaves called stomata.

Using these ingredients and the energy from sunlight, plants produce glucose (a type of sugar) which they use as food. As a byproduct, plants release oxygen into the air, which is essential for all living things to breathe.`,
  slides: [
    {
      id: "slide_1",
      title: "What is Photosynthesis?",
      content: "- Process by which plants make food\n- Uses sunlight, water, and CO2\n- Happens in leaves",
      hasIssue: false,
    },
    {
      id: "slide_2",
      title: "The Process",
      content: "- Plants absorb sunlight\n- Take in water and carbon dioxide\n- Convert to glucose and oxygen",
      hasIssue: false,
    },
    {
      id: "slide_3",
      title: "Key Components",
      content: "- Chlorophyll captures light\n- Stomata allow gas exchange\n- Roots absorb water",
      hasIssue: true,
    },
  ] as Slide[],
  teacherGuidelines: {
    objectives: "Students will understand how plants make food and identify key components of photosynthesis.",
    timing: "0-10 min: Introduction and hook\n10-25 min: Main content presentation\n25-40 min: Hands-on activity\n40-45 min: Wrap-up and assessment",
    questions: "What do you think plants need to grow?\nHow do you think plants make their food?\nWhat would happen if plants couldn't perform photosynthesis?",
    differentiation: "For struggling students: Provide visual aids and simplified explanations.\nFor advanced students: Discuss the chemical equation and deeper concepts.",
    assessment: "Exit ticket: Draw and label the photosynthesis process.\nQuick check: Ask students to explain in their own words.",
  },
};

export default function LessonEditor() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();

  const [lesson, setLesson] = useState(mockLessonData);
  const [activeTab, setActiveTab] = useState("studentSummary");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExportShareModal, setShowExportShareModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!user || userData?.role !== "teacher")) {
      navigate("/login");
    }
  }, [user, userData, loading, navigate]);

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
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    // In a real app, save to Firestore
  };

  const handleDelete = async () => {
    // In a real app, delete from Firestore
    navigate("/teacher/dashboard");
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
                  placeholder="Lesson title..."
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
                  {lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1)}
                </Badge>
                <Button variant="outline" onClick={handleRunFactCheck} size="sm">
                  <FileCheck className="h-4 w-4 mr-2" />
                  Run fact-check again
                </Button>
                <Button
                  onClick={() => {
                    handleStatusChange("ready");
                    handleSave();
                  }}
                  disabled={lesson.status === "ready"}
                  size="sm"
                >
                  Mark as ready
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="w-full">
              <TabsTrigger value="studentSummary" className="flex-1">
                Student summary
              </TabsTrigger>
              <TabsTrigger value="slides" className="flex-1">
                Slides
              </TabsTrigger>
              <TabsTrigger value="teacherGuidelines" className="flex-1">
                Teacher guidelines
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
              Delete lesson
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save draft"}
              </Button>
              <Button
                onClick={() => {
                  handleStatusChange("ready");
                  handleSave();
                }}
                disabled={lesson.status === "ready"}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as ready for students
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete lesson?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the lesson "{lesson.title}".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
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

