import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardRoute } from "@/lib/routes";
import { generateTeacherCode } from "@/lib/teacherCode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoleSelectionDialog } from "./role-selection-dialog";
import { Loader2 } from "lucide-react";
import { t, translations } from "@/lib/translations";

type LoginFormData = {
  email: string;
  password: string;
};

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "student" | "teacher" | "individual";
  grade?: string;
  teachingField?: string;
};

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const navigate = useNavigate();
  const { refreshUserData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<any>(null);

  // Define schemas inside component to use translations
  const loginSchema = z.object({
    email: z.string().email(t("auth.login.errors.invalidEmail")),
    password: z.string().min(6, t("auth.login.errors.wrongPassword")),
  });

  const passwordSchema = z
    .string()
    .min(8, t("auth.register.passwordRequirements.minLength"))
    .regex(/[A-Z]/, t("auth.register.passwordRequirements.uppercase"))
    .regex(/[a-z]/, t("auth.register.passwordRequirements.lowercase"))
    .regex(/[0-9]/, t("auth.register.passwordRequirements.number"))
    .regex(/[^A-Za-z0-9]/, t("auth.register.passwordRequirements.special"));

  const registerSchema = z.object({
    name: z.string().min(2, t("common.labels.name")),
    email: z.string().email(t("auth.login.errors.invalidEmail")),
    password: passwordSchema,
    confirmPassword: z.string().min(8, t("auth.register.passwordRequirements.minLength")),
    role: z.enum(["student", "teacher", "individual"]),
    grade: z.string().optional(),
    teachingField: z.string().optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t("auth.register.errors.passwordsDontMatch"),
    path: ["confirmPassword"],
  }).refine((data) => {
    if (data.role === "student") {
      return data.grade && data.grade.trim() !== "";
    }
    return true;
  }, {
    message: t("auth.register.errors.gradeRequired"),
    path: ["grade"],
  }).refine((data) => {
    if (data.role === "teacher") {
      return data.teachingField && data.teachingField.trim() !== "";
    }
    return true;
  }, {
    message: t("auth.register.errors.teachingFieldRequired"),
    path: ["teachingField"],
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<LoginFormData | RegisterFormData>({
    resolver: zodResolver(mode === "login" ? loginSchema : registerSchema),
    mode: "onChange",
  });
  
  const passwordValue = watch("password");

  const selectedRole = watch("role");

  const saveUserToFirestore = async (
    uid: string,
    email: string,
    name: string,
    role: "student" | "teacher" | "individual",
    grade?: string,
    teachingField?: string
  ) => {
    try {
      // Use uid as document ID
      const userDocRef = doc(db, "users", uid);
      
      // Check if user already exists
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        // Create new user document with uid as doc ID and as a field
        const userData: any = {
          uid: uid, // Store uid as a field
          email: email,
          name: name,
          role: role,
          createdAt: new Date(),
        };
        
        // Add grade if user is a student
        if (role === "student" && grade) {
          userData.grade = grade;
        }
        
        // Add teaching field and generate teacher code if user is a teacher
        if (role === "teacher") {
          if (teachingField) {
            userData.teachingField = teachingField;
          }
          // Generate unique teacher code
          userData.teacherCode = generateTeacherCode();
          userData.enrolledStudents = []; // Initialize empty array for enrolled students
        }
        
        console.log("Creating user document:", userData);
        await setDoc(userDocRef, userData);
        console.log("User document created successfully");
        
        // Verify it was saved
        const verifyDoc = await getDoc(userDocRef);
        if (verifyDoc.exists()) {
          console.log("User document verified in Firestore");
        } else {
          throw new Error("User document was not created");
        }
      } else {
        console.log("User already exists in Firestore, updating role if needed");
        // Update role if it's missing
        const existingData = userDocSnap.data();
        if (!existingData.role) {
          await setDoc(userDocRef, { ...existingData, role }, { merge: true });
        }
      }
    } catch (error) {
      console.error("Error in saveUserToFirestore:", error);
      throw error;
    }
  };

  const handleEmailAuth = async (data: LoginFormData | RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      if (mode === "login") {
        const { email, password } = data as LoginFormData;
        await signInWithEmailAndPassword(auth, email, password);
        // Refresh user data after login
        await refreshUserData();
        // Get user data to determine dashboard route
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const role = userDocSnap.data()?.role;
            const dashboardRoute = getDashboardRoute(role);
            navigate(dashboardRoute);
          } else {
            navigate("/profile");
          }
        }
      } else {
        const { email, password, name, role, grade, teachingField } = data as RegisterFormData;
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        // Send email verification
        await sendEmailVerification(user);
        
        // Save user to Firestore (include grade if student, teachingField if teacher)
        await saveUserToFirestore(user.uid, email, name, role, grade, teachingField);
        
        // Refresh user data in context
        await refreshUserData();
        
        setSuccessMessage(t("auth.register.emailVerification"));
        
        // Wait a bit for Firestore to be ready, then navigate to dashboard
        setTimeout(() => {
          const dashboardRoute = getDashboardRoute(role);
          navigate(dashboardRoute);
        }, 1500);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError(t("auth.login.errors.invalidCredentials"));
      } else if (err.code === "auth/email-already-in-use") {
        setError(t("auth.register.errors.emailExists"));
      } else {
        setError(err.message || t("common.messages.error"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log("Google sign-in successful, checking Firestore...");

      // Check if user already exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      console.log("User exists in Firestore:", userDocSnap.exists());

      if (userDocSnap.exists()) {
        // User exists, refresh user data and proceed to dashboard
        console.log("Existing user, refreshing data...");
        await refreshUserData();
        const role = userDocSnap.data()?.role;
        const dashboardRoute = getDashboardRoute(role);
        navigate(dashboardRoute);
      } else {
        // New user, show role selection
        console.log("New user, showing role selection dialog...");
        setPendingGoogleUser(user);
        setShowRoleDialog(true);
        setIsLoading(false); // Stop loading so dialog can be interacted with
      }
    } catch (err: any) {
      console.error("Google auth error:", err);
      setIsLoading(false);
      if (err.code === "auth/popup-closed-by-user") {
        setError(t("auth.login.errors.networkError"));
      } else {
        setError(err.message || t("common.messages.error"));
      }
    }
  };

  const handleRoleSelect = async (role: "student" | "teacher" | "individual", grade?: string, teachingField?: string) => {
    if (!pendingGoogleUser) {
      console.error("No pending user for role selection");
      setError(t("common.messages.error"));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      console.log("Saving user to Firestore with role:", role, "grade:", grade);
      console.log("User details:", {
        uid: pendingGoogleUser.uid,
        email: pendingGoogleUser.email,
        name: pendingGoogleUser.displayName
      });
      
      await saveUserToFirestore(
        pendingGoogleUser.uid,
        pendingGoogleUser.email || "",
        pendingGoogleUser.displayName || "User",
        role,
        grade,
        teachingField
      );
      
      console.log("User saved to Firestore, refreshing context...");
      
      // Wait a moment for Firestore to be ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh user data in context
      await refreshUserData();
      
      // Verify the data was saved
      const verifyDocRef = doc(db, "users", pendingGoogleUser.uid);
      const verifyDoc = await getDoc(verifyDocRef);
      
      if (!verifyDoc.exists()) {
        throw new Error(t("common.messages.error"));
      }
      
      console.log("User data verified, closing dialog and navigating...");
      
      setShowRoleDialog(false);
      setPendingGoogleUser(null);
      
      // Navigate to the appropriate dashboard based on selected role
      const dashboardRoute = getDashboardRoute(role);
      navigate(dashboardRoute);
    } catch (err: any) {
      console.error("Error saving user:", err);
      setError(err.message || t("common.messages.error"));
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto shadow-2xl border-2 dark:border-primary/20 backdrop-blur-sm bg-card/95 dark:bg-card/95 transition-all duration-300 hover:shadow-primary/10">
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {mode === "login" ? t("auth.login.title") : t("auth.register.title")}
          </CardTitle>
          <CardDescription className="text-center text-base">
            {mode === "login"
              ? t("auth.login.description")
              : t("auth.register.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleEmailAuth)} className="space-y-4">
            {mode === "register" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">{t("common.labels.name")}</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    {...register("name")}
                    disabled={isLoading}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message as string}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">{t("common.labels.role")}</Label>
                  <Select
                    value={selectedRole || ""}
                    onValueChange={(value) => {
                      setValue("role", value as "student" | "teacher" | "individual");
                      if (value !== "student") {
                        setValue("grade", "");
                      }
                      if (value !== "teacher") {
                        setValue("teachingField", "");
                      }
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder={t("auth.register.roleLabel")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">{t("auth.roleSelection.student.label")}</SelectItem>
                      <SelectItem value="teacher">{t("auth.roleSelection.teacher.label")}</SelectItem>
                      <SelectItem value="individual">{t("auth.roleSelection.individual.label")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-destructive">
                      {errors.role.message as string}
                    </p>
                  )}
                </div>
                
                {selectedRole === "student" && (
                  <div className="space-y-2">
                    <Label htmlFor="grade">
                      {t("common.labels.grade")} <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={watch("grade") || ""}
                      onValueChange={(value) => setValue("grade", value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="grade">
                        <SelectValue placeholder={t("auth.register.gradeLabel")} />
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
                    {errors.grade && (
                      <p className="text-sm text-destructive">
                        {errors.grade.message as string}
                      </p>
                    )}
                  </div>
                )}
                
                {selectedRole === "teacher" && (
                  <div className="space-y-2">
                    <Label htmlFor="teachingField">
                      {t("auth.register.teachingFieldLabel")} <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={watch("teachingField") || ""}
                      onValueChange={(value) => setValue("teachingField", value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="teachingField">
                        <SelectValue placeholder={t("auth.register.teachingFieldLabel")} />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(translations.ro.teachingFields).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.teachingField && (
                      <p className="text-sm text-destructive">
                        {errors.teachingField.message as string}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t("common.labels.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("common.labels.password")}</Label>
              <Input
                id="password"
                type="password"
                {...register("password", {
                  onChange: () => {
                    if (mode === "register") {
                      trigger("password");
                      trigger("confirmPassword");
                    }
                  },
                })}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message as string}
                </p>
              )}
              {mode === "register" && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {t("auth.register.passwordRequirements.title")}
                  </p>
                  <ul className="text-xs space-y-0.5 ml-4 list-disc">
                    <li className={passwordValue && passwordValue.length >= 8 ? "text-green-600" : "text-muted-foreground"}>
                      {t("auth.register.passwordRequirements.minLength")}
                    </li>
                    <li className={passwordValue && /[A-Z]/.test(passwordValue) ? "text-green-600" : "text-muted-foreground"}>
                      {t("auth.register.passwordRequirements.uppercase")}
                    </li>
                    <li className={passwordValue && /[a-z]/.test(passwordValue) ? "text-green-600" : "text-muted-foreground"}>
                      {t("auth.register.passwordRequirements.lowercase")}
                    </li>
                    <li className={passwordValue && /[0-9]/.test(passwordValue) ? "text-green-600" : "text-muted-foreground"}>
                      {t("auth.register.passwordRequirements.number")}
                    </li>
                    <li className={passwordValue && /[^A-Za-z0-9]/.test(passwordValue) ? "text-green-600" : "text-muted-foreground"}>
                      {t("auth.register.passwordRequirements.special")}
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("common.labels.confirmPassword")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword", {
                    onChange: () => {
                      trigger("confirmPassword");
                    },
                  })}
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message as string}
                  </p>
                )}
                {watch("confirmPassword") && watch("password") && watch("confirmPassword") === watch("password") && !errors.confirmPassword && (
                  <p className="text-xs text-green-600">{t("auth.register.passwordMatch")}</p>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">
                {successMessage}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "login" ? t("auth.login.submitButton") : t("auth.register.submitButton")}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t("auth.login.orContinueWith")}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Google
          </Button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                {t("auth.login.noAccount")}{" "}
                <Link
                  to="/register"
                  className="text-primary hover:underline font-medium"
                >
                  {t("auth.login.signUpLink")}
                </Link>
              </>
            ) : (
              <>
                {t("auth.register.hasAccount")}{" "}
                <Link
                  to="/login"
                  className="text-primary hover:underline font-medium"
                >
                  {t("auth.register.signInLink")}
                </Link>
              </>
            )}
          </p>
        </CardContent>
      </Card>

      {showRoleDialog && (
        <RoleSelectionDialog
          open={showRoleDialog}
          onRoleSelect={handleRoleSelect}
        />
      )}
    </>
  );
}

