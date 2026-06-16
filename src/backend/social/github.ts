import { doc, updateDoc } from "firebase/firestore"
import { getClientDb } from "@/backend/db/firebase"
import type { GitHubContributions, GitHubPinnedRepo, GitHubStats } from "./types"

interface GitHubUserResponse {
  login: string
  name: string | null
  avatar_url: string
  bio: string | null
  public_repos: number
  followers: number
  following: number
  html_url: string
}

interface GitHubRepoResponse {
  name: string
  description: string | null
  stargazers_count: number
  forks_count: number
  html_url: string
  language: string | null
}

function parseUsername(input: string): string {
  const trimmed = input.trim()
  const match = trimmed.match(/github\.com\/([A-Za-z0-9-]+)/i)
  return (match ? match[1] : trimmed).replace(/^@/, "")
}

interface ContributionsApiDay {
  date: string
  count: number
  level: number
}

interface ContributionsApiResponse {
  contributions?: ContributionsApiDay[]
  total?: { lastYear?: number }
  streak?: { current?: number; longest?: number }
}

async function fetchContributions(username: string): Promise<GitHubContributions | undefined> {
  try {
    const res = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`,
    )
    if (!res.ok) return undefined
    const data = (await res.json()) as ContributionsApiResponse
    const days = (data.contributions || []).map(d => ({
      date: d.date,
      count: d.count,
      level: Math.min(4, Math.max(0, d.level)),
    }))
    return {
      days,
      totalLastYear: data.total?.lastYear ?? days.reduce((a, d) => a + d.count, 0),
      currentStreak: data.streak?.current ?? 0,
      longestStreak: data.streak?.longest ?? 0,
    }
  } catch {
    return undefined
  }
}

export async function fetchGitHubStats(rawUsername: string): Promise<GitHubStats> {
  const username = parseUsername(rawUsername)
  if (!username) throw new Error("Enter a valid GitHub username")

  const headers = { Accept: "application/vnd.github+json" }

  const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers })
  if (userRes.status === 404) throw new Error("GitHub user not found")
  if (!userRes.ok) throw new Error("Could not reach GitHub — try again later")

  const user = (await userRes.json()) as GitHubUserResponse

  const reposRes = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=stars&per_page=100`,
    { headers },
  )
  const repos: GitHubRepoResponse[] = reposRes.ok ? await reposRes.json() : []

  let totalStars = 0
  let totalForks = 0
  for (const repo of repos) {
    totalStars += repo.stargazers_count
    totalForks += repo.forks_count
  }

  const pinnedRepos: GitHubPinnedRepo[] = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6)
    .map(r => ({
      name: r.name,
      description: r.description,
      stars: r.stargazers_count,
      forks: r.forks_count,
      url: r.html_url,
      language: r.language,
    }))

  const contributions = await fetchContributions(user.login)

  return {
    username: user.login,
    name: user.name,
    avatarUrl: user.avatar_url,
    bio: user.bio,
    publicRepos: user.public_repos,
    followers: user.followers,
    following: user.following,
    totalStars,
    totalForks,
    pinnedRepos,
    profileUrl: user.html_url,
    contributions,
  }
}

export async function syncGitHubToUser(uid: string, rawUsername: string): Promise<GitHubStats> {
  const stats = await fetchGitHubStats(rawUsername)
  await updateDoc(doc(getClientDb(), "users", uid), {
    githubUsername: stats.username,
    githubStats: stats,
    githubSyncedAt: Date.now(),
  })
  return stats
}
