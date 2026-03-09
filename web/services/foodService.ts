import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Food } from "@/types";

/** Returns true if a food with the same name (case-insensitive) already exists. */
export async function foodExists(
  userId: string,
  name: string
): Promise<boolean> {
  const q = query(
    collection(db, "users", userId, "foods"),
    where("name", "==", name.trim())
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function addFood(
  userId: string,
  food: Omit<Food, "id">
): Promise<string> {
  const ref = await addDoc(collection(db, "users", userId, "foods"), {
    ...food,
    name: food.name.trim(),
  });
  return ref.id;
}

export async function getFoods(userId: string): Promise<Food[]> {
  const q = query(
    collection(db, "users", userId, "foods"),
    orderBy("name")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Food));
}

export async function deleteFood(
  userId: string,
  foodId: string
): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "foods", foodId));
}
