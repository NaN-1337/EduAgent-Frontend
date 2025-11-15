import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { isValidTeacherCode } from "@/lib/teacherCode";

export default function JoinLessonPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userData, loading: authLoading, refreshUserData } = useAuth();
  const { t } = useLanguage();
  const [classCode, setClassCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check for class code in URL parameters
  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setClassCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  // Redirect if not a student (optional - you might want to allow anyone to join)
  useEffect(() => {
    if (!authLoading && user && userData && userData.role !== "student") {
      // Allow non-students to join too, but could redirect if needed
      // navigate("/login");
    }
  }, [user, userData, authLoading, navigate]);

  const handleJoinLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !userData) {
      setError("You must be logged in to enroll with a teacher.");
      return;
    }

    if (userData.role !== "student") {
      setError("Only students can enroll with teachers.");
      return;
    }
    
    if (!classCode.trim()) {
      setError(t.student.joinLesson.errors.emptyCode);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Normalize the teacher code (uppercase, remove spaces)
      const normalizedCode = classCode.trim().toUpperCase().replace(/\s+/g, "");

      // Validate code format (6 alphanumeric characters)
      if (!isValidTeacherCode(normalizedCode)) {
        setError(t.student.joinLesson.errors.invalidCode || "Invalid teacher code format. Code must be 6 characters.");
        setIsLoading(false);
        return;
      }

      // Find teacher by teacher code
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("teacherCode", "==", normalizedCode), where("role", "==", "teacher"));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError(t.student.joinLesson.errors.codeNotFound);
        setIsLoading(false);
        return;
      }

      // Get the teacher document
      const teacherDoc = querySnapshot.docs[0];
      const teacherData = teacherDoc.data();
      const teacherId = teacherDoc.id;

      // Check if student is already enrolled
      const enrolledStudents = teacherData.enrolledStudents || [];
      if (enrolledStudents.includes(user.uid)) {
        setError("You are already enrolled with this teacher.");
        setIsLoading(false);
        return;
      }

      // Add student to teacher's enrolledStudents array
      const teacherDocRef = doc(db, "users", teacherId);
      await updateDoc(teacherDocRef, {
        enrolledStudents: arrayUnion(user.uid),
      });

      // Optionally, store teacher ID in student's document
      const studentDocRef = doc(db, "users", user.uid);
      const studentDocSnap = await getDoc(studentDocRef);
      if (studentDocSnap.exists()) {
        const studentData = studentDocSnap.data();
        const enrolledTeachers = studentData.enrolledTeachers || [];
        if (!enrolledTeachers.includes(teacherId)) {
          await updateDoc(studentDocRef, {
            enrolledTeachers: arrayUnion(teacherId),
          });
        }
      }

      // Refresh user data to get updated enrolledTeachers
      await refreshUserData();

      // Show success message
      setSuccess(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate("/student/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Error enrolling with teacher:", err);
      setError(t.student.joinLesson.errors.genericError || "An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-uppercase and only allow alphanumeric characters, limit to 6 chars for teacher code
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setClassCode(value);
    setError(null); // Clear error when user types
    setSuccess(false); // Clear success when user types
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10">
      {/* Top: Simple logo and app name */}
      <div className="pt-6 px-4 sm:px-6">
        <Link 
          to="/student/dashboard" 
          className="flex items-center justify-center space-x-3 text-foreground/70 hover:text-foreground transition-colors"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            EA
          </div>
          <span className="text-lg font-semibold">EduAgent</span>
        </Link>
      </div>

      {/* Centered main card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <Card className="w-full max-w-md shadow-xl border-2 dark:border-primary/20 backdrop-blur-sm bg-card/95 dark:bg-card/95">
          <CardHeader className="space-y-2 text-center pb-6">
            <CardTitle className="text-3xl font-bold">{t.student.joinLesson.title || "Enroll with Teacher"}</CardTitle>
            <CardDescription className="text-base">
              {t.student.joinLesson.description || "Enter your teacher's code to join their class"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinLesson} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="classCode" className="text-base font-medium">
                  {t.student.joinLesson.classCodeLabel || "Teacher Code"}
                </Label>
                <Input
                  id="classCode"
                  type="text"
                  value={classCode}
                  onChange={handleCodeChange}
                  placeholder={t.student.joinLesson.classCodePlaceholder || "Enter 6-character code"}
                  maxLength={6}
                  className="h-14 text-lg text-center font-mono tracking-wider uppercase"
                  disabled={isLoading || success}
                  autoFocus
                  aria-required="true"
                  aria-invalid={!!error}
                  aria-describedby={error ? "error-message" : success ? "success-message" : undefined}
                />
              </div>

              {success && (
                <div
                  id="success-message"
                  className="flex items-start gap-2 p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800"
                  role="alert"
                >
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Successfully enrolled! Redirecting to dashboard...</span>
                </div>
              )}

              {error && (
                <div
                  id="error-message"
                  className="flex items-start gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={isLoading || !classCode.trim() || success}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t.student.joinLesson.buttonLoading || "Enrolling..."}
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Enrolled!
                  </>
                ) : (
                  t.student.joinLesson.button || "Enroll with Teacher"
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                {t.student.joinLesson.helperText || "Ask your teacher for their 6-character enrollment code"}
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

