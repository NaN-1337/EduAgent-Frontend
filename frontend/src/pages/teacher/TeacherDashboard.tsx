import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Clock, TrendingUp, Lightbulb, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

// Mock data - replace with actual data fetching
const recentLessons = [
  {
    id: "1",
    title: "Introduction to Photosynthesis",
    subject: "Science",
    grade: "Grade 5",
    dateModified: "2024-01-15",
    status: "Ready" as const,
  },
  {
    id: "2",
    title: "Ancient Civilizations",
    subject: "History",
    grade: "Grade 6",
    dateModified: "2024-01-14",
    status: "Fact-check needed" as const,
  },
  {
    id: "3",
    title: "Basic Algebra",
    subject: "Mathematics",
    grade: "Grade 7",
    dateModified: "2024-01-13",
    status: "Draft" as const,
  },
  {
    id: "4",
    title: "Shakespeare's Sonnets",
    subject: "English",
    grade: "Grade 9",
    dateModified: "2024-01-12",
    status: "Ready" as const,
  },
];

const analytics = {
  hoursSaved: 12,
  lessonsGenerated: 8,
  mostFrequentSubject: "Science",
};

const tips = [
  "Specify grade level clearly in your prompt",
  "Add 1–3 learning objectives for better results",
  "Include preferred teaching style or format",
  "Mention any specific topics to emphasize or avoid",
];

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || userData?.role !== "teacher")) {
      navigate("/login");
    }
  }, [user, userData, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusColor = (status: "Draft" | "Fact-check needed" | "Ready") => {
    switch (status) {
      case "Ready":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      case "Fact-check needed":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
      case "Draft":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700";
      default:
        return "";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  };

  const handleLessonClick = (lessonId: string) => {
    // Navigate to lesson editor
    navigate(`/teacher/lessons/${lessonId}`);
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
                  <CardTitle className="text-2xl font-semibold">Create new lesson</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Generate summary, slides, and teaching guidelines with built-in fact checking.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => navigate("/teacher/new-lesson")}
                    size="lg"
                    className="w-full sm:w-auto text-base px-6 py-6 h-auto font-medium"
                    aria-label="Create a new lesson"
                  >
                    <Plus className="mr-2 h-5 w-5" aria-hidden="true" />
                    New lesson
                  </Button>
                </CardContent>
              </Card>

              {/* Recent lessons card */}
              <Card className="border-2 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold">Recent lessons</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentLessons.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No lessons yet. Create your first lesson to get started.
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
                            aria-label={`Status: ${lesson.status}`}
                          >
                            {lesson.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLessonClick(lesson.id);
                            }}
                            aria-label={`Open ${lesson.title}`}
                          >
                            Open
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
                    Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Hours saved</span>
                    </div>
                    <p className="text-3xl font-semibold">{analytics.hoursSaved}h</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-sm">Lessons generated</span>
                    </div>
                    <p className="text-3xl font-semibold">{analytics.lessonsGenerated}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">Most frequent subject</span>
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
                    Tips for better lessons
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

