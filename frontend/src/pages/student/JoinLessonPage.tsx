import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function JoinLessonPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userData, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [classCode, setClassCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    
    if (!classCode.trim()) {
      setError(t.student.joinLesson.errors.emptyCode);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Normalize the class code (uppercase, remove spaces)
      const normalizedCode = classCode.trim().toUpperCase().replace(/\s+/g, "");

      // TODO: Replace with actual Firestore lookup
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock validation - replace with real Firestore query
      // Example: query lessons collection where classCode field matches
      const isValidCode = normalizedCode.length >= 3; // Basic validation for demo

      if (!isValidCode) {
        setError(t.student.joinLesson.errors.codeNotFound);
        setIsLoading(false);
        return;
      }

      // If code is valid, navigate to the lesson
      // TODO: Replace with actual lesson ID from Firestore
      // For now, use the code as the lesson ID
      navigate(`/lesson/${normalizedCode}`);
    } catch (err) {
      console.error("Error joining lesson:", err);
      setError(t.student.joinLesson.errors.genericError);
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-uppercase and only allow alphanumeric characters
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10); // Limit to 10 chars
    setClassCode(value);
    setError(null); // Clear error when user types
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
            <CardTitle className="text-3xl font-bold">{t.student.joinLesson.title}</CardTitle>
            <CardDescription className="text-base">
              {t.student.joinLesson.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinLesson} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="classCode" className="text-base font-medium">
                  {t.student.joinLesson.classCodeLabel}
                </Label>
                <Input
                  id="classCode"
                  type="text"
                  value={classCode}
                  onChange={handleCodeChange}
                  placeholder={t.student.joinLesson.classCodePlaceholder}
                  maxLength={10}
                  className="h-14 text-lg text-center font-mono tracking-wider uppercase"
                  disabled={isLoading}
                  autoFocus
                  aria-required="true"
                  aria-invalid={!!error}
                  aria-describedby={error ? "error-message" : undefined}
                />
              </div>

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
                disabled={isLoading || !classCode.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t.student.joinLesson.buttonLoading}
                  </>
                ) : (
                  t.student.joinLesson.button
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                {t.student.joinLesson.helperText}
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

