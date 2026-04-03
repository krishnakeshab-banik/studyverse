"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar"
import { BookOpen, Brain, ShoppingBag, CalendarDays, MessageSquare, Activity, FolderGit2, LogOut, User, ArrowLeft, ExternalLink, ShieldAlert } from "lucide-react"

const navLinks = [
  { label: "Library",       href: "/library",     icon: <BookOpen      size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Virtual Study", href: "/study",       icon: <Brain         size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Marketplace",   href: "/marketplace", icon: <ShoppingBag   size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Calendar",      href: "/calendar",    icon: <CalendarDays  size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Projects",      href: "/projects",    icon: <FolderGit2    size={24} className="text-indigo-400 flex-shrink-0" /> },
  { label: "Post Doubts",   href: "/doubts",      icon: <MessageSquare size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Analytics",     href: "/analytics",   icon: <Activity      size={24} className="text-neutral-400 flex-shrink-0" /> },
]

export default function RenderProjectIframe() {
  const router = useRouter()
  const { id } = useParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const [project, setProject] = useState<any>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    // Note: React 19 / Next.js 15 unpacks params natively, but for safety parse them string directly
    const pid = typeof id === "string" ? id : (Array.isArray(id) ? id[0] : null)
    
    if (!pid) return setError(true)
    
    const stored = localStorage.getItem("studyverse_projects_v1")
    if (stored) {
       const parsed = JSON.parse(stored)
       const p = parsed.find((x: any) => x.id === pid)
       if (p) setProject(p)
       else setError(true)
    } else {
       // Check mock data fallback if user navigated straight here without browsing
       // Doing a hardcoded check for the mocked items just in case
       const P1 = { id: "P-8X92B", deployedUrl: "https://en.wikipedia.org/wiki/Main_Page", title: "The Dawn of Innovation" }
       if (pid === P1.id) setProject(P1)
       else setError(true)
    }
  }, [id])

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
         {/* Top Navigation Bar */}
         <div className="w-full h-16 bg-[#0c0c0c] border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-20 shadow-xl">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push("/projects")} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors border border-white/10">
                 <ArrowLeft size={16} />
              </button>
              <h2 className="text-white font-bold tracking-wide flex items-center gap-2">
                 <span className="text-indigo-400">Deploy Viewer</span> <span className="text-gray-600">/</span> {project?.title || "Loading..."}
              </h2>
            </div>
            
            {project && (
              <a href={project.deployedUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-500/20">
                 Open Externally <ExternalLink size={14} />
              </a>
            )}
         </div>

         {/* Render Space */}
         <div className="flex-1 bg-black relative">
            {error ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <ShieldAlert size={48} className="text-red-500 mb-4" />
                  <h1 className="text-2xl font-bold text-white mb-2">Project Sandbox Error</h1>
                  <p className="text-gray-400">The requested link either restricts iframe nesting or the ID was not found.</p>
                  <button onClick={() => router.push("/projects")} className="mt-8 px-6 py-2 bg-white/10 text-white font-bold rounded-xl border border-white/10">Return to Directory</button>
               </div>
            ) : project ? (
               <iframe src={project.deployedUrl} className="w-full h-full border-none shadow-inner" style={{ background: "white" }} allow="fullscreen" />
            ) : (
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
               </div>
            )}
         </div>
      </main>
    </div>
  )
}
