import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/translations";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    const newLanguage: Language = language === "ro" ? "en" : "ro";
    setLanguage(newLanguage);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="h-10 w-10"
      title={language === "ro" ? "Switch to English" : "Schimbă în română"}
      aria-label={language === "ro" ? "Switch to English" : "Schimbă în română"}
    >
      <Languages className="h-5 w-5" />
      <span className="sr-only">
        {language === "ro" ? "Switch to English" : "Schimbă în română"}
      </span>
    </Button>
  );
}

