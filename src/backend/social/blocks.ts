import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { getClientDb } from "@/backend/db/firebase"
import { unfollow } from "./follow-requests"

export async function getBlockedUsers(uid: string): Promise<string[]> {  const snap = await getDoc(doc(getClientDb(), "users", uid))
  if (!snap.exists()) return []
  return (snap.data().blockedUsers as string[]) || []
}

export async function isBlocked(uid: string, otherUid: string): Promise<boolean> {
  const blocked = await getBlockedUsers(uid)
  return blocked.includes(otherUid)
}

export async function isEitherBlocked(uid1: string, uid2: string): Promise<boolean> {
  const [a, b] = await Promise.all([getBlockedUsers(uid1), getBlockedUsers(uid2)])
  return a.includes(uid2) || b.includes(uid1)
}

export async function blockUser(uid: string, blockedUid: string): Promise<void> {
  if (uid === blockedUid) return
  await updateDoc(doc(getClientDb(), "users", uid), {
    blockedUsers: arrayUnion(blockedUid),
  })
  try {
    await unfollow(uid, blockedUid)
    await unfollow(blockedUid, uid)
  } catch {
    // non-critical
  }
}
export async function unblockUser(uid: string, blockedUid: string): Promise<void> {
  await updateDoc(doc(getClientDb(), "users", uid), {
    blockedUsers: arrayRemove(blockedUid),
  })
}
