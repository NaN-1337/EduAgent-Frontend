import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step2Data {
  files: File[];
  textContent: string;
  useCurriculumStandards: boolean;
  useReputableSites: boolean;
  customUrls: string;
}

interface Step2SourcesProps {
  data: Step2Data;
  onChange: (data: Partial<Step2Data>) => void;
}

export function Step2Sources({ data, onChange }: Step2SourcesProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const isValid =
    data.files.length > 0 ||
    data.textContent.trim() ||
    data.useCurriculumStandards ||
    data.useReputableSites;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left main panel */}
      <div className="lg:col-span-2 space-y-8">
        {/* Primary reference material */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Primary reference material</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Upload files or paste text content
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
              Drag and drop PDF or DOCX files here
            </p>
            <p className="text-sm text-muted-foreground mb-4">or</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse files
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
              Or paste textbook excerpt / notes
            </Label>
            <Textarea
              id="textContent"
              value={data.textContent}
              onChange={(e) => onChange({ textContent: e.target.value })}
              placeholder="Paste your reference material here..."
              className="min-h-[150px] text-base"
              rows={6}
            />
          </div>
        </div>

        {/* Trusted sources */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Trusted sources</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Select additional sources for fact-checking
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="curriculum"
                checked={data.useCurriculumStandards}
                onCheckedChange={(checked) =>
                  onChange({ useCurriculumStandards: checked === true })
                }
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor="curriculum"
                  className="text-base font-medium cursor-pointer"
                >
                  Use official curriculum standards (if available)
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Automatically reference relevant educational standards
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="reputable"
                checked={data.useReputableSites}
                onCheckedChange={(checked) =>
                  onChange({ useReputableSites: checked === true })
                }
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor="reputable"
                  className="text-base font-medium cursor-pointer"
                >
                  Use reputable encyclopedia/science sites
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Include verified sources like Wikipedia, Britannica, etc.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="customUrls" className="text-base font-semibold">
                Add specific URLs (comma-separated)
              </Label>
              <Input
                id="customUrls"
                value={data.customUrls}
                onChange={(e) => onChange({ customUrls: e.target.value })}
                placeholder="https://example.com, https://another-site.org"
                className="text-base h-12"
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple URLs with commas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="lg:col-span-1">
        <Card className="border-2 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">About sources</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              EduAgent prioritizes these sources when generating and fact-checking content. The
              more relevant sources you provide, the more accurate and aligned your lesson will be.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

