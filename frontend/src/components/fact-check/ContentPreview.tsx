import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { FlaggedClaim } from "./ClaimItem";

interface ContentPreviewProps {
  studentSummary: string;
  slides: Array<{ title: string; content: string }>;
  teacherGuidelines: string;
  selectedClaim: FlaggedClaim | null;
  onHighlightPosition?: (position: number) => void;
}

export function ContentPreview({
  studentSummary,
  slides,
  teacherGuidelines,
  selectedClaim,
  onHighlightPosition,
}: ContentPreviewProps) {
  const [activeTab, setActiveTab] = useState<string>("studentSummary");

  // Switch to appropriate tab when claim is selected
  useEffect(() => {
    if (selectedClaim) {
      setActiveTab(selectedClaim.location.section);
    }
  }, [selectedClaim]);
  const highlightText = (text: string, claim: FlaggedClaim | null) => {
    if (!claim) return <>{text}</>;

    // Extract key phrases from the claim for better matching
    const claimText = claim.claim.toLowerCase();
    const words = claimText.split(/\s+/).filter((w) => w.length > 3);
    const keyPhrase = words.slice(0, 4).join(" ");

    // Find the position in text
    const textLower = text.toLowerCase();
    const matchIndex = textLower.indexOf(keyPhrase);

    if (matchIndex === -1) {
      // Fallback: highlight individual words
      const parts: (string | JSX.Element)[] = [];
      let lastIndex = 0;
      const wordsToHighlight = words.slice(0, 3);

      wordsToHighlight.forEach((word) => {
        const regex = new RegExp(`\\b${word}\\b`, "gi");
        let match;
        while ((match = regex.exec(text)) !== null) {
          // Add text before match
          if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
          }
          // Add highlighted match
          parts.push(
            <mark
              key={`${word}-${match.index}`}
              className={cn(
                "px-1 rounded",
                claim.severity === "critical"
                  ? "bg-red-200 dark:bg-red-900/50"
                  : "bg-yellow-200 dark:bg-yellow-900/50"
              )}
            >
              {match[0]}
            </mark>
          );
          lastIndex = match.index + match[0].length;
        }
      });
      // Add remaining text
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }
      return <>{parts.length > 0 ? parts : text}</>;
    }

    // Highlight the matched phrase
    const before = text.substring(0, matchIndex);
    const match = text.substring(matchIndex, matchIndex + keyPhrase.length);
    const after = text.substring(matchIndex + keyPhrase.length);

    return (
      <>
        {before}
        <mark
          className={cn(
            "px-1 rounded",
            claim.severity === "critical"
              ? "bg-red-200 dark:bg-red-900/50"
              : "bg-yellow-200 dark:bg-yellow-900/50"
          )}
        >
          {match}
        </mark>
        {after}
      </>
    );
  };

  return (
    <Card className="border-2 shadow-sm h-full flex flex-col">
      <CardContent className="p-0 flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="studentSummary" className="flex-1">
              Student summary
            </TabsTrigger>
            <TabsTrigger value="slides" className="flex-1">
              Slides
            </TabsTrigger>
            <TabsTrigger value="teacherGuidelines" className="flex-1">
              Teacher guidelines
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="studentSummary"
            className="flex-1 overflow-auto p-6 m-0 max-h-[calc(100vh-16rem)]"
          >
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap leading-relaxed text-base">
                {highlightText(
                  studentSummary,
                  selectedClaim?.location.section === "studentSummary"
                    ? selectedClaim
                    : null
                )}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="slides" className="flex-1 overflow-auto p-6 m-0 max-h-[calc(100vh-16rem)]">
            <div className="space-y-6">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={cn(
                    "border rounded-lg p-6 transition-colors",
                    selectedClaim?.location.section === "slides" &&
                      selectedClaim?.location.slideNumber === index + 1 &&
                      "border-primary bg-primary/5 shadow-md"
                  )}
                >
                  <h3 className="text-lg font-semibold mb-3">
                    Slide {index + 1}: {slide.title}
                  </h3>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap leading-relaxed text-base">
                      {highlightText(
                        slide.content,
                        selectedClaim?.location.section === "slides" &&
                          selectedClaim?.location.slideNumber === index + 1
                          ? selectedClaim
                          : null
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent
            value="teacherGuidelines"
            className="flex-1 overflow-auto p-6 m-0 max-h-[calc(100vh-16rem)]"
          >
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap leading-relaxed text-base">
                {highlightText(
                  teacherGuidelines,
                  selectedClaim?.location.section === "teacherGuidelines"
                    ? selectedClaim
                    : null
                )}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

