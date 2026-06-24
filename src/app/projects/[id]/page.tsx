"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageShell } from "@/components/ui/page-shell"
import { fetchProjectById } from "@/backend/social/projects"
import type { SVProject } from "@/backend/social/types"
import { ArrowLeft, ExternalLink, ShieldAlert, FolderGit2 } from "lucide-react"

export default function RenderProjectIframe() {
  const router = useRouter()
  const { id } = useParams()
  const [project, setProject] = useState<SVProject | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const pid = typeof id === "string" ? id : (Array.isArray(id) ? id[0] : null)
    if (!pid) { setError(true); return }

    fetchProjectById(pid).then(p => {
      if (p) setProject(p)
      else setError(true)
    }).catch(() => setError(true))
  }, [id])

  return (
    <PageShell
      title={project?.title || "Project Viewer"}
      subtitle={project ? `${project.authorName} · ${project.studyverseId}` : "Loading project..."}
      icon={FolderGit2}
      iconAccent="#6366f1"
      noPadding
      contentClassName="p-0 border-0 bg-transparent shadow-none overflow-visible"
    >
      <div className="rounded-2xl border border-white/[0.08] overflow-hidden flex flex-col" style={{ height: "calc(100vh - 220px)" }}>
        <div className="h-14 bg-[#0c0c0c] border-b border-white/10 flex items-center justify-between px-4 shrink-0">
          <button onClick={() => router.push("/projects")} className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to feed
          </button>
          {project && (
            <a href={project.deployedUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl">
              Open Externally <ExternalLink size={14} />
            </a>
          )}
        </div>
        <div className="flex-1 bg-black relative">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <ShieldAlert size={48} className="text-red-500 mb-4" />
              <h1 className="text-xl font-bold text-white mb-2">Project not found</h1>
              <p className="text-gray-400 text-sm">The project may have been removed or the ID is invalid.</p>
              <button onClick={() => router.push("/projects")} className="mt-6 px-6 py-2 bg-white/10 text-white font-bold rounded-xl border border-white/10">Return to feed</button>
            </div>
          ) : project ? (
            <iframe src={project.deployedUrl} className="w-full h-full border-none" style={{ background: "white" }} allow="fullscreen" title={project.title} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
