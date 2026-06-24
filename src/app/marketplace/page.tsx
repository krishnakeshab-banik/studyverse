"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { PageShell, StatCard } from "@/components/ui/page-shell"
import {
  Search, ThumbsUp, Eye, Download, Plus, Flame,
  FileText, Play, Link as LinkIcon, DollarSign, Trash2,
  BookOpen, User, Target, Filter, ShoppingBag, Star, type LucideIcon,
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

const TYPE_ICONS: Record<ResourceType, LucideIcon> = {
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

export default function MarketplacePage() {
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

  const freeCount = items.filter(i => i.price === 0).length
  const addedCount = items.filter(i => i.isAdded).length

  return (
    <PageShell
      title="Marketplace"
      subtitle="Discover and share top-tier study resources"
      icon={ShoppingBag}
      iconAccent="#10b981"
      action={
        <button className="flex items-center gap-2 px-5 h-11 rounded-xl text-sm font-semibold text-white border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all">
          <Plus size={16} /> Upload Resource
        </button>
      }
      stats={
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={ShoppingBag} label="Total listings" value={items.length} accent="#6366f1" />
          <StatCard icon={Flame} label="Trending" value={trending.length} accent="#f97316" />
          <StatCard icon={Star} label="Free resources" value={freeCount} accent="#10b981" />
          <StatCard icon={Download} label="In your library" value={addedCount} accent="#8b5cf6" />
        </div>
      }
      toolbar={
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or subject…"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 h-11 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            <div className="flex items-center gap-2 px-3 h-11 bg-white/[0.04] rounded-xl border border-white/10 shrink-0">
              <Filter size={14} className="text-gray-400" />
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-transparent text-xs text-white outline-none cursor-pointer">
                {["All", "Notes", "PDF", "PPT", "Website", "Study Guide"].map(t => <option key={t} value={t} className="bg-[#0f0f0f]">{t}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 h-11 bg-white/[0.04] rounded-xl border border-white/10 shrink-0">
              <DollarSign size={14} className="text-gray-400" />
              <select value={filterPrice} onChange={e => setFilterPrice(e.target.value)} className="bg-transparent text-xs text-white outline-none cursor-pointer">
                <option value="All" className="bg-[#0f0f0f]">All Prices</option>
                <option value="Free" className="bg-[#0f0f0f]">Free Only</option>
                <option value="Paid" className="bg-[#0f0f0f]">Premium</option>
              </select>
            </div>
          </div>
        </div>
      }
      noPadding
      contentClassName="p-4 sm:p-6"
    >
      {search === "" && filterType === "All" && filterPrice === "All" && trending.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <Flame size={16} className="text-orange-400" />
            </div>
            <h2 className="text-base font-bold text-white">Trending Now</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trending.slice(0, 3).map(item => <ItemCard key={item.id} item={item} />)}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Target size={16} className="text-indigo-400" />
          </div>
          <h2 className="text-base font-bold text-white">Explore Resources</h2>
          <span className="text-xs text-gray-500 ml-auto">{displayed.length} result{displayed.length !== 1 ? "s" : ""}</span>
        </div>

        {displayed.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center gap-3 border border-white/[0.06] rounded-2xl bg-white/[0.02]">
            <Search size={32} className="text-gray-600 mb-1" />
            <p className="text-gray-300 font-semibold">No resources found</p>
            <p className="text-gray-500 text-sm">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayed.map(item => <ItemCard key={item.id} item={item} />)}
          </div>
        )}
      </div>
    </PageShell>
  )
}
