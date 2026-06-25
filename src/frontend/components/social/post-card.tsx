"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import type { PostCategory, SVPost } from "@/backend/social/types"
import { Heart, User, ExternalLink, Code2, MessageCircle, Send } from "lucide-react"
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
  onComment?: (id: string, text: string) => void
  onViewProfile?: (studyverseId: string) => void
}

export function PostCard({ post, currentUid, onLike, onComment, onViewProfile }: PostCardProps) {
  const router = useRouter()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const liked = currentUid ? post.likedBy.includes(currentUid) : false
  const comments = post.comments || []

  const openProfile = () => {
    if (onViewProfile) onViewProfile(post.studyverseId)
    else router.push(`/profile/${post.studyverseId}`)
  }

  const submitComment = () => {
    if (!commentText.trim() || !onComment) return
    onComment(post.id, commentText.trim())
    setCommentText("")
    setShowComments(true)
  }

  const timeAgo = formatTimeAgo(post.timestamp)

  return (
    <article className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
      <div className="flex gap-3 p-4">
        <button type="button" onClick={openProfile} className="shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden">
            {post.authorPhoto
              ? <img src={post.authorPhoto} alt="" className="w-full h-full object-cover" />
              : <User size={18} className="text-white" />}
          </div>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={openProfile} className="text-sm font-semibold text-white hover:text-indigo-300">
              {post.authorName}
            </button>
            <span className="text-[11px] font-bold text-indigo-400">{post.studyverseId}</span>
            <span className="text-gray-600 text-xs">· {timeAgo}</span>
            <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", CATEGORY_COLORS[post.category])}>
              {CATEGORY_LABELS[post.category]}
            </span>
          </div>
          <p className="text-gray-200 text-sm mt-2 leading-relaxed whitespace-pre-wrap break-words">{post.text}</p>
          {post.imageUrls && post.imageUrls.length > 0 && (
            <div className={cn(
              "mt-3 grid gap-1 rounded-xl overflow-hidden border border-white/[0.08]",
              post.imageUrls.length === 1 ? "grid-cols-1" : "grid-cols-2",
            )}>
              {post.imageUrls.map((url, i) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer" className={cn(
                  "block bg-black/40 overflow-hidden",
                  post.imageUrls!.length === 3 && i === 0 ? "row-span-2" : "",
                )}>
                  <img src={url} alt="" className="w-full h-full max-h-80 object-cover hover:opacity-95 transition-opacity" />
                </a>
              ))}
            </div>
          )}
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
              type="button"
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
            <button
              type="button"
              onClick={() => setShowComments(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 hover:text-indigo-400 hover:bg-white/5 transition-all"
            >
              <MessageCircle size={14} />
              {comments.length || null}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/[0.06] overflow-hidden"
          >
            <div className="px-4 py-3 flex flex-col gap-3 max-h-48 overflow-y-auto">
              {comments.length === 0 && (
                <p className="text-gray-600 text-xs text-center py-2">No comments yet. Be the first!</p>
              )}
              {comments.map(c => (
                <div key={c.id} className="text-sm">
                  <span className="font-semibold text-indigo-300">{c.authorName}</span>
                  <span className="text-gray-600 text-xs ml-2">{c.studyverseId}</span>
                  <p className="text-gray-300 mt-0.5">{c.text}</p>
                </div>
              ))}
            </div>
            {currentUid && onComment && (
              <div className="px-4 pb-3 flex gap-2">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submitComment()}
                  placeholder="Add a comment..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 h-9 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/40"
                />
                <button type="button" onClick={submitComment} className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center hover:bg-indigo-500">
                  <Send size={14} className="text-white" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
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
