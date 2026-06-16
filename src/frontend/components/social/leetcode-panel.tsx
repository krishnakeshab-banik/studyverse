"use client"

import type { LeetCodeStats } from "@/backend/social/types"
import { Code2, ExternalLink, Trophy, Target, TrendingUp } from "lucide-react"
import { StatCard } from "@/components/ui/page-shell"
import { cn } from "@/lib/utils"

interface LeetCodePanelProps {
  leetcodeUsername?: string
  leetcodeStats?: LeetCodeStats
  leetcodeSyncedAt?: number
}

const DIFF_COLORS = {
  Easy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Hard: "text-red-400 bg-red-500/10 border-red-500/20",
}

const LEVEL_COLORS = [
  "bg-white/[0.06]",
  "bg-amber-900/60",
  "bg-amber-700/70",
  "bg-amber-500/80",
  "bg-amber-400",
]

function SubmissionHeatmap({ stats }: { stats: LeetCodeStats }) {
  const days = stats.submissionCalendar ?? []
  if (!days.length) return null

  const total = days.reduce((a, d) => a + d.count, 0)
  const weeks: typeof days[] = []
  let currentWeek: typeof days = []

  for (const day of days) {
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
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Submission activity</h4>
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <TrendingUp size={12} className="text-amber-400" />
          {total.toLocaleString()} submissions tracked
        </span>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-[3px] min-w-max">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map(day => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count} submission${day.count !== 1 ? "s" : ""}`}
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

export function LeetCodePanel({ leetcodeUsername, leetcodeStats, leetcodeSyncedAt }: LeetCodePanelProps) {
  if (!leetcodeStats) {
    return (
      <div className="py-12 text-center text-gray-500 text-sm">
        {leetcodeUsername
          ? "LeetCode linked — sync from Settings to refresh stats."
          : "No LeetCode account linked yet. Connect your account in Settings."}
      </div>
    )
  }

  const stats = leetcodeStats
  const recentProblems = stats.recentProblems ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        <div className="w-14 h-14 rounded-full border border-amber-500/30 bg-amber-500/10 flex items-center justify-center shrink-0">
          <Code2 size={24} className="text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white font-bold">@{stats.username}</p>
          <a href={stats.profileUrl} target="_blank" rel="noopener noreferrer"
            className="text-amber-400 text-sm font-semibold hover:text-amber-300 inline-flex items-center gap-1">
            View on LeetCode <ExternalLink size={12} />
          </a>
          {stats.ranking !== undefined && stats.ranking > 0 && (
            <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
              <Trophy size={11} /> Global rank #{stats.ranking.toLocaleString()}
            </p>
          )}
        </div>
        {leetcodeSyncedAt && (
          <span className="text-[10px] text-gray-600 shrink-0">
            Synced {new Date(leetcodeSyncedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Target} label="Total solved" value={stats.totalSolved} accent="#f59e0b" />
        <StatCard icon={Code2} label="Easy" value={stats.easySolved} accent="#10b981" />
        <StatCard icon={Code2} label="Medium" value={stats.mediumSolved} accent="#f59e0b" />
        <StatCard icon={Code2} label="Hard" value={stats.hardSolved} accent="#ef4444" />
      </div>

      <SubmissionHeatmap stats={stats} />

      {recentProblems.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Recent solved</h4>
          <div className="flex flex-col gap-2">
            {recentProblems.slice(0, 15).map(p => (
              <a
                key={`${p.slug}-${p.timestamp || p.title}`}
                href={`https://leetcode.com/problems/${p.slug}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] transition-colors"
              >
                <span className="text-sm text-white font-medium truncate">{p.title}</span>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border shrink-0", DIFF_COLORS[p.difficulty])}>
                  {p.difficulty}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
