import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/types";

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", userId, "profile", "data"));
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }
  return null;
}

export async function saveUserProfile(
  userId: string,
  profile: Partial<UserProfile>
): Promise<void> {
  const ref = doc(db, "users", userId, "profile", "data");
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await setDoc(ref, { ...existing.data(), ...profile }, { merge: true });
  } else {
    await setDoc(ref, { calorieGoal: 2000, ...profile });
  }
}
