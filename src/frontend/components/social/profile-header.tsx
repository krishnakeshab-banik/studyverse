"use client"

import { cn } from "@/lib/utils"
import type { UserPublicProfile } from "@/backend/social/types"
import { Copy, Check, UserPlus, UserCheck, Lock, Instagram, Linkedin } from "lucide-react"

interface ProfileStatsHeaderProps {
  profile: UserPublicProfile
  postCount: number
  projectCount: number
  repoCount?: number
  isFollowing: boolean
  isPending?: boolean
  isSelf: boolean
  signedIn?: boolean
  onFollow?: () => void
  onUnfollow?: () => void
  onCancelRequest?: () => void
  onSignInRequired?: () => void
  onCopyId?: () => void
  copied?: boolean
  action?: React.ReactNode
}

function socialUrl(platform: "instagram" | "linkedin", handle: string): string {
  const trimmed = handle.replace(/^@/, "").trim()
  if (trimmed.startsWith("http")) return trimmed
  if (platform === "instagram") return `https://instagram.com/${trimmed}`
  return `https://linkedin.com/in/${trimmed}`
}

export function ProfileStatsHeader({
  profile,
  postCount,
  projectCount,
  repoCount,
  isFollowing,
  isPending,
  isSelf,
  signedIn = true,
  onFollow,
  onUnfollow,
  onCancelRequest,
  onSignInRequired,
  onCopyId,
  copied,
  action,
}: ProfileStatsHeaderProps) {
  const initials = profile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  const isDemoProfile = profile.uid.startsWith("seed-")
  const showFollow = !isSelf

  const handleFollowClick = () => {
    if (isDemoProfile) {
      alert("This is a demo creator profile — follow is only available for registered StudyVerse users.")
      return
    }
    if (!signedIn) {
      onSignInRequired?.()
      return
    }
    if (isFollowing && onUnfollow) onUnfollow()
    else if (isPending && onCancelRequest) onCancelRequest()
    else if (onFollow) onFollow()
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm mb-6">
      <div className="h-24 sm:h-32 bg-gradient-to-r from-indigo-600/30 via-violet-600/20 to-fuchsia-600/20 rounded-t-2xl overflow-hidden" />

      <div className="px-4 sm:px-6 pb-6 -mt-12 sm:-mt-14">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="w-24 h-24 rounded-full border-4 border-[#080808] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 overflow-hidden shadow-xl">
            {profile.photoURL
              ? <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold text-white">{initials}</span>}
          </div>

          <div className="flex-1 min-w-0 pt-0 sm:pt-14">
            <div className="min-w-0 pr-14 sm:pr-20">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-white">{profile.name}</h2>
                {profile.isPrivate && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 border border-white/10">
                    <Lock size={10} /> Private
                  </span>
                )}
                {isDemoProfile && (
                  <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25">
                    Demo
                  </span>
                )}
              </div>
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

            {(showFollow || action) && (
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {showFollow && (
                  <button
                    type="button"
                    onClick={handleFollowClick}
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
                {action}
              </div>
            )}

            {profile.bio && (
              <p className="text-gray-300 text-sm mt-4 max-w-xl leading-relaxed">{profile.bio}</p>
            )}

            {(profile.instagram || profile.linkedin) && (
              <div className="flex flex-wrap gap-2 mt-3">
                {profile.instagram && (
                  <a
                    href={socialUrl("instagram", profile.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-pink-400 bg-pink-500/10 border border-pink-500/20 hover:bg-pink-500/15 transition-colors"
                  >
                    <Instagram size={13} /> {profile.instagram.replace(/^@/, "")}
                  </a>
                )}
                {profile.linkedin && (
                  <a
                    href={socialUrl("linkedin", profile.linkedin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/15 transition-colors"
                  >
                    <Linkedin size={13} /> LinkedIn
                  </a>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:gap-x-8 mt-5 text-sm">
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
      className="sticky top-[5.25rem] z-40 -mx-1 px-1 mb-6 rounded-xl bg-[#080808]/95 backdrop-blur-md"
    >
      <div
        className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-full max-w-full overflow-x-auto scrollbar-thin scroll-smooth"
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
              "relative z-10 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 whitespace-nowrap",
              active === tab.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-gray-500 hover:text-gray-300",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
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
