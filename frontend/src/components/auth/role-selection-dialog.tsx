import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraduationCap, User, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

type Role = "student" | "teacher" | "individual";

interface RoleSelectionDialogProps {
  open: boolean;
  onRoleSelect: (role: Role, grade?: string, teachingField?: string) => void;
}

export function RoleSelectionDialog({
  open,
  onRoleSelect,
}: RoleSelectionDialogProps) {
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedTeachingField, setSelectedTeachingField] = useState<string>("");

  // Reset selected role, grade, and teaching field when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedRole(null);
      setSelectedGrade("");
      setSelectedTeachingField("");
    }
  }, [open]);

  const roles = [
    {
      value: "student" as Role,
      label: t.auth.roleSelection.student.label,
      icon: GraduationCap,
      description: t.auth.roleSelection.student.description,
    },
    {
      value: "teacher" as Role,
      label: t.auth.roleSelection.teacher.label,
      icon: User,
      description: t.auth.roleSelection.teacher.description,
    },
    {
      value: "individual" as Role,
      label: t.auth.roleSelection.individual.label,
      icon: Users,
      description: t.auth.roleSelection.individual.description,
    },
  ];

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        // Prevent closing without selecting a role (and grade for students, teachingField for teachers)
        if (!isOpen && (!selectedRole || (selectedRole === "student" && !selectedGrade) || (selectedRole === "teacher" && !selectedTeachingField))) {
          return;
        }
      }}
    >
      <DialogContent 
        className="sm:max-w-[500px] shadow-2xl border-2 dark:border-primary/20 backdrop-blur-sm bg-card/95 dark:bg-card/95" 
        onPointerDownOutside={(e) => {
          // Prevent closing by clicking outside
          if (!selectedRole || (selectedRole === "student" && !selectedGrade) || (selectedRole === "teacher" && !selectedTeachingField)) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing with ESC key
          if (!selectedRole || (selectedRole === "student" && !selectedGrade) || (selectedRole === "teacher" && !selectedTeachingField)) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t.auth.roleSelection.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {t.auth.roleSelection.description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                  selectedRole === role.value
                    ? "border-primary bg-primary/10 dark:bg-primary/20 shadow-lg scale-[1.02]"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    selectedRole === role.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold">{role.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    {role.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Grade selector for students */}
        {selectedRole === "student" && (
          <div className="space-y-2 pt-2">
            <Label htmlFor="grade" className="text-base font-semibold">
              {t.auth.roleSelection.gradeRequired} <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger id="grade" className="h-12">
                <SelectValue placeholder={t.auth.register.gradeLabel} />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => {
                  const gradeKey = `Grade ${grade}`;
                  return (
                    <SelectItem key={grade} value={gradeKey}>
                      {translations.ro.grades[gradeKey as keyof typeof translations.ro.grades]}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Teaching field selector for teachers */}
        {selectedRole === "teacher" && (
          <div className="space-y-2 pt-2">
            <Label htmlFor="teachingField" className="text-base font-semibold">
              {t.auth.roleSelection.teachingFieldRequired} <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedTeachingField} onValueChange={setSelectedTeachingField}>
              <SelectTrigger id="teachingField" className="h-12">
                <SelectValue placeholder={t.auth.register.teachingFieldLabel} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(translations.ro.teachingFields).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => {
              if (selectedRole) {
                if (selectedRole === "student" && !selectedGrade) {
                  return;
                }
                if (selectedRole === "teacher" && !selectedTeachingField) {
                  return;
                }
                onRoleSelect(
                  selectedRole,
                  selectedGrade || undefined,
                  selectedTeachingField || undefined
                );
              }
            }}
            disabled={
              !selectedRole ||
              (selectedRole === "student" && !selectedGrade) ||
              (selectedRole === "teacher" && !selectedTeachingField)
            }
            className="w-full sm:w-auto"
          >
            {t.auth.roleSelection.continueButton}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

