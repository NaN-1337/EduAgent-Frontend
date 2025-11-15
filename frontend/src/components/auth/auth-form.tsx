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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoleSelectionDialog } from "./role-selection-dialog";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Strong password validation
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: passwordSchema,
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["student", "teacher", "individual"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<LoginFormData | RegisterFormData>({
    resolver: zodResolver(mode === "login" ? loginSchema : registerSchema),
    mode: "onChange", // Validate on change for better UX
  });
  
  const passwordValue = watch("password");

  const selectedRole = watch("role");

  const saveUserToFirestore = async (
    uid: string,
    email: string,
    name: string,
    role: "student" | "teacher" | "individual"
  ) => {
    try {
      // Use uid as document ID
      const userDocRef = doc(db, "users", uid);
      
      // Check if user already exists
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        // Create new user document with uid as doc ID and as a field
        const userData = {
          uid: uid, // Store uid as a field
          email: email,
          name: name,
          role: role,
          createdAt: new Date(),
        };
        
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
        navigate("/profile");
      } else {
        const { email, password, name, role } = data as RegisterFormData;
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        // Send email verification
        await sendEmailVerification(user);
        
        // Save user to Firestore
        await saveUserToFirestore(user.uid, email, name, role);
        
        // Refresh user data in context
        await refreshUserData();
        
        setSuccessMessage("Account created! Please check your email to verify your account.");
        
        // Wait a bit for Firestore to be ready, then navigate
        setTimeout(() => {
          navigate("/profile");
        }, 1500);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email or password");
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered");
      } else {
        setError(err.message || "An error occurred. Please try again.");
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
        // User exists, refresh user data and proceed to profile
        console.log("Existing user, refreshing data...");
        await refreshUserData();
        navigate("/profile");
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
        setError("Sign-in was cancelled");
      } else {
        setError(err.message || "An error occurred. Please try again.");
      }
    }
  };

  const handleRoleSelect = async (role: "student" | "teacher" | "individual") => {
    if (!pendingGoogleUser) {
      console.error("No pending user for role selection");
      setError("No user data available. Please try signing in again.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      console.log("Saving user to Firestore with role:", role);
      console.log("User details:", {
        uid: pendingGoogleUser.uid,
        email: pendingGoogleUser.email,
        name: pendingGoogleUser.displayName
      });
      
      await saveUserToFirestore(
        pendingGoogleUser.uid,
        pendingGoogleUser.email || "",
        pendingGoogleUser.displayName || "User",
        role
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
        throw new Error("User document was not created. Please try again.");
      }
      
      console.log("User data verified, closing dialog and navigating...");
      
      setShowRoleDialog(false);
      setPendingGoogleUser(null);
      
      // Navigate to profile
      navigate("/profile");
    } catch (err: any) {
      console.error("Error saving user:", err);
      setError(err.message || "Failed to save user data. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto shadow-2xl border-2 dark:border-primary/20 backdrop-blur-sm bg-card/95 dark:bg-card/95 transition-all duration-300 hover:shadow-primary/10">
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </CardTitle>
          <CardDescription className="text-center text-base">
            {mode === "login"
              ? "Enter your credentials to sign in"
              : "Enter your information to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleEmailAuth)} className="space-y-4">
            {mode === "register" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
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
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={selectedRole || ""}
                    onValueChange={(value) => setValue("role", value as "student" | "teacher" | "individual")}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-destructive">
                      {errors.role.message as string}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Password</Label>
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
                    Password must contain:
                  </p>
                  <ul className="text-xs space-y-0.5 ml-4 list-disc">
                    <li className={passwordValue && passwordValue.length >= 8 ? "text-green-600" : "text-muted-foreground"}>
                      At least 8 characters
                    </li>
                    <li className={passwordValue && /[A-Z]/.test(passwordValue) ? "text-green-600" : "text-muted-foreground"}>
                      One uppercase letter
                    </li>
                    <li className={passwordValue && /[a-z]/.test(passwordValue) ? "text-green-600" : "text-muted-foreground"}>
                      One lowercase letter
                    </li>
                    <li className={passwordValue && /[0-9]/.test(passwordValue) ? "text-green-600" : "text-muted-foreground"}>
                      One number
                    </li>
                    <li className={passwordValue && /[^A-Za-z0-9]/.test(passwordValue) ? "text-green-600" : "text-muted-foreground"}>
                      One special character
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
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
                  <p className="text-xs text-green-600">✓ Passwords match</p>
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
              {mode === "login" ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
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
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
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

