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
  toggleFollow, toggleLike, toggleStar,
} from "@/backend/social/projects"
import {
  fetchPostsByStudyverseId, togglePostLike,
} from "@/backend/social/posts"
import type { SVPost, SVProject, UserPublicProfile } from "@/backend/social/types"
import { User, ArrowLeft } from "lucide-react"

interface PublicProfileViewProps {
  studyverseId: string
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
    } catch (e) {
      console.error(e)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [studyverseId])

  useEffect(() => { load() }, [load])

  const isSelf = user?.uid === profile?.uid
  const isFollowing = profile ? (user ? profile.followers.includes(user.uid) : false) : false

  const handleFollow = async () => {
    if (!user || !profile) return alert("Sign in to follow")
    if (profile.uid.startsWith("seed-")) return alert("Demo account")
    const nowFollowing = await toggleFollow(user.uid, profile.uid)
    setProfile(prev => prev ? {
      ...prev,
      followers: nowFollowing
        ? [...prev.followers, user.uid]
        : prev.followers.filter(u => u !== user.uid),
    } : null)
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
    await togglePostLike(id, user.uid)
  }

  const handleProjectLike = async (id: string) => {
    if (!user) return
    const p = projects.find(x => x.id === id)
    if (!p) return
    const liked = p.likedBy.includes(user.uid)
    setProjects(prev => prev.map(x => x.id === id ? {
      ...x,
      likedBy: liked ? x.likedBy.filter(u => u !== user.uid) : [...x.likedBy, user.uid],
      likes: liked ? x.likes - 1 : x.likes + 1,
    } : x))
    await toggleLike(id, user.uid)
    if (activeProject?.id === id) {
      setActiveProject(prev => prev ? {
        ...prev,
        likedBy: liked ? prev.likedBy.filter(u => u !== user.uid) : [...prev.likedBy, user.uid],
        likes: liked ? prev.likes - 1 : prev.likes + 1,
      } : null)
    }
  }

  const handleProjectStar = async (id: string) => {
    if (!user) return
    const p = projects.find(x => x.id === id)
    if (!p) return
    const starred = p.starredBy.includes(user.uid)
    setProjects(prev => prev.map(x => x.id === id ? {
      ...x,
      starredBy: starred ? x.starredBy.filter(u => u !== user.uid) : [...x.starredBy, user.uid],
      stars: starred ? x.stars - 1 : x.stars + 1,
    } : x))
    await toggleStar(id, user.uid)
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
        isSelf={isSelf}
        onFollow={handleFollow}
        onCopyId={copyUserId}
        copied={copiedId}
        action={isSelf ? (
          <button
            onClick={() => router.push("/profile")}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-300 border border-white/10 bg-white/5 hover:bg-white/10"
          >
            Edit profile
          </button>
        ) : undefined}
      />

      <ProfileTabs active={tab} onChange={setTab} />

      {tab === "posts" && (
        posts.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">No posts yet.</div>
        ) : (
          <div className="flex flex-col gap-3 max-w-2xl">
            {posts.map(p => (
              <PostCard key={p.id} post={p} currentUid={user?.uid} onLike={handlePostLike} />
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

      {activeProject && (
        <ProjectDetailModal
          project={activeProject}
          currentUid={user?.uid}
          onClose={() => setActiveProject(null)}
          onLike={handleProjectLike}
          onStar={handleProjectStar}
          onOpenLive={id => router.push(`/projects/${id}`)}
          onViewProfile={() => {}}
        />
      )}
    </>
  )
}
