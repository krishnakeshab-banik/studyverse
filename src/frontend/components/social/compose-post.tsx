"use client"

import { useState, useMemo, useRef } from "react"
import { cn } from "@/lib/utils"
import type { LeetCodeProblem, PostCategory } from "@/backend/social/types"
import { Send, Search, ImagePlus, X } from "lucide-react"

const CATEGORIES: PostCategory[] = ["general", "project", "leetcode"]
const MAX_IMAGES = 4

interface ComposePostProps {
  onSubmit: (input: {
    category: PostCategory
    text: string
    imageFiles?: File[]
    projectUrl?: string
    leetcodeSlug?: string
  }) => Promise<void>
  disabled?: boolean
  leetcodeProblems?: LeetCodeProblem[]
}

export function ComposePost({ onSubmit, disabled, leetcodeProblems = [] }: ComposePostProps) {
  const [category, setCategory] = useState<PostCategory>("general")
  const [text, setText] = useState("")
  const [projectUrl, setProjectUrl] = useState("")
  const [leetcodeSlug, setLeetcodeSlug] = useState("")
  const [leetcodeTitle, setLeetcodeTitle] = useState("")
  const [problemQuery, setProblemQuery] = useState("")
  const [showPicker, setShowPicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredProblems = useMemo(() => {
    if (!problemQuery.trim()) return leetcodeProblems.slice(0, 8)
    const q = problemQuery.toLowerCase()
    return leetcodeProblems.filter(p =>
      p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
    ).slice(0, 8)
  }, [leetcodeProblems, problemQuery])

  const selectProblem = (p: LeetCodeProblem) => {
    setLeetcodeSlug(p.slug)
    setLeetcodeTitle(p.title)
    setProblemQuery(p.title)
    setShowPicker(false)
  }

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const next = [...imageFiles, ...files].slice(0, MAX_IMAGES)
    setImageFiles(next)
    setImagePreviews(next.map(f => URL.createObjectURL(f)))
    e.target.value = ""
  }

  const removeImage = (idx: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx))
    setImagePreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if ((!text.trim() && imageFiles.length === 0) || submitting) return
    setSubmitting(true)
    try {
      await onSubmit({
        category,
        text: text.trim(),
        imageFiles: imageFiles.length ? imageFiles : undefined,
        projectUrl: category === "project" ? projectUrl : undefined,
        leetcodeSlug: category === "leetcode" ? (leetcodeSlug || problemQuery.trim().replace(/\s+/g, "-").toLowerCase()) : undefined,
      })
      setText("")
      setProjectUrl("")
      setLeetcodeSlug("")
      setLeetcodeTitle("")
      setProblemQuery("")
      setImageFiles([])
      setImagePreviews([])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 mb-4">
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit mb-3 overflow-x-auto scrollbar-thin">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all shrink-0",
              category === cat ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-300",
            )}
          >
            {cat}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="What's happening?"
        rows={3}
        maxLength={500}
        disabled={disabled || submitting}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
      />
      {imagePreviews.length > 0 && (
        <div className={cn(
          "mt-3 grid gap-2 rounded-xl overflow-hidden",
          imagePreviews.length === 1 ? "grid-cols-1" : "grid-cols-2",
        )}>
          {imagePreviews.map((src, i) => (
            <div key={src} className="relative aspect-video bg-black/40 rounded-lg overflow-hidden group">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {category === "project" && (
        <input
          value={projectUrl}
          onChange={e => setProjectUrl(e.target.value)}
          placeholder="Project URL (optional)"
          className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/40"
        />
      )}
      {category === "leetcode" && (
        <div className="mt-2 relative">
          {leetcodeProblems.length > 0 ? (
            <>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={problemQuery}
                  onChange={e => { setProblemQuery(e.target.value); setShowPicker(true); setLeetcodeSlug("") }}
                  onFocus={() => setShowPicker(true)}
                  placeholder="Search synced problems or type slug..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              {leetcodeTitle && leetcodeSlug && (
                <p className="text-[11px] text-amber-400 mt-1.5">
                  Selected: {leetcodeTitle} ({leetcodeSlug})
                </p>
              )}
              {showPicker && filteredProblems.length > 0 && (
                <div className="absolute z-10 w-full mt-1 rounded-xl border border-white/10 bg-[#0f0f0f] shadow-xl overflow-hidden">
                  {filteredProblems.map(p => (
                    <button
                      key={p.slug}
                      type="button"
                      onClick={() => selectProblem(p)}
                      className="w-full text-left px-3 py-2.5 text-sm text-gray-200 hover:bg-white/5 flex items-center justify-between gap-2"
                    >
                      <span className="truncate">{p.title}</span>
                      <span className="text-[10px] text-gray-500 shrink-0">{p.difficulty}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <input
              value={leetcodeSlug}
              onChange={e => setLeetcodeSlug(e.target.value)}
              placeholder="LeetCode slug (e.g. two-sum)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          )}
        </div>
      )}
      <div className="flex items-center justify-between mt-3 gap-2">
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || submitting || imageFiles.length >= MAX_IMAGES}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-400 hover:bg-indigo-500/10 disabled:opacity-40 transition-colors"
          >
            <ImagePlus size={16} /> Photo
          </button>
          <span className="text-[10px] text-gray-600">{text.length}/500</span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={disabled || submitting || (!text.trim() && imageFiles.length === 0)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition-all"
        >
          <Send size={14} /> {submitting ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  )
}
