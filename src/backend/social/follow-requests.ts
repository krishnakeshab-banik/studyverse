import {
  doc, getDoc, setDoc, updateDoc,
  arrayUnion, arrayRemove,
} from "firebase/firestore"
import { getClientDb } from "@/backend/db/firebase"
import type { FollowRequest } from "./types"
import { isEitherBlocked } from "./blocks"
import { createNotification } from "./notifications"

function requestId(fromUid: string, toUid: string) {
  return `${fromUid}_${toUid}`
}

function parseRequest(id: string, data: Record<string, unknown>): FollowRequest {
  return {
    id,
    fromUid: (data.fromUid as string) || "",
    toUid: (data.toUid as string) || "",
    fromStudyverseId: (data.fromStudyverseId as string) || "",
    fromName: (data.fromName as string) || "User",
    fromPhoto: data.fromPhoto as string | undefined,
    status: (data.status as FollowRequest["status"]) || "pending",
    timestamp: (data.timestamp as number) || Date.now(),
  }
}

export async function getFollowRequest(fromUid: string, toUid: string): Promise<FollowRequest | null> {
  const snap = await getDoc(doc(getClientDb(), "followRequests", requestId(fromUid, toUid)))
  if (!snap.exists()) return null
  return parseRequest(snap.id, snap.data())
}

export async function getPendingOutgoingRequest(fromUid: string, toUid: string): Promise<boolean> {
  const req = await getFollowRequest(fromUid, toUid)
  return req?.status === "pending"
}

export async function sendFollowRequest(
  fromUid: string,
  toUid: string,
  fromStudyverseId: string,
  fromName: string,
  fromPhoto?: string,
): Promise<"sent" | "already_following" | "already_pending" | "blocked"> {
  if (fromUid === toUid) return "blocked"
  if (await isEitherBlocked(fromUid, toUid)) return "blocked"

  const targetRef = doc(getClientDb(), "users", toUid)
  const targetSnap = await getDoc(targetRef)
  if (!targetSnap.exists()) return "blocked"

  const followers = (targetSnap.data().followers as string[]) || []
  if (followers.includes(fromUid)) return "already_following"

  const existing = await getFollowRequest(fromUid, toUid)
  if (existing?.status === "pending") return "already_pending"

  const id = requestId(fromUid, toUid)
  const req: FollowRequest = {
    id,
    fromUid,
    toUid,
    fromStudyverseId,
    fromName,
    fromPhoto,
    status: "pending",
    timestamp: Date.now(),
  }
  await setDoc(doc(getClientDb(), "followRequests", id), req)

  await createNotification(toUid, {
    id: `fr-${id}`,
    type: "follow_request",
    fromUid,
    fromStudyverseId,
    fromName,
    fromPhoto,
    followRequestId: id,
    message: `${fromName} wants to follow you`,
  })

  return "sent"
}

export async function acceptFollowRequest(requestId: string, toUid: string): Promise<boolean> {
  const ref = doc(getClientDb(), "followRequests", requestId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return false

  const req = parseRequest(snap.id, snap.data())
  if (req.toUid !== toUid || req.status !== "pending") return false

  const followerRef = doc(getClientDb(), "users", req.fromUid)
  const targetRef = doc(getClientDb(), "users", req.toUid)
  const [followerSnap, targetSnap] = await Promise.all([getDoc(followerRef), getDoc(targetRef)])
  if (!followerSnap.exists() || !targetSnap.exists()) return false

  await updateDoc(ref, { status: "accepted" })
  await updateDoc(followerRef, { following: arrayUnion(req.toUid) })
  await updateDoc(targetRef, { followers: arrayUnion(req.fromUid) })

  await createNotification(req.fromUid, {
    type: "follow_accepted",
    fromUid: req.toUid,
    fromStudyverseId: (targetSnap.data().studyverseId as string) || "",
    fromName: (targetSnap.data().name as string) || "User",
    fromPhoto: targetSnap.data().photoURL as string | undefined,
    message: "accepted your follow request",
  })

  return true
}

export async function declineFollowRequest(requestId: string, toUid: string): Promise<boolean> {
  const ref = doc(getClientDb(), "followRequests", requestId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return false

  const req = parseRequest(snap.id, snap.data())
  if (req.toUid !== toUid || req.status !== "pending") return false

  await updateDoc(ref, { status: "declined" })
  return true
}

export async function unfollow(followerUid: string, targetUid: string): Promise<boolean> {
  if (followerUid === targetUid) return false

  const followerRef = doc(getClientDb(), "users", followerUid)
  const targetRef = doc(getClientDb(), "users", targetUid)
  const [followerSnap, targetSnap] = await Promise.all([getDoc(followerRef), getDoc(targetRef)])
  if (!followerSnap.exists() || !targetSnap.exists()) return false

  const following = (followerSnap.data().following as string[]) || []
  if (!following.includes(targetUid)) return false

  await updateDoc(followerRef, { following: arrayRemove(targetUid) })
  await updateDoc(targetRef, { followers: arrayRemove(followerUid) })
  return true
}

export async function cancelFollowRequest(fromUid: string, toUid: string): Promise<void> {
  const id = requestId(fromUid, toUid)
  const snap = await getDoc(doc(getClientDb(), "followRequests", id))
  if (!snap.exists()) return
  const req = parseRequest(snap.id, snap.data())
  if (req.status === "pending") {
    await updateDoc(doc(getClientDb(), "followRequests", id), { status: "declined" })
  }
}
