"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { PageShell, StatCard } from "@/components/ui/page-shell"
import { ProjectFeedCard, ProjectDetailModal } from "@/components/projects/project-feed"
import { ProjectMatcher } from "@/components/projects/project-matcher"
import { useAuth } from "@/context/AuthContext"
import { doc, getDoc } from "firebase/firestore"
import { getClientDb } from "@/backend/db/firebase"
import { ensureStudyverseId } from "@/backend/social/user-id"
import {
  fetchAllProjects, fetchUserByStudyverseId,
  createProject, toggleLike, toggleStar, addComment,
} from "@/backend/social/projects"
import type { SVProject } from "@/backend/social/types"
import {
  Search, Plus, ArrowLeft, FolderGit2, Heart, Star, Users, User,
} from "lucide-react"

type FeedTab = "Explore" | "Following" | "Mine"

export default function ProjectsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [projects, setProjects] = useState<SVProject[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FeedTab>("Explore")
  const [search, setSearch] = useState("")
  const [searchError, setSearchError] = useState<string | null>(null)

  const [myStudyverseId, setMyStudyverseId] = useState<string>("")
  const [myName, setMyName] = useState("You")
  const [myPhoto, setMyPhoto] = useState<string | undefined>()
  const [myFollowing, setMyFollowing] = useState<string[]>([])

  const [activeProject, setActiveProject] = useState<SVProject | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [fTitle, setFTitle] = useState("")
  const [fDesc, setFDesc] = useState("")
  const [fGit, setFGit] = useState("")
  const [fDeploy, setFDeploy] = useState("")
  const [uploading, setUploading] = useState(false)

  const reloadProjects = useCallback(async () => {
    try {
      const all = await fetchAllProjects()
      setProjects(all)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reloadProjects() }, [reloadProjects])

  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const id = await ensureStudyverseId(user.uid)
        setMyStudyverseId(id)
        const snap = await getDoc(doc(getClientDb(), "users", user.uid))
        if (snap.exists()) {
          const d = snap.data()
          setMyName((d.name as string) || user.displayName || "You")
          setMyPhoto((d.photoURL as string) || user.photoURL || undefined)
          setMyFollowing((d.following as string[]) || [])
        }
      } catch (e) {
        console.error(e)
      }
    })()
  }, [user])

  const refreshProject = (id: string, patch: Partial<SVProject>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
    if (activeProject?.id === id) setActiveProject(p => p ? { ...p, ...patch } : null)
  }

  const handleSearchUser = async () => {
    const q = search.trim().toUpperCase()
    if (!q) return
    setSearchError(null)
    if (!q.startsWith("U-")) {
      setSearchError("Enter a User ID like U-110")
      return
    }
    const profile = await fetchUserByStudyverseId(q)
    if (!profile) {
      setSearchError("No account found with that User ID")
      return
    }
    router.push(`/profile/${q}`)
  }

  const openProfileByStudyverseId = (studyverseId: string) => {
    router.push(`/profile/${studyverseId}`)
  }

  const handleLike = async (id: string) => {
    if (!user) return alert("Sign in to like projects")
    const p = projects.find(x => x.id === id)
    if (!p) return
    const liked = p.likedBy.includes(user.uid)
    refreshProject(id, {
      likedBy: liked ? p.likedBy.filter(u => u !== user.uid) : [...p.likedBy, user.uid],
      likes: liked ? p.likes - 1 : p.likes + 1,
    })
    await toggleLike(id, user.uid)
    await reloadProjects()
  }

  const handleStar = async (id: string) => {
    if (!user) return alert("Sign in to star projects")
    const p = projects.find(x => x.id === id)
    if (!p) return
    const starred = p.starredBy.includes(user.uid)
    refreshProject(id, {
      starredBy: starred ? p.starredBy.filter(u => u !== user.uid) : [...p.starredBy, user.uid],
      stars: starred ? p.stars - 1 : p.stars + 1,
    })
    await toggleStar(id, user.uid)
    await reloadProjects()
  }

  const handleComment = async (id: string, text: string) => {
    if (!user || !myStudyverseId) return alert("Sign in to comment")
    const comment = await addComment(id, user.uid, myName, myStudyverseId, text)
    const p = projects.find(x => x.id === id)
    if (p) refreshProject(id, { comments: [...p.comments, comment] })
    await reloadProjects()
  }

  const handleUpload = async () => {
    if (!user || !myStudyverseId) return alert("Sign in to upload projects")
    if (!fTitle.trim() || !fDeploy.trim() || !fDesc.trim()) return alert("Title, description, and deployed URL are required")
    setUploading(true)
    try {
      await createProject(user.uid, myStudyverseId, myName, myPhoto, {
        title: fTitle, description: fDesc, deployedUrl: fDeploy, github: fGit,
      })
      setShowForm(false)
      setFTitle(""); setFDesc(""); setFGit(""); setFDeploy("")
      setActiveTab("Mine")
      await reloadProjects()
    } finally {
      setUploading(false)
    }
  }

  let displayed = projects

  if (activeTab === "Mine" && myStudyverseId) {
    displayed = projects.filter(p => p.studyverseId === myStudyverseId)
  } else if (activeTab === "Following" && user) {
    displayed = projects.filter(p => myFollowing.includes(p.ownerUid))
  } else if (search && !search.startsWith("U-")) {
    displayed = projects.filter(p =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.studyverseId.toLowerCase().includes(search.toLowerCase()),
    )
  }

  if (activeTab === "Explore") {
    displayed = [...displayed].sort((a, b) => b.likes + b.stars - (a.likes + a.stars))
  } else {
    displayed = [...displayed].sort((a, b) => b.timestamp - a.timestamp)
  }

  const totalLikes = projects.reduce((a, p) => a + p.likes, 0)
  const totalStars = projects.reduce((a, p) => a + p.stars, 0)
  const myProjectCount = myStudyverseId ? projects.filter(p => p.studyverseId === myStudyverseId).length : 0

  return (
    <PageShell
      title="Project Social"
      subtitle="Discover builders, follow creators, and showcase your work — Instagram for projects"
      icon={FolderGit2}
      iconAccent="#6366f1"
      action={
        !showForm ? (
          <button
            onClick={() => user ? setShowForm(true) : alert("Sign in to upload a project")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Plus size={16} /> Share Project
          </button>
        ) : undefined
      }
      stats={
        !showForm ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={FolderGit2} label="Projects" value={projects.length} accent="#6366f1" />
            <StatCard icon={Heart} label="Total likes" value={totalLikes} accent="#f43f5e" />
            <StatCard icon={Star} label="Total stars" value={totalStars} accent="#f59e0b" />
            <StatCard icon={User} label={myStudyverseId ? "Your ID" : "My projects"} value={myStudyverseId || myProjectCount} accent="#10b981" />
          </div>
        ) : undefined
      }
      toolbar={
        !showForm ? (
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
              {(["Explore", "Following", "Mine"] as FeedTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                    activeTab === tab ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-gray-500 hover:text-gray-300",
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setSearchError(null) }}
                  onKeyDown={e => e.key === "Enter" && handleSearchUser()}
                  placeholder="Search User ID (e.g. U-110)..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <button
                onClick={handleSearchUser}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 shrink-0"
              >
                Find
              </button>
            </div>
          </div>
        ) : undefined
      }
      noPadding
      contentClassName="p-4 sm:p-6"
    >
      {searchError && (
        <p className="text-red-400 text-sm mb-4 font-medium">{searchError}</p>
      )}

      {!showForm && !loading && !authLoading && (
        <ProjectMatcher projects={projects} onOpenProject={setActiveProject} />
      )}

      {showForm ? (
        <div className="max-w-2xl mx-auto w-full">
          <button onClick={() => setShowForm(false)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm font-bold">
            <ArrowLeft size={16} /> Back to feed
          </button>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white mb-2">Share a new project</h2>
            <p className="text-gray-500 text-sm mb-6">Posted as <span className="text-indigo-400 font-bold">{myStudyverseId || "..."}</span></p>
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Title</label>
                <input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="My awesome project"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Description</label>
                <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="What did you build?" rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50 resize-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Live URL</label>
                  <input value={fDeploy} onChange={e => setFDeploy(e.target.value)} placeholder="https://..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">GitHub (optional)</label>
                  <input value={fGit} onChange={e => setFGit(e.target.value)} placeholder="https://github.com/..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/[0.06]">
              <button onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-bold hover:bg-white/5">Cancel</button>
              <button onClick={handleUpload} disabled={uploading} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 flex items-center gap-2 disabled:opacity-50">
                <Plus size={16} /> {uploading ? "Uploading..." : "Publish"}
              </button>
            </div>
          </div>
        </div>
      ) : loading || authLoading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-20 flex flex-col items-center text-center gap-3">
          <Users size={40} className="text-gray-700" />
          <p className="text-gray-400 font-bold">
            {activeTab === "Following" ? "Follow creators to see their projects here." : "No projects found."}
          </p>
          {activeTab === "Mine" && (
            <button onClick={() => setShowForm(true)} className="text-indigo-400 text-sm font-semibold hover:text-indigo-300">
              Share your first project →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {displayed.map(p => (
            <ProjectFeedCard
              key={p.id}
              project={p}
              currentUid={user?.uid}
              onLike={handleLike}
              onStar={handleStar}
              onOpen={setActiveProject}
              onViewProfile={openProfileByStudyverseId}
              onComment={handleComment}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {activeProject && (
          <ProjectDetailModal
            project={activeProject}
            currentUid={user?.uid}
            onClose={() => setActiveProject(null)}
            onLike={handleLike}
            onStar={handleStar}
            onOpenLive={id => router.push(`/projects/${id}`)}
            onViewProfile={id => { setActiveProject(null); openProfileByStudyverseId(id) }}
          />
        )}
      </AnimatePresence>
    </PageShell>
  )
}
