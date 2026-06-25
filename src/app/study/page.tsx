"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { PageShell, StatCard, GlassPanel } from "@/components/ui/page-shell"
import { GradientDots } from "@/components/ui/gradient-dots"
import {
  Plus, X, Play, Clock, FolderKanban, FileText, Sparkles,
  Highlighter, Send, ChevronRight, Trash2,
  Check, ArrowLeft, Video, Target, Calculator as CalcIcon,
  BookOpen,
} from "lucide-react"

// ─── Types and Config ──────────────────────────────────────────
type NoteType = "h1" | "h2" | "bullet" | "text"
interface Note { id: string; text: string; highlighted: boolean; type?: NoteType; timestamp?: string }
interface ChatMsg { role: "user" | "ai"; text: string }
interface Project {
  id: string; topic: string; description: string; youtubeUrl: string;
  timeSpentSeconds: number; notes: Note[]; chat: ChatMsg[]; summary: string;
}
interface Workspace {
  id: string; subject: string; topic: string;
  createdAt: number; lastOpened: number; projects: Project[];
}

const STORAGE_KEY = "studyverse_virtual_study_v1"

// Formats seconds into HH:MM:SS or MM:SS
const formatTime = (sec: number) => {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  return `${m}m ${s}s`
}

// Extracts YouTube video ID
const extractYTId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

// ─── Simple Calculator ─────────────────────────────────────────
function CalculatorTool() {
  const [expr, setExpr] = useState("")

  const append = (v: string) => setExpr(e => e + v)
  const calc = () => {
    try {
      if (!expr) return
      // Safe eval equivalent using Function for basic arithmetic
      const res = new Function(`return ${expr.replace(/[^-()\d/*+.]/g, '')}`)()
      setExpr(String(res))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) { setExpr("Error") }
  }
  const clear = () => setExpr("")
  
  const btns = [
    "7","8","9","/",
    "4","5","6","*",
    "1","2","3","-",
    "C","0","=","+"
  ]

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[280px] bg-white/[0.03] border border-white/10 rounded-2xl p-4 shadow-xl">
        <div className="w-full h-14 bg-[#0a0a0a] border border-white/10 rounded-xl mb-4 px-4 flex items-center justify-end overflow-hidden">
          <span className="text-white text-xl font-mono tracking-wider truncate">{expr || "0"}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {btns.map(b => (
            <button key={b}
              onClick={() => b === "C" ? clear() : b === "=" ? calc() : append(b)}
              className={cn("h-12 rounded-xl text-lg font-medium transition-colors active:scale-95",
                b === "=" ? "bg-indigo-600 text-white hover:bg-indigo-500" 
                : ["/","*","-","+","C"].includes(b) ? "bg-white/10 text-indigo-300 hover:bg-white/20" 
                : "bg-white/5 text-gray-200 hover:bg-white/10")}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Workspace Modal ───────────────────────────────────────────
function WorkspaceModal({ onSave, onCancel }: { onSave: (s: string, t: string) => void, onCancel: () => void }) {
  const [s, setS] = useState("")
  const [t, setT] = useState("")
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-[#0f0f0f] rounded-2xl border border-white/10 p-6 flex flex-col gap-4">
        <h2 className="text-white font-bold text-lg">Create Workspace</h2>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Subject Name</label>
          <input value={s} onChange={e => setS(e.target.value)} placeholder="e.g. Physics" autoFocus
            className="border border-white/10 bg-white/5 rounded-xl px-3 h-11 text-sm text-white outline-none focus:border-indigo-500/50" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Topic Name</label>
          <input value={t} onChange={e => setT(e.target.value)} placeholder="e.g. Quantum Mechanics"
            className="border border-white/10 bg-white/5 rounded-xl px-3 h-11 text-sm text-white outline-none focus:border-indigo-500/50" />
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={onCancel} className="flex-1 h-11 rounded-xl border border-white/10 text-gray-400 text-sm font-medium hover:bg-white/5">Cancel</button>
          <button onClick={() => s.trim() && t.trim() && onSave(s.trim(), t.trim())} className="flex-1 h-11 rounded-xl text-white text-sm font-semibold bg-indigo-600 hover:bg-indigo-500">
            Create
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Project Modal ─────────────────────────────────────────────
function ProjectModal({ onSave, onCancel }: { onSave: (t: string, d: string, u: string) => void, onCancel: () => void }) {
  const [t, setT] = useState("")
  const [d, setD] = useState("")
  const [u, setU] = useState("")
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-[#0f0f0f] rounded-2xl border border-white/10 p-6 flex flex-col gap-4">
        <h2 className="text-white font-bold text-lg">Create Project</h2>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Topic Name</label>
          <input value={t} onChange={e => setT(e.target.value)} placeholder="e.g. Schrödinger Equation" autoFocus
            className="border border-white/10 bg-white/5 rounded-xl px-3 h-11 text-sm text-white outline-none focus:border-indigo-500/50" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Description</label>
          <textarea value={d} onChange={e => setD(e.target.value)} placeholder="What are you learning?" rows={2}
            className="border border-white/10 bg-white/5 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50 resize-none" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">YouTube Link</label>
          <input value={u} onChange={e => setU(e.target.value)} placeholder="https://youtube.com/watch?v=..."
            className="border border-white/10 bg-white/5 rounded-xl px-3 h-11 text-sm text-white outline-none focus:border-indigo-500/50" />
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={onCancel} className="flex-1 h-11 rounded-xl border border-white/10 text-gray-400 text-sm font-medium hover:bg-white/5">Cancel</button>
          <button onClick={() => t.trim() && u.trim() && onSave(t.trim(), d.trim(), u.trim())} className="flex-1 h-11 rounded-xl text-white text-sm font-semibold bg-indigo-600 hover:bg-indigo-500">
            Create
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main Application ──────────────────────────────────────────
export default function VirtualStudyPage() {
  const [wks, setWks] = useState<Workspace[]>([])
  
  // Navigation State
  const [activeWk, setActiveWk] = useState<Workspace | null>(null)
  const [activeProj, setActiveProj] = useState<Project | null>(null)
  
  // Modals
  const [showWModal, setShowWModal] = useState(false)
  const [showPModal, setShowPModal] = useState(false)

  // Project Active Session State
  const [tab, setTab] = useState<"summary" | "notes" | "calc" | "ai">("summary")
  const [noteType, setNoteType] = useState<NoteType>("bullet")
  const [noteInput, setNoteInput] = useState("")
  const [aiInput, setAiInput] = useState("")
  const [saved, setSaved] = useState(false)
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Load from local storage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) { setWks(JSON.parse(stored)) }
  }, [])

  // Save to local storage
  const persist = useCallback((data: Workspace[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setWks(data)
  }, [])

  // Timer logic for active project
  useEffect(() => {
    if (activeProj) {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setActiveProj(p => p ? { ...p, timeSpentSeconds: p.timeSpentSeconds + 1 } : null)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [activeProj?.id])

  // Auto-sync active project & workspace to main state
  useEffect(() => {
    if (!activeProj || !activeWk) return
    
    // throttle saving UI state to avoid lag but keep accurate data
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      const nw = wks.map(w => w.id === activeWk.id ? {
        ...w, 
        lastOpened: Date.now(),
        projects: w.projects.map(p => p.id === activeProj.id ? activeProj : p)
      } : w)
      persist(nw)
      setSaved(true); setTimeout(() => setSaved(false), 1500)
    }, 2000)
    
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current) }
  }, [activeProj, activeWk?.id])

  // Scroll AI
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [activeProj?.chat])

  const addWorkspace = (subject: string, topic: string) => {
    persist([...wks, { id: Date.now().toString(), subject, topic, createdAt: Date.now(), lastOpened: Date.now(), projects: [] }])
    setShowWModal(false)
  }
  
  const addProject = (topic: string, description: string, youtubeUrl: string) => {
    if (!activeWk) return
    const newP: Project = {
      id: Date.now().toString(), topic, description, youtubeUrl,
      timeSpentSeconds: 0, notes: [], chat: [], 
      summary: "This video explores the core fundamentals of the selected topic. It breaks down complex ideas into manageable segments, walking you through practical examples. Key takeaways involve systematic problem solving and contextualizing the theory within real-world scenarios." // Mock summary
    }
    const nw = wks.map(w => w.id === activeWk.id ? { ...w, projects: [...w.projects, newP] } : w)
    persist(nw)
    setShowPModal(false)
    setActiveWk(nw.find(w => w.id === activeWk.id) || null)
  }

  // Active Project Tools Actions
  const addNote = () => {
    if (!noteInput.trim() || !activeProj) return
    const stamp = formatTime(activeProj.timeSpentSeconds)
    setActiveProj({ ...activeProj, notes: [...activeProj.notes, { id: Date.now().toString(), text: noteInput.trim(), highlighted: false, type: noteType, timestamp: stamp }] })
    setNoteInput("")
  }
  const deleteNote = (id: string) => activeProj && setActiveProj({ ...activeProj, notes: activeProj.notes.filter(n => n.id !== id) })
  
  const sendAi = () => {
    if (!aiInput.trim() || !activeProj) return
    const reply = `Regarding "${aiInput.slice(0, 30)}..." — based on the video context, usually breaking it down into smaller fundamental blocks helps clarify the intention of the instructor.`
    setActiveProj({ ...activeProj, chat: [...activeProj.chat, { role: "user", text: aiInput }, { role: "ai", text: reply }] })
    setAiInput("")
  }

  const totalProjects = wks.reduce((a, w) => a + w.projects.length, 0)
  const totalStudySeconds = wks.reduce((a, w) => a + w.projects.reduce((b, p) => b + p.timeSpentSeconds, 0), 0)

  const pageTitle = activeProj
    ? activeProj.topic
    : activeWk
      ? activeWk.topic
      : "Virtual Study"
  const pageSubtitle = activeProj
    ? `${activeWk?.subject || "Workspace"} · Focus room`
    : activeWk
      ? `${activeWk.subject} · ${activeWk.projects.length} project${activeWk.projects.length !== 1 ? "s" : ""}`
      : "Immersive focus rooms and project workspaces"

  const pageAction = activeProj ? undefined : activeWk ? (
    <button onClick={() => setShowPModal(true)}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_16px_rgba(99,102,241,0.3)] transition-all">
      <Plus size={16} /> New Project
    </button>
  ) : (
    <button onClick={() => setShowWModal(true)}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_16px_rgba(99,102,241,0.3)] transition-all">
      <Plus size={16} /> New Workspace
    </button>
  )

  return (
    <PageShell
      title={pageTitle}
      subtitle={pageSubtitle}
      icon={BookOpen}
      iconAccent="#6366f1"
      action={pageAction}
      stats={!activeWk && !activeProj ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard icon={FolderKanban} label="Workspaces" value={wks.length} accent="#6366f1" />
          <StatCard icon={Video} label="Projects" value={totalProjects} accent="#10b981" />
          <StatCard icon={Clock} label="Time studied" value={formatTime(totalStudySeconds)} accent="#f59e0b" />
        </div>
      ) : undefined}
      noPadding
      contentClassName="p-4 sm:p-6 min-h-[60vh] relative"
    >
      {(activeWk || activeProj) && (
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => activeProj ? setActiveProj(null) : setActiveWk(null)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={16} className="text-gray-300" />
          </button>
          {activeWk && !activeProj && (
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-bold tracking-wider uppercase">
              Workspace <ChevronRight size={12} className="text-gray-600" /> {activeWk.subject}
            </div>
          )}
        </div>
      )}

      <div className="relative z-10 w-full">
          
          {/* LEVEL 1: ALL WORKSPACES */}
          {!activeWk && !activeProj && (
            <GlassPanel className="relative overflow-hidden flex flex-col min-h-[420px]">
              <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                <GradientDots backgroundColor="transparent" />
              </div>
              <div className="flex-1 overflow-y-auto p-6 relative z-10">
                  {wks.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 border border-dashed border-white/10 rounded-3xl bg-white/[0.01] h-full">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                        <FolderKanban size={32} className="text-indigo-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-medium text-lg">No workspaces yet</p>
                        <p className="text-gray-500 text-sm mt-1">Create your first focus room to begin learning.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {wks.map(w => (
                         <div key={w.id} onClick={() => setActiveWk(w)}
                           className="group cursor-pointer rounded-2xl border border-white/10 bg-[#0e0e0e] hover:bg-[#141414] p-5 transition-all flex flex-col hover:border-indigo-500/30">
                           <div className="flex items-center gap-3 mb-4">
                             <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                               <Target size={20} className="text-violet-400" />
                             </div>
                             <div className="flex-1 min-w-0">
                               <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider truncate">{w.subject}</h3>
                               <p className="text-white font-medium truncate">{w.topic}</p>
                             </div>
                           </div>
                           <div className="flex items-center justify-between mt-auto">
                             <div className="flex items-center gap-1.5 text-xs text-gray-500">
                               <FolderKanban size={14} /> {w.projects.length} project{w.projects.length !== 1 && 's'}
                             </div>
                             <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                               Opened {new Date(w.lastOpened).toLocaleDateString()}
                             </div>
                           </div>
                         </div>
                      ))}
                    </div>
                  )}
              </div>
            </GlassPanel>
          )}

          {activeWk && !activeProj && (
            <GlassPanel className="relative overflow-hidden flex flex-col min-h-[420px]">
              <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                <GradientDots backgroundColor="transparent" />
              </div>
              <div className="flex-1 overflow-y-auto p-6 relative z-10">
                  {activeWk.projects.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 border border-dashed border-white/10 rounded-3xl bg-white/[0.01] h-full">
                       <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                         <Video size={32} className="text-indigo-400" />
                       </div>
                       <div className="text-center">
                         <p className="text-white font-medium text-lg">No projects added</p>
                         <p className="text-gray-500 text-sm mt-1">Start by adding a YouTube video topic to study.</p>
                       </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                      {activeWk.projects.map(p => (
                        <div key={p.id} className="rounded-2xl border border-white/10 bg-[#0e0e0e] p-5 flex flex-col gap-4">
                          
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                                <Play size={18} className="text-rose-400 ml-0.5" />
                              </div>
                              <div>
                                <h3 className="text-white font-semibold flex items-center gap-2">{p.topic}</h3>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                  <Clock size={12} className="text-gray-600" /> {formatTime(p.timeSpentSeconds)} studied
                                </div>
                              </div>
                            </div>
                            <button onClick={() => {
                                const nw = wks.map(w => w.id === activeWk.id ? { ...w, projects: w.projects.filter(pr => pr.id !== p.id) } : w)
                                persist(nw)
                                setActiveWk(nw.find(w => w.id === activeWk.id) || null)
                              }} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          
                          <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">{p.description}</p>
                          
                          <div className="mt-auto border-t border-white/[0.06] pt-4 flex justify-between items-center">
                            <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 font-medium">Recorded Session</span>
                            <button onClick={() => setActiveProj(p)}
                              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-colors">
                              <Play size={14} /> Open Context
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </GlassPanel>
          )}

          {activeWk && activeProj && (
            <div className="h-full flex flex-col min-h-[70vh]">
              <div className="flex items-center justify-between shrink-0 mb-4 bg-white/[0.03] border border-white/[0.08] px-4 py-3 rounded-2xl">
                 <p className="text-white font-semibold text-sm truncate">{activeProj.topic}</p>
                 <div className="flex items-center gap-4">
                   {saved && <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium"><Check size={10} /> Saved</span>}
                   <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-widest font-mono">
                     <Clock size={12} /> {formatTime(activeProj.timeSpentSeconds)}
                   </div>
                 </div>
              </div>

              {/* Split Content */}
              <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-y-auto md:overflow-hidden">
                {/* Left: Video */}
                <div className="w-full md:w-[60%] h-[300px] md:h-auto bg-[#050505] rounded-2xl border border-white/10 overflow-hidden relative shadow-2xl shrink-0 md:shrink">
                  {extractYTId(activeProj.youtubeUrl) ? (
                    <iframe 
                      src={`https://www.youtube.com/embed/${extractYTId(activeProj.youtubeUrl)}?autoplay=1`} 
                      className="w-full h-full border-0 absolute inset-0 rounded-2xl"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                       <Play size={32} className="text-gray-700 mb-2" />
                       <p className="text-gray-500 text-sm">Preview unavailable.</p>
                       <p className="text-gray-600 text-xs">A valid YouTube link is required.</p>
                    </div>
                  )}
                </div>

                {/* Right: Tools Panel */}
                <div className="flex-1 flex flex-col bg-[#0e0e0e] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                  <div className="flex bg-[#0a0a0a] border-b border-white/[0.06] shrink-0 p-1 overflow-x-auto scrollbar-thin">
                    {[
                      { id: "summary", icon: FileText, label: "Summary" },
                      { id: "notes", icon: Highlighter, label: "Jot Down" },
                      { id: "calc", icon: CalcIcon, label: "Calculator" },
                      { id: "ai", icon: Sparkles, label: "AI Assist" },
                    ].map(t => (
                      <button key={t.id} onClick={() => setTab(t.id as any)}
                        className={cn("flex-1 min-w-[4.5rem] flex flex-col items-center justify-center gap-1 sm:gap-1.5 py-2.5 sm:py-3 rounded-xl transition-all shrink-0",
                          tab === t.id ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300 hover:bg-white/5")}>
                        <t.icon size={16} className={tab === t.id ? (t.id === "ai" ? "text-violet-400" : "text-indigo-400") : ""} />
                        <span className="text-[9px] sm:text-[10px] font-semibold">{t.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Summary */}
                  {tab === "summary" && (
                    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                          <FileText size={16} className="text-indigo-400" />
                        </div>
                        <h3 className="text-white font-semibold">AI Video Summary</h3>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{activeProj.summary}</p>
                      <div className="mt-4 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                        <p className="text-indigo-300 text-xs font-medium italic">"Understanding the core concepts sequentially is crucial. Keep track of the major turning points in the lecture."</p>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {tab === "notes" && (
                    <div className="flex-1 flex flex-col overflow-hidden relative">
                      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                         {activeProj.notes.length === 0 && (
                           <div className="flex-1 flex items-center justify-center text-gray-600 text-sm py-12 text-center px-4 leading-relaxed">
                             Watch the video and note down important timestamps or concepts here.
                           </div>
                         )}
                         {activeProj.notes.map(n => (
                           <div key={n.id} className="group relative flex items-start gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 transition-colors hover:bg-white/[0.05]">
                             <div className="flex flex-col items-center pt-0.5 w-[50px] shrink-0">
                               <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 whitespace-nowrap">{n.timestamp || "0m 0s"}</span>
                             </div>
                             <div className="flex-1 min-w-0 flex items-start gap-2">
                               {(n.type === "bullet" || (!n.type)) && <span className="text-indigo-400 text-xs mt-1 shrink-0">•</span>}
                               <span className={cn("leading-relaxed break-words", 
                                 n.type === "h1" ? "text-lg font-bold text-white mb-1" :
                                 n.type === "h2" ? "text-base font-semibold text-gray-100" :
                                 "text-sm text-gray-300"
                               )}>{n.text}</span>
                             </div>
                             <button onClick={() => deleteNote(n.id)} className="absolute right-2 top-2 p-1.5 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20">
                               <X size={12} />
                             </button>
                           </div>
                         ))}
                      </div>
                      <div className="p-4 border-t border-white/[0.06] bg-[#0a0a0a] shrink-0 flex flex-col gap-2">
                         <div className="flex gap-1.5">
                           {(["h1", "h2", "bullet", "text"] as NoteType[]).map(t => (
                             <button key={t} onClick={() => setNoteType(t)}
                               className={cn("px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase transition-colors border",
                                 noteType === t ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300")}>
                               {t === "h1" ? "Title" : t === "h2" ? "Heading" : t}
                             </button>
                           ))}
                         </div>
                         <div className="flex gap-2">
                           <input value={noteInput} onChange={e => setNoteInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addNote()}
                             placeholder={noteType === "h1" ? "Add a title..." : noteType === "h2" ? "Add a heading..." : "Jot down a quick note…"}
                             className={cn("flex-1 border border-white/10 bg-white/5 rounded-xl px-4 h-11 text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all",
                               noteType === "h1" ? "font-bold text-base" : noteType === "h2" ? "font-semibold text-sm" : "text-sm text-gray-300"
                             )} />
                           <button onClick={addNote} className="w-11 h-11 shrink-0 rounded-xl bg-indigo-600 flex items-center justify-center hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                             <Plus size={18} className="text-white" />
                           </button>
                         </div>
                      </div>
                    </div>
                  )}

                  {/* Calculator */}
                  {tab === "calc" && <CalculatorTool />}

                  {/* AI Assist */}
                  {tab === "ai" && (
                    <div className="flex-1 flex flex-col overflow-hidden relative">
                      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                        {activeProj.chat.length === 0 && (
                          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-8">
                            <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                              <Sparkles size={18} className="text-violet-400" />
                            </div>
                            <p className="text-gray-400 text-sm max-w-[200px]">How can I help you understand this video better?</p>
                          </div>
                        )}
                        {activeProj.chat.map((m, i) => (
                           <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                             <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg",
                               m.role === "user" ? "text-white rounded-br-sm" : "bg-white/[0.06] border border-white/[0.06] text-gray-200 rounded-bl-sm")}
                               style={m.role === "user" ? { background: "linear-gradient(135deg,#4f46e5,#7c3aed)" } : {}}>
                               {m.role === "ai" && <Sparkles size={12} className="text-violet-400 mb-2" />}
                               {m.text}
                             </div>
                           </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                      <div className="p-4 border-t border-white/[0.06] bg-[#0a0a0a] shrink-0">
                         <div className="flex gap-2 relative">
                           <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendAi()}
                             placeholder="Ask a question..."
                             className="flex-1 border border-white/10 bg-white/5 rounded-xl pl-4 pr-12 h-11 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all shadow-inner" />
                           <button onClick={sendAi} className="absolute right-1 top-1 w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center hover:bg-violet-500 transition-colors shadow-lg shadow-violet-500/20">
                             <Send size={14} className="text-white ml-0.5" />
                           </button>
                         </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}
        </div>

      {showWModal && <WorkspaceModal onCancel={() => setShowWModal(false)} onSave={addWorkspace} />}
      {showPModal && <ProjectModal onCancel={() => setShowPModal(false)} onSave={addProject} />}
    </PageShell>
  )
}
