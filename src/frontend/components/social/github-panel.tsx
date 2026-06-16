"use client"

import type { GitHubStats } from "@/backend/social/types"
import { Github, Star, GitFork, ExternalLink, Users, BookOpen, Flame, TrendingUp } from "lucide-react"
import { StatCard } from "@/components/ui/page-shell"

interface GitHubPanelProps {
  githubUsername?: string
  githubStats?: GitHubStats
  githubSyncedAt?: number
}

const LEVEL_COLORS = [
  "bg-white/[0.06]",
  "bg-emerald-900/60",
  "bg-emerald-700/70",
  "bg-emerald-500/80",
  "bg-emerald-400",
]

function ContributionGraph({ stats }: { stats: GitHubStats }) {
  const contributions = stats.contributions
  if (!contributions?.days.length) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 overflow-hidden">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Contribution activity</h4>
        <img
          src={`https://ghchart.rshah.org/${encodeURIComponent(stats.username)}`}
          alt={`${stats.username} contribution chart`}
          className="w-full max-w-2xl rounded-lg opacity-90"
        />
        <p className="text-[10px] text-gray-600 mt-2">Chart via ghchart.rshah.org</p>
      </div>
    )
  }

  const weeks: typeof contributions.days[] = []
  let currentWeek: typeof contributions.days = []
  for (const day of contributions.days) {
    currentWeek.push(day)
    const d = new Date(day.date + "T00:00:00")
    if (d.getDay() === 6) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  if (currentWeek.length) weeks.push(currentWeek)

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contribution activity</h4>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <TrendingUp size={12} className="text-emerald-400" />
            {contributions.totalLastYear.toLocaleString()} in last year
          </span>
          {contributions.currentStreak > 0 && (
            <span className="flex items-center gap-1.5">
              <Flame size={12} className="text-orange-400" />
              {contributions.currentStreak} day streak
            </span>
          )}
          {contributions.longestStreak > 0 && (
            <span className="text-gray-600">Best: {contributions.longestStreak} days</span>
          )}
        </div>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-[3px] min-w-max">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map(day => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count} contribution${day.count !== 1 ? "s" : ""}`}
                  className={`w-[11px] h-[11px] rounded-sm ${LEVEL_COLORS[day.level] || LEVEL_COLORS[0]}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-600">
        <span>Less</span>
        {LEVEL_COLORS.map((c, i) => (
          <div key={i} className={`w-[11px] h-[11px] rounded-sm ${c}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

export function GitHubPanel({ githubUsername, githubStats, githubSyncedAt }: GitHubPanelProps) {
  const stats = githubStats

  if (!stats) {
    return (
      <div className="py-12 text-center text-gray-500 text-sm">
        {githubUsername
          ? "GitHub linked — sync from Settings to refresh stats."
          : "No GitHub account linked yet."}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        {stats.avatarUrl && (
          <img src={stats.avatarUrl} alt="" className="w-14 h-14 rounded-full border border-white/10" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-white font-bold">{stats.name || stats.username}</p>
          <a href={stats.profileUrl} target="_blank" rel="noopener noreferrer"
            className="text-indigo-400 text-sm font-semibold hover:text-indigo-300 inline-flex items-center gap-1">
            @{stats.username} <ExternalLink size={12} />
          </a>
          {stats.bio && <p className="text-gray-400 text-xs mt-1 line-clamp-2">{stats.bio}</p>}
        </div>
        {githubSyncedAt && (
          <span className="text-[10px] text-gray-600 shrink-0">
            Synced {new Date(githubSyncedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={BookOpen} label="Public repos" value={stats.publicRepos} accent="#6366f1" />
        <StatCard icon={Users} label="Followers" value={stats.followers} accent="#10b981" />
        <StatCard icon={Star} label="Total stars" value={stats.totalStars} accent="#f59e0b" />
        <StatCard icon={GitFork} label="Total forks" value={stats.totalForks} accent="#f43f5e" />
      </div>

      <ContributionGraph stats={stats} />

      {stats.pinnedRepos.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Github size={14} /> Top repositories
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.pinnedRepos.map(repo => (
              <a
                key={repo.url}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors"
              >
                <p className="text-sm font-semibold text-white truncate">{repo.name}</p>
                {repo.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{repo.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                  {repo.language && <span>{repo.language}</span>}
                  <span className="flex items-center gap-1"><Star size={10} /> {repo.stars}</span>
                  <span className="flex items-center gap-1"><GitFork size={10} /> {repo.forks}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
