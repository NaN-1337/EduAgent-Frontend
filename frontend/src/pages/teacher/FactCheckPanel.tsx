import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { SummaryCard } from "@/components/fact-check/SummaryCard";
import { FilterControls, FilterType } from "@/components/fact-check/FilterControls";
import { ClaimItem, FlaggedClaim } from "@/components/fact-check/ClaimItem";
import { ContentPreview } from "@/components/fact-check/ContentPreview";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

// Mock data - replace with actual data fetching from Firestore
const mockClaims: FlaggedClaim[] = [
  {
    id: "claim_1",
    claim: "Photosynthesis occurs only during daylight hours",
    fullText: "Photosynthesis occurs only during daylight hours when sunlight is available.",
    severity: "warning",
    location: {
      section: "studentSummary",
      position: 150,
    },
    reason: "Oversimplification - Some plants can perform limited photosynthesis at night.",
    sources: [
      { title: "Encyclopedia Britannica - Photosynthesis", url: "https://example.com" },
      { title: "Science Journal - Plant Biology", url: "https://example.com" },
    ],
  },
  {
    id: "claim_2",
    claim: "Chlorophyll is the only pigment involved in photosynthesis",
    fullText: "Chlorophyll is the only pigment involved in the process of photosynthesis.",
    severity: "critical",
    location: {
      section: "slides",
      slideNumber: 3,
      position: 200,
    },
    reason: "Missing source - Other pigments like carotenoids also play a role.",
    sources: [
      { title: "Biology Textbook - Chapter 5" },
      { title: "National Science Foundation", url: "https://example.com" },
    ],
  },
  {
    id: "claim_3",
    claim: "Plants produce oxygen as a byproduct",
    fullText: "During photosynthesis, plants produce oxygen as a byproduct that is released into the atmosphere.",
    severity: "warning",
    location: {
      section: "teacherGuidelines",
      position: 300,
    },
    reason: "Possibly incorrect - While true, this oversimplifies the process.",
    sources: [
      { title: "Curriculum Standards - Grade 5 Science" },
    ],
  },
];

const mockContent = {
  studentSummary: `Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create their own food. This amazing process happens in the leaves of plants, specifically in structures called chloroplasts.

During photosynthesis, plants absorb sunlight through their leaves. The green pigment called chlorophyll captures the light energy. Plants also take in water through their roots and carbon dioxide from the air through tiny openings in their leaves called stomata.

Using these ingredients and the energy from sunlight, plants produce glucose (a type of sugar) which they use as food. As a byproduct, plants release oxygen into the air, which is essential for all living things to breathe.

Photosynthesis occurs only during daylight hours when sunlight is available. This is why plants need to be in well-lit areas to grow properly. Without sunlight, plants cannot make their own food and will eventually die.`,

  slides: [
    {
      title: "What is Photosynthesis?",
      content: "Photosynthesis is how plants make food using sunlight, water, and carbon dioxide.",
    },
    {
      title: "The Process",
      content: "1. Plants absorb sunlight\n2. Take in water and carbon dioxide\n3. Convert to glucose and oxygen",
    },
    {
      title: "Key Components",
      content: "Chlorophyll is the only pigment involved in the process of photosynthesis. It captures light energy.",
    },
  ],

  teacherGuidelines: `Begin the lesson by asking students what they know about how plants grow. Use the provided slides to explain the process step by step.

Key points to emphasize:
- Photosynthesis is essential for plant survival
- Plants need sunlight, water, and carbon dioxide
- During photosynthesis, plants produce oxygen as a byproduct that is released into the atmosphere

Activity suggestion: Have students draw and label a diagram of the photosynthesis process.`,
};

export default function FactCheckPanel() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [selectedClaim, setSelectedClaim] = useState<FlaggedClaim | null>(null);
  const [fixingClaimId, setFixingClaimId] = useState<string | null>(null);
  const [acceptedClaimIds, setAcceptedClaimIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && (!user || userData?.role !== "teacher")) {
      navigate("/login");
    }
  }, [user, userData, loading, navigate]);

  // Filter claims based on selected filter
  const filteredClaims = useMemo(() => {
    let filtered = mockClaims.filter((claim) => !acceptedClaimIds.has(claim.id));

    if (selectedFilter === "warnings") {
      filtered = filtered.filter((claim) => claim.severity === "warning");
    } else if (selectedFilter === "critical") {
      filtered = filtered.filter((claim) => claim.severity === "critical");
    }

    return filtered;
  }, [selectedFilter, acceptedClaimIds]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeClaims = mockClaims.filter((claim) => !acceptedClaimIds.has(claim.id));
    const warnings = activeClaims.filter((c) => c.severity === "warning").length;
    const critical = activeClaims.filter((c) => c.severity === "critical").length;
    const verified = mockClaims.length - activeClaims.length;

    return {
      claimsVerified: verified,
      totalClaims: mockClaims.length,
      outdatedFacts: warnings,
      unsupportedStatements: critical,
    };
  }, [acceptedClaimIds]);

  const status: "High confidence" | "Needs review" | "Critical issues found" =
    stats.unsupportedStatements > 0
      ? "Critical issues found"
      : stats.outdatedFacts > 0
      ? "Needs review"
      : "High confidence";

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

  if (loading) {
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
            <h1 className="text-3xl font-bold mb-2">Fact-checking & quality review</h1>
            <p className="text-lg text-muted-foreground">
              Review flagged claims before publishing this lesson.
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
                <h2 className="text-lg font-semibold">Flagged claims</h2>
                {filteredClaims.length === 0 ? (
                  <div className="p-6 text-center border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {acceptedClaimIds.size === mockClaims.length
                        ? "All claims have been reviewed!"
                        : "No claims match the selected filter."}
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
                studentSummary={mockContent.studentSummary}
                slides={mockContent.slides}
                teacherGuidelines={mockContent.teacherGuidelines}
                selectedClaim={selectedClaim}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

