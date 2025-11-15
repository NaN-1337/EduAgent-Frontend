import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen } from "lucide-react";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();

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
            <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
            <p className="text-lg text-muted-foreground">
              Welcome back, {userData?.name || "Student"}!
            </p>
          </div>

          <Card className="border-2 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                My Lessons
              </CardTitle>
              <CardDescription>
                Access your assigned lessons and learning materials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                No lessons assigned yet. Your teacher will share lessons with you soon.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

