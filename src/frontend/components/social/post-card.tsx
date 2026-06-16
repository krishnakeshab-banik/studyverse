"use client"

import { cn } from "@/lib/utils"
import type { PostCategory, SVPost } from "@/backend/social/types"
import { Heart, User, ExternalLink, Code2 } from "lucide-react"
import { useRouter } from "next/navigation"

const CATEGORY_LABELS: Record<PostCategory, string> = {
  project: "Project",
  leetcode: "LeetCode",
  general: "General",
}

const CATEGORY_COLORS: Record<PostCategory, string> = {
  project: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  leetcode: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  general: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
}

interface PostCardProps {
  post: SVPost
  currentUid?: string
  onLike: (id: string) => void
  onViewProfile?: (studyverseId: string) => void
}

export function PostCard({ post, currentUid, onLike, onViewProfile }: PostCardProps) {
  const router = useRouter()
  const liked = currentUid ? post.likedBy.includes(currentUid) : false

  const openProfile = () => {
    if (onViewProfile) onViewProfile(post.studyverseId)
    else router.push(`/profile/${post.studyverseId}`)
  }

  const timeAgo = formatTimeAgo(post.timestamp)

  return (
    <article className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
      <div className="flex gap-3 p-4">
        <button onClick={openProfile} className="shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden">
            {post.authorPhoto
              ? <img src={post.authorPhoto} alt="" className="w-full h-full object-cover" />
              : <User size={18} className="text-white" />}
          </div>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={openProfile} className="text-sm font-semibold text-white hover:text-indigo-300">
              {post.authorName}
            </button>
            <span className="text-[11px] font-bold text-indigo-400">{post.studyverseId}</span>
            <span className="text-gray-600 text-xs">· {timeAgo}</span>
            <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", CATEGORY_COLORS[post.category])}>
              {CATEGORY_LABELS[post.category]}
            </span>
          </div>
          <p className="text-gray-200 text-sm mt-2 leading-relaxed whitespace-pre-wrap break-words">{post.text}</p>
          {post.projectUrl && (
            <a href={post.projectUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300">
              <ExternalLink size={12} /> {post.projectUrl}
            </a>
          )}
          {post.leetcodeSlug && (
            <a href={`https://leetcode.com/problems/${post.leetcodeSlug}/`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-amber-400 hover:text-amber-300">
              <Code2 size={12} /> leetcode.com/problems/{post.leetcodeSlug}
            </a>
          )}
          <div className="flex items-center gap-1 mt-3">
            <button
              onClick={() => onLike(post.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                liked
                  ? "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                  : "text-gray-500 hover:text-rose-400 hover:bg-white/5",
              )}
            >
              <Heart size={14} className={liked ? "fill-rose-400" : ""} />
              {post.likes || null}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "now"
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(ts).toLocaleDateString()
}

export { CATEGORY_LABELS, CATEGORY_COLORS }
