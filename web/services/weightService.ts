import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  limit,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { WeightEntry } from "@/types";

/** Strip undefined fields so Firestore never receives them */
function clean(obj: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  );
}

export async function addWeight(
  userId: string,
  entry: Omit<WeightEntry, "id" | "userId">
): Promise<string> {
  const ref = await addDoc(
    collection(db, "users", userId, "weights"),
    clean({ ...entry, userId })
  );
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

export async function updateWeight(
  userId: string,
  entryId: string,
  fields: Partial<Omit<WeightEntry, "id" | "userId">>
): Promise<void> {
  await updateDoc(
    doc(db, "users", userId, "weights", entryId),
    clean(fields as Record<string, unknown>)
  );
}

/** Returns the most-recently dated weight entry, or null if none. */
export async function getLatestWeight(
  userId: string
): Promise<WeightEntry | null> {
  const q = query(
    collection(db, "users", userId, "weights"),
    orderBy("date", "desc"),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as WeightEntry;
}

/** Returns the total number of weight entries logged. */
export async function getWeightCount(userId: string): Promise<number> {
  const snap = await getDocs(collection(db, "users", userId, "weights"));
  return snap.size;
}
