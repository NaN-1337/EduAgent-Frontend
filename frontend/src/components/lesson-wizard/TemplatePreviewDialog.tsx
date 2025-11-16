import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PDFSlideViewer } from "@/components/pdf-viewer/PDFSlideViewer";
import { useLanguage } from "@/contexts/LanguageContext";

interface TemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateUrl: string;
  templateName: string;
}

export function TemplatePreviewDialog({
  open,
  onOpenChange,
  templateUrl,
  templateName,
}: TemplatePreviewDialogProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>{templateName}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden p-6">
          <PDFSlideViewer
            fileUrl={templateUrl}
            showNavigation={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

