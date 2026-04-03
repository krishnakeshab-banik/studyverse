"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar"
import { GradientDots } from "@/components/ui/gradient-dots"
import {
  BookOpen, Brain, ShoppingBag, CalendarDays, MessageSquare, LogOut, User,
  Activity, ExternalLink, RefreshCw, AlertTriangle, CheckCircle2, Monitor, Map, FolderGit2
} from "lucide-react"

// ─── Sidebar Helpers ────────────────────────────────────────
const navLinks = [
  { label: "Library",       href: "/library",     icon: <BookOpen      size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Virtual Study", href: "/study",       icon: <Brain         size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Marketplace",   href: "/marketplace", icon: <ShoppingBag   size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Calendar",      href: "/calendar",    icon: <CalendarDays  size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Projects",      href: "/projects",    icon: <FolderGit2    size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Post Doubts",   href: "/doubts",      icon: <MessageSquare size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Analytics",     href: "/analytics",   icon: <Activity      size={24} className="text-indigo-400 flex-shrink-0" /> },
]

const PROD_DOMAINS = ["github.com", "stackoverflow.com", "wikipedia.org", "localhost", "127.0.0.1", "khanacademy.org", "coursera.org", "docs.google.com"]
const DIST_DOMAINS = ["youtube.com", "facebook.com", "instagram.com", "twitter.com", "reddit.com", "tiktok.com", "netflix.com", "twitch.tv", "discord.com"]

export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [extInstalled, setExtInstalled] = useState(false)
  const [data, setData] = useState<Record<string, number> | null>(null)
  const [loading, setLoading] = useState(true)

  const requestData = () => {
    setLoading(true)
    window.postMessage({ type: "STUDYVERSE_REQ_DATA" }, "*")
    setTimeout(() => setLoading(false), 2000) // Fallback if no response
  }

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== window) return
      if (e.data?.type === "STUDYVERSE_EXT_INSTALLED") {
        setExtInstalled(true)
        window.postMessage({ type: "STUDYVERSE_REQ_DATA" }, "*")
      }
      if (e.data?.type === "STUDYVERSE_RES_DATA") {
        setExtInstalled(true)
        setData(e.data.data)
        setLoading(false)
      }
    }
    window.addEventListener("message", onMsg)
    
    // Initial ping
    requestData()
    // Periodic refresh
    const int = setInterval(requestData, 10000)
    
    return () => {
      window.removeEventListener("message", onMsg)
      clearInterval(int)
    }
  }, [])

  // ─── Analytics Computations ───
  let totalTime = 0
  let prodTime = 0
  let distTime = 0
  let uncatTime = 0
  const sortedDomains: { domain: string; ms: number }[] = []

  if (data) {
    Object.entries(data).forEach(([domain, ms]) => {
      totalTime += ms
      if (PROD_DOMAINS.some(d => domain.includes(d))) prodTime += ms
      else if (DIST_DOMAINS.some(d => domain.includes(d))) distTime += ms
      else uncatTime += ms
      
      sortedDomains.push({ domain, ms })
    })
    sortedDomains.sort((a,b) => b.ms - a.ms)
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return "0s"
    const secs = Math.floor(ms / 1000)
    if (secs < 60) return `${secs}s`
    const mins = Math.floor(secs / 60)
    if (mins < 60) return `${mins}m ${secs % 60}s`
    const hrs = Math.floor(mins / 60)
    return `${hrs}h ${mins % 60}m`
  }

  const getCatColor = (domain: string) => {
    if (PROD_DOMAINS.some(d => domain.includes(d))) return "bg-emerald-500"
    if (DIST_DOMAINS.some(d => domain.includes(d))) return "bg-rose-500"
    return "bg-indigo-500" // Uncategorized
  }

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
        <div className="px-6 pt-6 shrink-0 relative z-10 w-full mb-8">
           <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent relative top-1">Analytics Tracker</h1>
                <p className="text-gray-500 text-sm mt-1">Monitor web usage to control distractions during StudyVerse workflows.</p>
              </div>
              {extInstalled && (
                <button onClick={requestData} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
              )}
           </div>
        </div>

        <div className="flex-1 px-6 pb-6 relative z-10 w-full overflow-y-auto">
           
           {!extInstalled ? (
             <div className="max-w-3xl mx-auto flex flex-col gap-8">
               <div className="bg-[#0a0a0a] border border-red-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
                  
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
                     <AlertTriangle size={32} className="text-red-400" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-white mb-3">Browser Extension Required</h2>
                  <p className="text-gray-400 leading-relaxed mb-6">
                    To actively monitor your web distractions while learning, you need to install the custom <strong>StudyVerse Analytics Extension</strong> built directly into your project files. It works entirely offline and communicates directly with this dashboard securely.
                  </p>
                  
                  <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 mb-6 font-mono text-sm leading-8 text-gray-300">
                    <ol className="list-decimal pl-5 marker:text-indigo-400">
                      <li>Open a new tab and go to <strong>chrome://extensions/</strong></li>
                      <li>Toggle <strong>"Developer mode"</strong> ON (top right corner).</li>
                      <li>Click <strong>"Load unpacked"</strong> (top left).</li>
                      <li>Select the <strong>StudyVerse/extension</strong> folder located in your local project directory.</li>
                      <li>Come back to this page and it will sync automatically!</li>
                    </ol>
                  </div>
                  
                  <button onClick={requestData} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 w-fit">
                    <RefreshCw size={16} className={loading && !data ? "animate-spin" : ""} /> I have installed it — Check Connection
                  </button>
               </div>
             </div>
           ) : (
             <div className="max-w-5xl mx-auto flex flex-col gap-6 w-full">
               
               {/* Summary Cards */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                     <div className="absolute top-4 right-4 text-emerald-500 opacity-20 group-hover:opacity-40 transition-opacity"><CheckCircle2 size={40} /></div>
                     <p className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-2">Focused Time</p>
                     <p className="text-3xl font-bold text-emerald-400 mb-1">{formatTime(prodTime)}</p>
                     <p className="text-xs text-emerald-500/70">Time spent on known learning tools</p>
                  </div>
                  <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                     <div className="absolute top-4 right-4 text-rose-500 opacity-20 group-hover:opacity-40 transition-opacity"><AlertTriangle size={40} /></div>
                     <p className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-2">Distractions</p>
                     <p className="text-3xl font-bold text-rose-400 mb-1">{formatTime(distTime)}</p>
                     <p className="text-xs text-rose-500/70">Time spent on entertainment/socials</p>
                  </div>
                  <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                     <div className="absolute top-4 right-4 text-indigo-500 opacity-20 group-hover:opacity-40 transition-opacity"><Monitor size={40} /></div>
                     <p className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-2">Total Monitored</p>
                     <p className="text-3xl font-bold text-white mb-1">{formatTime(totalTime)}</p>
                     <p className="text-xs text-gray-600">Total active browsing duration</p>
                  </div>
               </div>

               {/* Detailed Breakdown */}
               <div className="flex-1 rounded-3xl border border-white/10 bg-[#0c0c0c] relative overflow-hidden flex flex-col shadow-2xl p-6">
                  <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
                     <GradientDots backgroundColor="#0c0c0c" />
                  </div>
                  <div className="relative z-10 w-full h-full">
                     <div className="flex items-center gap-3 mb-8">
                       <Map size={24} className="text-indigo-400" />
                       <h2 className="text-xl font-bold text-white tracking-wide">Website Activity Map</h2>
                     </div>
                     
                     {sortedDomains.length === 0 ? (
                       <div className="py-20 flex flex-col items-center justify-center text-center">
                         <Activity size={40} className="text-gray-700 mb-3" />
                         <p className="text-gray-400 font-bold mb-1">No browsing data logged yet.</p>
                         <p className="text-gray-600 text-sm">Keep this page open and start browsing actively to see data.</p>
                       </div>
                     ) : (
                       <div className="flex flex-col gap-5">
                         {sortedDomains.map(({ domain, ms }) => {
                           const pct = totalTime > 0 ? (ms / totalTime) * 100 : 0
                           return (
                             <div key={domain} className="flex flex-col gap-2">
                               <div className="flex items-center justify-between text-sm">
                                  <span className="text-white font-medium flex items-center gap-2">
                                     <ExternalLink size={14} className="text-gray-600" /> {domain}
                                  </span>
                                  <span className="text-gray-400 font-bold tracking-wide">{formatTime(ms)}</span>
                               </div>
                               <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                                  <div className={cn("h-full rounded-full transition-all duration-1000 ease-out", getCatColor(domain))} style={{ width: `${pct}%` }} />
                               </div>
                             </div>
                           )
                         })}
                       </div>
                     )}
                  </div>
               </div>
               
             </div>
           )}

        </div>
      </main>
    </div>
  )
}
