import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Food } from "@/types";

/** Removes undefined fields so Firestore never receives them. */
function sanitize<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

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
  const ref = await addDoc(
    collection(db, "users", userId, "foods"),
    sanitize({ ...food, favorite: food.favorite ?? false, name: food.name.trim() })
  );
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

export async function updateFood(
  userId: string,
  foodId: string,
  updates: Partial<Omit<Food, "id">>
): Promise<void> {
  await updateDoc(doc(db, "users", userId, "foods", foodId), sanitize(updates));
}

export async function toggleFavorite(
  userId: string,
  foodId: string,
  favorite: boolean
): Promise<void> {
  await updateDoc(doc(db, "users", userId, "foods", foodId), { favorite });
}

export async function deleteFood(
  userId: string,
  foodId: string
): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "foods", foodId));
}

export async function deleteAllFoods(userId: string): Promise<void> {
  const snap = await getDocs(collection(db, "users", userId, "foods"));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}
