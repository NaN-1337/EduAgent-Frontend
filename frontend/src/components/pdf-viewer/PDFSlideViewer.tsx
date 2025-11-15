import { useState, useEffect } from "react";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";

interface PDFSlideViewerProps {
  fileUrl: string;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function PDFSlideViewer({
  fileUrl,
  currentPage = 0,
  onPageChange,
  className,
}: PDFSlideViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [page, setPage] = useState(currentPage);
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { jumpToPage } = pageNavigationPluginInstance;

  useEffect(() => {
    if (currentPage !== page) {
      setPage(currentPage);
      if (numPages > 0) {
        jumpToPage(currentPage);
      }
    }
  }, [currentPage, jumpToPage, numPages, page]);

  useEffect(() => {
    if (onPageChange && page !== undefined) {
      onPageChange(page);
    }
  }, [page, onPageChange]);

  const goToPreviousPage = () => {
    if (numPages === 0) return;
    const newPage = Math.max(0, page - 1);
    setPage(newPage);
    jumpToPage(newPage);
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  const goToNextPage = () => {
    if (numPages === 0) return;
    const newPage = Math.min(numPages - 1, page + 1);
    setPage(newPage);
    jumpToPage(newPage);
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  const goToPage = (pageIndex: number) => {
    setPage(pageIndex);
    jumpToPage(pageIndex);
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* PDF Viewer */}
      <Card className="min-h-[600px] flex flex-col border-2">
        <CardContent className="flex-1 p-0">
          <div className="h-[600px]">
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <div className="h-full overflow-auto">
                <Viewer
                  fileUrl={fileUrl}
                  plugins={[pageNavigationPluginInstance]}
                  initialPage={page}
                  onDocumentLoad={(e) => {
                    setNumPages(e.doc.numPages);
                  }}
                />
              </div>
            </Worker>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Controls */}
      {numPages > 0 && (
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={goToPreviousPage}
            disabled={page === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-5 w-5" />
            Previous
          </Button>

          <div className="text-sm text-muted-foreground">
            Page {page + 1} of {numPages}
          </div>

          <div className="flex gap-2">
            {Array.from({ length: Math.min(numPages, 10) }, (_, index) => (
              <button
                key={index}
                onClick={() => goToPage(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === page
                    ? "bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={goToNextPage}
            disabled={page >= numPages - 1}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}

