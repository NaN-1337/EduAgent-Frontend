/**
 * Get the dashboard route for a user based on their role
 */
export function getDashboardRoute(role: "student" | "teacher" | "individual" | undefined): string {
  switch (role) {
    case "teacher":
      return "/teacher/dashboard";
    case "student":
      return "/student/dashboard";
    case "individual":
      return "/individual/dashboard";
    default:
      return "/profile"; // Fallback to profile if role is unknown
  }
}

