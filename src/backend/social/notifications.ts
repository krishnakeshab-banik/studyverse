import {
  collection, doc, getDocs, setDoc, updateDoc,
  query, orderBy, writeBatch,
} from "firebase/firestore"
import { getClientDb } from "@/backend/db/firebase"
import type { NotificationType, SVNotification } from "./types"

function parseNotification(id: string, data: Record<string, unknown>): SVNotification {
  return {
    id,
    type: (data.type as NotificationType) || "follow_request",
    read: !!(data.read),
    timestamp: (data.timestamp as number) || Date.now(),
    fromUid: data.fromUid as string | undefined,
    fromStudyverseId: data.fromStudyverseId as string | undefined,
    fromName: data.fromName as string | undefined,
    fromPhoto: data.fromPhoto as string | undefined,
    followRequestId: data.followRequestId as string | undefined,
    postId: data.postId as string | undefined,
    message: data.message as string | undefined,
  }
}

function itemsRef(uid: string) {
  return collection(getClientDb(), "notifications", uid, "items")
}

export async function createNotification(
  uid: string,
  input: Omit<SVNotification, "id" | "read" | "timestamp"> & { id?: string; timestamp?: number },
): Promise<SVNotification> {
  const id = input.id || `N-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const notification: SVNotification = {
    id,
    type: input.type,
    read: false,
    timestamp: input.timestamp || Date.now(),
    fromUid: input.fromUid,
    fromStudyverseId: input.fromStudyverseId,
    fromName: input.fromName,
    fromPhoto: input.fromPhoto,
    followRequestId: input.followRequestId,
    postId: input.postId,
    message: input.message,
  }
  await setDoc(doc(itemsRef(uid), id), notification)
  return notification
}

export async function fetchNotifications(uid: string): Promise<SVNotification[]> {
  const snap = await getDocs(query(itemsRef(uid), orderBy("timestamp", "desc")))
  return snap.docs.map(d => parseNotification(d.id, d.data()))
}

export async function getUnreadCount(uid: string): Promise<number> {
  const all = await fetchNotifications(uid)
  return all.filter(n => !n.read).length
}

export async function markNotificationRead(uid: string, notificationId: string): Promise<void> {
  await updateDoc(doc(itemsRef(uid), notificationId), { read: true })
}

export async function markAllNotificationsRead(uid: string): Promise<void> {
  const snap = await getDocs(itemsRef(uid))
  const batch = writeBatch(getClientDb())
  snap.docs.forEach(d => {
    if (!d.data().read) batch.update(d.ref, { read: true })
  })
  await batch.commit()
}
