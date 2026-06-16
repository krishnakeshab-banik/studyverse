export interface ProjectComment {
  id: string
  authorUid: string
  authorName: string
  studyverseId: string
  text: string
  timestamp: number
}

export interface SVProject {
  id: string
  ownerUid: string
  studyverseId: string
  authorName: string
  authorPhoto?: string
  title: string
  description: string
  github: string
  deployedUrl: string
  likes: number
  likedBy: string[]
  stars: number
  starredBy: string[]
  comments: ProjectComment[]
  timestamp: number
  iconType: number
}

export type PostCategory = "project" | "leetcode" | "general"

export interface SVPost {
  id: string
  authorUid: string
  studyverseId: string
  authorName: string
  authorPhoto?: string
  category: PostCategory
  text: string
  projectUrl?: string
  leetcodeSlug?: string
  likes: number
  likedBy: string[]
  timestamp: number
}

export interface GitHubPinnedRepo {
  name: string
  description: string | null
  stars: number
  forks: number
  url: string
  language: string | null
}

export interface GitHubContributionDay {
  date: string
  count: number
  level: number
}

export interface GitHubContributions {
  days: GitHubContributionDay[]
  totalLastYear: number
  currentStreak: number
  longestStreak: number
}

export interface GitHubStats {
  username: string
  name: string | null
  avatarUrl: string | null
  bio: string | null
  publicRepos: number
  followers: number
  following: number
  totalStars: number
  totalForks: number
  pinnedRepos: GitHubPinnedRepo[]
  profileUrl: string
  contributions?: GitHubContributions
}

export interface LeetCodeProblem {
  title: string
  slug: string
  difficulty: "Easy" | "Medium" | "Hard"
  timestamp?: number
}

export interface LeetCodeStats {
  username: string
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
  ranking?: number
  recentProblems: LeetCodeProblem[]
  profileUrl: string
}

export interface UserPublicProfile {
  uid: string
  studyverseId: string
  name: string
  photoURL?: string
  college?: string
  bio?: string
  major?: string
  year?: string
  followers: string[]
  following: string[]
  githubUsername?: string
  githubStats?: GitHubStats
  githubSyncedAt?: number
  leetcodeUsername?: string
  leetcodeStats?: LeetCodeStats
  leetcodeSyncedAt?: number
}
