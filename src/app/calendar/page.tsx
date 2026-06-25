"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { PageShell, StatCard } from "@/components/ui/page-shell"
import {
  ChevronLeft, ChevronRight, Plus, Clock, Bell, Calendar as CalIcon, Check, Trash2,
  CalendarDays,
} from "lucide-react"
import { collection, addDoc, deleteDoc, doc, getDocs, query, where, serverTimestamp, Timestamp, writeBatch, onSnapshot } from "firebase/firestore"
import { getClientDb } from "@/backend/db/firebase"
import { useAuth } from "@/context/AuthContext"

// ─── Types and Config ──────────────────────────────────────────
interface StudySession {
  id: string
  subject: string
  topic: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  duration: number // in hours
  reminder: boolean
  userId?: string
  userEmail?: string | null
  scheduledStartTime?: any // Firestore Timestamp
  reminderMinutes?: number
  reminderSent?: boolean
  googleSynced?: boolean
  googleEventId?: string
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const getLocalDateString = (d: Date = new Date()) => {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

const formatSelectedDate = (dateStr: string) => {
  const [yyyy, mm, dd] = dateStr.split("-").map(Number)
  const dateObj = new Date(yyyy, mm - 1, dd)
  return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function CalendarPage() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString())
  
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Form State
  const [showForm, setShowForm] = useState(false)
  const [formSubj, setFormSubj] = useState("")
  const [formTopic, setFormTopic] = useState("")
  const [formTime, setFormTime] = useState("12:00")
  const [formDur, setFormDur] = useState("1")
  const [formRemind, setFormRemind] = useState(false)
  const [formReminderMinutes, setFormReminderMinutes] = useState(30)

  // Google Calendar Integration State
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false)
  const [googleEmail, setGoogleEmail] = useState("")

  // Monitor Google Calendar connection status
  useEffect(() => {
    if (!user) {
      setGoogleCalendarConnected(false)
      setGoogleEmail("")
      return
    }

    const unsub = onSnapshot(doc(getClientDb(), "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        setGoogleCalendarConnected(!!data.googleCalendarConnected)
        setGoogleEmail(data.googleEmail || "")
      } else {
        setGoogleCalendarConnected(false)
        setGoogleEmail("")
      }
    }, (error) => {
      console.error("Error listening to user document updates:", error)
    })

    return () => unsub()
  }, [user])

  const handleConnectGoogle = () => {
    if (!user) return

    const width = 600
    const height = 650
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    const popup = window.open(
      `/api/auth/google/login?uid=${user.uid}`,
      "Connect Google Calendar",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
    )

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === "GOOGLE_CALENDAR_CONNECTED") {
        setGoogleCalendarConnected(true)
        setGoogleEmail(event.data.email)
        window.removeEventListener("message", handleMessage)
      }
      if (event.data?.type === "GOOGLE_CALENDAR_ERROR") {
        alert(event.data.error || "Failed to connect Google Calendar.")
        window.removeEventListener("message", handleMessage)
      }
    }

    window.removeEventListener("message", handleMessage)
    window.addEventListener("message", handleMessage)
  }

  const handleDisconnectGoogle = async () => {
    if (!user) return
    if (!confirm("Are you sure you want to disconnect Google Calendar?")) return

    try {
      const response = await fetch("/api/auth/google/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.uid }),
      })

      if (!response.ok) {
        throw new Error("Failed to disconnect")
      }

      setGoogleCalendarConnected(false)
      setGoogleEmail("")
    } catch (error) {
      console.error("Error disconnecting Google Calendar:", error)
      alert("Failed to disconnect Google Calendar. Please try again.")
    }
  }

  const loadSessions = async () => {
    if (!user) {
      setSessions([])
      setIsLoading(false)
      return
    }
    
    try {
      setIsLoading(true)
      const q = query(
        collection(getClientDb(), "calendar_sessions"),
        where("userId", "==", user.uid)
      )
      const querySnapshot = await getDocs(q)
      const fetchedSessions: StudySession[] = []
      
      const batch = writeBatch(getClientDb())
      let hasMigrations = false

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data()
        
        // Migration logic for old documents
        if (!data.scheduledStartTime && data.date && data.startTime) {
          const [year, month, day] = data.date.split("-").map(Number)
          const [hour, minute] = data.startTime.split(":").map(Number)
          const dateObj = new Date(year, month - 1, day, hour, minute)
          
          data.scheduledStartTime = Timestamp.fromDate(dateObj)
          data.reminderMinutes = data.reminderMinutes || 30
          data.reminderSent = data.reminderSent || false
          
          batch.update(docSnap.ref, {
            scheduledStartTime: data.scheduledStartTime,
            reminderMinutes: data.reminderMinutes,
            reminderSent: data.reminderSent
          })
          hasMigrations = true
        }

        fetchedSessions.push({ id: docSnap.id, ...data } as StudySession)
      })
      
      if (hasMigrations) {
        await batch.commit().catch(console.error)
      }
      
      setSessions(fetchedSessions)
    } catch (error) {
      console.error("Firestore error loading sessions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [user])

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

  const addSession = async () => {
    if (!formSubj.trim() || !user) return
    
    try {
      const [year, month, day] = selectedDate.split("-").map(Number)
      const [hour, minute] = formTime.split(":").map(Number)
      const scheduledDateObj = new Date(year, month - 1, day, hour, minute)

      const newSessionData = {
        subject: formSubj.trim(),
        topic: formTopic.trim(),
        date: selectedDate,
        startTime: formTime,
        duration: parseFloat(formDur) || 1,
        reminder: formRemind,
        reminderMinutes: formRemind ? formReminderMinutes : 30,
        reminderSent: false,
        scheduledStartTime: Timestamp.fromDate(scheduledDateObj),
        userId: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp()
      }
      
      const docRef = await addDoc(collection(getClientDb(), "calendar_sessions"), newSessionData)
      
      const sessionWithId = { id: docRef.id, ...newSessionData } as StudySession
      setSessions([...sessions, sessionWithId])
      setShowForm(false)
      setFormSubj(""); setFormTopic(""); setFormTime("12:00"); setFormDur("1"); setFormRemind(false); setFormReminderMinutes(30)

      // If Google Calendar is connected, sync immediately
      if (googleCalendarConnected) {
        console.log("[Google Calendar Sync] Initiating immediate sync for session:", docRef.id)
        fetch("/api/calendar/event", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId: docRef.id, userId: user.uid }),
        })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            if (data.success) {
              // Update local state to reflect that it was successfully synced
              setSessions(prev => prev.map(s => s.id === docRef.id ? { ...s, googleSynced: true, googleEventId: data.googleEventId } : s))
            } else {
              console.error("Failed to sync to Google Calendar:", data.error)
            }
          }
        })
        .catch(err => console.error("Immediate Google Calendar sync failed:", err))
      }
    } catch (error) {
      console.error("Firestore error adding session:", error)
    }
  }

  const deleteSession = async (id: string) => {
    try {
      const sessionToDelete = sessions.find(s => s.id === id)
      if (sessionToDelete?.googleEventId && user) {
        console.log("[Google Calendar Sync] Deleting event from Google Calendar:", sessionToDelete.googleEventId)
        fetch(`/api/calendar/event?googleEventId=${sessionToDelete.googleEventId}&userId=${user.uid}`, {
          method: "DELETE",
        }).catch(err => console.error("Failed to delete Google Calendar event:", err))
      }

      await deleteDoc(doc(getClientDb(), "calendar_sessions", id))
      setSessions(sessions.filter(s => s.id !== id))
    } catch (error) {
      console.error("Firestore error deleting session:", error)
    }
  }

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
            "h-14 sm:h-20 lg:h-24 p-1.5 sm:p-2 lg:p-3 rounded-xl sm:rounded-2xl flex flex-col items-start transition-all relative overflow-hidden group border min-w-0",
            isSelected ? "border-indigo-500 bg-indigo-500/10" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]",
            isToday && !isSelected && "border-white/20"
          )}>
          <span className={cn("text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full",
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

  const totalSessions = sessions.length
  const todaySessions = sessions.filter(s => s.date === getLocalDateString()).length
  const totalHours = sessions.reduce((a, s) => a + s.duration, 0)

  return (
    <PageShell
      title="Calendar"
      subtitle="Plan, schedule, and manage your study time"
      icon={CalIcon}
      iconAccent="#6366f1"
      stats={
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard icon={CalIcon} label="Total sessions" value={totalSessions} accent="#6366f1" />
          <StatCard icon={Clock} label="Today's sessions" value={todaySessions} accent="#10b981" />
          <StatCard icon={Bell} label="Planned hours" value={`${totalHours.toFixed(1)}h`} accent="#f59e0b" />
        </div>
      }
      noPadding
      contentClassName="p-4 sm:p-6"
    >
      <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Left Side: Calendar Grid */}
              <div className="flex-[2] flex flex-col min-w-0">
                 {/* Calendar Header */}
                 <div className="flex items-center justify-between mb-4 sm:mb-6 bg-white/[0.03] border border-white/10 p-2 sm:p-3 rounded-2xl gap-2">
                    <h2 className="text-base sm:text-xl font-bold text-white px-1 sm:px-3 tracking-wide truncate">{MONTHS[month]} <span className="text-gray-500 font-medium ml-1">{year}</span></h2>
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
                 <div className="grid grid-cols-7 gap-1 sm:gap-2 lg:gap-3 mb-2 sm:mb-3">
                   {DAYS.map(d => (
                     <div key={d} className="text-center text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider sm:tracking-widest truncate">{d.slice(0, 3)}</div>
                   ))}
                 </div>

                 {/* Calendar Days */}
                 <div className="grid grid-cols-7 gap-1 sm:gap-2 lg:gap-3 pb-8">
                   {renderCalendarDays()}
                 </div>
              </div>

              {/* Right Side: Schedule & Details */}
              <div className="flex-1 w-full lg:max-w-md flex flex-col gap-6">
                
                {/* Google Calendar Sync Panel */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <CalIcon size={18} className="text-indigo-400" />
                    Sync Google Calendar
                  </h3>
                  {googleCalendarConnected ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-emerald-500">🟢</span>
                        <span className="font-semibold">Google Calendar Connected</span>
                      </div>
                      <div className="text-xs text-gray-500 font-medium">
                        Connected Account: <span className="text-gray-300 font-mono">{googleEmail}</span>
                      </div>
                      <button
                        onClick={handleDisconnectGoogle}
                        className="w-full mt-1 h-10 rounded-xl border border-red-500/30 hover:border-red-500/50 text-red-400 text-xs font-bold hover:bg-red-500/5 transition-all"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="text-gray-600">⚪</span>
                        <span>Google Calendar Not Connected</span>
                      </div>
                      <button
                        onClick={handleConnectGoogle}
                        className="w-full mt-1 h-10 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        Connect Google Calendar
                      </button>
                    </div>
                  )}
                </div>

                {/* Add Session Form or Schedule List */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col flex-1 overflow-hidden">
                   
                   <div className="flex items-center justify-between mb-6 shrink-0">
                     <div>
                       <h3 className="text-white font-bold text-lg flex items-center gap-2">
                         <CalIcon size={18} className="text-indigo-400" /> 
                         {selectedDate === getLocalDateString() ? "Today's Plan" : formatSelectedDate(selectedDate)}
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
                       
                        <div className="flex flex-col gap-3 mt-2 bg-white/[0.03] p-3 rounded-xl border border-white/5">
                          <div 
                            onClick={() => setFormRemind(!formRemind)} 
                            className="flex items-center gap-3 cursor-pointer select-none"
                          >
                            <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", formRemind ? "bg-indigo-600 border-indigo-600" : "border-gray-600")}>
                              {formRemind && <Check size={12} className="text-white" />}
                            </div>
                            <span className="text-sm text-gray-300 flex items-center gap-2">
                              <Bell size={14} className={formRemind ? "text-amber-400" : "text-gray-500"} /> Enable Reminders
                            </span>
                          </div>
                          
                          {formRemind && (
                            <div className="flex flex-col gap-1.5 pl-8 animate-in fade-in slide-in-from-top-1 duration-200">
                              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Reminder Time</label>
                              <select
                                value={formReminderMinutes}
                                onChange={(e) => setFormReminderMinutes(Number(e.target.value))}
                                className="border border-white/10 bg-black/40 text-gray-300 rounded-lg px-2 h-9 text-xs outline-none focus:border-indigo-500/50"
                              >
                                <option value="5" className="bg-[#0c0c0c] text-white">5 Minutes</option>
                                <option value="10" className="bg-[#0c0c0c] text-white">10 Minutes</option>
                                <option value="15" className="bg-[#0c0c0c] text-white">15 Minutes</option>
                                <option value="30" className="bg-[#0c0c0c] text-white">30 Minutes</option>
                                <option value="60" className="bg-[#0c0c0c] text-white">1 Hour</option>
                                <option value="1440" className="bg-[#0c0c0c] text-white">1 Day</option>
                              </select>
                            </div>
                          )}
                        </div>

                       <div className="flex gap-2 mt-auto pt-4">
                         <button onClick={() => setShowForm(false)} className="flex-1 h-10 rounded-xl border border-white/10 text-gray-400 text-xs font-bold hover:bg-white/5 transition-colors">Cancel</button>
                         <button onClick={addSession} className="flex-1 h-10 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all">Schedule</button>
                       </div>
                     </div>
                   ) : (
                     <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
                       {isLoading ? (
                         <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-10">
                           <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-2" />
                           <p className="text-gray-400 font-medium text-sm">Loading sessions...</p>
                         </div>
                       ) : selectedSessions.length === 0 ? (
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
    </PageShell>
  )
}
