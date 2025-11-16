import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TextSelectionHandlerProps {
  onExplain: (text: string) => void;
  enabled?: boolean;
  containerSelector?: string;
}

export function TextSelectionHandler({ 
  onExplain, 
  enabled = true,
  containerSelector = ".prose, [data-summary-content]"
}: TextSelectionHandlerProps) {
  const { t, language } = useLanguage();
  const [selection, setSelection] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!enabled) {
      setSelection(null);
      return;
    }

    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setSelection(null);
        return;
      }

      const selectedText = selection.toString().trim();
      if (!selectedText || selectedText.length < 3) {
        setSelection(null);
        return;
      }

      // Check if selection is within the summary content area
      const range = selection.getRangeAt(0);
      const commonAncestor = range.commonAncestorContainer;
      
      // Find if the selection is within a prose container or summary content
      let isInSummary = false;
      let element: Node | null = commonAncestor.nodeType === Node.TEXT_NODE 
        ? commonAncestor.parentElement 
        : commonAncestor as Element;
      
      while (element && element !== document.body) {
        if (element instanceof Element) {
          if (element.classList.contains('prose') || 
              element.hasAttribute('data-summary-content') ||
              element.closest('.prose') ||
              element.closest('[data-summary-content]')) {
            isInSummary = true;
            break;
          }
        }
        element = element.parentElement;
      }

      if (!isInSummary) {
        setSelection(null);
        return;
      }

      const rect = range.getBoundingClientRect();

      // Position button above the selection (getBoundingClientRect is relative to viewport)
      setSelection({
        text: selectedText,
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    };

    const handleClick = (e: MouseEvent) => {
      // Don't hide if clicking on the button itself
      if (buttonRef.current && buttonRef.current.contains(e.target as Node)) {
        return;
      }

      // Small delay to allow selection to update
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.toString().trim().length === 0) {
          setSelection(null);
        }
      }, 10);
    };

    document.addEventListener("selectionchange", handleSelection);
    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("selectionchange", handleSelection);
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("click", handleClick);
    };
  }, [enabled]);

  const handleExplain = () => {
    if (selection?.text) {
      onExplain(selection.text);
      setSelection(null);
      // Clear selection
      window.getSelection()?.removeAllRanges();
    }
  };

  if (!selection) return null;

  const buttonText = language === "ro" ? "Explica-mi" : "Explain";

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${selection.x}px`,
        top: `${selection.y}px`,
        transform: "translate(-50%, -100%)",
      }}
    >
      <Button
        ref={buttonRef}
        size="sm"
        onClick={handleExplain}
        className="pointer-events-auto shadow-lg"
      >
        <MessageSquare className="h-3 w-3 mr-1" />
        {buttonText}
      </Button>
    </div>
  );
}

