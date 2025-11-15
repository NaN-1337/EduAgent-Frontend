import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileText,
  Presentation,
  BookOpen,
  Link2,
  Copy,
  Check,
  Share2,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: {
    id: string;
    title: string;
    subject: string;
    grade: string;
  };
  onDone: () => void;
  onBack: () => void;
}

export function ExportShareModal({
  open,
  onOpenChange,
  lesson,
  onDone,
  onBack,
}: ExportShareModalProps) {
  const [downloadOptions, setDownloadOptions] = useState({
    studentSummary: false,
    slides: false,
    teacherGuide: false,
  });

  const [studentViewOptions, setStudentViewOptions] = useState({
    showSources: true,
    showQuiz: false,
  });

  const [linkCopied, setLinkCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Generate share link and code (in real app, this would come from backend)
  const shareLink = `${window.location.origin}/student/lesson/${lesson.id}`;
  const classCode = lesson.id.substring(0, 8).toUpperCase();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(classCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleDownload = (type: "studentSummary" | "slides" | "teacherGuide") => {
    // In a real app, this would trigger a download
    console.log(`Downloading ${type}...`);
    // Simulate download
    alert(`Downloading ${type}...`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-2xl font-bold">
              Your lesson is ready to share
            </DialogTitle>
          </div>
          <DialogDescription className="text-base">
            <div className="mt-2">
              <p className="font-semibold text-foreground">{lesson.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {lesson.subject} · {lesson.grade}
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Downloads Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Downloads</h3>
            </div>
            <div className="space-y-3 pl-7">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    id="download-student-summary"
                    checked={downloadOptions.studentSummary}
                    onCheckedChange={(checked) =>
                      setDownloadOptions({
                        ...downloadOptions,
                        studentSummary: checked === true,
                      })
                    }
                  />
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <Label
                    htmlFor="download-student-summary"
                    className="text-base font-medium cursor-pointer flex-1"
                  >
                    Download student summary (PDF)
                  </Label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload("studentSummary")}
                  disabled={!downloadOptions.studentSummary}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    id="download-slides"
                    checked={downloadOptions.slides}
                    onCheckedChange={(checked) =>
                      setDownloadOptions({
                        ...downloadOptions,
                        slides: checked === true,
                      })
                    }
                  />
                  <Presentation className="h-5 w-5 text-muted-foreground" />
                  <Label
                    htmlFor="download-slides"
                    className="text-base font-medium cursor-pointer flex-1"
                  >
                    Download slides (PDF)
                  </Label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload("slides")}
                  disabled={!downloadOptions.slides}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    id="download-teacher-guide"
                    checked={downloadOptions.teacherGuide}
                    onCheckedChange={(checked) =>
                      setDownloadOptions({
                        ...downloadOptions,
                        teacherGuide: checked === true,
                      })
                    }
                  />
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <Label
                    htmlFor="download-teacher-guide"
                    className="text-base font-medium cursor-pointer flex-1"
                  >
                    Download teacher guide (PDF)
                  </Label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload("teacherGuide")}
                  disabled={!downloadOptions.teacherGuide}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </section>

          {/* Share with Students Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Share with students</h3>
            </div>
            <div className="space-y-4 pl-7">
              {/* Class Link */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Class link</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="font-mono text-sm bg-muted"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {linkCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Class Code */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Class code</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="p-4 border-2 rounded-lg bg-muted/50 font-mono text-2xl font-bold text-center tracking-wider">
                      {classCode}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleCopyCode}
                    className="shrink-0"
                  >
                    {codeCopied ? (
                      <>
                        <Check className="h-4 w-4 mr-2 text-green-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy code
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Students can use this code to access the lesson
                </p>
              </div>

              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="w-full"
              >
                <Link2 className="h-4 w-4 mr-2" />
                Copy link
              </Button>
            </div>
          </section>

          {/* Student View Options */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Student view options</h3>
            </div>
            <div className="space-y-3 pl-7">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  {studentViewOptions.showSources ? (
                    <Eye className="h-5 w-5 text-primary" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  )}
                  <Label
                    htmlFor="show-sources"
                    className="text-base font-medium cursor-pointer flex-1"
                  >
                    Allow students to see sources used
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm",
                      studentViewOptions.showSources
                        ? "text-muted-foreground"
                        : "text-foreground"
                    )}
                  >
                    Off
                  </span>
                  <button
                    id="show-sources"
                    onClick={() =>
                      setStudentViewOptions({
                        ...studentViewOptions,
                        showSources: !studentViewOptions.showSources,
                      })
                    }
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      studentViewOptions.showSources ? "bg-primary" : "bg-muted"
                    )}
                    role="switch"
                    aria-checked={studentViewOptions.showSources}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        studentViewOptions.showSources ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                  <span
                    className={cn(
                      "text-sm",
                      studentViewOptions.showSources
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    On
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  {studentViewOptions.showQuiz ? (
                    <Eye className="h-5 w-5 text-primary" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  )}
                  <Label
                    htmlFor="show-quiz"
                    className="text-base font-medium cursor-pointer flex-1"
                  >
                    Show quiz after reading summary
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm",
                      studentViewOptions.showQuiz
                        ? "text-muted-foreground"
                        : "text-foreground"
                    )}
                  >
                    Off
                  </span>
                  <button
                    id="show-quiz"
                    onClick={() =>
                      setStudentViewOptions({
                        ...studentViewOptions,
                        showQuiz: !studentViewOptions.showQuiz,
                      })
                    }
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      studentViewOptions.showQuiz ? "bg-primary" : "bg-muted"
                    )}
                    role="switch"
                    aria-checked={studentViewOptions.showQuiz}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        studentViewOptions.showQuiz ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                  <span
                    className={cn(
                      "text-sm",
                      studentViewOptions.showQuiz
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    On
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t">
          <Button variant="outline" onClick={onBack} className="flex-1 sm:flex-none">
            Back to editor
          </Button>
          <Button onClick={onDone} className="flex-1 sm:flex-auto">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

