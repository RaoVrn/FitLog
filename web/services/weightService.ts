import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { WeightEntry } from "@/types";

export async function addWeight(
  userId: string,
  entry: Omit<WeightEntry, "id" | "userId">
): Promise<string> {
  const ref = await addDoc(collection(db, "users", userId, "weights"), {
    ...entry,
    userId,
  });
  return ref.id;
}

export async function getWeights(
  userId: string,
  limitCount = 30
): Promise<WeightEntry[]> {
  const q = query(
    collection(db, "users", userId, "weights"),
    orderBy("date", "asc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WeightEntry));
}

export async function deleteWeight(
  userId: string,
  entryId: string
): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "weights", entryId));
}
