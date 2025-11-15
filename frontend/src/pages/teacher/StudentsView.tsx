import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { gradeFromStorage } from "@/lib/dataConverters";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { Users, GraduationCap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Student {
  uid: string;
  name: string;
  email: string;
  grade: string;
  photoURL?: string;
}

export default function StudentsView() {
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();
  const { t, language } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsByGrade, setStudentsByGrade] = useState<Record<string, Student[]>>({});

  useEffect(() => {
    if (!loading && (!user || userData?.role !== "teacher")) {
      navigate("/login");
    }
  }, [user, userData, loading, navigate]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!userData || userData.role !== "teacher" || !userData.enrolledStudents) {
        setLoadingStudents(false);
        return;
      }

      try {
        setLoadingStudents(true);
        const enrolledStudentIds = userData.enrolledStudents;

        if (enrolledStudentIds.length === 0) {
          setStudents([]);
          setLoadingStudents(false);
          return;
        }

        // Fetch all student documents
        const studentPromises = enrolledStudentIds.map(async (studentId) => {
          const studentDocRef = doc(db, "users", studentId);
          const studentDocSnap = await getDoc(studentDocRef);
          
          if (studentDocSnap.exists()) {
            const data = studentDocSnap.data();
            return {
              uid: data.uid,
              name: data.name,
              email: data.email,
              grade: data.grade !== undefined
                ? (typeof data.grade === "number"
                    ? gradeFromStorage(data.grade)
                    : data.grade)
                : "Unknown",
              photoURL: data.photoURL,
            } as Student;
          }
          return null;
        });

        const studentResults = await Promise.all(studentPromises);
        const validStudents = studentResults.filter((s) => s !== null) as Student[];

        // Sort students by grade (extract number from "Grade X" format)
        const sortedStudents = validStudents.sort((a, b) => {
          const gradeA = parseInt(a.grade.replace(/\D/g, "")) || 0;
          const gradeB = parseInt(b.grade.replace(/\D/g, "")) || 0;
          return gradeA - gradeB;
        });

        setStudents(sortedStudents);

        // Group by grade
        const grouped: Record<string, Student[]> = {};
        sortedStudents.forEach((student) => {
          const grade = student.grade || "Unknown";
          if (!grouped[grade]) {
            grouped[grade] = [];
          }
          grouped[grade].push(student);
        });

        setStudentsByGrade(grouped);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoadingStudents(false);
      }
    };

    if (userData && userData.role === "teacher") {
      fetchStudents();
    }
  }, [userData]);

  if (loading || loadingStudents) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || userData?.role !== "teacher") {
    return null;
  }

  const gradeOrder = Object.keys(studentsByGrade).sort((a, b) => {
    const gradeA = parseInt(a.replace(/\D/g, "")) || 0;
    const gradeB = parseInt(b.replace(/\D/g, "")) || 0;
    return gradeA - gradeB;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="teacher" />

      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t.teacher.studentsView.title}</h1>
            <p className="text-muted-foreground">
              {t.teacher.studentsView.description}
            </p>
          </div>

          {students.length === 0 ? (
            <Card className="border-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Users className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t.teacher.studentsView.emptyTitle}</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {t.teacher.studentsView.emptyDescription}
                </p>
                {userData?.teacherCode && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">{t.teacher.studentsView.teacherCodeLabel}</p>
                    <p className="text-2xl font-bold text-primary font-mono">{userData.teacherCode}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {gradeOrder.map((grade) => (
                <Card key={grade} className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      {translations[language].grades[grade as keyof typeof translations.ro.grades] || grade}
                      <span className="text-base font-normal text-muted-foreground">
                        ({studentsByGrade[grade].length} {studentsByGrade[grade].length === 1 ? t.teacher.studentsView.student : t.teacher.studentsView.students})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {studentsByGrade[grade].map((student) => (
                        <div
                          key={student.uid}
                          className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={student.photoURL} alt={student.name} />
                            <AvatarFallback>
                              {student.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{student.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

