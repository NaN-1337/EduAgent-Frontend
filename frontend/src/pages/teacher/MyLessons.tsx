import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { convertLessonFromStorage } from "@/lib/dataConverters";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { BookOpen, ArrowRight, Plus, ChevronDown, ChevronRight, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Lesson {
  uid: string;
  title: string;
  grade: string;
  subject: string;
  duration?: string;
  status: "draft" | "fact-check needed" | "ready";
  lastModified?: any;
  createdAt?: any;
}

interface SubjectGroup {
  subject: string;
  lessons: Lesson[];
  expanded: boolean;
}

export default function MyLessons() {
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();
  const { t, language } = useLanguage();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [subjects, setSubjects] = useState<SubjectGroup[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [showFiltered, setShowFiltered] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
          // Convert from storage format to display format
          const converted = convertLessonFromStorage(data, {
            grades: translations[language].grades,
            teachingFields: translations[language].teachingFields,
          });
          lessonsData.push({
            uid: doc.id,
            title: converted.title || "Untitled Lesson",
            grade: converted.grade || "Unknown",
            subject: converted.subject || "Unknown",
            duration: data.duration,
            status: data.status || "draft",
            lastModified: data.lastModified,
            createdAt: data.createdAt,
          });
        });

        setLessons(lessonsData);

        // Group by subject
        const grouped: Record<string, Lesson[]> = {};
        lessonsData.forEach((lesson) => {
          const subject = lesson.subject || "Unknown";
          if (!grouped[subject]) {
            grouped[subject] = [];
          }
          grouped[subject].push(lesson);
        });

          // Create subject groups
          const subjectGroups: SubjectGroup[] = Object.keys(grouped)
            .sort()
            .map((subject) => ({
              subject,
              lessons: grouped[subject],
              expanded: false,
            }));

        setSubjects(subjectGroups);
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
            // Convert from storage format to display format
            const converted = convertLessonFromStorage(data, {
              grades: translations[language].grades,
              teachingFields: translations[language].teachingFields,
            });
            lessonsData.push({
              uid: doc.id,
              title: converted.title || "Untitled Lesson",
              grade: converted.grade || "Unknown",
              subject: converted.subject || "Unknown",
              duration: data.duration,
              status: data.status || "draft",
              lastModified: data.lastModified,
              createdAt: data.createdAt,
            });
          });

          // Sort by lastModified manually
          lessonsData.sort((a, b) => {
            const dateA = a.lastModified?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.lastModified?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
            return dateB.getTime() - dateA.getTime();
          });

          setLessons(lessonsData);

          // Group by subject
          const grouped: Record<string, Lesson[]> = {};
          lessonsData.forEach((lesson) => {
            const subject = lesson.subject || "Unknown";
            if (!grouped[subject]) {
              grouped[subject] = [];
            }
            grouped[subject].push(lesson);
          });

          // Create subject groups
          const subjectGroups: SubjectGroup[] = Object.keys(grouped)
            .sort()
            .map((subject) => ({
              subject,
              lessons: grouped[subject],
              expanded: false,
            }));

          setSubjects(subjectGroups);
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
  }, [user, userData, language]);

  const toggleSubjectExpanded = (subject: string) => {
    const currentSubject = subjects.find((s) => s.subject === subject);
    const isCurrentlyExpanded = currentSubject?.expanded || false;
    
    // Toggle expanded state
    setSubjects((prev) =>
      prev.map((s) =>
        s.subject === subject ? { ...s, expanded: !s.expanded } : s
      )
    );
    
    // Also toggle selection when clicking to expand/collapse
    setSelectedSubjects((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlyExpanded) {
        // Collapsing - remove from selection
        newSet.delete(subject);
      } else {
        // Expanding - add to selection
        newSet.add(subject);
      }
      return newSet;
    });
  };

  const toggleSubjectSelected = (subject: string) => {
    setSelectedSubjects((prev) => {
      const newSet = new Set(prev);
      const wasSelected = newSet.has(subject);
      if (wasSelected) {
        newSet.delete(subject);
        // Collapse when deselected
        setSubjects((prevSubjects) =>
          prevSubjects.map((s) =>
            s.subject === subject ? { ...s, expanded: false } : s
          )
        );
      } else {
        newSet.add(subject);
        // Expand when selected
        setSubjects((prevSubjects) =>
          prevSubjects.map((s) =>
            s.subject === subject ? { ...s, expanded: true } : s
          )
        );
      }
      return newSet;
    });
  };

  const handleShowSelectedLessons = () => {
    setShowFiltered(true);
    // Expand all selected subjects
    setSubjects((prev) =>
      prev.map((s) =>
        selectedSubjects.has(s.subject) ? { ...s, expanded: true } : s
      )
    );
  };

  const handleShowAllLessons = () => {
    setShowFiltered(false);
    setSelectedSubjects(new Set());
    setSubjects((prev) =>
      prev.map((s) => ({ ...s, expanded: false }))
    );
  };

  if (loading || loadingLessons) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || userData?.role !== "teacher") {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      case "fact-check needed":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
      case "draft":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
      default:
        return "";
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return t.teacher.myLessons.unknownDate;
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t.common.messages.today;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t.common.messages.yesterday;
    } else {
      return date.toLocaleDateString(language === "ro" ? "ro-RO" : "en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  };

  const handleLessonClick = (lessonId: string) => {
    navigate(`/teacher/lessons/${lessonId}/edit`);
  };

  // Filter subjects based on search query and selection
  const displayedSubjects = (() => {
    let filtered = subjects;
    
    // First apply search filter if there's a query
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.map((subjectGroup) => {
        // Check if subject name matches
        const subjectMatches = subjectGroup.subject.toLowerCase().includes(query);
        
        // Check if any lesson title matches
        const lessonsMatch = subjectGroup.lessons.some((lesson) =>
          lesson.title.toLowerCase().includes(query)
        );
        
        // If subject or any lesson matches, include it but filter lessons
        if (subjectMatches || lessonsMatch) {
          return {
            ...subjectGroup,
            lessons: subjectMatches
              ? subjectGroup.lessons // If subject matches, show all lessons
              : subjectGroup.lessons.filter((lesson) =>
                  lesson.title.toLowerCase().includes(query)
                ), // If only lessons match, filter lessons
          };
        }
        return null;
      }).filter((s) => s !== null) as SubjectGroup[];
    }
    
    // Then apply selection filter if showFiltered is true
    if (showFiltered) {
      filtered = filtered.filter((s) => selectedSubjects.has(s.subject));
    }
    
    return filtered;
  })();

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="teacher" />

      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t.teacher.myLessons.title}</h1>
              <p className="text-muted-foreground">
                {t.teacher.myLessons.description}
              </p>
            </div>
            <Button onClick={() => navigate("/teacher/new-lesson")} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t.teacher.myLessons.newLesson}
            </Button>
          </div>

          {lessons.length === 0 ? (
            <Card className="border-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t.teacher.myLessons.emptyTitle}</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  {t.teacher.myLessons.emptyDescription}
                </p>
                <Button onClick={() => navigate("/teacher/new-lesson")} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  {t.teacher.myLessons.createFirst}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Subjects list with lessons */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {t.teacher.myLessons.subjectsTitle}
                  </CardTitle>
                  <CardDescription>
                    {t.teacher.myLessons.subjectsDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Search input */}
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder={t.teacher.myLessons.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  {displayedSubjects.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      {t.teacher.myLessons.noResults}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {displayedSubjects.map((subjectGroup) => {
                      const isSelected = selectedSubjects.has(subjectGroup.subject);
                      return (
                        <div
                          key={subjectGroup.subject}
                          className={cn(
                            "rounded-lg border transition-colors",
                            isSelected && "bg-primary/5 border-primary/20"
                          )}
                        >
                          {/* Subject header */}
                          <div className="flex items-center gap-3 p-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSubjectSelected(subjectGroup.subject)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={() => toggleSubjectExpanded(subjectGroup.subject)}
                              className="flex-1 flex items-center justify-between text-left hover:bg-accent/50 rounded-md p-2 -m-2 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {subjectGroup.expanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="font-semibold text-base">{subjectGroup.subject}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {subjectGroup.lessons.length} {subjectGroup.lessons.length === 1 ? t.teacher.myLessons.lesson : t.teacher.myLessons.lessons}
                                </Badge>
                              </div>
                            </button>
                          </div>

                          {/* Lessons list - only shown when expanded */}
                          {subjectGroup.expanded && (
                            <div className="px-3 pb-3 pt-0 border-t mt-2">
                              {subjectGroup.lessons.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8 text-sm">
                                  {t.teacher.myLessons.noLessonsInSubject}
                                </p>
                              ) : (
                                <div className="space-y-2 mt-3">
                                  {subjectGroup.lessons.map((lesson) => (
                                    <div
                                      key={lesson.uid}
                                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                                      onClick={() => handleLessonClick(lesson.uid)}
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          handleLessonClick(lesson.uid);
                                        }
                                      }}
                                    >
                                      <div className="flex-1 space-y-1">
                                        <h3 className="font-semibold text-base">{lesson.title}</h3>
                                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                          <span>{lesson.grade}</span>
                                          {lesson.duration && (
                                            <>
                                              <span>·</span>
                                              <span>{lesson.duration}</span>
                                            </>
                                          )}
                                          <span>·</span>
                                          <span>
                                            {formatDate(lesson.lastModified || lesson.createdAt)}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <Badge
                                          className={`${getStatusColor(lesson.status)} border capitalize text-xs`}
                                        >
                                          {t.common.status[lesson.status as keyof typeof t.common.status] || lesson.status}
                                        </Badge>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="shrink-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleLessonClick(lesson.uid);
                                          }}
                                        >
                                          {t.teacher.myLessons.open}
                                          <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  )}

                  {selectedSubjects.size > 0 && !showFiltered && (
                    <div className="mt-6 flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div>
                        <p className="font-medium">
                          {t.teacher.myLessons.selectedCount(selectedSubjects.size)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleShowSelectedLessons} className="flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          {t.teacher.myLessons.showSelectedLessons}
                        </Button>
                      </div>
                    </div>
                  )}

                  {showFiltered && (
                    <div className="mt-6 flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div>
                        <p className="font-medium">
                          {t.teacher.myLessons.selectedCount(selectedSubjects.size)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleShowAllLessons}>
                          {t.teacher.myLessons.showAllLessons}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
