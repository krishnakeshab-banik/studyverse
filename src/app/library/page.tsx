"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence, useMotionValue } from "framer-motion"
import { cn } from "@/lib/utils"
import { AppNav } from "@/components/ui/app-nav"
import { CardPattern, generateRandomString } from "@/components/ui/evervault-card"
import {
  Plus, X, ExternalLink, FileText, Globe, Play, BookMarked, File,
  LayoutList, Trash2, ArrowLeft, Highlighter, Send, Sparkles, Check, Edit3, BookOpen,
  Search, LayoutGrid, List, ArrowDownNarrowWide, StickyNote, MessageSquare, Library as LibraryIcon,
  FolderOpen, Layers, type LucideIcon,
} from "lucide-react"

// ─── Types ─────────────────────────────────────────────────────
type ResourceType = "Notes" | "PDF" | "PPT" | "Website" | "Video" | "Book"
type SortKey = "recent" | "name" | "type"
type ViewMode = "grid" | "list"
interface Note { id: string; text: string; highlighted: boolean }
interface ChatMsg { role: "user" | "ai"; text: string }
interface Resource {
  id: string; name: string; url: string; description: string
  type: ResourceType; subject: string; notes: Note[]; chat: ChatMsg[]
}

// ─── Config ────────────────────────────────────────────────────
const STORAGE_KEY = "studyverse_library_v1"
const TYPE_CFG: Record<ResourceType, { icon: LucideIcon; color: string; bg: string; ring: string }> = {
  Notes:   { icon: FileText,   color: "text-cyan-400",    bg: "rgba(34,211,238,0.1)",  ring: "rgba(34,211,238,0.25)"  },
  PDF:     { icon: File,       color: "text-red-400",     bg: "rgba(248,113,113,0.1)", ring: "rgba(248,113,113,0.25)" },
  PPT:     { icon: LayoutList, color: "text-orange-400",  bg: "rgba(251,146,60,0.1)",  ring: "rgba(251,146,60,0.25)"  },
  Website: { icon: Globe,      color: "text-emerald-400", bg: "rgba(52,211,153,0.1)",  ring: "rgba(52,211,153,0.25)"  },
  Video:   { icon: Play,       color: "text-violet-400",  bg: "rgba(167,139,250,0.1)", ring: "rgba(167,139,250,0.25)" },
  Book:    { icon: BookMarked, color: "text-amber-400",   bg: "rgba(251,191,36,0.1)",  ring: "rgba(251,191,36,0.25)"  },
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

// ─── Resource Card (grid, evervault effect) ────────────────────
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
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className="relative group cursor-pointer rounded-2xl border border-white/[0.08] overflow-hidden min-h-[172px] flex flex-col hover:border-white/[0.16] transition-colors"
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
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
            style={{ background: cfg.bg, border: `1px solid ${cfg.ring}` }}>
            <Icon size={19} className={cfg.color} />
          </div>
          <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md text-gray-500 bg-white/[0.04] border border-white/[0.06]">
            {resource.type}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">{resource.name}</h3>
          <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{resource.description || "No description."}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/10 truncate max-w-[55%]" style={{ background: subjectColor, color: "#e5e7eb" }}>
            {resource.subject}
          </span>
          <div className="flex items-center gap-2.5 text-gray-600 shrink-0">
            {resource.notes.length > 0 && (
              <span className="flex items-center gap-1 text-[10px]"><StickyNote size={11} /> {resource.notes.length}</span>
            )}
            {resource.chat.length > 0 && (
              <span className="flex items-center gap-1 text-[10px]"><MessageSquare size={11} /> {Math.ceil(resource.chat.length / 2)}</span>
            )}
            {resource.url && <ExternalLink size={11} />}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Resource Row (list view) ──────────────────────────────────
function ResourceRow({ resource, subjectColor, onClick, onDelete, onEdit }: {
  resource: Resource; subjectColor: string
  onClick: () => void; onDelete: () => void; onEdit: () => void
}) {
  const cfg = TYPE_CFG[resource.type]
  const Icon = cfg.icon
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="group flex items-center gap-4 px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.13] transition-all cursor-pointer"
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: cfg.bg, border: `1px solid ${cfg.ring}` }}>
        <Icon size={16} className={cfg.color} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-medium text-sm truncate">{resource.name}</h3>
        <p className="text-gray-500 text-xs truncate">{resource.description || "No description."}</p>
      </div>
      <span className="hidden sm:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/10 shrink-0" style={{ background: subjectColor, color: "#e5e7eb" }}>
        {resource.subject}
      </span>
      <span className="hidden md:inline text-[10px] text-gray-600 w-14 text-center shrink-0">{resource.type}</span>
      <div className="flex items-center gap-2.5 text-gray-600 shrink-0 w-16 justify-end">
        {resource.notes.length > 0 && <span className="flex items-center gap-1 text-[10px]"><StickyNote size={11} /> {resource.notes.length}</span>}
        {resource.url && <ExternalLink size={11} />}
      </div>
      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
        <button onClick={onEdit} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <Edit3 size={12} className="text-gray-300" />
        </button>
        <button onClick={onDelete} className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center hover:bg-red-500/30 transition-colors">
          <Trash2 size={12} className="text-red-400" />
        </button>
      </div>
    </motion.div>
  )
}

// ─── Stat pill ─────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: number | string; accent: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/[0.07] bg-white/[0.025]">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accent}1a`, border: `1px solid ${accent}33` }}>
        <Icon size={16} style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <p className="text-white font-bold text-lg leading-none">{value}</p>
        <p className="text-gray-500 text-[11px] mt-1 truncate">{label}</p>
      </div>
    </div>
  )
}

// ─── Modal field helper ─────────────────────────────────────────
function MField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="sv-label">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="sv-input" />
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={onCancel}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/10 p-6 flex flex-col gap-4 shadow-2xl" style={{ background: "#0f0f0f" }}>

        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">{initial ? "Edit Resource" : "Add Resource"}</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-300 transition-colors"><X size={18} /></button>
        </div>

        <MField label="Resource Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Linear Algebra Notes" />
        <MField label="Resource URL" value={form.url} onChange={v => setForm(f => ({ ...f, url: v }))} placeholder="https://..." />

        <div className="flex flex-col gap-1.5">
          <label className="sv-label">Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Brief description..." rows={2} className="sv-input h-auto py-3 resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="sv-label">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ResourceType }))}
              className="border border-white/10 bg-[#1a1a1a] rounded-xl px-3 h-12 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/40">
              {(Object.keys(TYPE_CFG) as ResourceType[]).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="sv-label">Subject</label>
            {creating ? (
              <div className="flex gap-1.5">
                <input value={newSubj} onChange={e => setNewSubj(e.target.value)} onKeyDown={e => e.key === "Enter" && confirmSubject()}
                  placeholder="New subject…"
                  className="flex-1 border border-indigo-500/40 bg-white/5 rounded-xl px-3 h-12 text-sm text-white placeholder:text-gray-600 outline-none" />
                <button onClick={confirmSubject} className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Check size={16} className="text-white" />
                </button>
              </div>
            ) : (
              <select value={form.subject} onChange={e => { if (e.target.value === "__new__") setCreating(true); else setForm(f => ({ ...f, subject: e.target.value })) }}
                className="border border-white/10 bg-[#1a1a1a] rounded-xl px-3 h-12 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/40">
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="__new__">+ New Subject</option>
              </select>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-1">
          <button onClick={onCancel} className="flex-1 h-12 rounded-xl border border-white/10 text-gray-400 text-sm font-medium hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={() => { if (form.name.trim() && form.subject.trim()) onSave(form) }} className="flex-1 sv-btn-primary">
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* ── Left: viewer ── */}
      <div className="lg:w-[55%] flex flex-col gap-4 min-h-[400px]">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0">
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
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg, border: `1px solid ${cfg.ring}` }}>
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

          <div className="flex-1 flex flex-col overflow-hidden relative bg-[#050505] min-h-[300px]">
            {resource.url ? (
              <iframe src={resource.url} className="w-full h-full border-0 absolute inset-0" title={resource.name} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: cfg.bg, border: `1px solid ${cfg.ring}` }}>
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
      <div className="flex-1 flex flex-col rounded-2xl border border-white/10 overflow-hidden min-h-[400px]" style={{ background: "#0e0e0e" }}>
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
  const [resources, setResources] = useState<Resource[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [typeFilter, setTypeFilter] = useState<"all" | ResourceType>("all")
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("recent")
  const [view, setView] = useState<ViewMode>("grid")
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

  // Stats
  const totalNotes = useMemo(() => resources.reduce((a, r) => a + r.notes.length, 0), [resources])
  const typesUsed = useMemo(() => new Set(resources.map(r => r.type)).size, [resources])

  // Filter + sort pipeline
  const displayed = useMemo(() => {
    let list = activeTab === "all" ? resources : resources.filter(r => r.subject === activeTab)
    if (typeFilter !== "all") list = list.filter(r => r.type === typeFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(r => (r.name + " " + r.description + " " + r.subject).toLowerCase().includes(q))
    }
    const sorted = [...list]
    if (sortKey === "recent") sorted.sort((a, b) => Number(b.id) - Number(a.id))
    else if (sortKey === "name") sorted.sort((a, b) => a.name.localeCompare(b.name))
    else if (sortKey === "type") sorted.sort((a, b) => a.type.localeCompare(b.type))
    return sorted
  }, [resources, activeTab, typeFilter, query, sortKey])

  const subjectCount = (s: string) => resources.filter(r => r.subject === s).length
  const isFiltering = query.trim() !== "" || typeFilter !== "all" || activeTab !== "all"

  return (
    <div className="min-h-screen w-full bg-[#080808]">
      <AppNav />
      <main className="pt-24 pb-24 md:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 sm:pr-24">

          {!selected ? (
            <>
              {/* ── Header ── */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))", border: "1px solid rgba(99,102,241,0.3)" }}>
                    <LibraryIcon size={22} className="text-indigo-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                      My Library
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">Your personal collection of study resources</p>
                  </div>
                </div>
                <button onClick={() => { setEditing(undefined); setShowModal(true) }}
                  className="flex items-center justify-center gap-2 px-5 h-11 rounded-xl text-sm font-semibold text-white shrink-0 transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 24px rgba(99,102,241,0.35)" }}>
                  <Plus size={16} /> Add Resource
                </button>
              </div>

              {/* ── Stats ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatCard icon={BookOpen}   label="Total resources" value={resources.length} accent="#6366f1" />
                <StatCard icon={FolderOpen}  label="Subjects"        value={subjects.length}  accent="#10b981" />
                <StatCard icon={StickyNote}  label="Notes taken"     value={totalNotes}       accent="#f59e0b" />
                <StatCard icon={Layers}      label="Resource types"  value={typesUsed}        accent="#8b5cf6" />
              </div>

              {/* ── Toolbar ── */}
              <div className="flex flex-col md:flex-row gap-3 mb-5">
                {/* Search */}
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Search resources by name, description or subject…"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-9 h-11 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 transition-all" />
                  {query && (
                    <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
                  {/* Type filter */}
                  <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as "all" | ResourceType)}
                    className="bg-white/[0.04] border border-white/10 rounded-xl px-3 h-11 text-sm text-gray-300 outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer">
                    <option value="all">All types</option>
                    {(Object.keys(TYPE_CFG) as ResourceType[]).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>

                  {/* Sort */}
                  <div className="relative">
                    <ArrowDownNarrowWide size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
                      className="bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 h-11 text-sm text-gray-300 outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer appearance-none">
                      <option value="recent">Recent</option>
                      <option value="name">Name A–Z</option>
                      <option value="type">Type</option>
                    </select>
                  </div>

                  {/* View toggle */}
                  <div className="flex items-center bg-white/[0.04] border border-white/10 rounded-xl p-1 shrink-0">
                    {([["grid", LayoutGrid], ["list", List]] as const).map(([v, Ico]) => (
                      <button key={v} onClick={() => setView(v)}
                        className={cn("w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                          view === v ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}>
                        <Ico size={16} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Subject pills ── */}
              <div className="flex gap-1.5 overflow-x-auto pb-4 mb-2">
                <button onClick={() => setActiveTab("all")}
                  className={cn("px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5",
                    activeTab === "all" ? "text-white" : "text-gray-500 border border-white/10 bg-white/[0.03] hover:text-gray-300")}
                  style={activeTab === "all" ? { background: "linear-gradient(to right,#4f46e5,#7c3aed)", boxShadow: "0 0 12px rgba(99,102,241,0.25)" } : {}}>
                  All <span className="opacity-60">{resources.length}</span>
                </button>
                {subjects.map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={cn("px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5",
                      activeTab === tab ? "text-white" : "text-gray-500 border border-white/10 bg-white/[0.03] hover:text-gray-300")}
                    style={activeTab === tab ? { background: "linear-gradient(to right,#4f46e5,#7c3aed)", boxShadow: "0 0 12px rgba(99,102,241,0.25)" } : {}}>
                    {tab} <span className="opacity-60">{subjectCount(tab)}</span>
                  </button>
                ))}
              </div>

              {/* ── Content ── */}
              {displayed.length === 0 ? (
                <div className="rounded-3xl border border-white/[0.08] bg-[#0c0c0c] flex flex-col items-center justify-center gap-5 py-24 px-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}>
                    {isFiltering ? <Search size={28} className="text-indigo-400" /> : <BookOpen size={28} className="text-indigo-400" />}
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold text-lg">{isFiltering ? "No matching resources" : "Your library is empty"}</p>
                    <p className="text-gray-500 text-sm mt-1.5 max-w-sm">
                      {isFiltering
                        ? "Try adjusting your search or filters to find what you're looking for."
                        : "Start building your collection by adding your first study resource."}
                    </p>
                  </div>
                  {isFiltering ? (
                    <button onClick={() => { setQuery(""); setTypeFilter("all"); setActiveTab("all") }}
                      className="flex items-center gap-2 px-5 h-10 rounded-xl text-sm font-medium text-gray-300 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all">
                      Clear filters
                    </button>
                  ) : (
                    <button onClick={() => { setEditing(undefined); setShowModal(true) }}
                      className="flex items-center gap-2 px-5 h-10 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                      style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 4px 20px rgba(99,102,241,0.3)" }}>
                      <Plus size={15} /> Add your first resource
                    </button>
                  )}
                </div>
              ) : view === "grid" ? (
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  <AnimatePresence mode="popLayout">
                    {displayed.map(r => (
                      <ResourceCard key={r.id} resource={r} subjectColor={getColor(r.subject)}
                        onClick={() => setSelected(r)} onDelete={() => deleteResource(r.id)}
                        onEdit={() => { setEditing(r); setShowModal(true) }} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div layout className="flex flex-col gap-2">
                  <AnimatePresence mode="popLayout">
                    {displayed.map(r => (
                      <ResourceRow key={r.id} resource={r} subjectColor={getColor(r.subject)}
                        onClick={() => setSelected(r)} onDelete={() => deleteResource(r.id)}
                        onEdit={() => { setEditing(r); setShowModal(true) }} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </>
          ) : (
            <div className="h-[calc(100vh-180px)] min-h-[500px]">
              <ResourceDetail resource={selected} subjectColor={getColor(selected.subject)}
                onBack={() => setSelected(null)} onUpdate={updateResource} />
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {showModal && (
          <ResourceModal initial={editing} subjects={subjects}
            onSave={saveResource} onCancel={() => { setShowModal(false); setEditing(undefined) }} />
        )}
      </AnimatePresence>
    </div>
  )
}
