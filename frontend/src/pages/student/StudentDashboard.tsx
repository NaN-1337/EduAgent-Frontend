import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMockLessonsList } from "@/lib/translations";
import { BookOpen, Users, ArrowRight } from "lucide-react";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();
  const { t, language } = useLanguage();
  
  // Get mock lessons based on current language
  const myLessons = useMemo(() => getMockLessonsList(language), [language]);

  useEffect(() => {
    if (!loading && (!user || userData?.role !== "student")) {
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="student" />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t.student.dashboard.title}</h1>
            <p className="text-lg text-muted-foreground">
              {t.student.dashboard.welcomeMessage(userData?.name || t.placeholders.student)}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Join Lesson Card */}
            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-semibold">{t.student.dashboard.joinLesson.title}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {t.student.dashboard.joinLesson.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate("/lesson/join")}
                  size="lg"
                  className="w-full sm:w-auto text-base px-6 py-6 h-auto font-medium"
                  aria-label={t.student.dashboard.joinLesson.ariaLabel}
                >
                  <Users className="mr-2 h-5 w-5" aria-hidden="true" />
                  {t.student.dashboard.joinLesson.button}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {t.student.dashboard.myLessons.title}
              </CardTitle>
              <CardDescription>
                {t.student.dashboard.myLessons.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {myLessons.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {t.student.dashboard.myLessons.emptyState}
                </p>
              ) : (
                myLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-lg border hover:bg-accent/50 transition-colors duration-200 cursor-pointer focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                    onClick={() => navigate(`/lesson/${lesson.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/lesson/${lesson.id}`);
                      }
                    }}
                    aria-label={t.student.dashboard.myLessons.lessonAriaLabel(lesson.title)}
                  >
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold text-lg">{lesson.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>{lesson.subject}</span>
                        <span>·</span>
                        <span>{lesson.grade}</span>
                        <span>·</span>
                        <span>{lesson.teacherName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/lesson/${lesson.id}`);
                        }}
                        aria-label={t.student.dashboard.myLessons.openAriaLabel(lesson.title)}
                      >
                        {t.student.dashboard.myLessons.openButton}
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

