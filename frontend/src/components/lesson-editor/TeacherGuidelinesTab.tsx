import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeacherGuidelines {
  objectives: string;
  timing: string;
  questions: string;
  differentiation: string;
  assessment: string;
}

interface TeacherGuidelinesTabProps {
  guidelines: TeacherGuidelines;
  onChange: (guidelines: TeacherGuidelines) => void;
}

interface Section {
  id: keyof TeacherGuidelines;
  title: string;
  placeholder: string;
}

const sections: Section[] = [
  {
    id: "objectives",
    title: "Lesson objectives",
    placeholder: "List the learning objectives for this lesson...",
  },
  {
    id: "timing",
    title: "Timing & pacing",
    placeholder: "0-10 min: Introduction\n10-25 min: Main activity\n25-45 min: Practice...",
  },
  {
    id: "questions",
    title: "Suggested questions",
    placeholder: "What do you think happens when...?\nHow would you explain...?",
  },
  {
    id: "differentiation",
    title: "Differentiation tips",
    placeholder: "For struggling students: ...\nFor advanced students: ...",
  },
  {
    id: "assessment",
    title: "Assessment ideas",
    placeholder: "Exit ticket: ...\nQuick check: ...",
  },
];

export function TeacherGuidelinesTab({
  guidelines,
  onChange,
}: TeacherGuidelinesTabProps) {
  const [expandedSections, setExpandedSections] = useState<Set<keyof TeacherGuidelines>>(
    new Set(["objectives"])
  );

  const toggleSection = (sectionId: keyof TeacherGuidelines) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleChange = (sectionId: keyof TeacherGuidelines, value: string) => {
    onChange({ ...guidelines, [sectionId]: value });
  };

  return (
    <div className="space-y-4">
      {/* Teacher-only notice */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-primary">
            <Lock className="h-4 w-4" />
            <p className="text-sm font-medium">Teacher-only content — students don't see this.</p>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        const value = guidelines[section.id];

        return (
          <Card key={section.id} className="border-2 shadow-sm">
            <CardHeader>
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center justify-between w-full text-left"
              >
                <CardTitle className="text-lg font-semibold">{section.title}</CardTitle>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            </CardHeader>
            {isExpanded && (
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor={section.id} className="sr-only">
                    {section.title}
                  </Label>
                  <Textarea
                    id={section.id}
                    value={value}
                    onChange={(e) => handleChange(section.id, e.target.value)}
                    placeholder={section.placeholder}
                    className="min-h-[150px] text-base leading-relaxed resize-none"
                    rows={6}
                  />
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

