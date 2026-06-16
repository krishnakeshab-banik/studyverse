import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { db } from "@/backend/db/firebase"

const ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

export function generateStudyverseId(): string {
  let suffix = ""
  for (let i = 0; i < 5; i++) {
    suffix += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]
  }
  return `U-${suffix}`
}

export async function createUniqueStudyverseId(): Promise<string> {
  for (let attempt = 0; attempt < 15; attempt++) {
    const id = generateStudyverseId()
    const indexSnap = await getDoc(doc(db, "users_by_id", id))
    if (!indexSnap.exists()) return id
  }
  throw new Error("Could not generate a unique user ID")
}

export async function ensureStudyverseId(uid: string): Promise<string> {
  const userRef = doc(db, "users", uid)
  const snap = await getDoc(userRef)
  if (!snap.exists()) throw new Error("User profile not found")

  const existing = snap.data().studyverseId as string | undefined
  if (existing) return existing

  const studyverseId = await createUniqueStudyverseId()
  await setDoc(doc(db, "users_by_id", studyverseId), { uid })
  await updateDoc(userRef, { studyverseId, followers: [], following: [] })
  return studyverseId
}

export async function registerStudyverseId(uid: string, studyverseId: string): Promise<void> {
  await setDoc(doc(db, "users_by_id", studyverseId), { uid })
}
