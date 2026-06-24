import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy, arrayUnion, arrayRemove, increment,
} from "firebase/firestore"
import { getClientDb } from "@/backend/db/firebase"
import type { PostCategory, PostComment, SVPost } from "./types"
import { createNotification } from "./notifications"

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
    comments: (data.comments as PostComment[]) || [],
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
    comments: [],
    timestamp: Date.now(),
  }
  await setDoc(doc(getClientDb(), "posts", id), post)
  return post
}

export async function fetchAllPosts(): Promise<SVPost[]> {
  const snap = await getDocs(query(collection(getClientDb(), "posts"), orderBy("timestamp", "desc")))
  return snap.docs.map(d => parsePost(d.id, d.data()))
}

export async function fetchPostsByUid(uid: string): Promise<SVPost[]> {
  const q = query(collection(getClientDb(), "posts"), where("authorUid", "==", uid))
  const snap = await getDocs(q)
  return snap.docs.map(d => parsePost(d.id, d.data())).sort((a, b) => b.timestamp - a.timestamp)
}

export async function fetchPostsByStudyverseId(studyverseId: string): Promise<SVPost[]> {
  const normalized = studyverseId.trim().toUpperCase()
  const q = query(collection(getClientDb(), "posts"), where("studyverseId", "==", normalized))
  const snap = await getDocs(q)
  return snap.docs.map(d => parsePost(d.id, d.data())).sort((a, b) => b.timestamp - a.timestamp)
}

export async function fetchPostsByCategory(category: PostCategory): Promise<SVPost[]> {
  const q = query(collection(getClientDb(), "posts"), where("category", "==", category))
  const snap = await getDocs(q)
  return snap.docs.map(d => parsePost(d.id, d.data())).sort((a, b) => b.timestamp - a.timestamp)
}

export async function togglePostLike(postId: string, uid: string): Promise<void> {
  const ref = doc(getClientDb(), "posts", postId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const data = snap.data()
  const likedBy = (data.likedBy as string[]) || []
  const already = likedBy.includes(uid)
  await updateDoc(ref, already
    ? { likedBy: arrayRemove(uid), likes: increment(-1) }
    : { likedBy: arrayUnion(uid), likes: increment(1) },
  )

  if (!already) {
    const authorUid = data.authorUid as string
    if (authorUid && authorUid !== uid) {
      try {
        await createNotification(authorUid, {
          type: "post_like",
          fromUid: uid,
          postId,
          message: "liked your post",
        })
      } catch {
        // non-critical
      }
    }
  }
}

export async function addPostComment(
  postId: string,
  authorUid: string,
  authorName: string,
  studyverseId: string,
  text: string,
): Promise<PostComment> {
  const comment: PostComment = {
    id: Date.now().toString(),
    authorUid,
    authorName,
    studyverseId,
    text: text.trim(),
    timestamp: Date.now(),
  }
  const ref = doc(getClientDb(), "posts", postId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error("Post not found")
  const comments = [...((snap.data().comments as PostComment[]) || []), comment]
  await updateDoc(ref, { comments })
  return comment
}

export async function countPostsByUid(uid: string): Promise<number> {
  const q = query(collection(getClientDb(), "posts"), where("authorUid", "==", uid))
  const snap = await getDocs(q)
  return snap.size
}
