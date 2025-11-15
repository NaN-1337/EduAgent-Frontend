"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GraduationCap, User, Users } from "lucide-react";

type Role = "student" | "teacher" | "individual";

interface RoleSelectionDialogProps {
  open: boolean;
  onRoleSelect: (role: Role) => void;
}

export function RoleSelectionDialog({
  open,
  onRoleSelect,
}: RoleSelectionDialogProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const roles = [
    {
      value: "student" as Role,
      label: "Student",
      icon: GraduationCap,
      description: "I'm a student looking to join events",
    },
    {
      value: "teacher" as Role,
      label: "Teacher",
      icon: User,
      description: "I'm a teacher organizing events",
    },
    {
      value: "individual" as Role,
      label: "Individual",
      icon: Users,
      description: "I'm an individual participant",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select Your Role</DialogTitle>
          <DialogDescription>
            Please choose your role to continue. This helps us personalize your
            experience.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                  selectedRole === role.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
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
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => {
              if (selectedRole) {
                onRoleSelect(selectedRole);
              }
            }}
            disabled={!selectedRole}
            className="w-full sm:w-auto"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

