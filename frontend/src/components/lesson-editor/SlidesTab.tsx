import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Slide {
  id: string;
  title: string;
  content: string;
  imageDescription?: string;
  hasIssue?: boolean;
}

interface SlidesTabProps {
  slides: Slide[];
  onChange: (slides: Slide[]) => void;
}

export function SlidesTab({ slides, onChange }: SlidesTabProps) {
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);

  const selectedSlide = slides[selectedSlideIndex];

  const handleSlideChange = (index: number, updates: Partial<Slide>) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], ...updates };
    onChange(newSlides);
  };

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: `slide_${Date.now()}`,
      title: `Slide ${slides.length + 1}`,
      content: "",
    };
    onChange([...slides, newSlide]);
    setSelectedSlideIndex(slides.length);
  };

  const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) return; // Keep at least one slide
    const newSlides = slides.filter((_, i) => i !== index);
    onChange(newSlides);
    if (selectedSlideIndex >= newSlides.length) {
      setSelectedSlideIndex(newSlides.length - 1);
    }
  };

  const getBulletCount = (content: string) => {
    return (content.match(/^[-*•]\s/gm) || []).length;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left: Thumbnails */}
      <div className="lg:col-span-1">
        <Card className="border-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Slides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto hidden lg:block">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setSelectedSlideIndex(index)}
                className={cn(
                  "w-full text-left p-3 border-2 rounded-lg transition-colors",
                  selectedSlideIndex === index
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Slide {index + 1}
                  </span>
                  {slide.hasIssue && (
                    <AlertTriangle className="h-3 w-3 text-yellow-600 shrink-0" />
                  )}
                </div>
                <p className="text-sm font-semibold line-clamp-2 mb-1">{slide.title}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {getBulletCount(slide.content)} bullets
                  </Badge>
                </div>
              </button>
            ))}
            <Button
              onClick={handleAddSlide}
              variant="outline"
              className="w-full mt-2"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New slide
            </Button>
          </CardContent>
          {/* Mobile: Horizontal scroll */}
          <CardContent className="lg:hidden">
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => setSelectedSlideIndex(index)}
                  className={cn(
                    "shrink-0 w-32 text-left p-3 border-2 rounded-lg transition-colors",
                    selectedSlideIndex === index
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                    {slide.hasIssue && (
                      <AlertTriangle className="h-3 w-3 text-yellow-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs font-semibold line-clamp-2">{slide.title}</p>
                </button>
              ))}
              <button
                onClick={handleAddSlide}
                className="shrink-0 w-32 border-2 border-dashed rounded-lg p-3 flex items-center justify-center hover:border-primary/50 transition-colors"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: Slide Editor */}
      <div className="lg:col-span-3">
        <Card className="border-2 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Slide {selectedSlideIndex + 1} of {slides.length}
              </CardTitle>
              {slides.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSlide(selectedSlideIndex)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete slide
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="slide-title" className="text-sm font-medium">
                Slide title
              </label>
              <Input
                id="slide-title"
                value={selectedSlide?.title || ""}
                onChange={(e) =>
                  handleSlideChange(selectedSlideIndex, { title: e.target.value })
                }
                className="text-base"
                placeholder="Enter slide title..."
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="slide-content" className="text-sm font-medium">
                Content (use bullets: - or * for list items)
              </label>
              <Textarea
                id="slide-content"
                value={selectedSlide?.content || ""}
                onChange={(e) =>
                  handleSlideChange(selectedSlideIndex, { content: e.target.value })
                }
                className="min-h-[300px] text-base leading-relaxed font-sans resize-none"
                placeholder="Enter slide content...&#10;&#10;Use bullets:&#10;- Point 1&#10;- Point 2&#10;* Point 3"
                rows={12}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="image-description" className="text-sm font-medium">
                Add image description (optional)
              </label>
              <Input
                id="image-description"
                value={selectedSlide?.imageDescription || ""}
                onChange={(e) =>
                  handleSlideChange(selectedSlideIndex, { imageDescription: e.target.value })
                }
                className="text-base"
                placeholder="Describe an image to include on this slide..."
              />
              <p className="text-xs text-muted-foreground">
                This helps generate or select appropriate images for the slide.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

