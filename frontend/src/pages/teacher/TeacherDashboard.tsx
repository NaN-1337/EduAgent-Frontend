import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Clock, TrendingUp, Lightbulb, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { t } from "@/lib/translations";

interface Lesson {
  id: string;
  title: string;
  subject: string;
  grade: string;
  dateModified: any;
  status: "draft" | "fact-check needed" | "ready";
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [analytics, setAnalytics] = useState({
    hoursSaved: 0,
    lessonsGenerated: 0,
    mostFrequentSubject: t("common.messages.noData"),
  });

  const tips = [
    t("teacherDashboard.tips.tip1"),
    t("teacherDashboard.tips.tip2"),
    t("teacherDashboard.tips.tip3"),
    t("teacherDashboard.tips.tip4"),
  ];

  useEffect(() => {
    if (!loading && (!user || userData?.role !== "teacher")) {
      navigate("/login");
    }
  }, [user, userData, loading, navigate]);

  useEffect(() => {
    const fetchLessons = async () => {
      if (!user || userData?.role !== "teacher") {
        setLoadingLessons(false);
        return;
      }

      try {
        setLoadingLessons(true);
        
        // Query lessons for this teacher
        const lessonsRef = collection(db, "lessons");
        const q = query(
          lessonsRef,
          where("teacherId", "==", user.uid),
          orderBy("lastModified", "desc")
        );

        const querySnapshot = await getDocs(q);
        const lessonsData: Lesson[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          lessonsData.push({
            id: doc.id,
            title: data.title || "Untitled Lesson",
            subject: data.subject || "Unknown",
            grade: data.grade || "Unknown",
            dateModified: data.lastModified || data.createdAt || new Date(),
            status: data.status || "draft",
          });
        });

        // Get last 5 lessons for recent lessons
        const recent = lessonsData.slice(0, 5);
        setRecentLessons(recent);

        // Calculate analytics
        const lessonsGenerated = lessonsData.length;
        // Estimate hours saved: assume 1.5 hours per lesson
        const hoursSaved = Math.round(lessonsGenerated * 1.5);
        
        // Find most frequent subject
        const subjectCounts: Record<string, number> = {};
        lessonsData.forEach((lesson) => {
          const subject = lesson.subject;
          subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
        });
        
        const mostFrequentSubject = Object.entries(subjectCounts).reduce((a, b) =>
          subjectCounts[a[0]] > subjectCounts[b[0]] ? a : b,
          ["N/A", 0]
        )[0];

        setAnalytics({
          hoursSaved,
          lessonsGenerated,
          mostFrequentSubject,
        });
      } catch (error) {
        console.error("Error fetching lessons:", error);
        // If query fails (e.g., missing index), try without orderBy
        try {
          const lessonsRef = collection(db, "lessons");
          const q = query(lessonsRef, where("teacherId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          const lessonsData: Lesson[] = [];

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            lessonsData.push({
              id: doc.id,
              title: data.title || "Untitled Lesson",
              subject: data.subject || "Unknown",
              grade: data.grade || "Unknown",
              dateModified: data.lastModified || data.createdAt || new Date(),
              status: data.status || "draft",
            });
          });

          // Sort by lastModified manually
          lessonsData.sort((a, b) => {
            const dateA = a.dateModified?.toDate?.() || new Date(a.dateModified) || new Date(0);
            const dateB = b.dateModified?.toDate?.() || new Date(b.dateModified) || new Date(0);
            return dateB.getTime() - dateA.getTime();
          });

          const recent = lessonsData.slice(0, 5);
          setRecentLessons(recent);

          // Calculate analytics
          const lessonsGenerated = lessonsData.length;
          const hoursSaved = Math.round(lessonsGenerated * 1.5);
          
          const subjectCounts: Record<string, number> = {};
          lessonsData.forEach((lesson) => {
            const subject = lesson.subject;
            subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
          });
          
          const mostFrequentSubject = Object.entries(subjectCounts).reduce((a, b) =>
            subjectCounts[a[0]] > subjectCounts[b[0]] ? a : b,
            ["N/A", 0]
          )[0];

          setAnalytics({
            hoursSaved,
            lessonsGenerated,
            mostFrequentSubject,
          });
        } catch (fallbackError) {
          console.error("Error in fallback query:", fallbackError);
        }
      } finally {
        setLoadingLessons(false);
      }
    };

    if (user && userData && userData.role === "teacher") {
      fetchLessons();
    }
  }, [user, userData]);

  if (loading || loadingLessons) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusColor = (status: "draft" | "fact-check needed" | "ready") => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      case "fact-check needed":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700";
      default:
        return "";
    }
  };

  const getStatusLabel = (status: "draft" | "fact-check needed" | "ready") => {
    const statusKey = status.replace(/\s+/g, "").replace(/-/g, "");
    return t(`common.status.${statusKey}` as any) || status;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return t("common.messages.notFound");
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return t("common.messages.today");
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t("common.messages.yesterday");
    } else {
      return date.toLocaleDateString("ro-RO", { month: "short", day: "numeric", year: "numeric" });
    }
  };

  const handleLessonClick = (lessonId: string) => {
    // Navigate to lesson editor
    navigate(`/teacher/lessons/${lessonId}/edit`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="teacher" />
      
      {/* Main content with padding for fixed navbar */}
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
            {/* Left column - ~60% (3/5 columns) */}
            <div className="lg:col-span-3 space-y-6 lg:space-y-8">
              {/* Create new lesson card */}
              <Card className="border-2 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-semibold">{t("teacherDashboard.createNewLesson.title")}</CardTitle>
                  <CardDescription className="text-base mt-2">
                    {t("teacherDashboard.createNewLesson.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => navigate("/teacher/new-lesson")}
                    size="lg"
                    className="w-full sm:w-auto text-base px-6 py-6 h-auto font-medium"
                    aria-label={t("teacherDashboard.createNewLesson.title")}
                  >
                    <Plus className="mr-2 h-5 w-5" aria-hidden="true" />
                    {t("teacherDashboard.createNewLesson.button")}
                  </Button>
                </CardContent>
              </Card>

              {/* Recent lessons card */}
              <Card className="border-2 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold">{t("teacherDashboard.recentLessons.title")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentLessons.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      {t("teacherDashboard.recentLessons.empty")}
                    </p>
                  ) : (
                    recentLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-lg border hover:bg-accent/50 transition-colors duration-200 cursor-pointer focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                        onClick={() => handleLessonClick(lesson.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleLessonClick(lesson.id);
                          }
                        }}
                        aria-label={`Open lesson: ${lesson.title}, ${lesson.subject}, ${lesson.grade}, modified ${formatDate(lesson.dateModified)}, status: ${lesson.status}`}
                      >
                        <div className="flex-1 space-y-1">
                          <h3 className="font-semibold text-lg">{lesson.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span>{lesson.subject}</span>
                            <span>·</span>
                            <span>{lesson.grade}</span>
                            <span>·</span>
                            <span>{formatDate(lesson.dateModified)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge 
                            className={`${getStatusColor(lesson.status)} border`}
                            aria-label={`${t("common.labels.status")}: ${getStatusLabel(lesson.status)}`}
                          >
                            {getStatusLabel(lesson.status)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLessonClick(lesson.id);
                            }}
                            aria-label={`${t("common.buttons.open")} ${lesson.title}`}
                          >
                            {t("common.buttons.open")}
                            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right column - ~40% (2/5 columns) */}
            <div className="lg:col-span-2 space-y-6 lg:space-y-8">
              {/* Analytics card */}
              <Card className="border-2 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {t("teacherDashboard.insights.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{t("teacherDashboard.insights.hoursSaved")}</span>
                    </div>
                    <p className="text-3xl font-semibold">{analytics.hoursSaved}h</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-sm">{t("teacherDashboard.insights.lessonsGenerated")}</span>
                    </div>
                    <p className="text-3xl font-semibold">{analytics.lessonsGenerated}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">{t("teacherDashboard.insights.mostFrequentSubject")}</span>
                    </div>
                    <p className="text-2xl font-semibold">{analytics.mostFrequentSubject}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Tips card */}
              <Card className="border-2 shadow-sm bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    {t("teacherDashboard.tips.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3" role="list">
                    {tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-primary mt-1" aria-hidden="true">•</span>
                        <span className="text-base leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

