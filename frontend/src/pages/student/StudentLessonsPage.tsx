import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { convertLessonFromStorage, gradeToStorage } from "@/lib/dataConverters";
import { BookOpen, ArrowRight, ChevronDown, ChevronRight, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { cn } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  subject: string;
  grade: string;
  teacherName: string;
  teacherId: string;
  createdAt?: any;
  lastModified?: any;
}

interface SubjectGroup {
  subject: string;
  lessons: Lesson[];
  expanded: boolean;
}

export default function StudentLessonsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userData, loading } = useAuth();
  const { t, language } = useLanguage();
  const [myLessons, setMyLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [subjects, setSubjects] = useState<SubjectGroup[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [showFiltered, setShowFiltered] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasProcessedUrlParam, setHasProcessedUrlParam] = useState(false);

  useEffect(() => {
    if (!loading && (!user || userData?.role !== "student")) {
      navigate("/login");
    }
  }, [user, userData, loading, navigate]);

  useEffect(() => {
    const fetchLessons = async () => {
      if (!userData || userData.role !== "student" || !userData.enrolledTeachers || !userData.grade) {
        setLoadingLessons(false);
        return;
      }

      try {
        setLoadingLessons(true);
        const enrolledTeacherIds = userData.enrolledTeachers;
        // Convert student grade to integer for querying (storage format)
        const studentGradeStorage = gradeToStorage(userData.grade || "");
        const studentGrade = studentGradeStorage !== null ? studentGradeStorage : userData.grade;

        if (enrolledTeacherIds.length === 0) {
          setMyLessons([]);
          setLoadingLessons(false);
          return;
        }

        // Fetch lessons for enrolled teachers that match the student's grade and are ready
        const lessonsRef = collection(db, "lessons");
        const lessonsData: Lesson[] = [];
        const teacherMap = new Map<string, string>(); // Map teacherId to teacher name

        // First, fetch all teacher names
        const teacherPromises = enrolledTeacherIds.map(async (teacherId) => {
          const teacherDocRef = doc(db, "users", teacherId);
          const teacherDocSnap = await getDoc(teacherDocRef);
          if (teacherDocSnap.exists()) {
            const data = teacherDocSnap.data();
            teacherMap.set(teacherId, data.name || "Unknown Teacher");
          }
        });
        await Promise.all(teacherPromises);

        // Query lessons for each enrolled teacher
        const lessonPromises = enrolledTeacherIds.map(async (teacherId) => {
          try {
            const q = query(
              lessonsRef,
              where("teacherId", "==", teacherId),
              where("grade", "==", studentGrade),
              where("status", "==", "ready"),
              orderBy("lastModified", "desc")
            );
            const querySnapshot = await getDocs(q);
            
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              // Convert from storage format to display format
              const converted = convertLessonFromStorage(data, {
                grades: translations[language].grades,
                teachingFields: translations[language].teachingFields,
              });
              lessonsData.push({
                id: doc.id,
                title: converted.title || "Untitled Lesson",
                subject: converted.subject || "Unknown",
                grade: converted.grade || "Unknown",
                teacherName: teacherMap.get(teacherId) || "Unknown Teacher",
                teacherId: teacherId,
                createdAt: data.createdAt,
                lastModified: data.lastModified,
              });
            });
          } catch (error) {
            // If orderBy fails, try without it
            try {
              const q = query(
                lessonsRef,
                where("teacherId", "==", teacherId),
                where("grade", "==", studentGrade),
                where("status", "==", "ready")
              );
              const querySnapshot = await getDocs(q);
              
              querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Convert from storage format to display format
                const converted = convertLessonFromStorage(data, {
                  grades: translations[language].grades,
                  teachingFields: translations[language].teachingFields,
                });
                lessonsData.push({
                  id: doc.id,
                  title: converted.title || "Untitled Lesson",
                  subject: converted.subject || "Unknown",
                  grade: converted.grade || "Unknown",
                  teacherName: teacherMap.get(teacherId) || "Unknown Teacher",
                  teacherId: teacherId,
                  createdAt: data.createdAt,
                  lastModified: data.lastModified,
                });
              });
            } catch (fallbackError) {
              console.error(`Error fetching lessons for teacher ${teacherId}:`, fallbackError);
            }
          }
        });

        await Promise.all(lessonPromises);

        // Sort by lastModified (most recent first)
        lessonsData.sort((a, b) => {
          const dateA = a.lastModified?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.lastModified?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

        setMyLessons(lessonsData);

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
      } finally {
        setLoadingLessons(false);
      }
    };

    if (userData && userData.role === "student" && userData.enrolledTeachers && userData.grade) {
      fetchLessons();
    }
  }, [userData, language]);

  // Handle subject query parameter from URL (only once when subjects are loaded)
  useEffect(() => {
    if (hasProcessedUrlParam || subjects.length === 0) {
      return;
    }

    const subjectParam = searchParams.get("subject");
    if (subjectParam) {
      const decodedSubject = decodeURIComponent(subjectParam);
      
      // Find and expand the subject if it exists
      const subjectExists = subjects.find((s) => s.subject === decodedSubject);
      if (subjectExists) {
        // Set search query
        setSearchQuery(decodedSubject);
        
        // Expand the subject
        setSubjects((prev) =>
          prev.map((s) =>
            s.subject === decodedSubject ? { ...s, expanded: true } : s
          )
        );
        
        // Select the subject
        setSelectedSubjects((prev) => {
          const newSet = new Set(prev);
          newSet.add(decodedSubject);
          return newSet;
        });
        
        // Mark as processed so we don't run again
        setHasProcessedUrlParam(true);
        
        // Remove query parameter from URL after processing
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete("subject");
        const newUrl = newSearchParams.toString() 
          ? `${window.location.pathname}?${newSearchParams.toString()}`
          : window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      } else {
        // Subject not found, mark as processed anyway
        setHasProcessedUrlParam(true);
      }
    } else {
      // No subject param, mark as processed
      setHasProcessedUrlParam(true);
    }
  }, [subjects, searchParams, hasProcessedUrlParam]);

  const toggleSubjectExpanded = (subject: string) => {
    // Toggle expanded state
    setSubjects((prev) =>
      prev.map((s) =>
        s.subject === subject ? { ...s, expanded: !s.expanded } : s
      )
    );
    
    // Only toggle selection if NOT in filtered mode
    // In filtered mode, clicking should only expand/collapse, not deselect
    if (!showFiltered) {
      const isCurrentlySelected = selectedSubjects.has(subject);
      setSelectedSubjects((prev) => {
        const newSet = new Set(prev);
        if (isCurrentlySelected) {
          // Already selected - deselect
          newSet.delete(subject);
        } else {
          // Not selected - select
          newSet.add(subject);
        }
        return newSet;
      });
    }
  };

  const toggleSubjectSelected = (subject: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
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

  // Don't auto-clear selection when user manually changes search
  // User should have full control after initial URL parameter is processed

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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

  // Calculate visible selected subjects (only those that are currently displayed)
  const visibleSelectedSubjects = displayedSubjects.filter((s) => 
    selectedSubjects.has(s.subject)
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="student" />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t.student.lessons.title}</h1>
            <p className="text-lg text-muted-foreground">
              {t.student.lessons.description}
            </p>
          </div>

          {myLessons.length === 0 ? (
            <Card className="border-2 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {t.student.lessons.emptyState}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  {t.student.lessons.allLessons}
                </CardTitle>
                <CardDescription>
                  {t.student.lessons.clickToStart}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search input */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder={t.student.lessons.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {displayedSubjects.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {t.student.lessons.noResults}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSubjectSelected(subjectGroup.subject, e);
                          }}
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
                                {subjectGroup.lessons.length} {subjectGroup.lessons.length === 1 ? t.student.lessons.lesson : t.student.lessons.lessons}
                              </Badge>
                            </div>
                          </button>
                        </div>

                        {/* Lessons list - only shown when expanded */}
                        {subjectGroup.expanded && (
                          <div className="px-3 pb-3 pt-0 border-t mt-2">
                            {subjectGroup.lessons.length === 0 ? (
                              <p className="text-muted-foreground text-center py-8 text-sm">
                                {t.student.lessons.emptyState}
                              </p>
                            ) : (
                              <div className="space-y-2 mt-3">
                                {subjectGroup.lessons.map((lesson) => (
                                  <div
                                    key={lesson.id}
                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors duration-200 cursor-pointer focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                                    onClick={() => navigate(`/lesson/${lesson.id}`)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        navigate(`/lesson/${lesson.id}`);
                                      }
                                    }}
                                    aria-label={t.student.lessons.lessonAriaLabel(lesson.title)}
                                  >
                                    <div className="flex-1 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-base">{lesson.title}</h3>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                        <span>{translations[language].grades[lesson.grade as keyof typeof translations.ro.grades] || lesson.grade}</span>
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
                                        aria-label={t.student.lessons.openAriaLabel(lesson.title)}
                                      >
                                        {t.student.lessons.openButton}
                                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
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

                {visibleSelectedSubjects.length > 0 && !showFiltered && (
                  <div className="mt-6 flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div>
                      <p className="font-medium">
                        {visibleSelectedSubjects.length} {visibleSelectedSubjects.length === 1 ? t.student.lessons.subjectSelected : t.student.lessons.subjectsSelected}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleShowSelectedLessons} className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        {t.student.lessons.showSelectedLessons}
                      </Button>
                    </div>
                  </div>
                )}

                {showFiltered && visibleSelectedSubjects.length > 0 && (
                  <div className="mt-6 flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div>
                      <p className="font-medium">
                        {visibleSelectedSubjects.length} {visibleSelectedSubjects.length === 1 ? t.student.lessons.subjectSelected : t.student.lessons.subjectsSelected}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleShowAllLessons}>
                        {t.student.lessons.showAllLessons}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
