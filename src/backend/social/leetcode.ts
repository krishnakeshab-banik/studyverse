import { doc, updateDoc } from "firebase/firestore"
import { getClientDb } from "@/backend/db/firebase"
import type { LeetCodeProblem, LeetCodeStats, LeetCodeSubmissionDay } from "./types"

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
  submissionCalendar?: string | Record<string, number>
}

interface AlfaSubmission {
  title?: string
  titleSlug?: string
  difficulty?: string
  timestamp?: string | number
}

function countToLevel(count: number): number {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

function parseSubmissionCalendar(raw: string | Record<string, number> | undefined): LeetCodeSubmissionDay[] {
  if (!raw) return []
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) as Record<string, number> : raw
    return Object.entries(obj)
      .map(([ts, count]) => {
        const n = Number(count)
        const date = new Date(Number(ts) * 1000).toISOString().slice(0, 10)
        return { date, count: n, level: countToLevel(n) }
      })
      .sort((a, b) => a.date.localeCompare(b.date))
  } catch {
    return []
  }
}

async function fetchFromHeroku(username: string): Promise<Partial<LeetCodeStatsApiResponse> | null> {
  try {
    const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${encodeURIComponent(username)}`)
    if (!res.ok) return null
    const data = (await res.json()) as LeetCodeStatsApiResponse
    if (data.status === "error" || data.message?.toLowerCase().includes("not found")) return null
    return data
  } catch {
    return null
  }
}

async function fetchFromAlfa(username: string): Promise<Partial<LeetCodeStatsApiResponse> | null> {
  try {
    const res = await fetch(`https://alfa-leetcode-api.onrender.com/${encodeURIComponent(username)}/solved`)
    if (!res.ok) return null
    const data = (await res.json()) as {
      solvedProblem?: number
      easySolved?: number
      mediumSolved?: number
      hardSolved?: number
      ranking?: number
      submissionCalendar?: string | Record<string, number>
    }
    if (!data.solvedProblem && !data.easySolved && !data.mediumSolved && !data.hardSolved) return null
    return {
      totalSolved: data.solvedProblem,
      easySolved: data.easySolved,
      mediumSolved: data.mediumSolved,
      hardSolved: data.hardSolved,
      ranking: data.ranking,
      submissionCalendar: data.submissionCalendar,
    }
  } catch {
    return null
  }
}

async function fetchFromFuxsw(username: string): Promise<Partial<LeetCodeStatsApiResponse> | null> {
  try {
    const res = await fetch(`https://leetcode-api-fuxsw.vercel.app/${encodeURIComponent(username)}`)
    if (!res.ok) return null
    const data = (await res.json()) as LeetCodeStatsApiResponse & {
      totalQuestions?: number
      solvedStats?: { easy?: number; medium?: number; hard?: number }
    }
    if (data.status === "error" || data.message?.toLowerCase().includes("not found")) return null
    return {
      totalSolved: data.totalSolved ?? data.solvedStats
        ? (data.solvedStats?.easy ?? 0) + (data.solvedStats?.medium ?? 0) + (data.solvedStats?.hard ?? 0)
        : undefined,
      easySolved: data.easySolved ?? data.solvedStats?.easy,
      mediumSolved: data.mediumSolved ?? data.solvedStats?.medium,
      hardSolved: data.hardSolved ?? data.solvedStats?.hard,
      ranking: data.ranking,
      submissionCalendar: data.submissionCalendar,
    }
  } catch {
    return null
  }
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

  const [heroku, alfa, fuxsw, recentProblems] = await Promise.all([
    fetchFromHeroku(username),
    fetchFromAlfa(username),
    fetchFromFuxsw(username),
    fetchRecentProblems(username),
  ])

  const merged = { ...fuxsw, ...alfa, ...heroku }
  if (!merged.totalSolved && merged.totalSolved !== 0) {
    throw new Error("LeetCode user not found")
  }

  const submissionCalendar = parseSubmissionCalendar(
    heroku?.submissionCalendar ?? alfa?.submissionCalendar ?? fuxsw?.submissionCalendar,
  )

  return {
    username,
    totalSolved: merged.totalSolved ?? 0,
    easySolved: merged.easySolved ?? 0,
    mediumSolved: merged.mediumSolved ?? 0,
    hardSolved: merged.hardSolved ?? 0,
    ranking: merged.ranking,
    recentProblems,
    submissionCalendar: submissionCalendar.length > 0 ? submissionCalendar : undefined,
    profileUrl: `https://leetcode.com/${username}/`,
  }
}

export async function syncLeetCodeToUser(uid: string, rawUsername: string): Promise<LeetCodeStats> {
  const stats = await fetchLeetCodeStats(rawUsername)
  await updateDoc(doc(getClientDb(), "users", uid), {
    leetcodeUsername: stats.username,
    leetcodeStats: stats,
    leetcodeSyncedAt: Date.now(),
  })
  return stats
}
