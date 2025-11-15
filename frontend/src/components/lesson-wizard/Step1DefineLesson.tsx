import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

interface Step1Data {
  title: string;
  grade: string;
  subject: string;
}

interface Step1DefineLessonProps {
  data: Step1Data;
  onChange: (data: Partial<Step1Data>) => void;
}

export function Step1DefineLesson({ data, onChange }: Step1DefineLessonProps) {
  const { userData } = useAuth();
  const { t, language } = useLanguage();

  // Auto-populate subject from teacher's teaching field
  useEffect(() => {
    if (userData?.teachingField && !data.subject) {
      onChange({ subject: userData.teachingField });
    }
  }, [userData?.teachingField, data.subject, onChange]);

  const grades = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`);

  const isValid = data.title.trim() && data.grade && data.subject;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left main form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-base font-semibold">
            {t.teacher.newLesson.step1.titleLabel} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={data.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder={t.teacher.newLesson.step1.titlePlaceholder}
            className="text-base h-12"
            aria-required="true"
            aria-invalid={!data.title.trim()}
          />
          {!data.title.trim() && (
            <p className="text-sm text-destructive" role="alert">
              {t.teacher.newLesson.step1.titleRequired}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="grade" className="text-base font-semibold">
              {t.teacher.newLesson.step1.gradeLabel} <span className="text-destructive">*</span>
            </Label>
            <Select value={data.grade} onValueChange={(value) => onChange({ grade: value })}>
              <SelectTrigger id="grade" className="h-12" aria-required="true">
                <SelectValue placeholder={t.teacher.newLesson.step1.gradePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {grades.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {translations[language].grades[grade as keyof typeof translations.ro.grades] || grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!data.grade && (
              <p className="text-sm text-destructive" role="alert">
                {t.teacher.newLesson.step1.gradeRequired}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject" className="text-base font-semibold">
              {t.teacher.newLesson.step1.subjectLabel} <span className="text-destructive">*</span>
            </Label>
            <Select value={data.subject} onValueChange={(value) => onChange({ subject: value })} disabled={!!userData?.teachingField}>
              <SelectTrigger id="subject" className="h-12" aria-required="true">
                <SelectValue placeholder={t.teacher.newLesson.step1.subjectPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {userData?.teachingField && (
                  <SelectItem value={userData.teachingField}>
                    {translations[language].teachingFields[userData.teachingField as keyof typeof translations.ro.teachingFields] || userData.teachingField}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {!data.subject && (
              <p className="text-sm text-destructive" role="alert">
                {t.teacher.newLesson.step1.subjectRequired}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right helper panel */}
      <div className="lg:col-span-1">
        <Card className="border-2 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t.teacher.newLesson.step1.exampleTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">{t.teacher.newLesson.step1.exampleTitleLabel}:</p>
              <p className="text-sm text-muted-foreground">
                {t.teacher.newLesson.step1.exampleTitleText}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

