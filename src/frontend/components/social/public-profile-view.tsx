"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ProfileStatsHeader, ProfileTabs, ProjectGridItem, type ProfileTab } from "@/components/social/profile-header"
import { PostCard } from "@/components/social/post-card"
import { GitHubPanel } from "@/components/social/github-panel"
import { LeetCodePanel } from "@/components/social/leetcode-panel"
import { ProjectDetailModal } from "@/components/projects/project-feed"
import { useAuth } from "@/context/AuthContext"
import {
  fetchUserByStudyverseId, fetchProjectsByStudyverseId,
  toggleLike, toggleStar,
} from "@/backend/social/projects"
import {
  fetchPostsByStudyverseId, togglePostLike, addPostComment,
} from "@/backend/social/posts"
import {
  sendFollowRequest, unfollow, cancelFollowRequest, getFollowRequest,
} from "@/backend/social/follow-requests"
import { blockUser } from "@/backend/social/blocks"
import { canMessage } from "@/backend/social/messages"
import { doc, getDoc } from "firebase/firestore"
import { getClientDb } from "@/backend/db/firebase"
import { ensureStudyverseId } from "@/backend/social/user-id"
import type { SVPost, SVProject, UserPublicProfile } from "@/backend/social/types"
import { User, ArrowLeft, MessageSquare, Ban } from "lucide-react"

interface PublicProfileViewProps {
  studyverseId: string
}

const VALID_TABS: ProfileTab[] = ["posts", "projects", "github", "leetcode"]

function tabFromHash(): ProfileTab | null {
  if (typeof window === "undefined") return null
  const hash = window.location.hash.replace("#", "") as ProfileTab
  return VALID_TABS.includes(hash) ? hash : null
}

export function PublicProfileView({ studyverseId }: PublicProfileViewProps) {
  const router = useRouter()
  const { user } = useAuth()

  const [profile, setProfile] = useState<UserPublicProfile | null>(null)
  const [posts, setPosts] = useState<SVPost[]>([])
  const [projects, setProjects] = useState<SVProject[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState<ProfileTab>("posts")
  const [copiedId, setCopiedId] = useState(false)
  const [activeProject, setActiveProject] = useState<SVProject | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [canMsg, setCanMsg] = useState(false)
  const [myName, setMyName] = useState("You")
  const [myStudyverseId, setMyStudyverseId] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setNotFound(false)
    try {
      const p = await fetchUserByStudyverseId(studyverseId)
      if (!p) {
        setNotFound(true)
        return
      }
      setProfile(p)
      const [userPosts, userProjects] = await Promise.all([
        fetchPostsByStudyverseId(studyverseId),
        fetchProjectsByStudyverseId(studyverseId),
      ])
      setPosts(userPosts)
      setProjects(userProjects)

      if (user && user.uid !== p.uid) {
        const req = await getFollowRequest(user.uid, p.uid)
        setIsPending(req?.status === "pending")
        setCanMsg(await canMessage(user.uid, p.uid))
      }
    } catch (e) {
      console.error(e)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [studyverseId, user])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const initial = tabFromHash()
    if (initial) setTab(initial)
  }, [])

  const handleTabChange = useCallback((next: ProfileTab) => {
    setTab(next)
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${next}`)
      requestAnimationFrame(() => {
        document.getElementById("profile-tab-panel")?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      })
    }
  }, [])

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

  const isSelf = user?.uid === profile?.uid
  const isFollowing = profile ? (user ? profile.followers.includes(user.uid) : false) : false

  const handleFollow = async () => {
    if (!user || !profile) return alert("Sign in to follow")
    if (profile.uid.startsWith("seed-")) return alert("Demo account")
    try {
      const result = await sendFollowRequest(
        user.uid, profile.uid, myStudyverseId || "U-???", myName, user.photoURL || undefined,
      )
      if (result === "blocked") return alert("Unable to send follow request")
      if (result === "already_following") return
      if (result === "already_pending") {
        setIsPending(true)
        return
      }
      setIsPending(true)
      alert("Follow request sent!")
    } catch (e) {
      console.error(e)
      alert("Failed to send follow request")
    }
  }

  const handleUnfollow = async () => {
    if (!user || !profile) return
    try {
      await unfollow(user.uid, profile.uid)
      setProfile(prev => prev ? {
        ...prev,
        followers: prev.followers.filter(u => u !== user.uid),
      } : null)
      setIsPending(false)
    } catch (e) {
      console.error(e)
      alert("Failed to unfollow")
    }
  }

  const handleCancelRequest = async () => {
    if (!user || !profile) return
    try {
      await cancelFollowRequest(user.uid, profile.uid)
      setIsPending(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleBlock = async () => {
    if (!user || !profile) return
    if (!confirm(`Block ${profile.name}? They won't be able to message or follow you.`)) return
    try {
      await blockUser(user.uid, profile.uid)
      alert("User blocked")
      router.push("/browse")
    } catch (e) {
      console.error(e)
      alert("Failed to block user")
    }
  }

  const handlePostLike = async (id: string) => {
    if (!user) return alert("Sign in to like")
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
      alert("Failed to update like")
      load()
    }
  }

  const handlePostComment = async (id: string, text: string) => {
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

  const handleProjectLike = async (id: string) => {
    if (!user) return alert("Sign in to like")
    const p = projects.find(x => x.id === id)
    if (!p) return
    const liked = p.likedBy.includes(user.uid)
    setProjects(prev => prev.map(x => x.id === id ? {
      ...x,
      likedBy: liked ? x.likedBy.filter(u => u !== user.uid) : [...x.likedBy, user.uid],
      likes: liked ? x.likes - 1 : x.likes + 1,
    } : x))
    try {
      await toggleLike(id, user.uid)
    } catch (e) {
      console.error(e)
      alert("Failed to update like")
    }
    if (activeProject?.id === id) {
      setActiveProject(prev => prev ? {
        ...prev,
        likedBy: liked ? prev.likedBy.filter(u => u !== user.uid) : [...prev.likedBy, user.uid],
        likes: liked ? prev.likes - 1 : prev.likes + 1,
      } : null)
    }
  }

  const handleProjectStar = async (id: string) => {
    if (!user) return alert("Sign in to star")
    const p = projects.find(x => x.id === id)
    if (!p) return
    const starred = p.starredBy.includes(user.uid)
    setProjects(prev => prev.map(x => x.id === id ? {
      ...x,
      starredBy: starred ? x.starredBy.filter(u => u !== user.uid) : [...x.starredBy, user.uid],
      stars: starred ? x.stars - 1 : x.stars + 1,
    } : x))
    try {
      await toggleStar(id, user.uid)
    } catch (e) {
      console.error(e)
      alert("Failed to update star")
    }
    if (activeProject?.id === id) {
      setActiveProject(prev => prev ? {
        ...prev,
        starredBy: starred ? prev.starredBy.filter(u => u !== user.uid) : [...prev.starredBy, user.uid],
        stars: starred ? prev.stars - 1 : prev.stars + 1,
      } : null)
    }
  }

  const copyUserId = () => {
    if (!profile) return
    navigator.clipboard.writeText(profile.studyverseId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="py-20 text-center">
        <User size={40} className="text-gray-700 mx-auto mb-3" />
        <p className="text-gray-400 font-semibold">User not found</p>
        <button onClick={() => router.push("/browse")} className="text-indigo-400 text-sm mt-2 hover:text-indigo-300">
          Browse feed →
        </button>
      </div>
    )
  }

  return (
    <>
      <button onClick={() => router.back()} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-4 text-sm font-bold">
        <ArrowLeft size={16} /> Back
      </button>

      <ProfileStatsHeader
        profile={profile}
        postCount={posts.length}
        projectCount={projects.length}
        repoCount={profile.githubStats?.publicRepos}
        isFollowing={isFollowing}
        isPending={isPending}
        isSelf={isSelf}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        onCancelRequest={handleCancelRequest}
        onCopyId={copyUserId}
        copied={copiedId}
        action={
          <div className="flex items-center gap-2">
            {isSelf ? (
              <button
                onClick={() => router.push("/profile")}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-300 border border-white/10 bg-white/5 hover:bg-white/10"
              >
                Edit profile
              </button>
            ) : (
              <>
                {canMsg && (
                  <button
                    onClick={() => router.push(`/messages?uid=${profile.uid}`)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-indigo-400 border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20"
                  >
                    <MessageSquare size={14} /> Message
                  </button>
                )}
                <button
                  onClick={handleBlock}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-400 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20"
                  title="Block user"
                >
                  <Ban size={14} />
                </button>
              </>
            )}
          </div>
        }
      />

      <ProfileTabs active={tab} onChange={handleTabChange} />

      <div id="profile-tab-panel" role="tabpanel" className="min-h-[200px]">
      {tab === "posts" && (
        posts.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">No posts yet.</div>
        ) : (
          <div className="flex flex-col gap-3 max-w-2xl">
            {posts.map(p => (
              <PostCard
                key={p.id}
                post={p}
                currentUid={user?.uid}
                onLike={handlePostLike}
                onComment={handlePostComment}
              />
            ))}
          </div>
        )
      )}

      {tab === "projects" && (
        projects.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">No projects shared yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-w-3xl">
            {projects.map(p => (
              <ProjectGridItem key={p.id} project={p} onOpen={() => setActiveProject(p)} />
            ))}
          </div>
        )
      )}

      {tab === "github" && (
        <GitHubPanel
          githubUsername={profile.githubUsername}
          githubStats={profile.githubStats}
          githubSyncedAt={profile.githubSyncedAt}
        />
      )}

      {tab === "leetcode" && (
        <LeetCodePanel
          leetcodeUsername={profile.leetcodeUsername}
          leetcodeStats={profile.leetcodeStats}
          leetcodeSyncedAt={profile.leetcodeSyncedAt}
        />
      )}
      </div>

      {activeProject && (
        <ProjectDetailModal
          project={activeProject}
          currentUid={user?.uid}
          onClose={() => setActiveProject(null)}
          onLike={handleProjectLike}
          onStar={handleProjectStar}
          onOpenLive={id => router.push(`/projects/${id}`)}
          onViewProfile={() => router.push(`/profile/${profile.studyverseId}`)}
        />
      )}
    </>
  )
}
