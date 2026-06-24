"use client"

import { cn } from "@/lib/utils"
import type { UserPublicProfile } from "@/backend/social/types"
import { Copy, Check, UserPlus, UserCheck } from "lucide-react"

interface ProfileStatsHeaderProps {
  profile: UserPublicProfile
  postCount: number
  projectCount: number
  repoCount?: number
  isFollowing: boolean
  isPending?: boolean
  isSelf: boolean
  onFollow?: () => void
  onUnfollow?: () => void
  onCancelRequest?: () => void
  onCopyId?: () => void
  copied?: boolean
  action?: React.ReactNode
}

export function ProfileStatsHeader({
  profile, postCount, projectCount, repoCount, isFollowing, isPending, isSelf,
  onFollow, onUnfollow, onCancelRequest, onCopyId, copied, action,
}: ProfileStatsHeaderProps) {
  const initials = profile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm overflow-hidden mb-6">
      <div className="h-24 sm:h-32 bg-gradient-to-r from-indigo-600/30 via-violet-600/20 to-fuchsia-600/20" />
      <div className="px-6 pb-6 -mt-12 sm:-mt-14">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="w-24 h-24 rounded-full border-4 border-[#080808] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 overflow-hidden shadow-xl">
            {profile.photoURL
              ? <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold text-white">{initials}</span>}
          </div>
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">{profile.name}</h2>
              <button
                onClick={onCopyId}
                className="inline-flex items-center gap-1.5 mt-0.5 text-indigo-400 text-sm font-bold tracking-wider hover:text-indigo-300"
              >
                {profile.studyverseId}
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
              {(profile.college || profile.major || profile.year) && (
                <p className="text-gray-500 text-xs mt-1">
                  {[profile.college, profile.major, profile.year].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {action}
              {!isSelf && !profile.uid.startsWith("seed-") && (onFollow || onUnfollow || onCancelRequest) && (
                <button
                  type="button"
                  onClick={() => {
                    if (isFollowing && onUnfollow) onUnfollow()
                    else if (isPending && onCancelRequest) onCancelRequest()
                    else if (onFollow) onFollow()
                  }}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    isFollowing
                      ? "bg-white/10 text-gray-300 border border-white/10"
                      : isPending
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20",
                  )}
                >
                  {isFollowing
                    ? <><UserCheck size={16} /> Following</>
                    : isPending
                      ? <>Requested</>
                      : <><UserPlus size={16} /> Follow</>}
                </button>
              )}
            </div>
          </div>
        </div>

        {profile.bio && (
          <p className="text-gray-300 text-sm mt-4 max-w-xl leading-relaxed">{profile.bio}</p>
        )}

        <div className="flex items-center gap-6 sm:gap-8 mt-5 text-sm">
          <Stat n={postCount} label="posts" />
          <Stat n={profile.followers.length} label="followers" />
          <Stat n={profile.following.length} label="following" />
          <Stat n={projectCount} label="projects" />
          {repoCount !== undefined && repoCount > 0 && (
            <Stat n={repoCount} label="repos" />
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <span>
      <strong className="text-white font-bold">{n}</strong>{" "}
      <span className="text-gray-500">{label}</span>
    </span>
  )
}

export type ProfileTab = "posts" | "projects" | "github" | "leetcode" | "settings"

interface ProfileTabsProps {
  active: ProfileTab
  onChange: (tab: ProfileTab) => void
  showSettings?: boolean
}

export function ProfileTabs({ active, onChange, showSettings }: ProfileTabsProps) {
  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "posts", label: "Posts" },
    { id: "projects", label: "Projects" },
    { id: "github", label: "GitHub" },
    { id: "leetcode", label: "LeetCode" },
  ]
  if (showSettings) tabs.push({ id: "settings", label: "Settings" })

  return (
    <div
      role="tablist"
      aria-label="Profile sections"
      className="relative z-10 flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-full max-w-full overflow-x-auto scrollbar-thin mb-6"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 whitespace-nowrap",
            active === tab.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-gray-500 hover:text-gray-300",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function ProjectGridItem({ project, onOpen }: { project: { id: string; title: string; deployedUrl: string; likes: number }; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="relative aspect-square rounded-xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden group"
    >
      <iframe
        src={project.deployedUrl}
        title={project.title}
        className="absolute inset-0 w-[200%] h-[200%] origin-top-left scale-50 border-none pointer-events-none opacity-60 group-hover:opacity-80 transition-opacity grayscale group-hover:grayscale-0"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
        <div className="text-left">
          <p className="text-xs font-bold text-white truncate">{project.title}</p>
          <p className="text-[10px] text-gray-400">{project.likes} likes</p>
        </div>
      </div>
    </button>
  )
}
