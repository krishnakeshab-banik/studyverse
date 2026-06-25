"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { ProjectComment, SVProject, UserPublicProfile } from "@/backend/social/types"
import {
  Heart, Star, MessageCircle, ExternalLink, Github, Send, X,
  User, Copy, Check, UserPlus, UserCheck,
} from "lucide-react"

interface FeedCardProps {
  project: SVProject
  currentUid?: string
  onLike: (id: string) => void
  onStar: (id: string) => void
  onOpen: (p: SVProject) => void
  onViewProfile: (studyverseId: string) => void
  onComment: (id: string, text: string) => void
}

export function ProjectFeedCard({
  project, currentUid, onLike, onStar, onOpen, onViewProfile, onComment,
}: FeedCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const liked = currentUid ? project.likedBy.includes(currentUid) : false
  const starred = currentUid ? project.starredBy.includes(currentUid) : false

  const submitComment = () => {
    if (!commentText.trim()) return
    onComment(project.id, commentText.trim())
    setCommentText("")
    setShowComments(true)
  }

  return (
    <article className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden shadow-xl">
      {/* Header */}
      <button
        onClick={() => onViewProfile(project.studyverseId)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 overflow-hidden">
          {project.authorPhoto
            ? <img src={project.authorPhoto} alt="" className="w-full h-full object-cover" />
            : <User size={16} className="text-white" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">{project.authorName}</p>
          <p className="text-[11px] font-bold text-indigo-400 tracking-wider">{project.studyverseId}</p>
        </div>
        <span className="text-[10px] text-gray-600 font-mono">{project.id}</span>
      </button>

      {/* Preview */}
      <button
        onClick={() => onOpen(project)}
        className="relative w-full aspect-[16/10] bg-[#0a0a0a] block group overflow-hidden"
      >
        <iframe
          src={project.deployedUrl}
          title={project.title}
          className="absolute inset-0 w-[200%] h-[200%] origin-top-left scale-50 border-none pointer-events-none opacity-70 group-hover:opacity-90 transition-opacity grayscale group-hover:grayscale-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <span className="text-xs font-semibold text-white flex items-center gap-1.5">
            <ExternalLink size={12} /> Open project
          </span>
        </div>
      </button>

      {/* Actions */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-1">
        <button
          onClick={() => onLike(project.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all",
            liked
              ? "text-rose-400 bg-rose-500/10 border border-rose-500/20"
              : "text-gray-400 hover:text-rose-400 hover:bg-white/5",
          )}
        >
          <Heart size={18} className={liked ? "fill-rose-400" : ""} />
          {project.likes}
        </button>
        <button
          onClick={() => onStar(project.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all",
            starred
              ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
              : "text-gray-400 hover:text-amber-400 hover:bg-white/5",
          )}
        >
          <Star size={18} className={starred ? "fill-amber-400" : ""} />
          {project.stars}
        </button>
        <button
          onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-indigo-400 hover:bg-white/5 transition-all"
        >
          <MessageCircle size={18} />
          {project.comments.length}
        </button>
        <button
          onClick={() => onOpen(project)}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-indigo-400 hover:bg-indigo-500/10 transition-all"
        >
          <ExternalLink size={16} /> Open
        </button>
      </div>

      {/* Caption */}
      <div className="px-4 pb-3">
        <h3 className="text-white font-bold text-sm">{project.title}</h3>
        <p className="text-gray-400 text-sm mt-1 line-clamp-2 leading-relaxed">{project.description}</p>
        {project.comments.length > 0 && !showComments && (
          <button onClick={() => setShowComments(true)} className="text-gray-500 text-xs mt-2 hover:text-gray-300">
            View all {project.comments.length} comment{project.comments.length !== 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/[0.06] overflow-hidden"
          >
            <div className="px-4 py-3 flex flex-col gap-3 max-h-48 overflow-y-auto">
              {project.comments.length === 0 && (
                <p className="text-gray-600 text-xs text-center py-2">No comments yet. Be the first!</p>
              )}
              {project.comments.map(c => (
                <div key={c.id} className="text-sm">
                  <span className="font-semibold text-indigo-300">{c.authorName}</span>
                  <span className="text-gray-600 text-xs ml-2">{c.studyverseId}</span>
                  <p className="text-gray-300 mt-0.5">{c.text}</p>
                </div>
              ))}
            </div>
            {currentUid && (
              <div className="px-4 pb-3 flex gap-2">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submitComment()}
                  placeholder="Add a comment..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 h-9 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/40"
                />
                <button onClick={submitComment} className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center hover:bg-indigo-500">
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

interface ProfileHeaderProps {
  profile: UserPublicProfile
  projectCount: number
  isFollowing: boolean
  isSelf: boolean
  onFollow: () => void
  onCopyId: () => void
  copied: boolean
}

export function ProfileHeader({
  profile, projectCount, isFollowing, isSelf, onFollow, onCopyId, copied,
}: ProfileHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] mb-6">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 overflow-hidden border-2 border-white/10 shadow-lg">
        {profile.photoURL
          ? <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
          : <User size={32} className="text-white" />}
      </div>
      <div className="flex-1 text-center sm:text-left min-w-0">
        <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
        <button
          onClick={onCopyId}
          className="inline-flex items-center gap-1.5 mt-1 text-indigo-400 text-sm font-bold tracking-wider hover:text-indigo-300"
        >
          {profile.studyverseId}
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
        </button>
        {(profile.college || profile.bio) && (
          <p className="text-gray-400 text-sm mt-2 max-w-md">{profile.bio || profile.college}</p>
        )}
        <div className="flex items-center justify-center sm:justify-start gap-5 mt-4 text-sm">
          <span><strong className="text-white">{projectCount}</strong> <span className="text-gray-500">projects</span></span>
          <span><strong className="text-white">{profile.followers.length}</strong> <span className="text-gray-500">followers</span></span>
          <span><strong className="text-white">{profile.following.length}</strong> <span className="text-gray-500">following</span></span>
        </div>
      </div>
      {!isSelf && (
        <button
          onClick={onFollow}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0",
            isFollowing
              ? "bg-white/10 text-gray-300 border border-white/10 hover:bg-white/5"
              : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20",
          )}
        >
          {isFollowing ? <><UserCheck size={16} /> Following</> : <><UserPlus size={16} /> Follow</>}
        </button>
      )}
    </div>
  )
}

interface ProjectModalProps {
  project: SVProject
  currentUid?: string
  onClose: () => void
  onLike: (id: string) => void
  onStar: (id: string) => void
  onOpenLive: (id: string) => void
  onViewProfile: (studyverseId: string) => void
}

export function ProjectDetailModal({
  project, currentUid, onClose, onLike, onStar, onOpenLive, onViewProfile,
}: ProjectModalProps) {
  const liked = currentUid ? project.likedBy.includes(currentUid) : false
  const starred = currentUid ? project.starredBy.includes(currentUid) : false

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-[#0c0c0c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="h-48 sm:h-56 relative bg-[#0a0a0a] shrink-0">
          <iframe src={project.deployedUrl} className="absolute inset-0 w-full h-full border-none pointer-events-none opacity-40 grayscale" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/40 to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white backdrop-blur-md">
            <X size={16} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <button onClick={() => onViewProfile(project.studyverseId)} className="text-xs font-bold text-indigo-400 mb-2 hover:text-indigo-300">
              {project.authorName} · {project.studyverseId}
            </button>
            <h2 className="text-2xl font-bold text-white">{project.title}</h2>
          </div>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-gray-300 text-sm leading-relaxed mb-6">{project.description}</p>
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => onLike(project.id)} className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition-all", liked ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-white/5 border-white/10 text-gray-400")}>
              <Heart size={16} className={liked ? "fill-rose-400" : ""} /> {project.likes}
            </button>
            <button onClick={() => onStar(project.id)} className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition-all", starred ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-white/5 border-white/10 text-gray-400")}>
              <Star size={16} className={starred ? "fill-amber-400" : ""} /> {project.stars}
            </button>
            <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-gray-400">
              <MessageCircle size={16} /> {project.comments.length}
            </span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => onOpenLive(project.id)} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 text-sm">
              <ExternalLink size={16} /> Open Live
            </button>
            {project.github && (
              <a href={project.github} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 text-sm">
                <Github size={16} /> Repo
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export type { SVProject, UserPublicProfile, ProjectComment }
