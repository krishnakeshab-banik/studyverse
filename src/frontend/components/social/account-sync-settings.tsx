"use client"

import { useState } from "react"
import type { GitHubStats, LeetCodeStats } from "@/backend/social/types"
import { syncGitHubToUser } from "@/backend/social/github"
import { syncLeetCodeToUser } from "@/backend/social/leetcode"
import { Github, Code2, RefreshCw } from "lucide-react"

interface AccountSyncSettingsProps {
  uid: string
  githubUsername?: string
  githubStats?: GitHubStats
  leetcodeUsername?: string
  leetcodeStats?: LeetCodeStats
  onGitHubSynced?: (stats: GitHubStats, username: string) => void
  onLeetCodeSynced?: (stats: LeetCodeStats, username: string) => void
}

function SyncBlock({
  icon: Icon,
  title,
  description,
  placeholder,
  initialUsername,
  hasStats,
  onSync,
}: {
  icon: typeof Github
  title: string
  description: string
  placeholder: string
  initialUsername: string
  hasStats: boolean
  onSync: (username: string) => Promise<void>
}) {
  const [username, setUsername] = useState(initialUsername)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSync = async () => {
    if (!username.trim()) return
    setSyncing(true)
    setError(null)
    try {
      await onSync(username)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} className="text-white" />
        <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4">{description}</p>
      <div className="flex gap-2 flex-col sm:flex-row">
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/40"
        />
        <button
          onClick={handleSync}
          disabled={syncing || !username.trim()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing..." : hasStats ? "Re-sync" : "Connect"}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  )
}

export function AccountSyncSettings({
  uid,
  githubUsername,
  githubStats,
  leetcodeUsername,
  leetcodeStats,
  onGitHubSynced,
  onLeetCodeSynced,
}: AccountSyncSettingsProps) {
  return (
    <div className="flex flex-col gap-4">
      <SyncBlock
        icon={Github}
        title="Connect GitHub"
        description="Enter your public GitHub username — no OAuth required. We fetch public stats and contribution data."
        placeholder="username or github.com/username"
        initialUsername={githubUsername || ""}
        hasStats={!!githubStats}
        onSync={async username => {
          const result = await syncGitHubToUser(uid, username)
          onGitHubSynced?.(result, result.username)
        }}
      />
      <SyncBlock
        icon={Code2}
        title="Connect LeetCode"
        description="Enter your LeetCode username to sync solved problems and stats for your profile and posts."
        placeholder="leetcode username"
        initialUsername={leetcodeUsername || ""}
        hasStats={!!leetcodeStats}
        onSync={async username => {
          const result = await syncLeetCodeToUser(uid, username)
          onLeetCodeSynced?.(result, result.username)
        }}
      />
    </div>
  )
}
