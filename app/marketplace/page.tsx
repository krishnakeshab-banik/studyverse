"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar"
import { GradientDots } from "@/components/ui/gradient-dots"
import {
  BookOpen, Brain, ShoppingBag, CalendarDays, MessageSquare, LogOut,
  Search, Filter, ThumbsUp, Eye, Download, Plus, Flame, Star, Target,
  FileText, Play, Link as LinkIcon, DollarSign, User, ChevronRight, Check, Trash2,
  Activity, FolderGit2
} from "lucide-react"

// ─── Types and Config ──────────────────────────────────────────
type ResourceType = "Notes" | "PDF" | "PPT" | "Website" | "Study Guide"

interface MarketItem {
  id: string
  title: string
  description: string
  subject: string
  type: ResourceType
  creator: string
  price: number // 0 means Free
  likes: number
  views: number
  trending: boolean
  isAdded: boolean
}

const TYPE_ICONS: Record<ResourceType, React.ElementType> = {
  "Notes": FileText,
  "PDF": FileText,
  "PPT": Play,
  "Website": LinkIcon,
  "Study Guide": BookOpen
}

const MOCK_MARKETPLACE: MarketItem[] = [
  { id: "m1", title: "Complete Physics Form 4", description: "Comprehensive notes for high school physics covering mechanics and thermal physics.", subject: "Physics", type: "Notes", creator: "Prof. Feynman", price: 0, likes: 1240, views: 5600, trending: true, isAdded: false },
  { id: "m2", title: "Advanced Calculus Cheat Sheet", description: "A highly condensed 2-page PDF of all derivatives and integration formulas.", subject: "Mathematics", type: "PDF", creator: "MathWizard99", price: 0, likes: 3500, views: 12000, trending: true, isAdded: false },
  { id: "m3", title: "Organic Chemistry Reactions", description: "Interactive presentation covering all SN1, SN2, E1, and E2 mechanisms.", subject: "Chemistry", type: "PPT", creator: "ChemMaster", price: 4.99, likes: 850, views: 2100, trending: false, isAdded: false },
  { id: "m4", title: "World War II - Full Study Guide", description: "In-depth guide with timelines, key figures, and practice essay questions.", subject: "History", type: "Study Guide", creator: "Historica", price: 2.50, likes: 420, views: 1100, trending: false, isAdded: false },
  { id: "m5", title: "JavaScript Fundamentals", description: "Interactive website resource for mastering ES6+ concepts and async programming.", subject: "Computer Science", type: "Website", creator: "CodeNinja", price: 0, likes: 980, views: 4300, trending: true, isAdded: false },
  { id: "m6", title: "Macroeconomics Graphs Explained", description: "PDF guide breaking down supply/demand, IS-LM, and AD-AS models.", subject: "Economics", type: "PDF", creator: "Econ101", price: 0, likes: 310, views: 900, trending: false, isAdded: false },
]

// ─── Sidebar Helpers ────────────────────────────────────────
const navLinks = [
  { label: "Library",       href: "/library",     icon: <BookOpen      size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Virtual Study", href: "/study",       icon: <Brain         size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Marketplace",   href: "/marketplace", icon: <ShoppingBag   size={24} className="text-indigo-400 flex-shrink-0" /> },
  { label: "Calendar",      href: "/calendar",    icon: <CalendarDays  size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Projects",      href: "/projects",    icon: <FolderGit2    size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Post Doubts",   href: "/doubts",      icon: <MessageSquare size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Analytics",     href: "/analytics",   icon: <Activity      size={24} className="text-neutral-400 flex-shrink-0" /> },
]

export default function MarketplacePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const [items, setItems] = useState<MarketItem[]>([])
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<string>("All")
  const [filterPrice, setFilterPrice] = useState<string>("All")
  
  useEffect(() => {
    // Load from local storage or use mock
    const stored = localStorage.getItem("studyverse_marketplace")
    if (stored) setItems(JSON.parse(stored))
    else setItems(MOCK_MARKETPLACE)
  }, [])

  const persist = (data: MarketItem[]) => {
    localStorage.setItem("studyverse_marketplace", JSON.stringify(data))
    setItems(data)
  }

  const addToLibrary = (item: MarketItem) => {
    const nr = items.map(i => i.id === item.id ? { ...i, isAdded: true } : i)
    persist(nr)
    
    // Sync to Library local storage
    try {
      const storedLib = localStorage.getItem("studyverse_library_v1")
      let libObj = storedLib ? JSON.parse(storedLib) : { r: [], s: ["Physics", "Chemistry", "Mathematics", "Computer Science"] }
      if (!libObj || Array.isArray(libObj)) libObj = { r: [], s: ["Physics", "Chemistry", "Mathematics", "Computer Science"] }
      
      let resources = Array.isArray(libObj.r) ? libObj.r : []
      let subjects = Array.isArray(libObj.s) ? libObj.s : ["Physics", "Chemistry", "Mathematics", "Computer Science"]
      
      const newLibResource = {
        id: "mkt-" + item.id,
        name: item.title,
        url: "", // Downloadable/Market item
        description: item.description,
        type: item.type === "Study Guide" ? "Book" : item.type, // Approximate type mapping
        subject: item.subject,
        notes: [],
        chat: []
      }
      
      if (!resources.find((r: any) => r.id === newLibResource.id)) {
         resources = [...resources, newLibResource]
      }
      if (!subjects.includes(item.subject)) {
        subjects = [...subjects, item.subject]
      }
      
      localStorage.setItem("studyverse_library_v1", JSON.stringify({ r: resources, s: subjects }))
    } catch(e) { console.error(e) }
  }

  const removeFromLibrary = (item: MarketItem) => {
    const nr = items.map(i => i.id === item.id ? { ...i, isAdded: false } : i)
    persist(nr)
    
    try {
       const storedLib = localStorage.getItem("studyverse_library_v1")
       if (storedLib) {
         let libObj = JSON.parse(storedLib)
         if (libObj && !Array.isArray(libObj) && Array.isArray(libObj.r)) {
            libObj.r = libObj.r.filter((r: any) => r.id !== ("mkt-" + item.id) && r.name !== item.title)
            localStorage.setItem("studyverse_library_v1", JSON.stringify(libObj))
         }
       }
    } catch(e) { console.error(e) }
  }

  const handleLike = (id: string) => {
    const nr = items.map(i => i.id === id ? { ...i, likes: i.likes + 1 } : i)
    persist(nr)
  }

  // Derived state
  const trending = items.filter(i => i.trending).sort((a,b) => b.likes - a.likes)
  
  let displayed = items.filter(i => i.title.toLowerCase().includes(search.toLowerCase()) || i.subject.toLowerCase().includes(search.toLowerCase()))
  if (filterType !== "All") displayed = displayed.filter(i => i.type === filterType)
  if (filterPrice !== "All") displayed = displayed.filter(i => filterPrice === "Free" ? i.price === 0 : i.price > 0)

  // Subcomponents
  const ItemCard = ({ item }: { item: MarketItem }) => {
    const Icon = TYPE_ICONS[item.type] || FileText
    return (
      <div className="group rounded-2xl border border-white/10 bg-[#0e0e0e] hover:bg-[#121212] p-5 transition-all flex flex-col hover:border-indigo-500/30 shadow-lg relative overflow-hidden">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/10 transition-colors">
              <Icon size={18} className="text-gray-400 group-hover:text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold mb-0.5">{item.subject}</p>
              <h3 className="text-white font-semibold line-clamp-1">{item.title}</h3>
            </div>
          </div>
          {item.price === 0 ? (
            <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2 py-1 rounded bg-clip-text border border-emerald-500/20">Free</span>
          ) : (
            <span className="bg-amber-500/10 text-amber-400 text-xs font-bold px-2 py-1 rounded bg-clip-text border border-amber-500/20">${item.price.toFixed(2)}</span>
          )}
        </div>
        
        <p className="text-sm text-gray-400 line-clamp-2 mb-4 leading-relaxed">{item.description}</p>
        
        <div className="flex items-center gap-4 text-xs text-gray-500 font-medium mb-5">
           <div className="flex items-center gap-1.5"><User size={13} /> {item.creator}</div>
           <div className="flex items-center gap-1.5"><Eye size={13} /> {item.views.toLocaleString()}</div>
           <button onClick={() => handleLike(item.id)} className="flex items-center gap-1.5 hover:text-rose-400 transition-colors">
              <ThumbsUp size={13} /> {item.likes.toLocaleString()}
           </button>
        </div>

        <div className="mt-auto border-t border-white/[0.06] pt-4 flex justify-between items-center">
          <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/5 font-medium">{item.type}</span>
          {item.isAdded ? (
            <button onClick={() => removeFromLibrary(item)} className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/20 transition-colors">
              <Trash2 size={14} /> Remove
            </button>
          ) : (
            <button onClick={() => addToLibrary(item)} className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg shadow-lg shadow-indigo-500/20 transition-all">
              <Download size={14} /> Get Resource
            </button>
          )}
        </div>
      </div>
    )
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent relative top-1">Marketplace</h1>
              <p className="text-gray-500 text-sm mt-1">Discover and share top-tier study resources.</p>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
              <Plus size={16} /> Upload Resource
            </button>
          </div>
        </div>

        <div className="flex-1 px-6 pb-6 mt-2 relative z-10 overflow-hidden flex flex-col w-full">
          <div className="flex-1 rounded-3xl border border-white/10 bg-[#0c0c0c] relative overflow-hidden flex flex-col shadow-2xl">
            <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
              <GradientDots backgroundColor="#0c0c0c" />
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 relative z-10 w-full">
              
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 bg-[#0a0a0a] border border-white/10 p-3 rounded-2xl shadow-xl">
                 <div className="relative w-full md:max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or subject..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all" />
                 </div>
                 
                 <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
                     <Filter size={14} className="text-gray-400" />
                     <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-transparent text-xs text-white outline-none cursor-pointer">
                       {["All", "Notes", "PDF", "PPT", "Website", "Study Guide"].map(t => <option key={t} value={t} className="bg-[#0f0f0f]">{t}</option>)}
                     </select>
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
                     <DollarSign size={14} className="text-gray-400" />
                     <select value={filterPrice} onChange={e => setFilterPrice(e.target.value)} className="bg-transparent text-xs text-white outline-none cursor-pointer">
                       <option value="All" className="bg-[#0f0f0f]">All Prices</option>
                       <option value="Free" className="bg-[#0f0f0f]">Free Only</option>
                       <option value="Paid" className="bg-[#0f0f0f]">Premium</option>
                     </select>
                   </div>
                 </div>
              </div>

              {/* Trending Section */}
              {search === "" && filterType === "All" && filterPrice === "All" && trending.length > 0 && (
                <div className="mb-10">
                   <div className="flex items-center gap-2 mb-4">
                     <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                       <Flame size={16} className="text-orange-400" />
                     </div>
                     <h2 className="text-lg font-bold text-white">Trending Now</h2>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                     {trending.slice(0, 3).map(item => <ItemCard key={item.id} item={item} />)}
                   </div>
                </div>
              )}

              {/* Explore Section */}
              <div>
                 <div className="flex items-center gap-2 mb-4">
                   <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                     <Target size={16} className="text-indigo-400" />
                   </div>
                   <h2 className="text-lg font-bold text-white">Explore Resources</h2>
                 </div>
                 
                 {displayed.length === 0 ? (
                   <div className="py-16 flex flex-col items-center justify-center text-center gap-3 border border-white/5 rounded-3xl bg-white/[0.02]">
                     <Search size={32} className="text-gray-600 mb-2" />
                     <p className="text-gray-300 font-semibold">No resources found</p>
                     <p className="text-gray-500 text-sm">Try adjusting your filters or search query.</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                     {displayed.map(item => <ItemCard key={item.id} item={item} />)}
                   </div>
                 )}
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
