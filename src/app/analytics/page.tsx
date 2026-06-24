"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { PageShell, StatCard } from "@/components/ui/page-shell"
import {
  Activity, ExternalLink, RefreshCw, AlertTriangle, CheckCircle2, Monitor, Map, BarChart3,
} from "lucide-react"

const PROD_DOMAINS = ["github.com", "stackoverflow.com", "wikipedia.org", "localhost", "127.0.0.1", "khanacademy.org", "coursera.org", "docs.google.com"]
const DIST_DOMAINS = ["youtube.com", "facebook.com", "instagram.com", "twitter.com", "reddit.com", "tiktok.com", "netflix.com", "twitch.tv", "discord.com"]

export default function AnalyticsPage() {
  const [extInstalled, setExtInstalled] = useState(false)
  const [data, setData] = useState<Record<string, number> | null>(null)
  const [loading, setLoading] = useState(true)

  const requestData = () => {
    setLoading(true)
    window.postMessage({ type: "STUDYVERSE_REQ_DATA" }, "*")
    setTimeout(() => setLoading(false), 2000) // Fallback if no response
  }

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== window) return
      if (e.data?.type === "STUDYVERSE_EXT_INSTALLED") {
        setExtInstalled(true)
        window.postMessage({ type: "STUDYVERSE_REQ_DATA" }, "*")
      }
      if (e.data?.type === "STUDYVERSE_RES_DATA") {
        setExtInstalled(true)
        setData(e.data.data)
        setLoading(false)
      }
    }
    window.addEventListener("message", onMsg)
    
    // Initial ping
    requestData()
    // Periodic refresh
    const int = setInterval(requestData, 10000)
    
    return () => {
      window.removeEventListener("message", onMsg)
      clearInterval(int)
    }
  }, [])

  // ─── Analytics Computations ───
  let totalTime = 0
  let prodTime = 0
  let distTime = 0
  let uncatTime = 0
  const sortedDomains: { domain: string; ms: number }[] = []

  if (data) {
    Object.entries(data).forEach(([domain, ms]) => {
      totalTime += ms
      if (PROD_DOMAINS.some(d => domain.includes(d))) prodTime += ms
      else if (DIST_DOMAINS.some(d => domain.includes(d))) distTime += ms
      else uncatTime += ms
      
      sortedDomains.push({ domain, ms })
    })
    sortedDomains.sort((a,b) => b.ms - a.ms)
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return "0s"
    const secs = Math.floor(ms / 1000)
    if (secs < 60) return `${secs}s`
    const mins = Math.floor(secs / 60)
    if (mins < 60) return `${mins}m ${secs % 60}s`
    const hrs = Math.floor(mins / 60)
    return `${hrs}h ${mins % 60}m`
  }

  const getCatColor = (domain: string) => {
    if (PROD_DOMAINS.some(d => domain.includes(d))) return "bg-emerald-500"
    if (DIST_DOMAINS.some(d => domain.includes(d))) return "bg-rose-500"
    return "bg-indigo-500" // Uncategorized
  }

  return (
    <PageShell
      title="Analytics Tracker"
      subtitle="Monitor web usage to control distractions during study"
      icon={BarChart3}
      iconAccent="#6366f1"
      action={extInstalled ? (
        <button onClick={requestData} className="flex items-center gap-2 px-4 h-11 rounded-xl text-xs font-semibold text-white bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-sm transition-all">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      ) : undefined}
      noPadding
      contentClassName="p-4 sm:p-6"
    >
      {!extInstalled ? (
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/[0.03] border border-red-500/20 rounded-2xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-5 border border-red-500/20">
              <AlertTriangle size={28} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Browser Extension Required</h2>
            <p className="text-gray-400 leading-relaxed mb-6 text-sm">
              Install the <strong className="text-white">StudyVerse Analytics Extension</strong> from your project&apos;s <code className="text-indigo-400">extension</code> folder to monitor browsing activity.
            </p>
            <div className="bg-black/40 border border-white/10 rounded-xl p-5 mb-6 text-sm leading-7 text-gray-300">
              <ol className="list-decimal pl-5 marker:text-indigo-400 space-y-1">
                <li>Open <strong>chrome://extensions/</strong></li>
                <li>Enable <strong>Developer mode</strong></li>
                <li>Click <strong>Load unpacked</strong></li>
                <li>Select the <strong>StudyVerse/extension</strong> folder</li>
              </ol>
            </div>
            <button onClick={requestData} className="flex items-center gap-2 px-5 h-11 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all">
              <RefreshCw size={16} className={loading && !data ? "animate-spin" : ""} /> Check Connection
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard icon={CheckCircle2} label="Focused time" value={formatTime(prodTime)} accent="#10b981" />
            <StatCard icon={AlertTriangle} label="Distractions" value={formatTime(distTime)} accent="#f43f5e" />
            <StatCard icon={Monitor} label="Total monitored" value={formatTime(totalTime)} accent="#6366f1" />
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <Map size={20} className="text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Website Activity Map</h2>
            </div>
            {sortedDomains.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <Activity size={36} className="text-gray-700 mb-3" />
                <p className="text-gray-400 font-bold mb-1">No browsing data logged yet</p>
                <p className="text-gray-600 text-sm">Browse actively to see data appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {sortedDomains.map(({ domain, ms }) => {
                  const pct = totalTime > 0 ? (ms / totalTime) * 100 : 0
                  return (
                    <div key={domain} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-sm gap-2">
                        <span className="text-white font-medium flex items-center gap-2 truncate">
                          <ExternalLink size={13} className="text-gray-600 shrink-0" /> {domain}
                        </span>
                        <span className="text-gray-400 font-bold shrink-0">{formatTime(ms)}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all duration-1000", getCatColor(domain))} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  )
}
