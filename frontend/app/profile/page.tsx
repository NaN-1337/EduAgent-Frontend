"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, User as UserIcon } from "lucide-react";

interface UserData {
  uid: string;
  email: string;
  name: string;
  role: "student" | "teacher" | "individual";
  createdAt?: any;
}

export default function ProfilePage() {
  const { user, userData, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user && userData) {
      setProfileData(userData);
      setName(userData.name);
      setLoading(false);
    } else if (user) {
      // Fetch user data if not in context
      const fetchUserData = async () => {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as UserData;
            setProfileData(data);
            setName(data.name);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchUserData();
    }
  }, [user, userData, authLoading, router]);

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
    router.push("/login");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p>No profile data found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleColors = {
    student: "bg-blue-100 text-blue-800",
    teacher: "bg-purple-100 text-purple-800",
    individual: "bg-green-100 text-green-800",
  };

  const roleLabels = {
    student: "Student",
    teacher: "Teacher",
    individual: "Individual",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Profile</h1>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
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
                  <Badge className={roleColors[profileData.role]}>
                    {roleLabels[profileData.role]}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!editing || saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
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
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={roleLabels[profileData.role]}
                    disabled
                    className="bg-muted"
                  />
                </div>
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

          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Additional information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Account Created</Label>
                <p className="text-sm text-muted-foreground">
                  {profileData.createdAt
                    ? new Date(
                        profileData.createdAt.seconds * 1000
                      ).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Authentication Method</Label>
                <p className="text-sm text-muted-foreground">
                  {user?.providerData[0]?.providerId === "google.com"
                    ? "Google"
                    : "Email/Password"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

