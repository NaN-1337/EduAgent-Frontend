import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, User as UserIcon } from "lucide-react";
import { translations } from "@/lib/translations";

interface UserData {
  uid: string;
  email: string;
  name: string;
  role: "student" | "teacher" | "individual";
  grade?: string;
  teachingField?: string;
  teacherCode?: string;
  enrolledStudents?: string[];
  createdAt?: any;
}

export default function ProfilePage() {
  const { user, userData, loading: authLoading, signOut, refreshUserData } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // If we have userData from context, use it immediately
    if (user && userData) {
      console.log("ProfilePage: Using userData from context", userData);
      setProfileData(userData);
      setName(userData.name);
      setLoading(false);
      return;
    }

    // If we have user but no userData yet, try to fetch it
    if (user && !userData && !retrying) {
      console.log("ProfilePage: No userData in context, fetching from Firestore...");
      setRetrying(true);
      
      const fetchUserData = async () => {
        let retries = 0;
        const maxRetries = 15; // Increased retries
        
        const tryFetch = async (): Promise<void> => {
          try {
            console.log(`ProfilePage: Attempting to fetch user data (attempt ${retries + 1}/${maxRetries})`);
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
              const data = userDocSnap.data() as UserData;
              console.log("ProfilePage: User data found in Firestore", data);
              setProfileData(data);
              setName(data.name);
              setLoading(false);
              setRetrying(false);
            } else {
              console.log(`ProfilePage: User document not found (attempt ${retries + 1}/${maxRetries})`);
              if (retries < maxRetries) {
                retries++;
                setTimeout(() => tryFetch(), 500);
              } else {
                console.error("ProfilePage: Max retries reached, user document not found");
                setLoading(false);
                setRetrying(false);
              }
            }
          } catch (error) {
            console.error("ProfilePage: Error fetching user data:", error);
            if (retries < maxRetries) {
              retries++;
              setTimeout(() => tryFetch(), 500);
            } else {
              setLoading(false);
              setRetrying(false);
            }
          }
        };
        
        tryFetch();
      };
      
      fetchUserData();
    }
  }, [user, userData, authLoading, navigate, retrying]);

  const handleSave = async () => {
    if (!user || !profileData) return;

    try {
      setSaving(true);
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        name: name,
      });
      setProfileData({ ...profileData, name });
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const handleManualRefresh = async () => {
    setRetrying(false);
    setLoading(true);
    await refreshUserData();
    // Also try direct fetch
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data() as UserData;
          setProfileData(data);
          setName(data.name);
        }
      } catch (error) {
        console.error("Error in manual refresh:", error);
      }
    }
    setLoading(false);
  };

  if (!profileData && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-muted-foreground font-semibold">No profile data found.</p>
            <p className="text-sm text-muted-foreground">
              {user 
                ? `User ID: ${user.uid.substring(0, 8)}...`
                : "Not authenticated"}
            </p>
            <p className="text-xs text-muted-foreground">
              If you just signed in with Google, make sure you selected a role.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleManualRefresh} variant="default" className="w-full">
                Try Again
              </Button>
              <div className="flex gap-2">
                <Button onClick={() => window.location.reload()} variant="outline" className="flex-1">
                  Refresh Page
                </Button>
                {user && (
                  <Button 
                    onClick={async () => {
                      await signOut();
                      navigate("/login");
                    }} 
                    variant="ghost"
                    className="flex-1"
                  >
                    Sign Out
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profileData) {
    return null;
  }

  const roleColors = {
    student: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    teacher: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    individual: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
  };

  const roleLabels = {
    student: "Student",
    teacher: "Teacher",
    individual: "Individual",
  };

      // Determine navbar role based on user role
      const navbarRole = profileData.role === "teacher" ? "teacher" : "student";

      return (
        <div className="min-h-screen bg-background">
          <Navbar role={navbarRole} />
          
          <main className="pt-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
              <div className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {t.common.profile.title}
                </h1>
              </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-xl border-2 dark:border-primary/20 backdrop-blur-sm bg-card/95 dark:bg-card/95 transition-all duration-300 hover:shadow-primary/10">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">{t.common.profile.profileInformation}</CardTitle>
                  <CardDescription>{t.common.profile.accountDetails}</CardDescription>
                </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.photoURL || undefined} />
                  <AvatarFallback>
                    <UserIcon className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{profileData.name}</h3>
                  <Badge className={`${roleColors[profileData.role]} border`}>
                    {roleLabels[profileData.role]}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t.common.labels.name}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!editing || saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t.common.labels.email}</Label>
                  <Input
                    id="email"
                    value={profileData.email}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uid">User ID</Label>
                  <Input
                    id="uid"
                    value={profileData.uid}
                    disabled
                    className="bg-muted font-mono text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">{t.common.labels.role}</Label>
                  <Input
                    id="role"
                    value={roleLabels[profileData.role]}
                    disabled
                    className="bg-muted"
                  />
                </div>

                {profileData.role === "student" && profileData.grade && (
                  <div className="space-y-2">
                    <Label htmlFor="grade">{t.common.labels.grade}</Label>
                    <Input
                      id="grade"
                      value={translations[language].grades[profileData.grade as keyof typeof translations.ro.grades] || profileData.grade}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                )}

                {profileData.role === "teacher" && profileData.teachingField && (
                  <div className="space-y-2">
                    <Label htmlFor="teachingField">{t.auth.register.teachingFieldLabel}</Label>
                    <Input
                      id="teachingField"
                      value={translations[language].teachingFields[profileData.teachingField as keyof typeof translations.ro.teachingFields] || profileData.teachingField}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {editing ? (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1"
                    >
                      {saving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setName(profileData.name);
                        setEditing(false);
                      }}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setEditing(true)}
                    className="w-full"
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

              <Card className="shadow-xl border-2 dark:border-primary/20 backdrop-blur-sm bg-card/95 dark:bg-card/95 transition-all duration-300 hover:shadow-primary/10">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">{t.common.profile.accountDetails}</CardTitle>
                  <CardDescription>Additional information</CardDescription>
                </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t.common.profile.accountCreated}</Label>
                <p className="text-sm text-muted-foreground">
                  {profileData.createdAt
                    ? new Date(
                        profileData.createdAt.seconds * 1000
                      ).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{t.common.profile.authenticationMethod}</Label>
                <p className="text-sm text-muted-foreground">
                  {user?.providerData[0]?.providerId === "google.com"
                    ? "Google"
                    : "Email/Password"}
                </p>
              </div>

              {profileData.role === "teacher" && profileData.teacherCode && (
                <div className="space-y-2">
                  <Label>{t.common.labels.teacherCode}</Label>
                  <div className="p-3 bg-muted rounded-md border">
                    <p className="text-lg font-bold text-primary font-mono text-center">
                      {profileData.teacherCode}
                    </p>
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      {t.common.profile.shareCodeMessage}
                    </p>
                  </div>
                </div>
              )}

              {profileData.role === "teacher" && profileData.enrolledStudents && (
                <div className="space-y-2">
                  <Label>{t.common.labels.enrolledStudents}</Label>
                  <p className="text-sm text-muted-foreground">
                    {profileData.enrolledStudents.length} {t.common.profile.studentsEnrolled}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
            </div>
            </div>
          </main>
        </div>
      );
    }

