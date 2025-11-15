import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

interface UserData {
  uid: string;
  email: string;
  name: string;
  role: "student" | "teacher" | "individual";
  grade?: string;
  teachingField?: string;
  teacherCode?: string;
  enrolledStudents?: string[];
  enrolledTeachers?: string[];
  createdAt?: any;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;
      
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch user data from Firestore using uid as document ID
        // Retry logic to handle race conditions
        const maxRetries = 10;
        
        const fetchUserData = async (retryCount: number = 0): Promise<void> => {
          if (!isMounted) return;
          
          try {
            console.log(`AuthContext: Fetching user data (attempt ${retryCount + 1}/${maxRetries})`);
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (!isMounted) return;
            
            if (userDocSnap.exists()) {
              const data = userDocSnap.data() as UserData;
              console.log("AuthContext: User data found", data);
              setUserData(data);
              setLoading(false);
            } else {
              // If document doesn't exist yet, retry after a short delay
              if (retryCount < maxRetries) {
                console.log(`AuthContext: User document not found, retrying in 500ms...`);
                setTimeout(() => {
                  if (isMounted) {
                    fetchUserData(retryCount + 1);
                  }
                }, 500);
              } else {
                console.warn("AuthContext: Max retries reached, user document not found");
                if (isMounted) {
                  setUserData(null);
                  setLoading(false);
                }
              }
            }
          } catch (error) {
            console.error("AuthContext: Error fetching user data:", error);
            if (retryCount < maxRetries && isMounted) {
              setTimeout(() => {
                if (isMounted) {
                  fetchUserData(retryCount + 1);
                }
              }, 500);
            } else if (isMounted) {
              setUserData(null);
              setLoading(false);
            }
          }
        };
        
        fetchUserData();
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const refreshUserData = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setUserData(null);
      return;
    }

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        setUserData(userDocSnap.data() as UserData);
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signOut, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

