"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { PageShell } from "@/components/ui/page-shell"
import { PostCard } from "@/components/social/post-card"
import type { PostCategory, SVPost } from "@/backend/social/types"
import { fetchAllPosts, togglePostLike, addPostComment } from "@/backend/social/posts"
import { fetchUserByStudyverseId } from "@/backend/social/projects"
import { canViewProfileContent } from "@/backend/social/privacy"
import { doc, getDoc } from "firebase/firestore"
import { getClientDb } from "@/backend/db/firebase"
import { ensureStudyverseId } from "@/backend/social/user-id"
import { useAuth } from "@/context/AuthContext"
import { Compass, Search, Heart, User, Grid3X3, LayoutList } from "lucide-react"

type FilterCategory = "all" | PostCategory
type ViewMode = "grid" | "feed"

const FILTERS: { id: FilterCategory; label: string }[] = [
  { id: "all", label: "For You" },
  { id: "project", label: "Projects" },
  { id: "leetcode", label: "LeetCode" },
  { id: "general", label: "General" },
]

export default function BrowsePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [posts, setPosts] = useState<SVPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterCategory>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [search, setSearch] = useState("")
  const [myName, setMyName] = useState("You")
  const [myStudyverseId, setMyStudyverseId] = useState("")

  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const id = await ensureStudyverseId(user.uid)
        setMyStudyverseId(id)
        const snap = await getDoc(doc(getClientDb(), "users", user.uid))
        if (snap.exists()) {
          setMyName((snap.data().name as string) || user.displayName || "You")
        }
      } catch (e) {
        console.error(e)
      }
    })()
  }, [user])

  const load = useCallback(async () => {
    try {
      const all = await fetchAllPosts()
      const visible: SVPost[] = []

      for (const post of all) {
        const profile = await fetchUserByStudyverseId(post.studyverseId)
        if (!profile) continue
        if (canViewProfileContent(profile, user?.uid)) visible.push(post)
      }
      setPosts(visible)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => { load() }, [load])

  const handleLike = async (id: string) => {
    if (!user) return alert("Sign in to like posts")
    const p = posts.find(x => x.id === id)
    if (!p) return
    const liked = p.likedBy.includes(user.uid)
    setPosts(prev => prev.map(x => x.id === id ? {
      ...x,
      likedBy: liked ? x.likedBy.filter(u => u !== user.uid) : [...x.likedBy, user.uid],
      likes: liked ? x.likes - 1 : x.likes + 1,
    } : x))
    try {
      await togglePostLike(id, user.uid)
    } catch (e) {
      console.error(e)
      load()
    }
  }

  const handleComment = async (id: string, text: string) => {
    if (!user || !myStudyverseId) return alert("Sign in to comment")
    try {
      const comment = await addPostComment(id, user.uid, myName, myStudyverseId, text)
      setPosts(prev => prev.map(x => x.id === id ? {
        ...x,
        comments: [...(x.comments || []), comment],
      } : x))
    } catch (e) {
      console.error(e)
      alert("Failed to add comment")
    }
  }

  const displayed = useMemo(() => {
    let list = filter === "all" ? posts : posts.filter(p => p.category === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.text.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        p.studyverseId.toLowerCase().includes(q),
      )
    }
    return list
  }, [posts, filter, search])

  const creators = useMemo(() => {
    const map = new Map<string, SVPost>()
    for (const p of posts) {
      if (!map.has(p.studyverseId)) map.set(p.studyverseId, p)
    }
    return [...map.values()].slice(0, 12)
  }, [posts])

  const gridPosts = useMemo(() =>
    displayed.filter(p => p.imageUrls && p.imageUrls.length > 0),
  [displayed])

  return (
    <PageShell
      title="Explore"
      subtitle="Discover posts, creators, and moments from StudyVerse"
      icon={Compass}
      iconAccent="#6366f1"
      toolbar={
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search posts or creators..."
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 h-10 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-x-auto scrollbar-thin">
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0",
                    filter === f.id ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-300",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center bg-white/[0.04] border border-white/10 rounded-xl p-1">
              <button onClick={() => setViewMode("grid")} className={cn("w-8 h-8 rounded-lg flex items-center justify-center", viewMode === "grid" ? "bg-white/10 text-white" : "text-gray-500")}>
                <Grid3X3 size={15} />
              </button>
              <button onClick={() => setViewMode("feed")} className={cn("w-8 h-8 rounded-lg flex items-center justify-center", viewMode === "feed" ? "bg-white/10 text-white" : "text-gray-500")}>
                <LayoutList size={15} />
              </button>
            </div>
          </div>
        </div>
      }
      noPadding
      contentClassName="p-4 sm:p-6"
    >
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        </div>
      ) : (
        <>
          {creators.length > 0 && (
            <div className="mb-8">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Creators</p>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                {creators.map(p => (
                  <button
                    key={p.studyverseId}
                    onClick={() => router.push(`/profile/${p.studyverseId}`)}
                    className="flex flex-col items-center gap-2 shrink-0 group"
                  >
                    <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 via-violet-500 to-fuchsia-500">
                      <div className="w-full h-full rounded-full overflow-hidden bg-[#080808] flex items-center justify-center">
                        {p.authorPhoto
                          ? <img src={p.authorPhoto} alt="" className="w-full h-full object-cover" />
                          : <User size={20} className="text-gray-500" />}
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-400 group-hover:text-white truncate max-w-[72px]">{p.authorName.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {displayed.length === 0 ? (
            <div className="py-20 text-center text-gray-500">
              No posts to explore yet. Be the first to share on your profile!
            </div>
          ) : viewMode === "grid" && gridPosts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2">
              {gridPosts.map(p => (
                <button
                  key={p.id}
                  onClick={() => setViewMode("feed")}
                  className="relative aspect-square bg-black/40 overflow-hidden group"
                >
                  <img src={p.imageUrls![0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-sm font-bold">
                    <span className="flex items-center gap-1"><Heart size={16} className="fill-white" /> {p.likes}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4 max-w-2xl mx-auto">
              {displayed.map(p => (
                <PostCard
                  key={p.id}
                  post={p}
                  currentUid={user?.uid}
                  onLike={handleLike}
                  onComment={handleComment}
                  onViewProfile={id => router.push(`/profile/${id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </PageShell>
  )
}
