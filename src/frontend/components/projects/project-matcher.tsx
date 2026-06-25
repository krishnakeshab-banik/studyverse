"use client"

import { useState } from "react"
import type { SVProject } from "@/backend/social/types"
import { matchProjects } from "@/backend/social/project-match"
import { Sparkles, Search, ArrowRight } from "lucide-react"

interface ProjectMatcherProps {
  projects: SVProject[]
  onOpenProject: (project: SVProject) => void
}

export function ProjectMatcher({ projects, onOpenProject }: ProjectMatcherProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ReturnType<typeof matchProjects>>([])
  const [searched, setSearched] = useState(false)

  const handleSearch = () => {
    if (!query.trim()) return
    setResults(matchProjects(query, projects))
    setSearched(true)
  }

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-transparent p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
          <Sparkles size={16} className="text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">AI Project Finder</h3>
          <p className="text-[11px] text-gray-500">Describe what you need — we match community projects</p>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="e.g. React dashboard with charts for student analytics..."
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 h-11 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/40"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!query.trim()}
          className="px-4 h-11 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold disabled:opacity-40 shrink-0 flex items-center gap-1.5"
        >
          <Sparkles size={14} /> Match
        </button>
      </div>
      {searched && (
        <div className="mt-4 space-y-2">
          {results.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">No close matches found. Try different keywords.</p>
          ) : (
            results.map(({ project, score, matchedTerms }) => (
              <button
                key={project.id}
                onClick={() => onOpenProject(project)}
                className="w-full text-left rounded-xl border border-white/[0.08] bg-black/30 hover:bg-white/[0.04] hover:border-violet-500/30 p-4 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{project.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{project.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {matchedTerms.map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/20">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs font-bold text-emerald-400">{Math.round(score * 100)}% match</span>
                    <ArrowRight size={14} className="text-gray-600 group-hover:text-violet-400 mt-2 ml-auto transition-colors" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
