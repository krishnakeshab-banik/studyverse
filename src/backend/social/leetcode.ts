import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/backend/db/firebase"
import type { LeetCodeProblem, LeetCodeStats } from "./types"

function parseUsername(input: string): string {
  return input.trim().replace(/^@/, "").replace(/\/$/, "")
}

interface LeetCodeStatsApiResponse {
  status?: string
  message?: string
  totalSolved?: number
  easySolved?: number
  mediumSolved?: number
  hardSolved?: number
  ranking?: number
}

interface AlfaSubmission {
  title?: string
  titleSlug?: string
  difficulty?: string
  timestamp?: string | number
}

async function fetchRecentProblems(username: string): Promise<LeetCodeProblem[]> {
  try {
    const res = await fetch(
      `https://alfa-leetcode-api.onrender.com/${encodeURIComponent(username)}/acsubmission?limit=30`,
    )
    if (!res.ok) return []
    const data = (await res.json()) as { submission?: AlfaSubmission[] } | AlfaSubmission[]
    const submissions = Array.isArray(data) ? data : data.submission || []
    return submissions
      .filter(s => s.titleSlug)
      .map(s => ({
        title: s.title || s.titleSlug || "Unknown",
        slug: s.titleSlug!,
        difficulty: (["Easy", "Medium", "Hard"].includes(s.difficulty || "")
          ? s.difficulty
          : "Medium") as LeetCodeProblem["difficulty"],
        timestamp: s.timestamp ? Number(s.timestamp) * 1000 : undefined,
      }))
  } catch {
    return []
  }
}

export async function fetchLeetCodeStats(rawUsername: string): Promise<LeetCodeStats> {
  const username = parseUsername(rawUsername)
  if (!username) throw new Error("Enter a valid LeetCode username")

  const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${encodeURIComponent(username)}`)
  if (!res.ok) throw new Error("Could not reach LeetCode — try again later")

  const data = (await res.json()) as LeetCodeStatsApiResponse
  if (data.status === "error" || data.message?.toLowerCase().includes("not found")) {
    throw new Error("LeetCode user not found")
  }

  const recentProblems = await fetchRecentProblems(username)

  return {
    username,
    totalSolved: data.totalSolved ?? 0,
    easySolved: data.easySolved ?? 0,
    mediumSolved: data.mediumSolved ?? 0,
    hardSolved: data.hardSolved ?? 0,
    ranking: data.ranking,
    recentProblems,
    profileUrl: `https://leetcode.com/${username}/`,
  }
}

export async function syncLeetCodeToUser(uid: string, rawUsername: string): Promise<LeetCodeStats> {
  const stats = await fetchLeetCodeStats(rawUsername)
  await updateDoc(doc(db, "users", uid), {
    leetcodeUsername: stats.username,
    leetcodeStats: stats,
    leetcodeSyncedAt: Date.now(),
  })
  return stats
}
