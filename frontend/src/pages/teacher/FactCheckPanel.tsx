import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { SummaryCard } from "@/components/fact-check/SummaryCard";
import { FilterControls, FilterType } from "@/components/fact-check/FilterControls";
import { ClaimItem, FlaggedClaim } from "@/components/fact-check/ClaimItem";
import { ContentPreview } from "@/components/fact-check/ContentPreview";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function FactCheckPanel() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();
  const { t } = useLanguage();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [selectedClaim, setSelectedClaim] = useState<FlaggedClaim | null>(null);
  const [fixingClaimId, setFixingClaimId] = useState<string | null>(null);
  const [acceptedClaimIds, setAcceptedClaimIds] = useState<Set<string>>(new Set());
  const [claims, setClaims] = useState<FlaggedClaim[]>([]);
  const [content, setContent] = useState({
    studentSummary: "",
    slides: [] as Array<{ title: string; content: string }>,
    teacherGuidelines: "",
  });
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && (!user || userData?.role !== "teacher")) {
      navigate("/login");
    }
  }, [user, userData, loading, navigate]);

  useEffect(() => {
    const fetchLessonData = async () => {
      if (!lessonId || !user) {
        setLoadingData(false);
        return;
      }

      try {
        setLoadingData(true);
        const lessonDocRef = doc(db, "lessons", lessonId);
        const lessonDocSnap = await getDoc(lessonDocRef);

        if (!lessonDocSnap.exists()) {
          console.error("Lesson not found");
          navigate("/teacher/dashboard");
          return;
        }

        const data = lessonDocSnap.data();

        // Fetch flagged issues
        const flaggedIssues = data.flaggedIssues || [];
        const claimsData: FlaggedClaim[] = flaggedIssues.map((issue: any) => ({
          id: issue.id || `claim_${Math.random()}`,
          claim: issue.claim || "",
          fullText: issue.fullText || issue.claim || "",
          severity: issue.severity || "warning",
          location: issue.location || {
            section: issue.section || "studentSummary",
            position: issue.position || 0,
            slideNumber: issue.slideNumber,
          },
          reason: issue.reason || issue.explanation || "",
          sources: issue.sources || [],
        }));

        setClaims(claimsData);

        // Fetch content
        let slides: Array<{ title: string; content: string }> = [];
        if (data.slides) {
          if (Array.isArray(data.slides)) {
            slides = data.slides.map((slide: any) => ({
              title: slide.title || "",
              content: slide.content || "",
            }));
          } else if (typeof data.slides === 'object') {
            slides = Object.values(data.slides).map((slide: any) => ({
              title: slide.title || "",
              content: slide.content || "",
            }));
          }
        }

        let teacherGuidelines = "";
        if (data.teacherGuidelines) {
          if (typeof data.teacherGuidelines === 'string') {
            teacherGuidelines = data.teacherGuidelines;
          } else {
            // If it's an object, combine all fields
            const parts: string[] = [];
            if (data.teacherGuidelines.objectives) parts.push(data.teacherGuidelines.objectives);
            if (data.teacherGuidelines.timing) parts.push(data.teacherGuidelines.timing);
            if (data.teacherGuidelines.questions) parts.push(data.teacherGuidelines.questions);
            if (data.teacherGuidelines.differentiation) parts.push(data.teacherGuidelines.differentiation);
            if (data.teacherGuidelines.assessment) parts.push(data.teacherGuidelines.assessment);
            teacherGuidelines = parts.join("\n\n");
          }
        }

        setContent({
          studentSummary: data.studentSummary || "",
          slides: slides,
          teacherGuidelines: teacherGuidelines,
        });
      } catch (error) {
        console.error("Error fetching lesson data:", error);
        navigate("/teacher/dashboard");
      } finally {
        setLoadingData(false);
      }
    };

    if (lessonId && user) {
      fetchLessonData();
    }
  }, [lessonId, user, navigate]);

  // Filter claims based on selected filter
  const filteredClaims = useMemo(() => {
    let filtered = claims.filter((claim) => !acceptedClaimIds.has(claim.id));

    if (selectedFilter === "warnings") {
      filtered = filtered.filter((claim) => claim.severity === "warning");
    } else if (selectedFilter === "critical") {
      filtered = filtered.filter((claim) => claim.severity === "critical");
    }

    return filtered;
  }, [selectedFilter, acceptedClaimIds, claims]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeClaims = claims.filter((claim) => !acceptedClaimIds.has(claim.id));
    const warnings = activeClaims.filter((c) => c.severity === "warning").length;
    const critical = activeClaims.filter((c) => c.severity === "critical").length;
    const verified = claims.length - activeClaims.length;

    return {
      claimsVerified: verified,
      totalClaims: claims.length,
      outdatedFacts: warnings,
      unsupportedStatements: critical,
    };
  }, [acceptedClaimIds, claims]);

  const status: "High confidence" | "Needs review" | "Critical issues found" =
    stats.unsupportedStatements > 0
      ? t.teacher.factCheck.status.criticalIssues as "Critical issues found"
      : stats.outdatedFacts > 0
      ? t.teacher.factCheck.status.needsReview as "Needs review"
      : t.teacher.factCheck.status.highConfidence as "High confidence";

  const handleFix = async (claimId: string) => {
    setFixingClaimId(claimId);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setFixingClaimId(null);
    // In a real app, update the claim status
  };

  const handleAccept = (claimId: string) => {
    setAcceptedClaimIds((prev) => new Set(prev).add(claimId));
    if (selectedClaim?.id === claimId) {
      setSelectedClaim(null);
    }
  };

  const handleEdit = (claim: FlaggedClaim) => {
    // In a real app, this would navigate to the editor and highlight the position
    setSelectedClaim(claim);
    // Scroll to the content section
    // You could use a ref or state to trigger scrolling in ContentPreview
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="teacher" />

      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t.teacher.factCheck.title}</h1>
            <p className="text-lg text-muted-foreground">
              {t.teacher.factCheck.description}
            </p>
          </div>

          {/* Split view */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
            {/* Left side - Summary & Claims */}
            <div className="lg:col-span-1 space-y-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
              <SummaryCard status={status} stats={stats} />
              <FilterControls
                selectedFilter={selectedFilter}
                onFilterChange={setSelectedFilter}
                warningCount={stats.outdatedFacts}
                criticalCount={stats.unsupportedStatements}
              />

              {/* Claims list */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">{t.teacher.factCheck.flaggedClaims}</h2>
                {filteredClaims.length === 0 ? (
                  <div className="p-6 text-center border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {claims.length === 0
                        ? t.teacher.factCheck.noIssues
                        : acceptedClaimIds.size === claims.length
                        ? t.teacher.factCheck.allReviewed
                        : t.teacher.factCheck.noMatches}
                    </p>
                  </div>
                ) : (
                  filteredClaims.map((claim) => (
                    <ClaimItem
                      key={claim.id}
                      claim={claim}
                      isSelected={selectedClaim?.id === claim.id}
                      onSelect={() => setSelectedClaim(claim)}
                      onFix={() => handleFix(claim.id)}
                      onAccept={() => handleAccept(claim.id)}
                      onEdit={() => handleEdit(claim)}
                      isFixing={fixingClaimId === claim.id}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Right side - Content Preview */}
            <div className="lg:col-span-2 min-h-[600px]">
              <ContentPreview
                studentSummary={content.studentSummary}
                slides={content.slides}
                teacherGuidelines={content.teacherGuidelines}
                selectedClaim={selectedClaim}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

