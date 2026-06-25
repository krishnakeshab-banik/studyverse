import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy, arrayUnion, arrayRemove, increment,
} from "firebase/firestore"
import { getClientDb } from "@/backend/db/firebase"
import type { ProjectComment, SVProject, UserPublicProfile } from "./types"

const SEED_FLAG = "studyverse_projects_seeded_v2"

export const SEED_PROJECTS: Omit<SVProject, "ownerUid">[] = [
  {
    id: "P-8X92B", studyverseId: "U-110", authorName: "Alice M.",
    title: "The Dawn of Innovation",
    description: "Explore the birth of groungetClientDb()reaking ideas and inventions via an interactive timeline.",
    github: "https://github.com", deployedUrl: "https://en.wikipedia.org/wiki/Main_Page",
    likes: 120, likedBy: [], stars: 34, starredBy: [], comments: [], timestamp: Date.now() - 100000, iconType: 0,
  },
  {
    id: "P-4C19A", studyverseId: "U-842", authorName: "Devin J.",
    title: "The Digital Revolution",
    description: "Dive into the transformative power of modern decentralized web protocols.",
    github: "", deployedUrl: "https://nextjs.org",
    likes: 89, likedBy: [], stars: 21, starredBy: [], comments: [], timestamp: Date.now() - 200000, iconType: 1,
  },
  {
    id: "P-7T66K", studyverseId: "U-555", authorName: "Sarah K.",
    title: "The Art of Design",
    description: "An interactive portfolio built for brutalist typography models.",
    github: "https://github.com", deployedUrl: "https://ui.shadcn.com",
    likes: 310, likedBy: [], stars: 88, starredBy: [], comments: [], timestamp: Date.now() - 300000, iconType: 2,
  },
  {
    id: "P-2F80Z", studyverseId: "U-110", authorName: "Alice M.",
    title: "CodeSangetClientDb()ox Clone",
    description: "An experimental localized sangetClientDb()ox for React environments.",
    github: "https://github.com", deployedUrl: "https://react.dev",
    likes: 45, likedBy: [], stars: 12, starredBy: [], comments: [], timestamp: Date.now() - 400000, iconType: 3,
  },
  {
    id: "P-9L11Y", studyverseId: "U-990", authorName: "Marcus T.",
    title: "NextJS Analytics Hub",
    description: "Realtime tracking dashboard with Vercel bindings.",
    github: "https://github.com", deployedUrl: "https://vercel.com",
    likes: 215, likedBy: [], stars: 56, starredBy: [], comments: [], timestamp: Date.now() - 500000, iconType: 4,
  },
]

function parseProject(id: string, data: Record<string, unknown>): SVProject {
  return {
    id,
    ownerUid: (data.ownerUid as string) || "",
    studyverseId: (data.studyverseId as string) || "",
    authorName: (data.authorName as string) || "Anonymous",
    authorPhoto: data.authorPhoto as string | undefined,
    title: (data.title as string) || "",
    description: (data.description as string) || "",
    github: (data.github as string) || "",
    deployedUrl: (data.deployedUrl as string) || "",
    likes: (data.likes as number) || 0,
    likedBy: (data.likedBy as string[]) || [],
    stars: (data.stars as number) || 0,
    starredBy: (data.starredBy as string[]) || [],
    comments: (data.comments as ProjectComment[]) || [],
    timestamp: (data.timestamp as number) || Date.now(),
    iconType: (data.iconType as number) || 0,
  }
}

export async function seedProjectsIfNeeded(): Promise<void> {
  const flagRef = doc(getClientDb(), "meta", SEED_FLAG)
  const flagSnap = await getDoc(flagRef)
  if (flagSnap.exists()) return

  for (const p of SEED_PROJECTS) {
    await setDoc(doc(getClientDb(), "projects", p.id), {
      ...p,
      ownerUid: `seed-${p.studyverseId}`,
    })
  }
  await setDoc(flagRef, { seededAt: Date.now() })
}

export async function fetchAllProjects(): Promise<SVProject[]> {
  await seedProjectsIfNeeded()
  const snap = await getDocs(query(collection(getClientDb(), "projects"), orderBy("timestamp", "desc")))
  return snap.docs.map(d => parseProject(d.id, d.data()))
}

export async function fetchProjectById(id: string): Promise<SVProject | null> {
  const snap = await getDoc(doc(getClientDb(), "projects", id))
  if (!snap.exists()) return null
  return parseProject(snap.id, snap.data())
}

export async function fetchProjectsByStudyverseId(studyverseId: string): Promise<SVProject[]> {
  const q = query(collection(getClientDb(), "projects"), where("studyverseId", "==", studyverseId.toUpperCase()))
  const snap = await getDocs(q)
  return snap.docs.map(d => parseProject(d.id, d.data())).sort((a, b) => b.timestamp - a.timestamp)
}

function mapUserProfile(uid: string, d: Record<string, unknown>, normalized: string): UserPublicProfile {
  return {
    uid,
    studyverseId: (d.studyverseId as string) || normalized,
    name: (d.name as string) || "User",
    photoURL: d.photoURL as string | undefined,
    college: d.college as string | undefined,
    bio: d.bio as string | undefined,
    major: d.major as string | undefined,
    year: d.year as string | undefined,
    instagram: d.instagram as string | undefined,
    linkedin: d.linkedin as string | undefined,
    isPrivate: !!(d.isPrivate),
    followers: (d.followers as string[]) || [],
    following: (d.following as string[]) || [],
    githubUsername: d.githubUsername as string | undefined,
    githubStats: d.githubStats as UserPublicProfile["githubStats"],
    githubSyncedAt: d.githubSyncedAt as number | undefined,
    leetcodeUsername: d.leetcodeUsername as string | undefined,
    leetcodeStats: d.leetcodeStats as UserPublicProfile["leetcodeStats"],
    leetcodeSyncedAt: d.leetcodeSyncedAt as number | undefined,
  }
}

export async function fetchUserByStudyverseId(studyverseId: string): Promise<UserPublicProfile | null> {
  const normalized = studyverseId.trim().toUpperCase()
  if (!normalized.startsWith("U-")) return null

  const indexSnap = await getDoc(doc(getClientDb(), "users_by_id", normalized))
  if (indexSnap.exists()) {
    const uid = indexSnap.data().uid as string
    const userSnap = await getDoc(doc(getClientDb(), "users", uid))
    if (userSnap.exists()) {
      return mapUserProfile(uid, userSnap.data(), normalized)
    }
  }

  // Fallback for seeded demo creators without a real account
  const demoProjects = await fetchProjectsByStudyverseId(normalized)
  if (demoProjects.length === 0) return null
  const first = demoProjects[0]
  return {
    uid: `seed-${normalized}`,
    studyverseId: normalized,
    name: first.authorName,
    photoURL: first.authorPhoto,
    followers: [],
    following: [],
  }
}

export async function createProject(
  ownerUid: string,
  studyverseId: string,
  authorName: string,
  authorPhoto: string | undefined,
  input: { title: string; description: string; deployedUrl: string; github: string },
): Promise<SVProject> {
  const id = "P-" + Math.random().toString(36).slice(2, 7).toUpperCase()
  const project: SVProject = {
    id,
    ownerUid,
    studyverseId,
    authorName,
    authorPhoto,
    title: input.title.trim(),
    description: input.description.trim(),
    deployedUrl: input.deployedUrl.trim(),
    github: input.github.trim(),
    likes: 0,
    likedBy: [],
    stars: 0,
    starredBy: [],
    comments: [],
    timestamp: Date.now(),
    iconType: Math.floor(Math.random() * 7),
  }
  await setDoc(doc(getClientDb(), "projects", id), project)
  return project
}

export async function toggleLike(projectId: string, uid: string): Promise<void> {
  const ref = doc(getClientDb(), "projects", projectId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const likedBy = (snap.data().likedBy as string[]) || []
  const already = likedBy.includes(uid)
  await updateDoc(ref, already
    ? { likedBy: arrayRemove(uid), likes: increment(-1) }
    : { likedBy: arrayUnion(uid), likes: increment(1) },
  )
}

export async function toggleStar(projectId: string, uid: string): Promise<void> {
  const ref = doc(getClientDb(), "projects", projectId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const starredBy = (snap.data().starredBy as string[]) || []
  const already = starredBy.includes(uid)
  await updateDoc(ref, already
    ? { starredBy: arrayRemove(uid), stars: increment(-1) }
    : { starredBy: arrayUnion(uid), stars: increment(1) },
  )
}

export async function addComment(
  projectId: string,
  authorUid: string,
  authorName: string,
  studyverseId: string,
  text: string,
): Promise<ProjectComment> {
  const comment: ProjectComment = {
    id: Date.now().toString(),
    authorUid,
    authorName,
    studyverseId,
    text: text.trim(),
    timestamp: Date.now(),
  }
  const ref = doc(getClientDb(), "projects", projectId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error("Project not found")
  const comments = [...((snap.data().comments as ProjectComment[]) || []), comment]
  await updateDoc(ref, { comments })
  return comment
}

export async function toggleFollow(followerUid: string, targetUid: string): Promise<boolean> {
  if (followerUid === targetUid) return false

  const followerRef = doc(getClientDb(), "users", followerUid)
  const targetRef = doc(getClientDb(), "users", targetUid)
  const [followerSnap, targetSnap] = await Promise.all([getDoc(followerRef), getDoc(targetRef)])
  if (!followerSnap.exists() || !targetSnap.exists()) return false

  const following = (followerSnap.data().following as string[]) || []
  const followers = (targetSnap.data().followers as string[]) || []
  const isFollowing = following.includes(targetUid)

  if (isFollowing) {
    await updateDoc(followerRef, { following: arrayRemove(targetUid) })
    await updateDoc(targetRef, { followers: arrayRemove(followerUid) })
    return false
  }
  await updateDoc(followerRef, { following: arrayUnion(targetUid) })
  await updateDoc(targetRef, { followers: arrayUnion(followerUid) })
  return true
}

export function isUserFollowing(followerUid: string | undefined, targetUid: string, following: string[]): boolean {
  if (!followerUid) return false
  return following.includes(targetUid)
}
