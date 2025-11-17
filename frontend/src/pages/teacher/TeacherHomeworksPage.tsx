import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileText } from "lucide-react";

export default function TeacherHomeworksPage() {
  const { user, userData, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loadingHomeworks, setLoadingHomeworks] = useState(false);

  useEffect(() => {
    if (!loading && (!user || userData?.role !== "teacher")) {
      navigate("/login");
    }
  }, [user, userData, loading, navigate]);

  if (loading || loadingHomeworks) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="teacher" />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {t.teacher.homeworks?.title || "Temele mele"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t.teacher.homeworks?.description || "Vizualizează și gestionează toate temele pentru elevi"}
            </p>
          </div>

          {/* Empty State */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  {t.teacher.homeworks?.emptyTitle || "Nicio temă încă"}
                </p>
                <p className="text-muted-foreground">
                  {t.teacher.homeworks?.emptyDescription || 
                   "Temele generate pentru lecții vor apărea aici"}
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  Coming soon...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
