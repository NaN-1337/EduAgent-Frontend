import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { convertLessonFromStorage, gradeToStorage, teachingFieldFromStorage } from "@/lib/dataConverters";
import { BookOpen, Users, ArrowRight, GraduationCap, User, BookMarked } from "lucide-react";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Teacher {
  uid: string;
  name: string;
  email: string;
  teachingField?: string; // Display value (translated)
  teachingFieldStorage?: string; // Storage key (for navigation/search)
  teacherCode?: string;
  photoURL?: string;
}

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

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();
  const { t, language } = useLanguage();
  const [enrolledTeachers, setEnrolledTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [myLessons, setMyLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);

  useEffect(() => {
    if (!loading && (!user || userData?.role !== "student")) {
      navigate("/login");
    }
  }, [user, userData, loading, navigate]);

  useEffect(() => {
    const fetchTeachers = async () => {
      if (!userData || userData.role !== "student" || !userData.enrolledTeachers) {
        setLoadingTeachers(false);
        return;
      }

      try {
        setLoadingTeachers(true);
        const enrolledTeacherIds = userData.enrolledTeachers;

        if (enrolledTeacherIds.length === 0) {
          setEnrolledTeachers([]);
          setLoadingTeachers(false);
          return;
        }

        // Fetch all teacher documents
        const teacherPromises = enrolledTeacherIds.map(async (teacherId) => {
          const teacherDocRef = doc(db, "users", teacherId);
          const teacherDocSnap = await getDoc(teacherDocRef);
          
          if (teacherDocSnap.exists()) {
            const data = teacherDocSnap.data();
            // Get current language for translations
            const currentLanguage = language;
            return {
              uid: data.uid,
              name: data.name,
              email: data.email,
              teachingField: data.teachingField 
                ? (() => {
                    const englishKey = teachingFieldFromStorage(data.teachingField);
                    return englishKey ? (translations[currentLanguage].teachingFields[englishKey] || data.teachingField) : data.teachingField;
                  })()
                : undefined,
              teachingFieldStorage: data.teachingField, // Keep original storage key
              teacherCode: data.teacherCode,
              photoURL: data.photoURL,
            } as Teacher;
          }
          return null;
        });

        const teacherResults = await Promise.all(teacherPromises);
        const validTeachers = teacherResults.filter((t) => t !== null) as Teacher[];
        setEnrolledTeachers(validTeachers);
      } catch (error) {
        console.error("Error fetching teachers:", error);
      } finally {
        setLoadingTeachers(false);
      }
    };

    if (userData && userData.role === "student") {
      fetchTeachers();
    }
  }, [userData, language]);

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

        // Sort by createdAt (most recent first) and limit to 3
        lessonsData.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

        // Limit to 3 most recent lessons
        setMyLessons(lessonsData.slice(0, 3));
      } catch (error) {
        console.error("Error fetching lessons:", error);
      } finally {
        setLoadingLessons(false);
      }
    };

    if (userData && userData.role === "student" && userData.enrolledTeachers && userData.grade) {
      fetchLessons();
    }
  }, [userData]);

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

            {/* Student Info Card */}
            <Card className="border-2 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  {t.student.dashboard.myInfo?.title || "My Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userData?.grade && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium text-muted-foreground">
                      {t.common.labels.grade}:
                    </span>
                    <Badge variant="outline" className="font-semibold">
                      {translations[language].grades[userData.grade as keyof typeof translations.ro.grades] || userData.grade}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* My Subjects Card */}
          <Card className="border-2 shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <BookMarked className="h-5 w-5 text-primary" />
                {language === "ro" ? "Materiile mele" : "My Subjects"}
              </CardTitle>
              <CardDescription>
                {language === "ro" ? "Materiile la care ești înscris, organizate pe profesori" : "Subjects you are enrolled in, organized by teacher"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTeachers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : enrolledTeachers.length === 0 ? (
                <div className="text-center py-8">
                  <BookMarked className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {language === "ro" ? "Nu ești înscris la nicio materie încă." : "You are not enrolled in any subjects yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrolledTeachers
                    .filter((teacher) => teacher.teachingField)
                    .map((teacher) => (
                      <div
                        key={teacher.uid}
                        onClick={() => navigate(`/student/lessons?subject=${encodeURIComponent(teacher.teachingFieldStorage || "")}`)}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigate(`/student/lessons?subject=${encodeURIComponent(teacher.teachingFieldStorage || "")}`);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="font-semibold text-base">
                              {teacher.teachingField}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {teacher.name}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enrolled Teachers Card */}
          <Card className="border-2 shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {t.student.dashboard.myTeachers?.title || "My Teachers"}
              </CardTitle>
              <CardDescription>
                {t.student.dashboard.myTeachers?.description || "Teachers you are enrolled with"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTeachers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : enrolledTeachers.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">
                    {t.student.dashboard.myTeachers?.emptyState || "You are not enrolled with any teachers yet."}
                  </p>
                  <Button
                    onClick={() => navigate("/lesson/join")}
                    variant="outline"
                    size="sm"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    {t.student.dashboard.joinLesson.button}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enrolledTeachers.map((teacher) => (
                    <div
                      key={teacher.uid}
                      className="flex items-start gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={teacher.photoURL} alt={teacher.name} />
                        <AvatarFallback>
                          {teacher.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{teacher.name}</p>
                        {teacher.teachingField && (
                          <p className="text-sm text-muted-foreground truncate">
                            {teacher.teachingField}
                          </p>
                        )}
                        {teacher.teacherCode && (
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            {t.common.labels.teacherCode}: {teacher.teacherCode}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {t.student.dashboard.myLessons.title}
              </CardTitle>
              <CardDescription>
                {language === "ro" ? "Ultimele 3 lecții adăugate" : "Latest 3 lessons added"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingLessons ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : myLessons.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {t.student.dashboard.myLessons.emptyState}
                </p>
              ) : (
                <>
                  {myLessons.map((lesson) => (
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
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{lesson.title}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span>{lesson.subject}</span>
                          <span>·</span>
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
                          aria-label={t.student.dashboard.myLessons.openAriaLabel(lesson.title)}
                        >
                          {t.student.dashboard.myLessons.openButton}
                          <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {myLessons.length >= 3 && (
                    <div className="pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => navigate("/student/lessons")}
                        className="w-full"
                      >
                        {language === "ro" ? "Vezi toate lecțiile" : "View all lessons"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

