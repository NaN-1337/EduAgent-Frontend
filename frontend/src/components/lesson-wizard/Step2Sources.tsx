import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface Step2Data {
  files: File[];
  textContent: string;
  presentationFile?: File | null; // PDF or PPT file for slide viewer
}

interface Step2SourcesProps {
  data: Step2Data;
  onChange: (data: Partial<Step2Data>) => void;
}

export function Step2Sources({ data, onChange }: Step2SourcesProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const presentationFileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files).filter(
        (file) => file.type === "application/pdf" || file.name.endsWith(".docx")
      );
      onChange({ files: [...data.files, ...newFiles] });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    onChange({ files: data.files.filter((_, i) => i !== index) });
  };

  const isValid = data.files.length > 0 || data.textContent.trim();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left main panel */}
      <div className="lg:col-span-2 space-y-8">
        {/* Primary reference material */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">{t.teacher.newLesson.step2.title}</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {t.teacher.newLesson.step2.description}
            </p>
          </div>

          {/* File upload area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/30 hover:border-primary/50"
            )}
          >
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-base font-medium mb-2">
              {t.teacher.newLesson.step2.dragDrop}
            </p>
            <p className="text-sm text-muted-foreground mb-4">{t.teacher.newLesson.step2.or}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              {t.teacher.newLesson.step2.browseFiles}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>

          {/* Uploaded files list */}
          {data.files.length > 0 && (
            <div className="space-y-2">
              {data.files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Textarea for pasting content */}
          <div className="space-y-2">
            <Label htmlFor="textContent" className="text-base font-semibold">
              {t.teacher.newLesson.step2.promptLabel}
            </Label>
            <Textarea
              id="textContent"
              value={data.textContent}
              onChange={(e) => onChange({ textContent: e.target.value })}
              placeholder={t.teacher.newLesson.step2.promptPlaceholder}
              className="min-h-[200px] text-base"
              rows={8}
            />
          </div>

          {/* Presentation file upload (PDF/PPT) */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              {t.teacher.newLesson.step2.presentationLabel || "Presentation File (PDF/PPT)"}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t.teacher.newLesson.step2.presentationDescription || "Upload a PDF or PowerPoint file to display slide-by-slide"}
            </p>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              {data.presentationFile ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{data.presentationFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {((data.presentationFile.size || 0) / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onChange({ presentationFile: null })}
                    aria-label="Remove presentation file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">
                    {t.teacher.newLesson.step2.presentationPlaceholder || "Upload PDF or PowerPoint file"}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => presentationFileInputRef.current?.click()}
                  >
                    {t.teacher.newLesson.step2.browseFiles || "Browse Files"}
                  </Button>
                  <input
                    ref={presentationFileInputRef}
                    type="file"
                    accept=".pdf,.ppt,.pptx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onChange({ presentationFile: file });
                      }
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="border-2 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t.teacher.newLesson.step2.aboutTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.teacher.newLesson.step2.aboutDescription}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-2 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t.teacher.newLesson.step2.promptTipsTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.teacher.newLesson.step2.promptTipsDescription}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

