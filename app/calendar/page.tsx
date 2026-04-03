"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar"
import {
  BookOpen, Brain, ShoppingBag, CalendarDays, MessageSquare, LogOut, User,
  ChevronLeft, ChevronRight, Plus, X, Clock, Play, Bell, Calendar as CalIcon, Check, MoreVertical, Trash2,
  Activity, FolderGit2
} from "lucide-react"

// ─── Types and Config ──────────────────────────────────────────
interface StudySession {
  id: string
  subject: string
  topic: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  duration: number // in hours
  reminder: boolean
}

const MOCK_SESSIONS: StudySession[] = [
  { id: "s1", subject: "Physics", topic: "Quantum Mechanics", date: new Date().toISOString().split("T")[0], startTime: "14:00", duration: 2, reminder: true },
  { id: "s2", subject: "Math", topic: "Linear Algebra Exam Prep", date: new Date().toISOString().split("T")[0], startTime: "18:00", duration: 1.5, reminder: false },
]

// ─── Sidebar Helpers ────────────────────────────────────────
const navLinks = [
  { label: "Library",       href: "/library",     icon: <BookOpen      size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Virtual Study", href: "/study",       icon: <Brain         size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Marketplace",   href: "/marketplace", icon: <ShoppingBag   size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Calendar",      href: "/calendar",    icon: <CalendarDays  size={24} className="text-indigo-400 flex-shrink-0" /> },
  { label: "Post Doubts",   href: "/doubts",      icon: <MessageSquare size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Analytics",     href: "/analytics",   icon: <Activity      size={24} className="text-neutral-400 flex-shrink-0" /> },
]

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function CalendarPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  
  const [sessions, setSessions] = useState<StudySession[]>([])
  
  // Form State
  const [showForm, setShowForm] = useState(false)
  const [formSubj, setFormSubj] = useState("")
  const [formTopic, setFormTopic] = useState("")
  const [formTime, setFormTime] = useState("12:00")
  const [formDur, setFormDur] = useState("1")
  const [formRemind, setFormRemind] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("studyverse_calendar")
    if (stored) setSessions(JSON.parse(stored))
    else setSessions(MOCK_SESSIONS)
  }, [])

  const persist = (data: StudySession[]) => {
    localStorage.setItem("studyverse_calendar", JSON.stringify(data))
    setSessions(data)
  }

  // Calendar Logic
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const handleDayClick = (dayStr: string) => {
    setSelectedDate(dayStr)
    setShowForm(false)
  }

  const addSession = () => {
    if (!formSubj.trim()) return
    const newSession: StudySession = {
      id: Date.now().toString(),
      subject: formSubj.trim(),
      topic: formTopic.trim(),
      date: selectedDate,
      startTime: formTime,
      duration: parseFloat(formDur) || 1,
      reminder: formRemind
    }
    persist([...sessions, newSession])
    setShowForm(false)
    setFormSubj(""); setFormTopic(""); setFormTime("12:00"); setFormDur("1"); setFormRemind(false)
  }

  const deleteSession = (id: string) => persist(sessions.filter(s => s.id !== id))

  const selectedSessions = sessions.filter(s => s.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime))
  
  // Calculate grid rendering
  const renderCalendarDays = () => {
    const blanks = Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`blank-${i}`} className="p-2 opacity-0 pointer-events-none" />)
    const days = Array.from({ length: daysInMonth }).map((_, i) => {
      const dayNum = i + 1
      const isToday = new Date().toDateString() === new Date(year, month, dayNum).toDateString()
      const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`
      const isSelected = selectedDate === dayStr
      const daySessions = sessions.filter(s => s.date === dayStr)
      
      return (
        <button key={dayNum} onClick={() => handleDayClick(dayStr)}
          className={cn(
            "h-24 p-3 rounded-2xl flex flex-col items-start transition-all relative overflow-hidden group border",
            isSelected ? "border-indigo-500 bg-indigo-500/10" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]",
            isToday && !isSelected && "border-white/20"
          )}>
          <span className={cn("text-sm font-semibold mb-1 w-7 h-7 flex items-center justify-center rounded-full",
             isToday ? "bg-white text-black" : isSelected ? "text-indigo-400" : "text-gray-400"
          )}>{dayNum}</span>
          
          <div className="flex flex-col gap-1 w-full mt-auto">
            {daySessions.slice(0, 2).map((s, idx) => (
              <div key={idx} className="w-full text-left truncate text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                {s.startTime} - {s.subject}
              </div>
            ))}
            {daySessions.length > 2 && (
              <div className="text-[10px] text-gray-500 px-1 font-medium">+{daySessions.length - 2} more</div>
            )}
          </div>
        </button>
      )
    })
    return [...blanks, ...days]
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
        <div className="px-6 pt-6 shrink-0 relative z-10 w-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent relative top-1">Calendar</h1>
              <p className="text-gray-500 text-sm mt-1">Plan, schedule, and meticulously manage your study time.</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 pb-6 mt-2 relative z-10 overflow-hidden flex flex-col w-full">
          <div className="flex-1 rounded-3xl border border-white/10 bg-[#0c0c0c] relative overflow-hidden flex flex-col shadow-2xl">
            
            <div className="flex-1 overflow-y-auto p-6 relative z-10 w-full flex flex-col lg:flex-row gap-6">
              
              {/* Left Side: Calendar Grid */}
              <div className="flex-[2] flex flex-col min-w-0">
                 {/* Calendar Header */}
                 <div className="flex items-center justify-between mb-6 bg-white/[0.03] border border-white/10 p-3 rounded-2xl">
                    <h2 className="text-xl font-bold text-white px-3 tracking-wide">{MONTHS[month]} <span className="text-gray-500 font-medium ml-1">{year}</span></h2>
                    <div className="flex items-center gap-2">
                       <button onClick={prevMonth} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                         <ChevronLeft size={18} className="text-gray-300" />
                       </button>
                       <button onClick={nextMonth} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                         <ChevronRight size={18} className="text-gray-300" />
                       </button>
                    </div>
                 </div>

                 {/* Days Header */}
                 <div className="grid grid-cols-7 gap-3 mb-3">
                   {DAYS.map(d => (
                     <div key={d} className="text-center text-xs font-semibold text-gray-500 uppercase tracking-widest">{d}</div>
                   ))}
                 </div>

                 {/* Calendar Days */}
                 <div className="grid grid-cols-7 gap-3 pb-8">
                   {renderCalendarDays()}
                 </div>
              </div>

              {/* Right Side: Schedule & Details */}
              <div className="flex-1 w-full lg:max-w-md flex flex-col gap-6">
                
                {/* Add Session Form or Schedule List */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col flex-1 overflow-hidden">
                   
                   <div className="flex items-center justify-between mb-6 shrink-0">
                     <div>
                       <h3 className="text-white font-bold text-lg flex items-center gap-2">
                         <CalIcon size={18} className="text-indigo-400" /> 
                         {selectedDate === new Date().toISOString().split("T")[0] ? "Today's Plan" : new Date(selectedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                       </h3>
                       <p className="text-gray-500 text-xs mt-1">{selectedSessions.length} session{selectedSessions.length !== 1 ? "s" : ""} scheduled</p>
                     </div>
                     {!showForm && (
                       <button onClick={() => setShowForm(true)} className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                         <Plus size={16} className="text-white" />
                       </button>
                     )}
                   </div>

                   {showForm ? (
                     <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 flex-1 overflow-y-auto pr-2 pb-2">
                       <div className="flex flex-col gap-1.5">
                         <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Subject</label>
                         <input value={formSubj} onChange={e => setFormSubj(e.target.value)} placeholder="e.g. Mathematics" className="border border-white/10 bg-white/5 rounded-xl px-3 h-10 text-sm text-white outline-none focus:border-indigo-500/50" />
                       </div>
                       <div className="flex flex-col gap-1.5">
                         <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Topic (Optional)</label>
                         <input value={formTopic} onChange={e => setFormTopic(e.target.value)} placeholder="e.g. Calculus Integration" className="border border-white/10 bg-white/5 rounded-xl px-3 h-10 text-sm text-white outline-none focus:border-indigo-500/50" />
                       </div>
                       <div className="flex flex-col gap-1.5">
                         <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Start Time</label>
                         <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="border border-white/10 bg-white/5 rounded-xl px-3 h-10 text-sm text-white outline-none focus:border-indigo-500/50 w-full" />
                       </div>
                       <div className="flex flex-col gap-1.5">
                         <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Duration (Hours)</label>
                         <input type="number" step="0.5" value={formDur} onChange={e => setFormDur(e.target.value)} placeholder="e.g. 1.5" className="border border-white/10 bg-white/5 rounded-xl px-3 h-10 text-sm text-white outline-none focus:border-indigo-500/50" />
                       </div>
                       <div className="flex items-center gap-3 mt-2 bg-white/[0.03] p-3 rounded-xl border border-white/5">
                         <button onClick={() => setFormRemind(!formRemind)} className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", formRemind ? "bg-indigo-600 border-indigo-600" : "border-gray-600")}>
                           {formRemind && <Check size={12} className="text-white" />}
                         </button>
                         <label className="text-sm text-gray-300 flex items-center gap-2 cursor-pointer" onClick={() => setFormRemind(!formRemind)}>
                           <Bell size={14} className={formRemind ? "text-amber-400" : "text-gray-500"} /> Enable Reminders
                         </label>
                       </div>
                       
                       <div className="flex gap-2 mt-auto pt-4">
                         <button onClick={() => setShowForm(false)} className="flex-1 h-10 rounded-xl border border-white/10 text-gray-400 text-xs font-bold hover:bg-white/5 transition-colors">Cancel</button>
                         <button onClick={addSession} className="flex-1 h-10 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all">Schedule</button>
                       </div>
                     </div>
                   ) : (
                     <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
                       {selectedSessions.length === 0 ? (
                         <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-10">
                           <CalendarDays size={32} className="text-gray-700 mb-2" />
                           <p className="text-gray-400 font-medium text-sm">No sessions scheduled.</p>
                           <p className="text-gray-600 text-xs px-6">Rest today or click + to plan ahead.</p>
                         </div>
                       ) : (
                         selectedSessions.map(s => (
                           <div key={s.id} className="group relative bg-[#0e0e0e] border border-white/10 rounded-xl p-4 flex flex-col gap-3 hover:border-indigo-500/30 transition-colors">
                              <div className="flex justify-between items-start">
                                 <div>
                                   <p className="text-xs text-indigo-400 font-bold tracking-wider uppercase mb-0.5">{s.subject}</p>
                                   <h4 className="text-white font-semibold text-sm line-clamp-1">{s.topic || "General Study"}</h4>
                                 </div>
                                 <button onClick={() => deleteSession(s.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-gray-500 transition-all">
                                   <Trash2 size={14} />
                                 </button>
                              </div>
                              <div className="flex items-center gap-4 text-xs font-medium mt-1">
                                <div className="flex items-center gap-1.5 text-gray-300 bg-white/5 py-1 px-2 rounded-lg">
                                  <Clock size={12} className="text-gray-400" /> {s.startTime}
                                </div>
                                <div className="text-gray-500">{s.duration} hr{s.duration !== 1 && "s"}</div>
                                {s.reminder && (
                                  <div className="flex items-center gap-1 text-amber-400 ml-auto">
                                    <Bell size={12} className="fill-amber-400/20" /> Alert
                                  </div>
                                )}
                              </div>
                           </div>
                         ))
                       )}
                       
                       <div className="mt-auto border-t border-white/[0.06] pt-4">
                         <div className="flex items-center justify-between text-xs">
                           <span className="text-gray-500 font-medium">Planned Focus Time</span>
                           <span className="text-indigo-400 font-bold">{selectedSessions.reduce((acc, s) => acc + s.duration, 0)} hrs</span>
                         </div>
                       </div>
                     </div>
                   )}
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
