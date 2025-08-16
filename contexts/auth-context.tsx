"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface UserProfile {
  id: string;
  fullName: string;
  username: string;
  country: string;
  userType: "volunteer" | "event-owner";
  bio?: string;
  profileImage?: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signup: (
    email: string,
    password: string,
    profile: Omit<UserProfile, "id" | "email" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        // Fetch user profile from Firestore
        const profileDoc = await getDoc(doc(db, "users", user.uid));
        if (profileDoc.exists()) {
          setUserProfile(profileDoc.data() as UserProfile);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (
    email: string,
    password: string,
    profile: Omit<UserProfile, "id" | "email" | "createdAt" | "updatedAt">
  ) => {
    const { user } = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Create user profile with id matching the Firebase Auth user ID
    const userProfileData: UserProfile = {
      ...profile,
      id: user.uid, // Same as the document ID
      email: email,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save user profile to Firestore using the same ID as document name
    await setDoc(doc(db, "users", user.uid), userProfileData);

    setUserProfile(userProfileData);
  };

  const login = async (emailOrUsername: string, password: string) => {
    // For simplicity, we'll assume it's an email. In a real app, you'd check if it's a username first
    await signInWithEmailAndPassword(auth, emailOrUsername, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("No user logged in");

    const updatedProfile = {
      ...userProfile,
      ...updates,
      updatedAt: new Date(),
    };
    await setDoc(doc(db, "users", user.uid), updatedProfile, { merge: true });
    setUserProfile(updatedProfile as UserProfile);
  };

  const value = {
    user,
    userProfile,
    loading,
    signup,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
