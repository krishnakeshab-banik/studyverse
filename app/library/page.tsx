"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { motion, useMotionValue } from "framer-motion"
import { cn } from "@/lib/utils"
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar"
import { GradientDots } from "@/components/ui/gradient-dots"
import { CardPattern, generateRandomString } from "@/components/ui/evervault-card"
import {
  BookOpen, Brain, ShoppingBag, CalendarDays, MessageSquare, LogOut,
  Plus, X, ExternalLink, FileText, Globe, Play, BookMarked, File,
  LayoutList, Trash2, ArrowLeft, Highlighter, Send, Sparkles, Check,
  Edit3, User,
  Activity, FolderGit2
} from "lucide-react"

// ─── Types ─────────────────────────────────────────────────────
type ResourceType = "Notes" | "PDF" | "PPT" | "Website" | "Video" | "Book"
interface Note { id: string; text: string; highlighted: boolean }
interface ChatMsg { role: "user" | "ai"; text: string }
interface Resource {
  id: string; name: string; url: string; description: string
  type: ResourceType; subject: string; notes: Note[]; chat: ChatMsg[]
}

// ─── Config ────────────────────────────────────────────────────
const STORAGE_KEY = "studyverse_library_v1"
const TYPE_CFG: Record<ResourceType, { icon: React.ElementType; color: string; bg: string }> = {
  Notes:   { icon: FileText,   color: "text-cyan-400",    bg: "rgba(34,211,238,0.1)"  },
  PDF:     { icon: File,       color: "text-red-400",     bg: "rgba(248,113,113,0.1)" },
  PPT:     { icon: LayoutList, color: "text-orange-400",  bg: "rgba(251,146,60,0.1)"  },
  Website: { icon: Globe,      color: "text-emerald-400", bg: "rgba(52,211,153,0.1)"  },
  Video:   { icon: Play,       color: "text-violet-400",  bg: "rgba(167,139,250,0.1)" },
  Book:    { icon: BookMarked, color: "text-amber-400",   bg: "rgba(251,191,36,0.1)"  },
}
const SUBJ_COLORS = [
  "rgba(99,102,241,0.18)","rgba(139,92,246,0.18)","rgba(14,165,233,0.18)",
  "rgba(16,185,129,0.18)","rgba(245,158,11,0.18)","rgba(239,68,68,0.18)",
]
const AI_REPLS = [
  "Based on this resource, {q} is a core concept. Try breaking it into smaller ideas.",
  "Great question! Regarding {q} — look for patterns in the examples the resource provides.",
  "For {q}, the resource likely approaches it step by step. Revisiting the introduction often helps.",
  "Thinking about {q}: connecting it to what you already know can make it much clearer.",
]

// ─── Sidebar helpers ────────────────────────────────────────────
const Logo = () => (
  <Link href="/" className="flex items-center gap-3 py-1 z-20">
    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
      style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 0 16px rgba(99,102,241,0.4)" }}>
      <BookOpen size={20} className="text-white" />
    </div>
    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-white text-lg tracking-tight whitespace-pre">
      StudyVerse
    </motion.span>
  </Link>
)
const LogoIcon = () => (
  <Link href="/" className="flex items-center py-1 z-20">
    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
      style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 0 16px rgba(99,102,241,0.4)" }}>
      <BookOpen size={20} className="text-white" />
    </div>
  </Link>
)
const navLinks = [
  { label: "Library",       href: "/library",    icon: <BookOpen      size={24} className="text-indigo-400 flex-shrink-0" /> },
  { label: "Virtual Study", href: "/study",       icon: <Brain         size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Marketplace",   href: "/marketplace", icon: <ShoppingBag   size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Calendar",      href: "/calendar",    icon: <CalendarDays  size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Projects",      href: "/projects",    icon: <FolderGit2    size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Post Doubts",   href: "/doubts",      icon: <MessageSquare size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Analytics",     href: "/analytics",   icon: <Activity      size={24} className="text-neutral-400 flex-shrink-0" /> },
]

// ─── Resource Card (Evervault effect) ──────────────────────────
function ResourceCard({ resource, subjectColor, onClick, onDelete, onEdit }: {
  resource: Resource; subjectColor: string
  onClick: () => void; onDelete: () => void; onEdit: () => void
}) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const [rndStr, setRndStr] = useState("")
  const cfg = TYPE_CFG[resource.type]
  const Icon = cfg.icon

  return (
    <div
      className="relative group cursor-pointer rounded-2xl border border-white/10 overflow-hidden min-h-[160px] flex flex-col"
      style={{ background: "#0e0e0e" }}
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect()
        mouseX.set(e.clientX - r.left); mouseY.set(e.clientY - r.top)
        setRndStr(generateRandomString(600))
      }}
      onClick={onClick}
    >
      <CardPattern mouseX={mouseX} mouseY={mouseY} randomString={rndStr} />

      {/* Action btns */}
      <div className="absolute top-2.5 right-2.5 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => e.stopPropagation()}>
        <button onClick={onEdit} className="w-7 h-7 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
          <Edit3 size={12} className="text-gray-300" />
        </button>
        <button onClick={onDelete} className="w-7 h-7 rounded-lg bg-red-500/20 backdrop-blur-sm flex items-center justify-center hover:bg-red-500/40 transition-colors">
          <Trash2 size={12} className="text-red-400" />
        </button>
      </div>

      <div className="relative z-10 p-4 flex flex-col gap-3 flex-1">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
          <Icon size={20} className={cfg.color} />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">{resource.name}</h3>
          <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{resource.description || "No description."}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/10" style={{ background: subjectColor, color: "#e5e7eb" }}>
            {resource.subject}
          </span>
          <span className="text-[10px] text-gray-600">{resource.type}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Modal field helper ─────────────────────────────────────────
function MField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
      <div className="border border-white/10 bg-white/5 rounded-xl px-3 h-11 flex items-center focus-within:ring-2 focus-within:ring-indigo-500/40 transition-all">
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-600 outline-none" />
      </div>
    </div>
  )
}

// ─── Add / Edit Modal ───────────────────────────────────────────
function ResourceModal({ initial, subjects, onSave, onCancel }: {
  initial?: Resource; subjects: string[]
  onSave: (d: Omit<Resource, "id" | "notes" | "chat">) => void; onCancel: () => void
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "", url: initial?.url ?? "",
    description: initial?.description ?? "", type: (initial?.type ?? "Notes") as ResourceType,
    subject: initial?.subject ?? subjects[0] ?? "",
  })
  const [newSubj, setNewSubj] = useState("")
  const [creating, setCreating] = useState(subjects.length === 0)

  const confirmSubject = () => {
    if (newSubj.trim()) { setForm(f => ({ ...f, subject: newSubj.trim() })); setCreating(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-white/10 p-6 flex flex-col gap-4" style={{ background: "#0f0f0f" }}>

        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">{initial ? "Edit Resource" : "Add Resource"}</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-300 transition-colors"><X size={18} /></button>
        </div>

        <MField label="Resource Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Linear Algebra Notes" />
        <MField label="Resource URL" value={form.url} onChange={v => setForm(f => ({ ...f, url: v }))} placeholder="https://..." />

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Brief description..." rows={2}
            className="border border-white/10 bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ResourceType }))}
              className="border border-white/10 bg-[#1a1a1a] rounded-xl px-3 h-11 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/40">
              {(Object.keys(TYPE_CFG) as ResourceType[]).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Subject</label>
            {creating ? (
              <div className="flex gap-1.5">
                <input value={newSubj} onChange={e => setNewSubj(e.target.value)} onKeyDown={e => e.key === "Enter" && confirmSubject()}
                  placeholder="New subject…"
                  className="flex-1 border border-indigo-500/40 bg-white/5 rounded-xl px-3 h-11 text-sm text-white placeholder:text-gray-600 outline-none" />
                <button onClick={confirmSubject} className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Check size={16} className="text-white" />
                </button>
              </div>
            ) : (
              <select value={form.subject} onChange={e => { if (e.target.value === "__new__") setCreating(true); else setForm(f => ({ ...f, subject: e.target.value })) }}
                className="border border-white/10 bg-[#1a1a1a] rounded-xl px-3 h-11 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/40">
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="__new__">+ New Subject</option>
              </select>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-1">
          <button onClick={onCancel} className="flex-1 h-11 rounded-xl border border-white/10 text-gray-400 text-sm font-medium hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={() => { if (form.name.trim() && form.subject.trim()) onSave(form) }}
            className="flex-1 h-11 rounded-xl text-white text-sm font-semibold"
            style={{ background: "linear-gradient(to right,#4f46e5,#7c3aed)", boxShadow: "0 0 16px rgba(99,102,241,0.3)" }}>
            {initial ? "Save Changes" : "Add Resource"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Resource Detail (split view) ──────────────────────────────
function ResourceDetail({ resource, subjectColor, onBack, onUpdate }: {
  resource: Resource; subjectColor: string; onBack: () => void; onUpdate: (r: Resource) => void
}) {
  const [tab, setTab] = useState<"notes" | "ai">("notes")
  const [notes, setNotes] = useState<Note[]>(resource.notes)
  const [chat, setChat] = useState<ChatMsg[]>(resource.chat)
  const [noteInput, setNoteInput] = useState("")
  const [aiInput, setAiInput] = useState("")
  const [saved, setSaved] = useState(false)
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const cfg = TYPE_CFG[resource.type]
  const Icon = cfg.icon

  useEffect(() => {
    if (saveRef.current) clearTimeout(saveRef.current)
    saveRef.current = setTimeout(() => {
      onUpdate({ ...resource, notes, chat })
      setSaved(true); setTimeout(() => setSaved(false), 1500)
    }, 1000)
    return () => { if (saveRef.current) clearTimeout(saveRef.current) }
  }, [notes, chat])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [chat])

  const addNote = () => {
    if (!noteInput.trim()) return
    setNotes(p => [...p, { id: Date.now().toString(), text: noteInput.trim(), highlighted: false }])
    setNoteInput("")
  }
  const toggleHL = (id: string) => setNotes(p => p.map(n => n.id === id ? { ...n, highlighted: !n.highlighted } : n))
  const delNote = (id: string) => setNotes(p => p.filter(n => n.id !== id))

  const sendAi = () => {
    if (!aiInput.trim()) return
    const reply = AI_REPLS[Math.floor(Math.random() * AI_REPLS.length)].replace("{q}", aiInput.slice(0, 40))
    setChat(p => [...p, { role: "user", text: aiInput }, { role: "ai", text: reply }])
    setAiInput("")
  }

  return (
    <div className="flex gap-4 h-full">
      {/* ── Left: viewer ── */}
      <div className="w-[55%] flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <ArrowLeft size={15} className="text-gray-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-base truncate">{resource.name}</h2>
            <p className="text-gray-500 text-xs">{resource.type} · {resource.subject}</p>
          </div>
          <span className="text-[10px] font-medium px-2.5 py-1 rounded-full border border-white/10 shrink-0"
            style={{ background: subjectColor, color: "#e5e7eb" }}>{resource.subject}</span>
        </div>

        <div className="flex-1 rounded-2xl border border-white/10 flex flex-col overflow-hidden" style={{ background: "#0e0e0e" }}>
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
              <Icon size={18} className={cfg.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{resource.name}</p>
              <p className="text-gray-500 text-xs truncate">{resource.url || "No URL provided"}</p>
            </div>
            {resource.url && (
              <a href={resource.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors shrink-0">
                <ExternalLink size={12} /> Open
              </a>
            )}
          </div>

          <div className="flex-1 flex flex-col overflow-hidden relative bg-[#050505]">
            {resource.url ? (
              <iframe
                src={resource.url}
                className="w-full h-full border-0 absolute inset-0"
                title={resource.name}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: cfg.bg }}>
                  <Icon size={32} className={cfg.color} />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold">{resource.type} Resource</p>
                  <p className="text-gray-500 text-sm mt-1 max-w-xs leading-relaxed">{resource.description || "No description available."}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: notes panel ── */}
      <div className="flex-1 flex flex-col rounded-2xl border border-white/10 overflow-hidden" style={{ background: "#0e0e0e" }}>
        <div className="flex border-b border-white/[0.06] shrink-0">
          {(["notes", "ai"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors",
                tab === t ? "text-white border-b-2 border-indigo-500" : "text-gray-500 hover:text-gray-300")}>
              {t === "notes" ? <><Highlighter size={14} /> Jot Down</> : <><Sparkles size={14} /> AI Assistant</>}
            </button>
          ))}
        </div>

        {tab === "notes" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {notes.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-gray-600 text-sm py-12">No notes yet — start jotting!</div>
              )}
              {notes.map(n => (
                <div key={n.id} className={cn("group flex items-start gap-2 rounded-xl px-3 py-2.5 transition-colors",
                  n.highlighted ? "bg-amber-500/10 border border-amber-500/20" : "bg-white/[0.03] border border-white/[0.06]")}>
                  <span className="text-gray-500 text-xs mt-0.5 shrink-0">•</span>
                  <span className={cn("flex-1 text-sm leading-relaxed", n.highlighted ? "text-amber-100" : "text-gray-200")}>{n.text}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => toggleHL(n.id)} className={cn("p-1 rounded", n.highlighted ? "text-amber-400" : "text-gray-600 hover:text-amber-400")}>
                      <Highlighter size={11} />
                    </button>
                    <button onClick={() => delNote(n.id)} className="p-1 rounded text-gray-600 hover:text-red-400"><X size={11} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] shrink-0">
              {saved && <p className="text-emerald-400 text-[10px] mb-2 flex items-center gap-1"><Check size={9} /> Auto-saved</p>}
              <div className="flex gap-2">
                <input value={noteInput} onChange={e => setNoteInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addNote()}
                  placeholder="Add a note and press Enter…"
                  className="flex-1 border border-white/10 bg-white/5 rounded-xl px-3 h-10 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/40" />
                <button onClick={addNote} className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center hover:bg-indigo-500 transition-colors">
                  <Plus size={16} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "ai" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {chat.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 py-12">
                  <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <Sparkles size={18} className="text-violet-400" />
                  </div>
                  <p className="text-gray-500 text-sm text-center">Ask me anything about this resource!</p>
                </div>
              )}
              {chat.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[85%] rounded-xl px-3 py-2.5 text-sm leading-relaxed",
                    m.role === "user" ? "text-white" : "bg-white/[0.05] border border-white/[0.06] text-gray-200")}
                    style={m.role === "user" ? { background: "linear-gradient(to right,#4f46e5,#7c3aed)" } : {}}>
                    {m.role === "ai" && <Sparkles size={10} className="text-violet-400 mb-1" />}
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] flex gap-2 shrink-0">
              <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendAi()}
                placeholder="Ask about this resource…"
                className="flex-1 border border-white/10 bg-white/5 rounded-xl px-3 h-10 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-violet-500/40" />
              <button onClick={sendAi} className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center hover:bg-violet-500 transition-colors">
                <Send size={15} className="text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────
export default function LibraryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [resources, setResources] = useState<Resource[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [selected, setSelected] = useState<Resource | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Resource | undefined>()

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) { const d = JSON.parse(stored); setResources(d.r ?? []); setSubjects(d.s ?? []) }
  }, [])

  const persist = useCallback((r: Resource[], s: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ r, s }))
  }, [])

  const saveResource = (data: Omit<Resource, "id" | "notes" | "chat">) => {
    if (editing) {
      const updated = { ...editing, ...data }
      const nr = resources.map(r => r.id === editing.id ? updated : r)
      const ns = subjects.includes(data.subject) ? subjects : [...subjects, data.subject]
      setResources(nr); setSubjects(ns); persist(nr, ns)
      if (selected?.id === editing.id) setSelected(updated)
    } else {
      const nr = [...resources, { ...data, id: Date.now().toString(), notes: [], chat: [] }]
      const ns = subjects.includes(data.subject) ? subjects : [...subjects, data.subject]
      setResources(nr); setSubjects(ns); persist(nr, ns)
    }
    setShowModal(false); setEditing(undefined)
  }

  const deleteResource = (id: string) => {
    const nr = resources.filter(r => r.id !== id)
    setResources(nr); persist(nr, subjects)
    if (selected?.id === id) setSelected(null)
  }

  const updateResource = (updated: Resource) => {
    const nr = resources.map(r => r.id === updated.id ? updated : r)
    setResources(nr); persist(nr, subjects); setSelected(updated)
  }

  const getColor = (subject: string) => SUBJ_COLORS[subjects.indexOf(subject) % SUBJ_COLORS.length] ?? SUBJ_COLORS[0]

  const displayed = activeTab === "all" ? resources : resources.filter(r => r.subject === activeTab)
  const byType = activeTab !== "all"
    ? (Object.keys(TYPE_CFG) as ResourceType[]).reduce((acc, t) => {
        const f = displayed.filter(r => r.type === t); if (f.length) acc[t] = f; return acc
      }, {} as Record<string, Resource[]>)
    : {}

  return (
    <div className="flex relative h-screen w-full bg-[#080808] overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-10" style={{ background: "#0d0d0d", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {sidebarOpen ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-0.5">
              {navLinks.map((link, i) => <SidebarLink key={i} link={link} className="hover:bg-white/5 rounded-lg px-2 transition-colors py-3" />)}
            </div>
          </div>
          <div className="flex flex-col gap-0.5 pb-2">
            <div className="border-t border-white/[0.06] mb-2" />
            <SidebarLink link={{ label: "Profile", href: "/profile",
              icon: <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}><User size={16} /></div>
            }} className="bg-white/[0.06] rounded-lg px-2" />
            <SidebarLink link={{ label: "Logout", href: "/", icon: <LogOut size={22} className="text-red-400 flex-shrink-0 ml-0.5" /> }}
              className="hover:bg-red-500/10 rounded-lg px-2 transition-colors" />
          </div>
        </SidebarBody>
      </Sidebar>

      <main className="flex-1 overflow-hidden flex flex-col relative z-0">
        <div className="px-6 pt-6 shrink-0 relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent relative top-1">
                Library
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">{resources.length} resource{resources.length !== 1 ? "s" : ""} saved</p>
            </div>
            {!selected && (
              <button onClick={() => { setEditing(undefined); setShowModal(true) }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(to right,#4f46e5,#7c3aed)", boxShadow: "0 0 16px rgba(99,102,241,0.3)" }}>
                <Plus size={16} /> Add Resource
              </button>
            )}
          </div>

          {!selected && (
            <div className="flex gap-1.5 overflow-x-auto pb-4">
              {["all", ...subjects].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={cn("px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
                    activeTab === tab ? "text-white" : "text-gray-500 border border-white/10 bg-white/[0.03] hover:text-gray-300")}
                  style={activeTab === tab ? { background: "linear-gradient(to right,#4f46e5,#7c3aed)", boxShadow: "0 0 12px rgba(99,102,241,0.25)" } : {}}>
                  {tab === "all" ? "All" : tab}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 px-6 pb-6 mt-4 relative z-10 overflow-hidden flex flex-col">
          {!selected ? (
            <div className="flex-1 rounded-3xl border border-white/10 bg-[#0c0c0c] relative overflow-hidden flex flex-col shadow-2xl">
              <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                <GradientDots backgroundColor="#0c0c0c" />
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 relative z-10">
                {/* Empty state */}
                {displayed.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.12)" }}>
                      <BookOpen size={28} className="text-indigo-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-semibold">No resources yet</p>
                      <p className="text-gray-500 text-sm mt-1">Click "Add Resource" to start building your library.</p>
                    </div>
                  </div>
                )}

          {/* All tab grid */}
          {!selected && activeTab === "all" && displayed.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {displayed.map(r => (
                <ResourceCard key={r.id} resource={r} subjectColor={getColor(r.subject)}
                  onClick={() => setSelected(r)} onDelete={() => deleteResource(r.id)}
                  onEdit={() => { setEditing(r); setShowModal(true) }} />
              ))}
            </div>
          )}

          {/* Subject tab — grouped by type */}
          {!selected && activeTab !== "all" && Object.entries(byType).map(([type, items]) => {
            const cfg = TYPE_CFG[type as ResourceType]; const Icon = cfg.icon
            return (
              <div key={type} className="mb-7">
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={15} className={cfg.color} />
                  <h3 className="text-sm font-semibold text-gray-300">{type}</h3>
                  <span className="text-xs text-gray-600 bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/[0.06]">{items.length}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {items.map(r => (
                    <ResourceCard key={r.id} resource={r} subjectColor={getColor(r.subject)}
                      onClick={() => setSelected(r)} onDelete={() => deleteResource(r.id)}
                      onEdit={() => { setEditing(r); setShowModal(true) }} />
                  ))}
                </div>
              </div>
            )
          })}
              </div>
            </div>
          ) : (
            <div className="flex-1 h-full">
              {/* Split-screen detail view */}
              <ResourceDetail resource={selected} subjectColor={getColor(selected.subject)}
                onBack={() => setSelected(null)} onUpdate={updateResource} />
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <ResourceModal initial={editing} subjects={subjects}
          onSave={saveResource} onCancel={() => { setShowModal(false); setEditing(undefined) }} />
      )}
    </div>
  )
}
