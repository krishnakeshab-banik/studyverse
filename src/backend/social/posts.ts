import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy, arrayUnion, arrayRemove, increment,
} from "firebase/firestore"
import { db } from "@/backend/db/firebase"
import type { PostCategory, SVPost } from "./types"

function parsePost(id: string, data: Record<string, unknown>): SVPost {
  return {
    id,
    authorUid: (data.authorUid as string) || "",
    studyverseId: (data.studyverseId as string) || "",
    authorName: (data.authorName as string) || "Anonymous",
    authorPhoto: data.authorPhoto as string | undefined,
    category: (data.category as PostCategory) || "general",
    text: (data.text as string) || "",
    projectUrl: data.projectUrl as string | undefined,
    leetcodeSlug: data.leetcodeSlug as string | undefined,
    likes: (data.likes as number) || 0,
    likedBy: (data.likedBy as string[]) || [],
    timestamp: (data.timestamp as number) || Date.now(),
  }
}

export async function createPost(
  authorUid: string,
  studyverseId: string,
  authorName: string,
  authorPhoto: string | undefined,
  input: {
    category: PostCategory
    text: string
    projectUrl?: string
    leetcodeSlug?: string
  },
): Promise<SVPost> {
  const id = "S-" + Math.random().toString(36).slice(2, 8).toUpperCase()
  const post: SVPost = {
    id,
    authorUid,
    studyverseId,
    authorName,
    authorPhoto,
    category: input.category,
    text: input.text.trim(),
    projectUrl: input.projectUrl?.trim() || undefined,
    leetcodeSlug: input.leetcodeSlug?.trim() || undefined,
    likes: 0,
    likedBy: [],
    timestamp: Date.now(),
  }
  await setDoc(doc(db, "posts", id), post)
  return post
}

export async function fetchAllPosts(): Promise<SVPost[]> {
  const snap = await getDocs(query(collection(db, "posts"), orderBy("timestamp", "desc")))
  return snap.docs.map(d => parsePost(d.id, d.data()))
}

export async function fetchPostsByUid(uid: string): Promise<SVPost[]> {
  const q = query(collection(db, "posts"), where("authorUid", "==", uid))
  const snap = await getDocs(q)
  return snap.docs.map(d => parsePost(d.id, d.data())).sort((a, b) => b.timestamp - a.timestamp)
}

export async function fetchPostsByStudyverseId(studyverseId: string): Promise<SVPost[]> {
  const normalized = studyverseId.trim().toUpperCase()
  const q = query(collection(db, "posts"), where("studyverseId", "==", normalized))
  const snap = await getDocs(q)
  return snap.docs.map(d => parsePost(d.id, d.data())).sort((a, b) => b.timestamp - a.timestamp)
}

export async function fetchPostsByCategory(category: PostCategory): Promise<SVPost[]> {
  const q = query(collection(db, "posts"), where("category", "==", category))
  const snap = await getDocs(q)
  return snap.docs.map(d => parsePost(d.id, d.data())).sort((a, b) => b.timestamp - a.timestamp)
}

export async function togglePostLike(postId: string, uid: string): Promise<void> {
  const ref = doc(db, "posts", postId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const likedBy = (snap.data().likedBy as string[]) || []
  const already = likedBy.includes(uid)
  await updateDoc(ref, already
    ? { likedBy: arrayRemove(uid), likes: increment(-1) }
    : { likedBy: arrayUnion(uid), likes: increment(1) },
  )
}

export async function countPostsByUid(uid: string): Promise<number> {
  const q = query(collection(db, "posts"), where("authorUid", "==", uid))
  const snap = await getDocs(q)
  return snap.size
}
