import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Step1Data {
  title: string;
  grade: string;
  subject: string;
  duration: string;
  objectives: string[];
}

interface Step1DefineLessonProps {
  data: Step1Data;
  onChange: (data: Partial<Step1Data>) => void;
}

const grades = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "University",
  "Adult",
];

const subjects = [
  "Science",
  "Mathematics",
  "History",
  "English",
  "Geography",
  "Art",
  "Music",
  "Physical Education",
  "Computer Science",
  "Foreign Language",
  "Other",
];

const durations = ["20 minutes", "30 minutes", "45 minutes", "60 minutes"];

export function Step1DefineLesson({ data, onChange }: Step1DefineLessonProps) {
  const [newObjective, setNewObjective] = useState("");

  const handleAddObjective = () => {
    if (newObjective.trim() && !data.objectives.includes(newObjective.trim())) {
      onChange({ objectives: [...data.objectives, newObjective.trim()] });
      setNewObjective("");
    }
  };

  const handleRemoveObjective = (index: number) => {
    onChange({
      objectives: data.objectives.filter((_, i) => i !== index),
    });
  };

  const isValid = data.title.trim() && data.grade && data.subject;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left main form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-base font-semibold">
            Lesson title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={data.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="e.g., Photosynthesis – Grade 5"
            className="text-base h-12"
            aria-required="true"
            aria-invalid={!data.title.trim()}
          />
          {!data.title.trim() && (
            <p className="text-sm text-destructive" role="alert">
              Lesson title is required
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="grade" className="text-base font-semibold">
              Grade/Level <span className="text-destructive">*</span>
            </Label>
            <Select value={data.grade} onValueChange={(value) => onChange({ grade: value })}>
              <SelectTrigger id="grade" className="h-12" aria-required="true">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {grades.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!data.grade && (
              <p className="text-sm text-destructive" role="alert">
                Grade is required
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject" className="text-base font-semibold">
              Subject <span className="text-destructive">*</span>
            </Label>
            <Select value={data.subject} onValueChange={(value) => onChange({ subject: value })}>
              <SelectTrigger id="subject" className="h-12" aria-required="true">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!data.subject && (
              <p className="text-sm text-destructive" role="alert">
                Subject is required
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration" className="text-base font-semibold">
            Duration
          </Label>
          <Select value={data.duration} onValueChange={(value) => onChange({ duration: value })}>
            <SelectTrigger id="duration" className="h-12">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {durations.map((duration) => (
                <SelectItem key={duration} value={duration}>
                  {duration}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold">
            Learning objectives <span className="text-muted-foreground font-normal">(optional but recommended)</span>
          </Label>
          <div className="flex gap-2">
            <Input
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              placeholder="Enter a learning objective"
              className="text-base h-12"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddObjective();
                }
              }}
            />
            <Button
              type="button"
              onClick={handleAddObjective}
              disabled={!newObjective.trim()}
              className="shrink-0"
            >
              + Add objective
            </Button>
          </div>
          {data.objectives.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {data.objectives.map((objective, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-sm py-1.5 px-3 flex items-center gap-2"
                >
                  {objective}
                  <button
                    type="button"
                    onClick={() => handleRemoveObjective(index)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    aria-label={`Remove objective: ${objective}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right helper panel */}
      <div className="lg:col-span-1">
        <Card className="border-2 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Example of a good lesson setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Title:</p>
              <p className="text-sm text-muted-foreground">
                "Introduction to Photosynthesis – Grade 5"
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Objectives:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Understand how plants make food</li>
                <li>Identify the key components of photosynthesis</li>
                <li>Explain the role of sunlight in the process</li>
              </ul>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                EduAgent uses your objectives to generate targeted content and ensure alignment with
                your teaching goals.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

