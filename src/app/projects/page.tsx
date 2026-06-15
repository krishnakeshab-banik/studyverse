"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar"
import { GradientDots } from "@/components/ui/gradient-dots"
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid"
import {
  BookOpen, Brain, ShoppingBag, CalendarDays, MessageSquare, Activity, FolderGit2,
  LogOut, User, Search, Plus, ExternalLink, Github, ThumbsUp, ThumbsDown, ArrowLeft, X, LayoutGrid
} from "lucide-react"

import {
  IconArrowWaveRightUp,
  IconBoxAlignRightFilled,
  IconBoxAlignTopLeft,
  IconClipboardCopy,
  IconFileBroken,
  IconSignature,
  IconTableColumn,
} from "@tabler/icons-react"

// ─── Types and Mock Data ──────────────────────────────────────────
interface SVProject {
  id: string
  userId: string
  authorName: string
  title: string
  description: string
  github: string
  deployedUrl: string
  likes: number
  dislikes: number
  isMine: boolean
  timestamp: number
  iconType: number
}

const MOCK_PROJECTS: SVProject[] = [
  { id: "P-8X92B", userId: "U-110", authorName: "Alice M.", title: "The Dawn of Innovation", description: "Explore the birth of groundbreaking ideas and inventions via an interactive timeline.", github: "https://github.com", deployedUrl: "https://en.wikipedia.org/wiki/Main_Page", likes: 120, dislikes: 2, isMine: false, timestamp: Date.now() - 100000, iconType: 0 },
  { id: "P-4C19A", userId: "U-842", authorName: "Devin J.", title: "The Digital Revolution", description: "Dive into the transformative power of modern decentralized web protocols.", github: "", deployedUrl: "https://nextjs.org", likes: 89, dislikes: 5, isMine: false, timestamp: Date.now() - 200000, iconType: 1 },
  { id: "P-7T66K", userId: "U-555", authorName: "Sarah K.", title: "The Art of Design", description: "An interactive portfolio built explicitly for brutalist typography models.", github: "https://github.com", deployedUrl: "https://ui.shadcn.com", likes: 310, dislikes: 1, isMine: false, timestamp: Date.now() - 300000, iconType: 2 },
  { id: "P-2F80Z", userId: "U-110", authorName: "Alice M.", title: "CodeSandbox Clone", description: "An experimental localized sandbox for React environments.", github: "https://github.com", deployedUrl: "https://react.dev", likes: 45, dislikes: 0, isMine: false, timestamp: Date.now() - 400000, iconType: 3 },
  { id: "P-9L11Y", userId: "U-990", authorName: "Marcus T.", title: "NextJS Analytics Hub", description: "Realtime tracking dashboard with Vercel bindings.", github: "https://github.com", deployedUrl: "https://vercel.com", likes: 215, dislikes: 10, isMine: false, timestamp: Date.now() - 500000, iconType: 4 },
]

const ICONS = [
  <IconClipboardCopy className="h-4 w-4 text-indigo-400" />,
  <IconFileBroken className="h-4 w-4 text-emerald-400" />,
  <IconSignature className="h-4 w-4 text-rose-400" />,
  <IconTableColumn className="h-4 w-4 text-amber-400" />,
  <IconArrowWaveRightUp className="h-4 w-4 text-cyan-400" />,
  <IconBoxAlignTopLeft className="h-4 w-4 text-violet-400" />,
  <IconBoxAlignRightFilled className="h-4 w-4 text-orange-400" />
]

const Skeleton = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-white/5 opacity-50"></div>
)

// ─── Sidebar Helpers ────────────────────────────────────────
const navLinks = [
  { label: "Library",       href: "/library",     icon: <BookOpen      size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Virtual Study", href: "/study",       icon: <Brain         size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Marketplace",   href: "/marketplace", icon: <ShoppingBag   size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Calendar",      href: "/calendar",    icon: <CalendarDays  size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Projects",      href: "/projects",    icon: <FolderGit2    size={24} className="text-indigo-400 flex-shrink-0" /> },
  { label: "Post Doubts",   href: "/doubts",      icon: <MessageSquare size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Analytics",     href: "/analytics",   icon: <Activity      size={24} className="text-neutral-400 flex-shrink-0" /> },
]

export default function ProjectsPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const [projects, setProjects] = useState<SVProject[]>([])
  const [activeTab, setActiveTab] = useState<"Browse" | "Mine">("Browse")
  const [search, setSearch] = useState("")

  const [activeProject, setActiveProject] = useState<SVProject | null>(null)
  const [profileView, setProfileView] = useState<string | null>(null) // Stores UserID if viewing a profile
  
  const [showForm, setShowForm] = useState(false)
  const [fTitle, setFTitle] = useState("")
  const [fDesc, setFDesc] = useState("")
  const [fGit, setFGit] = useState("")
  const [fDeploy, setFDeploy] = useState("")

  useEffect(() => {
    const stored = localStorage.getItem("studyverse_projects_v1")
    if (stored) setProjects(JSON.parse(stored))
    else setProjects(MOCK_PROJECTS)
  }, [])

  const persist = (data: SVProject[]) => {
    localStorage.setItem("studyverse_projects_v1", JSON.stringify(data))
    setProjects(data)
  }

  const handleUpload = () => {
    if (!fTitle.trim() || !fDeploy.trim() || !fDesc.trim()) return alert("Title, Description, and Deployed URL are required!")
    const newP: SVProject = {
      id: "P-" + Math.random().toString(36).substr(2, 5).toUpperCase(),
      userId: "U-YOU", authorName: "You",
      title: fTitle.trim(), description: fDesc.trim(),
      github: fGit.trim(), deployedUrl: fDeploy.trim(),
      likes: 0, dislikes: 0, isMine: true,
      timestamp: Date.now(),
      iconType: Math.floor(Math.random() * ICONS.length)
    }
    persist([newP, ...projects])
    setShowForm(false)
    setActiveTab("Mine")
    setFTitle(""); setFDesc(""); setFGit(""); setFDeploy("")
  }

  const handleReaction = (id: string, type: "like"|"dislike") => {
    const nr = projects.map(p => {
      if (p.id === id) {
        if (type === "like") return { ...p, likes: p.likes + 1 }
        return { ...p, dislikes: p.dislikes + 1 }
      }
      return p
    })
    persist(nr)
    if (activeProject?.id === id) setActiveProject(nr.find(p => p.id === id) || null)
  }

  const openProjectWindow = (id: string) => {
    router.push(`/projects/${id}`)
  }

  let displayed = projects
  if (activeTab === "Mine") {
    displayed = displayed.filter(p => p.isMine)
  }
  if (profileView) {
    displayed = projects.filter(p => p.userId === profileView)
  }
  if (search) {
    displayed = displayed.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.userId.toLowerCase().includes(search.toLowerCase()))
  }

  // Sort by latest for mine, likes for browse
  if (activeTab === "Browse" && !profileView) displayed.sort((a,b) => b.likes - a.likes)
  else displayed.sort((a,b) => b.timestamp - a.timestamp)

  return (
    <div className="flex h-screen w-full bg-[#080808] overflow-hidden font-sans">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-10" style={{ background: "#0d0d0d", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <Link href="/" className="flex items-center gap-3 py-1 z-20">
               <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 0 16px rgba(99,102,241,0.4)" }}>
                 <BookOpen size={20} className="text-white" />
               </div>
               <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-white text-lg tracking-tight whitespace-pre">StudyVerse</motion.span>
            </Link>
            <div className="mt-8 flex flex-col gap-0.5">
               {navLinks.map((link, i) => <SidebarLink key={i} link={link} className="hover:bg-white/5 rounded-lg px-2 transition-colors py-3" />)}
            </div>
          </div>
          <div className="flex flex-col gap-0.5 pb-2">
             <div className="border-t border-white/[0.06] mb-2" />
             <SidebarLink link={{ label: "Profile", href: "/profile",
               icon: <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}><User size={16} /></div>
             }} className="bg-white/[0.06] rounded-lg px-2" />
             <SidebarLink link={{ label: "Logout", href: "/", icon: <LogOut size={22} className="text-red-400 flex-shrink-0 ml-0.5" /> }} className="hover:bg-red-500/10 rounded-lg px-2 transition-colors" />
           </div>
        </SidebarBody>
      </Sidebar>

      <main className="flex-1 overflow-hidden flex flex-col relative z-0">
        <div className="px-6 pt-6 shrink-0 relative z-10 w-full mb-6 relative">
           
           <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent relative top-1">Community Projects</h1>
                <p className="text-gray-500 text-sm mt-1">Discover what the universe is building.</p>
              </div>
              {!showForm && !profileView && (
                <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all">
                  <Plus size={16} /> Upload Project
                </button>
              )}
           </div>

           {!showForm && !profileView && (
             <div className="flex gap-4 border-b border-white/10 mt-6 mt-6">
                {(["Browse", "Mine"] as const).map(tab => (
                  <button key={tab} onClick={() => { setActiveTab(tab); setActiveProject(null) }}
                     className={cn("pb-3 text-sm font-bold transition-all relative border-b-2",
                        activeTab === tab ? "text-indigo-400 border-indigo-500" : "text-gray-500 border-transparent hover:text-gray-300"
                     )}>
                     {tab === "Mine" ? "My Projects" : "Spotlight"}
                  </button>
                ))}
             </div>
           )}
        </div>

        <div className="flex-1 px-6 pb-6 relative z-10 w-full overflow-y-auto">
           {showForm ? (
             <div className="max-w-2xl mx-auto w-full flex flex-col mt-4">
                <button onClick={() => setShowForm(false)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 self-start text-sm font-bold">
                   <ArrowLeft size={16} /> Back to Projects
                </button>
                <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl">
                   <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">Launch a new Project</h2>
                   
                   <div className="flex flex-col gap-6">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Project Title</label>
                        <input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="e.g. Next.js Developer Portfolio"
                          className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/50 transition-all" />
                      </div>
                      
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Description</label>
                        <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Summarize your project..." rows={3}
                          className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/50 resize-none transition-all" />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         <div>
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Deployed URL (Mandatory)</label>
                           <input value={fDeploy} onChange={e => setFDeploy(e.target.value)} placeholder="https://..."
                             className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/50 transition-all" />
                         </div>
                         <div>
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block flex gap-2">GitHub Repo <span className="text-indigo-400/50 lowercase">(optional)</span></label>
                           <input value={fGit} onChange={e => setFGit(e.target.value)} placeholder="https://github.com/..."
                             className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/50 transition-all" />
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/[0.06]">
                     <button onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-bold hover:bg-white/5 transition-colors">Cancel</button>
                     <button onClick={handleUpload} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"><Plus size={16} /> Upload</button>
                   </div>
                </div>
             </div>
             
           ) : profileView ? (
             
             <div className="max-w-6xl mx-auto w-full flex flex-col mt-4">
                <button onClick={() => setProfileView(null)} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors mb-6 self-start text-sm font-bold">
                   <ArrowLeft size={16} /> Back to Spotlight
                </button>
                
                <div className="flex items-center gap-4 mb-8 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-xl">
                   <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center border-2 border-[#1a1a1a] shadow-lg">
                      <User size={24} className="text-white" />
                   </div>
                   <div>
                     <h2 className="text-2xl font-bold text-white mb-1">{displayed[0]?.authorName || "User"}</h2>
                     <p className="text-indigo-400 text-sm font-bold tracking-widest uppercase">ID: {profileView}</p>
                   </div>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><LayoutGrid size={18} className="text-gray-400" /> Projects Portfolio</h3>
                
                <BentoGrid className="max-w-6xl mx-auto w-full">
                  {displayed.map((item, i) => (
                    <BentoGridItem key={item.id} title={item.title} description={item.description}
                      header={<div className="absolute inset-0 w-full h-full overflow-hidden"><iframe src={item.deployedUrl} title={item.title} className="absolute top-0 left-0 w-[200%] h-[200%] origin-top-left scale-50 border-none pointer-events-none grayscale group-hover/bento:grayscale-0 transition-all duration-500 opacity-60 group-hover/bento:opacity-90" /></div>}
                      icon={ICONS[item.iconType % ICONS.length]}
                      onClick={() => setActiveProject(item)}
                      className={i === 3 || i === 6 ? "md:col-span-2" : ""}
                    />
                  ))}
                </BentoGrid>
             </div>
             
           ) : (
             
             <div className="max-w-6xl mx-auto w-full">
                {activeTab === "Browse" && (
                   <div className="mb-8 relative w-full max-w-lg mt-2">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Project Title or User ID (e.g. U-110)..."
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all shadow-inner" />
                   </div>
                )}
                
                {displayed.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center">
                    <FolderGit2 size={40} className="text-gray-700 mb-3" />
                    <p className="text-gray-400 font-bold mb-1">No projects found.</p>
                  </div>
                ) : (
                  <BentoGrid className="max-w-6xl mx-auto w-full">
                    {displayed.map((item, i) => (
                      <BentoGridItem key={item.id} title={item.title} description={item.description}
                        header={<div className="absolute inset-0 w-full h-full overflow-hidden"><iframe src={item.deployedUrl} title={item.title} className="absolute top-0 left-0 w-[200%] h-[200%] origin-top-left scale-50 border-none pointer-events-none grayscale group-hover/bento:grayscale-0 transition-all duration-500 opacity-60 group-hover/bento:opacity-90" /></div>}
                        icon={ICONS[item.iconType % ICONS.length]}
                        onClick={() => setActiveProject(item)}
                        className={i === 3 || i === 6 ? "md:col-span-2" : ""}
                      />
                    ))}
                  </BentoGrid>
                )}
             </div>
             
           )}

           {/* ── PROJECT MODAL ── */}
           <AnimatePresence>
             {activeProject && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}>
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="w-full max-w-2xl bg-[#0c0c0c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                     
                     <div className="h-56 relative bg-gradient-to-b from-transparent to-[#0c0c0c] flex items-end">
                        <iframe src={activeProject.deployedUrl} className="absolute inset-0 w-full h-full border-none pointer-events-none opacity-30 z-0 grayscale mask-image-gradient" />
                        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0c0c0c] via-transparent to-transparent" />
                        <button onClick={() => setActiveProject(null)} className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white backdrop-blur-md transition-colors"><X size={16} /></button>
                        
                        <div className="relative z-10 px-8 pb-6 w-full flex items-end justify-between">
                           <div>
                             <div className="flex items-center gap-2 mb-3">
                               <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 flex items-center gap-1.5">{activeProject.id}</span>
                               <button onClick={() => { setActiveProject(null); setProfileView(activeProject.userId); }} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-white transition-colors bg-white/5 border border-white/5 py-1 px-2 rounded cursor-pointer">By {activeProject.authorName}</button>
                             </div>
                             <h2 className="text-3xl font-bold text-white leading-snug">{activeProject.title}</h2>
                           </div>
                           <div className="flex items-center gap-2 pb-1 shrink-0">
                              <button onClick={() => handleReaction(activeProject.id, "like")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-xs font-bold">
                                <ThumbsUp size={14} /> {activeProject.likes}
                              </button>
                              <button onClick={() => handleReaction(activeProject.id, "dislike")} className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors">
                                <ThumbsDown size={14} />
                              </button>
                           </div>
                        </div>
                     </div>
                     
                     <div className="p-8 bg-[#0a0a0a] flex-1">
                        <p className="text-gray-300 text-sm leading-relaxed mb-10">{activeProject.description}</p>
                        
                        <div className="flex items-center gap-4 border-t border-white/[0.06] pt-6 w-full">
                           <button onClick={() => openProjectWindow(activeProject.id)} className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all text-sm">
                             <ExternalLink size={16} /> View Project Live
                           </button>
                           {activeProject.github && (
                             <a href={activeProject.github} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all text-sm">
                               <Github size={16} /> Repository
                             </a>
                           )}
                        </div>
                     </div>
                  </motion.div>
               </div>
             )}
           </AnimatePresence>

        </div>
      </main>
    </div>
  )
}
