import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, User, LogOut } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";

interface NavbarProps {
  role?: "teacher" | "student" | "individual";
}

export function Navbar({ role = "teacher" }: NavbarProps) {
  const { user, userData, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/individual/learning-paths" || path === "/student/learning-paths") {
      return location.pathname.startsWith("/individual/learning-paths") || location.pathname.startsWith("/student/learning-paths");
    }
    return location.pathname === path;
  };

  const teacherLinks = [
    { path: "/teacher/dashboard", label: t.navbar.teacher?.dashboard || t.navbar.student.dashboard },
    { path: "/teacher/lessons", label: t.navbar.teacher?.myLessons || t.navbar.student.myLessons },
    { path: "/teacher/students", label: t.teacher.studentsView.title },
    { path: "/profile", label: t.navbar.teacher?.account || t.navbar.student.account },
  ];

  const studentLinks = [
    { path: "/student/dashboard", label: t.navbar.student.dashboard },
    { path: "/student/lessons", label: t.navbar.student.myLessons },
    { path: "/student/learning-paths", label: t.navbar.individual?.learningPaths || "Căi de învățare" },
    { path: "/profile", label: t.navbar.student.account },
  ];

  const individualLinks = [
    { path: "/individual/dashboard", label: t.navbar.individual?.dashboard || t.navbar.student.dashboard },
    { path: "/individual/learning-paths", label: t.navbar.individual?.learningPaths || "Căi de învățare" },
    { path: "/profile", label: t.navbar.individual?.account || t.navbar.student.account },
  ];

  const links = role === "teacher" ? teacherLinks : role === "individual" ? individualLinks : studentLinks;

  const NavLinks = () => (
    <>
      {links.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={`px-4 py-2 rounded-md text-base font-medium transition-colors ${
            isActive(link.path)
              ? "text-primary bg-primary/10"
              : "text-foreground/70 hover:text-foreground hover:bg-accent"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        >
          {link.label}
        </Link>
      ))}
    </>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and name */}
          <Link to={role === "teacher" ? "/teacher/dashboard" : role === "individual" ? "/individual/dashboard" : "/student/dashboard"} className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground font-bold text-xl">
              EA
            </div>
            <span className="text-xl font-semibold text-foreground">EduAgent</span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLinks />
          </div>

          {/* Right side: Language toggle, Theme toggle, Avatar */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:block">
              <LanguageToggle />
            </div>
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL || undefined} alt={userData?.name || "User"} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {userData?.name || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground capitalize">
                        {userData?.role || "User"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      {t.navbar.profile}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t.navbar.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile menu button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">{t.navbar.menu}</h2>
                    <div className="flex items-center gap-2">
                      <LanguageToggle />
                      <ThemeToggle />
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <NavLinks />
                  </div>
                  {user && (
                    <>
                      <div className="pt-4 border-t">
                        <div className="flex items-center space-x-3 mb-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.photoURL || undefined} alt={userData?.name || "User"} />
                            <AvatarFallback>
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{userData?.name || "User"}</p>
                            <p className="text-xs text-muted-foreground capitalize">{userData?.role || "User"}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleSignOut}
                          className="w-full justify-start"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          {t.navbar.logout}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}

