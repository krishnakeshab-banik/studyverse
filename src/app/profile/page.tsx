"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { PageShell } from "@/components/ui/page-shell"
import { ProfileStatsHeader, ProfileTabs, ProjectGridItem, type ProfileTab } from "@/components/social/profile-header"
import { PostCard } from "@/components/social/post-card"
import { ComposePost } from "@/components/social/compose-post"
import { GitHubPanel } from "@/components/social/github-panel"
import { LeetCodePanel } from "@/components/social/leetcode-panel"
import { AccountSyncSettings } from "@/components/social/account-sync-settings"
import { ProjectDetailModal } from "@/components/projects/project-feed"
import { ensureStudyverseId } from "@/backend/social/user-id"
import { unblockUser } from "@/backend/social/blocks"
import { fetchProjectsByStudyverseId, toggleLike, toggleStar } from "@/backend/social/projects"
import { fetchPostsByUid, createPost, togglePostLike, addPostComment } from "@/backend/social/posts"
import type { GitHubStats, LeetCodeStats, SVPost, SVProject } from "@/backend/social/types"
import {
  UserIcon, CheckCircle2, AlertCircle,
  Eye, EyeOff, Save, Pencil, X, Shield, Mail, Phone, GraduationCap,
  ChevronDown, ChevronUp, LogOut, ExternalLink, Camera, Lock, Instagram, Linkedin, type LucideIcon,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { getClientAuth, getClientDb } from "@/backend/db/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateProfile, signOut } from "firebase/auth"

interface ProfileData {
  name: string; college: string
  email: string; emailVerified: boolean
  phone: string; phoneVerified: boolean
  year: string; major: string; bio: string
  instagram: string; linkedin: string
}

const VerifyBadge = ({ verified }: { verified: boolean }) =>
  verified ? (
    <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium shrink-0">
      <CheckCircle2 size={12} /> Verified
    </span>
  ) : (
    <button className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors shrink-0">
      <AlertCircle size={12} /> Verify
    </button>
  )

const Field = ({ label, value, editing, onChange, type = "text", placeholder, icon: Icon, suffix }: {
  label: string; value: string; editing: boolean; onChange: (v: string) => void
  type?: string; placeholder?: string; icon?: LucideIcon; suffix?: React.ReactNode
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
    <div className={cn("flex items-center gap-2", editing
      ? "border border-white/10 bg-white/5 rounded-xl px-3 h-11 focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:border-indigo-500/40 transition-all"
      : "py-0.5")}>
      {Icon && <Icon size={15} className="text-gray-500 shrink-0" />}
      {editing
        ? <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-600 outline-none" />
        : <span className="text-white text-sm">{value || <span className="text-gray-600">Not set</span>}</span>}
      {suffix && <div className="ml-auto">{suffix}</div>}
    </div>
  </div>
)

const Section = ({ title, icon: Icon, children }: { title: string; icon?: LucideIcon; children: React.ReactNode }) => (
  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
    <div className="flex items-center gap-2 mb-5">
      {Icon && <Icon size={15} className="text-indigo-400" />}
      <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
    </div>
    <div className="flex flex-col gap-4">{children}</div>
  </div>
)

const VALID_TABS: ProfileTab[] = ["posts", "projects", "github", "leetcode", "settings"]

function tabFromHash(): ProfileTab | null {
  if (typeof window === "undefined") return null
  const hash = window.location.hash.replace("#", "") as ProfileTab
  return VALID_TABS.includes(hash) ? hash : null
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [tab, setTab] = useState<ProfileTab>("posts")
  const [editing, setEditing] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [pwdVis, setPwdVis] = useState({ current: false, new: false, confirm: false })
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" })
  const [pwdError, setPwdError] = useState("")

  const [profile, setProfile] = useState<ProfileData>({
    name: "Loading...", college: "Loading...",
    email: "loading@email.com", emailVerified: false,
    phone: "", phoneVerified: false,
    year: "", major: "", bio: "",
    instagram: "", linkedin: "",
  })
  const [photoURL, setPhotoURL] = useState<string>("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isPrivate, setIsPrivate] = useState(false)
  const [blockedUsers, setBlockedUsers] = useState<string[]>([])
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState<ProfileData>(profile)
  const [studyverseId, setStudyverseId] = useState("")
  const [copiedId, setCopiedId] = useState(false)
  const [followers, setFollowers] = useState<string[]>([])
  const [following, setFollowing] = useState<string[]>([])
  const [githubUsername, setGithubUsername] = useState<string>()
  const [githubStats, setGithubStats] = useState<GitHubStats>()
  const [githubSyncedAt, setGithubSyncedAt] = useState<number>()
  const [leetcodeUsername, setLeetcodeUsername] = useState<string>()
  const [leetcodeStats, setLeetcodeStats] = useState<LeetCodeStats>()
  const [leetcodeSyncedAt, setLeetcodeSyncedAt] = useState<number>()

  const [posts, setPosts] = useState<SVPost[]>([])
  const [projects, setProjects] = useState<SVProject[]>([])
  const [activeProject, setActiveProject] = useState<SVProject | null>(null)

  const loadSocial = useCallback(async (uid: string, svId: string) => {
    const [userPosts, userProjects] = await Promise.all([
      fetchPostsByUid(uid),
      fetchProjectsByStudyverseId(svId),
    ])
    setPosts(userPosts)
    setProjects(userProjects)
  }, [])

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
    async function loadProfile() {
      if (!user) return
      const id = await ensureStudyverseId(user.uid).catch(() => "")
      if (id) setStudyverseId(id)
      const docRef = doc(getClientDb(), "users", user.uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        const pd: ProfileData = {
          name: (data.name as string) || user.displayName || "User",
          college: (data.college as string) || "",
          email: user.email || (data.email as string) || "",
          emailVerified: user.emailVerified,
          phone: (data.phone as string) || "",
          phoneVerified: !!(data.phoneVerified),
          year: (data.year as string) || "",
          major: (data.major as string) || "",
          bio: (data.bio as string) || "",
          instagram: (data.instagram as string) || "",
          linkedin: (data.linkedin as string) || "",
        }
        setProfile(pd)
        setDraft(pd)
        setPhotoURL((data.photoURL as string) || user.photoURL || "")
        setIsPrivate(!!data.isPrivate)
        setBlockedUsers((data.blockedUsers as string[]) || [])
        setFollowers((data.followers as string[]) || [])
        setFollowing((data.following as string[]) || [])
        setGithubUsername(data.githubUsername as string | undefined)
        setGithubStats(data.githubStats as GitHubStats | undefined)
        setGithubSyncedAt(data.githubSyncedAt as number | undefined)
        setLeetcodeUsername(data.leetcodeUsername as string | undefined)
        setLeetcodeStats(data.leetcodeStats as LeetCodeStats | undefined)
        setLeetcodeSyncedAt(data.leetcodeSyncedAt as number | undefined)
        if (id) await loadSocial(user.uid, id)
        if (!data.college || !data.major || !data.year) setEditing(true)
      }
    }
    loadProfile()
  }, [user, loadSocial])

  const copyUserId = () => {
    if (!studyverseId) return
    navigator.clipboard.writeText(studyverseId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const handleSave = async () => {
    if (!user) return
    try {
      let nextPhoto = photoURL
      if (photoFile) {
        const { uploadAvatar } = await import("@/backend/social/storage-upload")
        nextPhoto = await uploadAvatar(user.uid, photoFile)
        setPhotoURL(nextPhoto)
        setPhotoFile(null)
        setPhotoPreview(null)
      }
      await updateDoc(doc(getClientDb(), "users", user.uid), {
        name: draft.name, college: draft.college, year: draft.year,
        major: draft.major, bio: draft.bio, phone: draft.phone,
        instagram: draft.instagram.trim(), linkedin: draft.linkedin.trim(),
        photoURL: nextPhoto, isPrivate,
      })
      await updateProfile(user, { displayName: draft.name, photoURL: nextPhoto || undefined })
      setProfile(draft)
      setEditing(false)
    } catch (e) {
      console.error(e)
      alert("Failed to save profile")
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleUpdatePassword = async () => {
    setPwdError("")
    if (!user || !user.email) return
    if (passwords.new !== passwords.confirm) {
      setPwdError("New passwords do not match")
      return
    }
    try {
      const credential = EmailAuthProvider.credential(user.email, passwords.current)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, passwords.new)
      alert("Password updated successfully!")
      setPasswords({ current: "", new: "", confirm: "" })
      setShowPwd(false)
    } catch (e: unknown) {
      setPwdError(e instanceof Error ? e.message : "Failed to update password")
    }
  }

  const handleCreatePost = async (input: Parameters<typeof createPost>[4] & { imageFiles?: File[] }) => {
    if (!user || !studyverseId) return
    let imageUrls: string[] | undefined
    if (input.imageFiles?.length) {
      const { uploadPostImages } = await import("@/backend/social/storage-upload")
      imageUrls = await uploadPostImages(user.uid, input.imageFiles)
    }
    const post = await createPost(user.uid, studyverseId, profile.name, user.photoURL || undefined, {
      category: input.category,
      text: input.text,
      imageUrls,
      projectUrl: input.projectUrl,
      leetcodeSlug: input.leetcodeSlug,
    })
    setPosts(prev => [post, ...prev])
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
    }
  }

  const handlePostComment = async (id: string, text: string) => {
    if (!user || !studyverseId) return alert("Sign in to comment")
    try {
      const comment = await addPostComment(id, user.uid, profile.name, studyverseId, text)
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
  }

  const publicProfile = user && studyverseId ? {
    uid: user.uid,
    studyverseId,
    name: profile.name,
    photoURL: photoPreview || photoURL || user.photoURL || undefined,
    college: profile.college,
    bio: profile.bio,
    major: profile.major,
    year: profile.year,
    instagram: profile.instagram || undefined,
    linkedin: profile.linkedin || undefined,
    isPrivate,
    followers,
    following,
    githubUsername,
    githubStats,
    githubSyncedAt,
    leetcodeUsername,
    leetcodeStats,
    leetcodeSyncedAt,
  } : null

  return (
    <PageShell
      title="My Profile"
      subtitle="Your social hub on StudyVerse"
      icon={UserIcon}
      iconAccent="#6366f1"
      action={
        tab === "settings" ? (
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button onClick={() => { setDraft(profile); setEditing(false) }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-400 border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                  <X size={13} /> Cancel
                </button>
                <button onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
                  style={{ background: "linear-gradient(to right,#4f46e5,#7c3aed)", boxShadow: "0 0 16px rgba(99,102,241,0.3)" }}>
                  <Save size={13} /> Save
                </button>
              </>
            ) : (
              <button onClick={() => { setDraft(profile); setEditing(true) }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-300 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all">
                <Pencil size={13} /> Edit Profile
              </button>
            )}
          </div>
        ) : undefined
      }
      noPadding
      contentClassName="p-4 sm:p-6"
    >
      {publicProfile && (
        <ProfileStatsHeader
          profile={publicProfile}
          postCount={posts.length}
          projectCount={projects.length}
          repoCount={githubStats?.publicRepos}
          isFollowing={false}
          isSelf={true}
          onCopyId={copyUserId}
          copied={copiedId}
          action={
            <a href={`/profile/${studyverseId}`}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-indigo-400 border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 inline-flex items-center gap-1.5">
              <ExternalLink size={14} /> Public view
            </a>
          }
        />
      )}

      <ProfileTabs active={tab} onChange={handleTabChange} showSettings />

      <div id="profile-tab-panel" role="tabpanel" className="min-h-[200px]">
      {tab === "posts" && (
        <>
          <ComposePost
            onSubmit={handleCreatePost}
            disabled={!user}
            leetcodeProblems={leetcodeStats?.recentProblems}
          />
          {posts.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">Share your first post above!</div>
          ) : (
            <div className="flex flex-col gap-3 max-w-2xl">
              {posts.map(p => (
                <PostCard key={p.id} post={p} currentUid={user?.uid} onLike={handlePostLike} onComment={handlePostComment} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "projects" && (
        projects.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500 text-sm mb-3">No projects yet.</p>
            <button onClick={() => router.push("/projects")} className="text-indigo-400 text-sm font-semibold hover:text-indigo-300">
              Share a project →
            </button>
          </div>
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
          githubUsername={githubUsername}
          githubStats={githubStats}
          githubSyncedAt={githubSyncedAt}
        />
      )}

      {tab === "leetcode" && (
        <LeetCodePanel
          leetcodeUsername={leetcodeUsername}
          leetcodeStats={leetcodeStats}
          leetcodeSyncedAt={leetcodeSyncedAt}
        />
      )}

      {tab === "settings" && (
        authLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          </div>
        ) : !user ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            Sign in to manage your profile settings.
          </div>
        ) : (
        <div className="max-w-3xl flex flex-col gap-4">
          <Section title="Profile Photo" icon={Camera}>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full border-2 border-white/10 overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 shrink-0">
                {(photoPreview || photoURL) ? (
                  <img src={photoPreview || photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                    {profile.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-indigo-400 border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20"
                >
                  Change photo
                </button>
                <p className="text-xs text-gray-500 mt-2">JPG or PNG. Saved when you click Save.</p>
              </div>
            </div>
          </Section>

          <Section title="Privacy" icon={Lock}>
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-gray-200">Private account</p>
                <p className="text-xs text-gray-500 mt-0.5">Only approved followers can see your posts and projects.</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const next = !isPrivate
                  setIsPrivate(next)
                  if (user) {
                    await updateDoc(doc(getClientDb(), "users", user.uid), { isPrivate: next })
                  }
                }}
                className={cn(
                  "w-12 h-7 rounded-full transition-colors relative shrink-0",
                  isPrivate ? "bg-indigo-600" : "bg-white/10",
                )}
              >
                <span className={cn(
                  "absolute top-1 w-5 h-5 rounded-full bg-white transition-all",
                  isPrivate ? "left-6" : "left-1",
                )} />
              </button>
            </label>
          </Section>

          <Section title="Personal Information" icon={UserIcon}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full Name" value={editing ? draft.name : profile.name} editing={editing} onChange={v => setDraft(d => ({ ...d, name: v }))} placeholder="Your full name" icon={UserIcon} />
              <Field label="University / College" value={editing ? draft.college : profile.college} editing={editing} onChange={v => setDraft(d => ({ ...d, college: v }))} placeholder="Your institution" icon={GraduationCap} />
              <Field label="Year of Study" value={editing ? draft.year : profile.year} editing={editing} onChange={v => setDraft(d => ({ ...d, year: v }))} placeholder="e.g. 3rd Year" />
              <Field label="Field of Study" value={editing ? draft.major : profile.major} editing={editing} onChange={v => setDraft(d => ({ ...d, major: v }))} placeholder="e.g. Computer Science" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Bio</label>
              {editing
                ? <textarea value={draft.bio} onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))} rows={3} maxLength={200} placeholder="Tell others about yourself..."
                    className="border border-white/10 bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none" />
                : <p className="text-white text-sm leading-relaxed">{profile.bio || <span className="text-gray-600">No bio added.</span>}</p>}
            </div>
          </Section>

          <Section title="Social Links" icon={Instagram}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Instagram" value={editing ? draft.instagram : profile.instagram} editing={editing} onChange={v => setDraft(d => ({ ...d, instagram: v }))} placeholder="@username" icon={Instagram} />
              <Field label="LinkedIn" value={editing ? draft.linkedin : profile.linkedin} editing={editing} onChange={v => setDraft(d => ({ ...d, linkedin: v }))} placeholder="username or full URL" icon={Linkedin} />
            </div>
          </Section>

          <Section title="Contact & Verification" icon={Mail}>
            <Field label="Email Address" value={editing ? draft.email : profile.email} editing={editing}
              onChange={v => setDraft(d => ({ ...d, email: v }))} placeholder="your@email.com" icon={Mail}
              suffix={<VerifyBadge verified={profile.emailVerified} />} />
            <Field label="Phone Number" value={editing ? draft.phone : profile.phone} editing={editing}
              onChange={v => setDraft(d => ({ ...d, phone: v }))} placeholder="+91 XXXXX XXXXX" icon={Phone}
              suffix={<VerifyBadge verified={profile.phoneVerified} />} />
          </Section>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
            <button className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/[0.02] transition-colors"
              onClick={() => setShowPwd(v => !v)}>
              <div className="flex items-center gap-2">
                <Shield size={15} className="text-indigo-400" />
                <span className="text-sm font-semibold text-gray-200">Security &amp; Password</span>
              </div>
              {showPwd ? <ChevronUp size={15} className="text-gray-500" /> : <ChevronDown size={15} className="text-gray-500" />}
            </button>
            {showPwd && (
              <div className="px-6 pb-6 flex flex-col gap-4 border-t border-white/[0.06] pt-5">
                {(["current", "new", "confirm"] as const).map((key) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      {key === "current" ? "Current Password" : key === "new" ? "New Password" : "Confirm New Password"}
                    </label>
                    <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-xl px-3 h-11 focus-within:ring-2 focus-within:ring-indigo-500/40 transition-all">
                      <Shield size={15} className="text-gray-500 shrink-0" />
                      <input type={pwdVis[key] ? "text" : "password"} value={passwords[key]}
                        onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))} placeholder="••••••••"
                        className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-600 outline-none" />
                      <button onClick={() => setPwdVis(v => ({ ...v, [key]: !v[key] }))} className="text-gray-500 hover:text-gray-300 transition-colors">
                        {pwdVis[key] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
                {pwdError && <p className="text-red-400 text-xs font-medium">{pwdError}</p>}
                <button onClick={handleUpdatePassword} className="self-start flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white mt-1"
                  style={{ background: "linear-gradient(to right,#4f46e5,#7c3aed)", boxShadow: "0 0 16px rgba(99,102,241,0.25)" }}>
                  <Shield size={13} /> Update Password
                </button>
              </div>
            )}
          </div>

          <Section title="Connected Accounts" icon={Shield}>
            <AccountSyncSettings
              uid={user.uid}
              githubUsername={githubUsername}
              githubStats={githubStats}
              leetcodeUsername={leetcodeUsername}
              leetcodeStats={leetcodeStats}
              onGitHubSynced={(stats, username) => {
                setGithubStats(stats)
                setGithubUsername(username)
                setGithubSyncedAt(Date.now())
              }}
              onLeetCodeSynced={(stats, username) => {
                setLeetcodeStats(stats)
                setLeetcodeUsername(username)
                setLeetcodeSyncedAt(Date.now())
              }}
            />
          </Section>

          {blockedUsers.length > 0 && (
            <Section title="Blocked Users" icon={Shield}>
              <div className="flex flex-col gap-2">
                {blockedUsers.map(uid => (
                  <div key={uid} className="flex items-center justify-between py-2 border-b border-white/[0.06] last:border-0">
                    <span className="text-xs text-gray-500 font-mono">{uid.slice(0, 12)}…</span>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!user) return
                        await unblockUser(user.uid, uid)
                        setBlockedUsers(prev => prev.filter(u => u !== uid))
                      }}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <div className="bg-white/[0.03] border border-red-500/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-200">Sign out of StudyVerse</p>
              <p className="text-xs text-gray-500 mt-0.5">You can always sign back in at any time.</p>
            </div>
            <button
              onClick={async () => { await signOut(getClientAuth()); router.push("/") }}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-all shrink-0 self-start sm:self-auto"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
        )
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
          onViewProfile={() => {}}
        />
      )}
    </PageShell>
  )
}
