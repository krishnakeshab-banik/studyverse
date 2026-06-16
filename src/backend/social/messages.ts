import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy,
} from "firebase/firestore"
import { getClientDb } from "@/backend/db/firebase"
import type { Conversation, Message } from "./types"
import { isEitherBlocked } from "./blocks"

export function conversationId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join("_")
}

function parseConversation(id: string, data: Record<string, unknown>): Conversation {
  const participants = (data.participants as string[]) || []
  return {
    id,
    participants: [participants[0], participants[1]] as [string, string],
    updatedAt: (data.updatedAt as number) || Date.now(),
    lastMessage: data.lastMessage as string | undefined,
    lastSenderUid: data.lastSenderUid as string | undefined,
  }
}

function parseMessage(id: string, data: Record<string, unknown>): Message {
  return {
    id,
    senderUid: (data.senderUid as string) || "",
    text: (data.text as string) || "",
    timestamp: (data.timestamp as number) || Date.now(),
    deleted: data.deleted as boolean | undefined,
  }
}

export async function canMessage(senderUid: string, receiverUid: string): Promise<boolean> {
  if (senderUid === receiverUid) return false
  if (await isEitherBlocked(senderUid, receiverUid)) return false

  const [senderSnap, receiverSnap] = await Promise.all([
    getDoc(doc(getClientDb(), "users", senderUid)),
    getDoc(doc(getClientDb(), "users", receiverUid)),
  ])
  if (!senderSnap.exists() || !receiverSnap.exists()) return false

  const senderFollowers = (senderSnap.data().followers as string[]) || []
  const receiverFollowers = (receiverSnap.data().followers as string[]) || []

  const senderFollowsReceiver = receiverFollowers.includes(senderUid)
  const receiverFollowsSender = senderFollowers.includes(receiverUid)
  const mutual = senderFollowsReceiver && receiverFollowsSender

  return mutual || senderFollowsReceiver
}

export async function fetchConversations(uid: string): Promise<Conversation[]> {
  const q = query(
    collection(getClientDb(), "conversations"),
    where("participants", "array-contains", uid),
    orderBy("updatedAt", "desc"),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => parseConversation(d.id, d.data()))
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const snap = await getDocs(
    query(
      collection(getClientDb(), "conversations", conversationId, "messages"),
      orderBy("timestamp", "asc"),
    ),
  )
  return snap.docs.map(d => parseMessage(d.id, d.data()))
}

export async function sendMessage(
  senderUid: string,
  receiverUid: string,
  text: string,
): Promise<Message | null> {
  const trimmed = text.trim()
  if (!trimmed) return null
  if (!(await canMessage(senderUid, receiverUid))) return null

  const convId = conversationId(senderUid, receiverUid)
  const convRef = doc(getClientDb(), "conversations", convId)
  const convSnap = await getDoc(convRef)

  if (!convSnap.exists()) {
    await setDoc(convRef, {
      participants: [senderUid, receiverUid].sort(),
      updatedAt: Date.now(),
      lastMessage: trimmed,
      lastSenderUid: senderUid,
    })
  } else {
    await updateDoc(convRef, {
      updatedAt: Date.now(),
      lastMessage: trimmed,
      lastSenderUid: senderUid,
    })
  }

  const msgId = `M-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const message: Message = {
    id: msgId,
    senderUid,
    text: trimmed,
    timestamp: Date.now(),
  }
  await setDoc(doc(getClientDb(), "conversations", convId, "messages", msgId), message)
  return message
}

export async function deleteMessage(
  conversationId: string,
  messageId: string,
  requesterUid: string,
): Promise<boolean> {
  const ref = doc(getClientDb(), "conversations", conversationId, "messages", messageId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return false
  if ((snap.data().senderUid as string) !== requesterUid) return false
  await updateDoc(ref, { deleted: true, text: "" })
  return true
}

export async function getOrCreateConversation(uid1: string, uid2: string): Promise<Conversation | null> {
  if (!(await canMessage(uid1, uid2)) && !(await canMessage(uid2, uid1))) return null

  const convId = conversationId(uid1, uid2)
  const ref = doc(getClientDb(), "conversations", convId)
  const snap = await getDoc(ref)
  if (snap.exists()) return parseConversation(snap.id, snap.data())

  const conv: Conversation = {
    id: convId,
    participants: [uid1, uid2].sort() as [string, string],
    updatedAt: Date.now(),
  }
  await setDoc(ref, conv)
  return conv
}
