"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { PageShell, StatCard } from "@/components/ui/page-shell"
import {
  Plus, X, Search, ThumbsUp, MessageCircle, FileImage,
  Sparkles, Send, ArrowLeft, Layers, Clock, User, MessageSquare,
} from "lucide-react"

// ─── Types and Config ──────────────────────────────────────────
interface HumanAnswer {
  id: string
  text: string
  author: string
  upvotes: number
}

interface Doubt {
  id: string
  title: string
  description: string
  subject: string
  fileAttached: boolean
  upvotes: number
  isMine: boolean
  timestamp: number
  aiAnswer: string
  answers: HumanAnswer[]
}

const MOCK_DOUBTS: Doubt[] = [
  {
    id: "d1", title: "Applying Kirchhoff's Loop Rule in complex circuits?", description: "I always get the signs wrong when applying the loop rule across multiple voltage sources. Can someone explain a foolproof sign convention?", subject: "Physics", fileAttached: true, upvotes: 42, isMine: false, timestamp: Date.now() - 86400000,
    aiAnswer: "When using Kirchhoff's Voltage Law (KVL), adopt a consistent direction (e.g., clockwise). If you cross a battery from negative to positive, it's a + drop. If you cross a resistor in the same direction as your assumed current, it's a -IR drop. Consistency is key!",
    answers: [
      { id: "a1", text: "I just draw an arrow next to every resistor for current direction. If I walk against the arrow, it's +IR.", author: "Alex F.", upvotes: 12 }
    ]
  },
  {
    id: "d2", title: "Difference between React useEffect and useLayoutEffect?", description: "Both seem to run after render, but I don't get the visual blocking part. When should I strictly use useLayoutEffect?", subject: "Computer Science", fileAttached: false, upvotes: 89, isMine: false, timestamp: Date.now() - 172800000,
    aiAnswer: "`useEffect` runs asynchronously after the browser paints, making it good for side effects like fetching data. `useLayoutEffect` runs synchronously immediately after DOM mutations but before painting. Use it ONLY when you need to read layout from the DOM and synchronously re-render to prevent visual flickering.",
    answers: []
  }
]

export default function DoubtsPage() {
  const [doubts, setDoubts] = useState<Doubt[]>([])
  const [activeTab, setActiveTab] = useState<"Browse" | "Mine">("Browse")
  const [search, setSearch] = useState("")

  const [activeDoubt, setActiveDoubt] = useState<Doubt | null>(null)
  const [showForm, setShowForm] = useState(false)
  
  // Form State
  const [fTitle, setFTitle] = useState("")
  const [fDesc, setFDesc] = useState("")
  const [fSubj, setFSubj] = useState("Mathematics")
  const [fAttached, setFAttached] = useState(false)
  
  // Answer Form
  const [myAnswer, setMyAnswer] = useState("")

  useEffect(() => {
    const stored = localStorage.getItem("studyverse_doubts")
    if (stored) setDoubts(JSON.parse(stored))
    else setDoubts(MOCK_DOUBTS)
  }, [])

  const persist = (data: Doubt[]) => {
    localStorage.setItem("studyverse_doubts", JSON.stringify(data))
    setDoubts(data)
  }

  const postDoubt = () => {
    if (!fTitle.trim() || !fDesc.trim()) return
    const aiResponses = [
      "Here's a structured way to think about this: start by breaking the problem into foundational principles. Often, redefining the core variables clarifies the logic.",
      "This is a common hurdle! Always verify your underlying assumptions. In these cases, mapping out a visual diagram resolves 90% of the ambiguity.",
      "Excellent question. Studies show that tackling this specific category requires isolating variables. Test edge cases first, then apply the general rule."
    ]
    const randomAi = aiResponses[Math.floor(Math.random() * aiResponses.length)]
    
    const newD: Doubt = {
      id: Date.now().toString(),
      title: fTitle.trim(),
      description: fDesc.trim(),
      subject: fSubj,
      fileAttached: fAttached,
      upvotes: 0,
      isMine: true,
      timestamp: Date.now(),
      aiAnswer: randomAi,
      answers: []
    }
    const updated = [newD, ...doubts]
    persist(updated)
    setShowForm(false)
    setActiveTab("Mine")
    setFTitle(""); setFDesc(""); setFAttached(false)
  }

  const postAnswer = () => {
    if (!myAnswer.trim() || !activeDoubt) return
    const nAns: HumanAnswer = { id: Date.now().toString(), text: myAnswer.trim(), author: "You", upvotes: 0 }
    const updated = doubts.map(d => d.id === activeDoubt.id ? { ...d, answers: [...d.answers, nAns] } : d)
    persist(updated)
    setActiveDoubt(updated.find(d => d.id === activeDoubt.id) || null)
    setMyAnswer("")
  }

  const handleUpvote = (id: string, isAnswerId?: string) => {
    const updated = doubts.map(d => {
      if (d.id === id) {
        if (!isAnswerId) return { ...d, upvotes: d.upvotes + 1 }
        return { ...d, answers: d.answers.map(a => a.id === isAnswerId ? { ...a, upvotes: a.upvotes + 1 } : a) }
      }
      return d
    })
    persist(updated)
    if (activeDoubt?.id === id) setActiveDoubt(updated.find(d => d.id === activeDoubt.id) || null)
  }

  let displayed = doubts.filter(d => activeTab === "Browse" ? !d.isMine : d.isMine)
  if (search) displayed = displayed.filter(d => d.title.toLowerCase().includes(search.toLowerCase()) || d.subject.toLowerCase().includes(search.toLowerCase()))
  // Sort by upvotes for Browse, and by latest for Mine
  if (activeTab === "Browse") displayed.sort((a,b) => b.upvotes - a.upvotes)
  else displayed.sort((a,b) => b.timestamp - a.timestamp)

  const totalAnswers = doubts.reduce((a, d) => a + d.answers.length, 0)
  const myDoubts = doubts.filter(d => d.isMine).length

  return (
    <PageShell
      title="Community Doubts"
      subtitle="Ask questions, share knowledge, and learn together"
      icon={MessageSquare}
      iconAccent="#6366f1"
      action={
        !activeDoubt && !showForm ? (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_16px_rgba(99,102,241,0.3)] transition-all">
            <Plus size={16} /> Post a Doubt
          </button>
        ) : undefined
      }
      stats={
        !activeDoubt && !showForm ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <StatCard icon={MessageSquare} label="Total doubts" value={doubts.length} accent="#6366f1" />
            <StatCard icon={MessageCircle} label="Community answers" value={totalAnswers} accent="#10b981" />
            <StatCard icon={User} label="My doubts" value={myDoubts} accent="#f59e0b" />
          </div>
        ) : undefined
      }
      toolbar={
        !activeDoubt && !showForm ? (
          <div className="flex gap-4 border-b border-white/10">
            {(["Browse", "Mine"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn("pb-3 text-sm font-bold transition-all relative border-b-2",
                  activeTab === tab ? "text-indigo-400 border-indigo-500" : "text-gray-500 border-transparent hover:text-gray-300"
                )}>
                {tab === "Mine" ? "My Doubts" : "Explore"}
              </button>
            ))}
          </div>
        ) : undefined
      }
      noPadding
      contentClassName="p-4 sm:p-6"
    >
      <div className="relative z-10 w-full">
               
               {/* ── LIST VIEW ── */}
               {!activeDoubt && !showForm && (
                 <div className="flex flex-col h-full">
                    {activeTab === "Browse" && (
                       <div className="mb-6 relative w-full max-w-lg">
                          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for existing doubts..."
                            className="w-full bg-[#080808] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all shadow-inner" />
                       </div>
                    )}
                    
                    {displayed.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                        <MessageSquare size={32} className="text-gray-700 mb-2" />
                        <p className="text-gray-400 font-medium">No doubts found.</p>
                        <p className="text-gray-600 text-sm">{activeTab === "Mine" ? "You haven't posted any questions yet. Click 'Post a Doubt'!" : "Be the first to ask a question!"}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                         {displayed.map(d => (
                            <div key={d.id} onClick={() => setActiveDoubt(d)} className="group bg-[#080808] border border-white/10 rounded-2xl p-5 hover:border-indigo-500/40 transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/10 flex flex-col h-56">
                               <div className="flex items-center gap-2 mb-3">
                                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">{d.subject}</span>
                                  {d.fileAttached && <FileImage size={14} className="text-gray-500 ml-auto" />}
                               </div>
                               <h3 className="text-white font-bold leading-snug line-clamp-2 mb-2 group-hover:text-indigo-300 transition-colors">{d.title}</h3>
                               <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed mb-auto">{d.description}</p>
                               <div className="flex items-center justify-between border-t border-white/[0.06] pt-4 mt-4">
                                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                     <ThumbsUp size={12} /> {d.upvotes}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                                     <MessageCircle size={14} className="text-gray-600" /> {d.answers.length} {d.answers.length === 1 ? 'Answer' : 'Answers'}
                                  </div>
                               </div>
                            </div>
                         ))}
                      </div>
                    )}
                 </div>
               )}

               {/* ── CREATE FORM ── */}
               {showForm && (
                 <div className="max-w-3xl mx-auto w-full flex flex-col">
                    <button onClick={() => setShowForm(false)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 self-start text-sm font-bold">
                       <ArrowLeft size={16} /> Back to Doubts
                    </button>
                    <div className="bg-[#080808] border border-white/10 rounded-3xl p-8 shadow-2xl">
                       <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Plus className="text-indigo-400" /> Post a New Doubt</h2>
                       
                       <div className="flex flex-col gap-5">
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Doubt Title</label>
                            <input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="e.g. How does recursion work in Python?" autoFocus
                              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/50" />
                          </div>
                          
                          <div className="flex gap-5">
                             <div className="flex-1">
                               <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Subject</label>
                               <select value={fSubj} onChange={e => setFSubj(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer">
                                  {["Physics", "Mathematics", "Computer Science", "Chemistry", "Biology", "History", "Economics"].map(s => <option key={s} value={s}>{s}</option>)}
                               </select>
                             </div>
                             <div className="flex-1">
                               <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Attach Reference Image</label>
                               <button onClick={() => setFAttached(!fAttached)} className={cn("w-full border rounded-xl px-4 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2", fAttached ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "bg-[#0a0a0a] border-white/10 text-gray-400 hover:bg-white/5")}>
                                  <FileImage size={16} /> {fAttached ? "Image Attached" : "Browse Files"}
                               </button>
                             </div>
                          </div>
                          
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Description & Details</label>
                            <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Explain what you are struggling with..." rows={5}
                              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/50 resize-none leading-relaxed" />
                          </div>
                       </div>
                       
                       <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/[0.06]">
                         <button onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-bold hover:bg-white/5 transition-colors">Cancel</button>
                         <button onClick={postDoubt} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"><Send size={16} /> Submit Doubt</button>
                       </div>
                    </div>
                 </div>
               )}

               {/* ── DETAILED VIEW ── */}
               {activeDoubt && !showForm && (
                 <div className="max-w-4xl mx-auto w-full flex flex-col pb-10">
                    <button onClick={() => setActiveDoubt(null)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 self-start text-sm font-bold">
                       <ArrowLeft size={16} /> Back to Doubts
                    </button>
                    
                    {/* The Question */}
                    <div className="bg-[#080808] border border-white/10 rounded-3xl p-8 mb-6 shadow-2xl relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                       <div className="flex items-start justify-between gap-6">
                         <div>
                            <div className="flex items-center gap-3 mb-4">
                              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 flex items-center gap-1.5"><Layers size={12} /> {activeDoubt.subject}</span>
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1"><Clock size={12} /> {new Date(activeDoubt.timestamp).toLocaleDateString()}</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4 leading-snug">{activeDoubt.title}</h2>
                            <p className="text-gray-300 text-sm leading-relaxed max-w-2xl">{activeDoubt.description}</p>
                            {activeDoubt.fileAttached && (
                              <div className="mt-6 flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl w-fit">
                                <FileImage size={18} className="text-gray-400" />
                                <span className="text-sm font-semibold text-gray-300">Reference_Image.png</span>
                              </div>
                            )}
                         </div>
                         <div className="flex flex-col items-center gap-2 bg-[#0a0a0a] border border-white/5 rounded-2xl p-3 shadow-inner">
                            <button onClick={() => handleUpvote(activeDoubt.id)} className="w-10 h-10 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center text-emerald-400 transition-colors border border-emerald-500/20">
                               <ThumbsUp size={18} />
                            </button>
                            <span className="text-sm font-bold text-white">{activeDoubt.upvotes}</span>
                         </div>
                       </div>
                    </div>

                    {/* The AI Answer */}
                    <div className="bg-gradient-to-br from-violet-900/20 to-indigo-900/20 border border-violet-500/20 rounded-3xl p-8 mb-6 shadow-xl relative">
                       <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
                            <Sparkles size={14} className="text-violet-400" />
                          </div>
                          <h3 className="text-base font-bold text-violet-100 tracking-wide">AI Explanation</h3>
                       </div>
                       <p className="text-gray-300 text-sm leading-relaxed font-medium">{activeDoubt.aiAnswer}</p>
                    </div>

                    {/* Human Answers */}
                    <div className="mt-4">
                       <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">Community Answers <span className="bg-white/10 text-gray-300 text-xs px-2 py-0.5 rounded-full">{activeDoubt.answers.length}</span></h3>
                       
                       <div className="flex flex-col gap-4 mb-8">
                         {activeDoubt.answers.map(ans => (
                           <div key={ans.id} className="bg-[#080808] border border-white/5 rounded-2xl p-6 flex gap-4">
                              <div className="shrink-0 flex flex-col items-center gap-1.5">
                                 <button onClick={() => handleUpvote(activeDoubt.id, ans.id)} className="w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center text-emerald-400 transition-colors">
                                   <ThumbsUp size={14} />
                                 </button>
                                 <span className="text-xs font-bold text-gray-400">{ans.upvotes}</span>
                              </div>
                              <div className="flex-1 mt-1">
                                 <div className="flex items-center gap-2 mb-2">
                                   <User size={14} className="text-indigo-400" />
                                   <span className="text-xs font-bold text-indigo-300">{ans.author}</span>
                                 </div>
                                 <p className="text-gray-300 text-sm leading-relaxed">{ans.text}</p>
                              </div>
                           </div>
                         ))}
                         {activeDoubt.answers.length === 0 && (
                           <div className="py-6 flex justify-center border border-dashed border-white/10 rounded-2xl">
                             <p className="text-gray-500 text-sm font-semibold">No community answers yet. Be the first to help out!</p>
                           </div>
                         )}
                       </div>

                       {/* Post Answer */}
                       <div className="bg-[#080808] border border-white/10 rounded-2xl p-4 flex gap-3 shadow-inner">
                         <textarea value={myAnswer} onChange={e => setMyAnswer(e.target.value)} placeholder="Type your answer here to help out..." rows={2}
                            className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 outline-none resize-none pt-2" />
                         <button onClick={postAnswer} className="self-end w-12 h-12 shrink-0 rounded-xl bg-indigo-600 flex items-center justify-center hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                            <Send size={18} className="text-white ml-0.5" />
                         </button>
                       </div>
                    </div>
                 </div>
               )}
      </div>
    </PageShell>
  )
}
