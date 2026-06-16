"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { PageShell } from "@/components/ui/page-shell"
import { PostCard } from "@/components/social/post-card"
import type { PostCategory, SVPost } from "@/backend/social/types"
import { fetchAllPosts, togglePostLike } from "@/backend/social/posts"
import { useAuth } from "@/context/AuthContext"
import { Compass } from "lucide-react"

type FilterCategory = "all" | PostCategory

const FILTERS: { id: FilterCategory; label: string }[] = [
  { id: "all", label: "All" },
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

  const load = useCallback(async () => {
    try {
      const all = await fetchAllPosts()
      setPosts(all)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

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
    await togglePostLike(id, user.uid)
  }

  const displayed = filter === "all" ? posts : posts.filter(p => p.category === filter)

  return (
    <PageShell
      title="Browse"
      subtitle="Discover posts from the StudyVerse community"
      icon={Compass}
      iconAccent="#6366f1"
      toolbar={
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                filter === f.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-gray-500 hover:text-gray-300",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      }
      noPadding
      contentClassName="p-4 sm:p-6"
    >
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-20 text-center text-gray-500">
          {filter === "all" ? "No posts yet. Be the first to share on your profile!" : `No ${filter} posts yet.`}
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-w-2xl mx-auto">
          {displayed.map(p => (
            <PostCard
              key={p.id}
              post={p}
              currentUid={user?.uid}
              onLike={handleLike}
              onViewProfile={id => router.push(`/profile/${id}`)}
            />
          ))}
        </div>
      )}
    </PageShell>
  )
}
