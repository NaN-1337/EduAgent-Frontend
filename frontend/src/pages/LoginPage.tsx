import { AuthForm } from "@/components/auth/auth-form";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { RoleSelectionDialog } from "@/components/auth/role-selection-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { getDashboardRoute } from "@/lib/routes";

export default function LoginPage() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only check once when auth finishes loading
    if (loading) {
      return;
    }

    // If user is authenticated and has userData, navigate to their dashboard
    if (user && userData) {
      const timer = setTimeout(() => {
        const dashboardRoute = getDashboardRoute(userData.role);
        navigate(dashboardRoute);
      }, 100);
      return () => clearTimeout(timer);
    }

    // If user is authenticated but no userData, check Firestore once
    if (user && !userData && !hasChecked) {
      setHasChecked(true);
      const checkUserDocument = async () => {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (!userDocSnap.exists()) {
            // User is authenticated but has no Firestore document
            // Show role selection dialog
            console.log("User authenticated but no Firestore document, showing role selection");
            setShowRoleDialog(true);
          } else {
            // User has document, refresh and navigate
            await refreshUserData();
            // Wait a bit before navigating to prevent flicker
            setTimeout(() => {
              // Get the role from the document to determine dashboard
              const role = userDocSnap.data()?.role;
              const dashboardRoute = getDashboardRoute(role);
              navigate(dashboardRoute);
            }, 200);
          }
        } catch (error) {
          console.error("Error checking user document:", error);
        }
      };

      checkUserDocument();
    }
  }, [user, userData, loading, navigate, hasChecked, refreshUserData]);

  const handleRoleSelect = async (role: "student" | "teacher" | "individual") => {
    if (!user) return;

    try {
      const userDocRef = doc(db, "users", user.uid);
      
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email || "",
        name: user.displayName || "User",
        role: role,
        createdAt: new Date(),
      });

      await refreshUserData();
      setShowRoleDialog(false);
      // Navigate to the appropriate dashboard based on selected role
      const dashboardRoute = getDashboardRoute(role);
      navigate(dashboardRoute);
    } catch (error) {
      console.error("Error saving user role:", error);
    }
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show login form if user is authenticated (they'll be redirected)
  if (user && userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10 p-4">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        {/* Theme toggle */}
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        
        <div className="relative z-10 w-full max-w-md">
          <AuthForm mode="login" />
        </div>
      </div>
      {showRoleDialog && (
        <RoleSelectionDialog
          open={showRoleDialog}
          onRoleSelect={handleRoleSelect}
        />
      )}
    </>
  );
}

