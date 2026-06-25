"use client"

import { AppNav } from "@/components/ui/app-nav"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface PageShellProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  iconAccent?: string
  action?: React.ReactNode
  toolbar?: React.ReactNode
  stats?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
  noPadding?: boolean
}

export function PageShell({
  title,
  subtitle,
  icon: Icon,
  iconAccent = "#6366f1",
  action,
  toolbar,
  stats,
  children,
  className,
  contentClassName,
  noPadding,
}: PageShellProps) {
  return (
    <div className={cn("min-h-screen w-full bg-[#080808]", className)}>
      <AppNav />
      <main className="pt-24 pb-24 md:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 sm:pr-24">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3.5 min-w-0">
              {Icon && (
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${iconAccent}33, ${iconAccent}18)`,
                    border: `1px solid ${iconAccent}44`,
                  }}
                >
                  <Icon size={22} style={{ color: iconAccent }} />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent truncate">
                  {title}
                </h1>
                {subtitle && <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>}
              </div>
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>

          {/* Stats row */}
          {stats && <div className="mb-6">{stats}</div>}

          {/* Toolbar */}
          {toolbar && <div className="mb-5">{toolbar}</div>}

          {/* Content */}
          <div
            className={cn(
              "rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm shadow-2xl",
              !noPadding && "p-4 sm:p-6",
              contentClassName,
            )}
          >
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, accent }: {
  icon: LucideIcon; label: string; value: number | string; accent: string
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-sm">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${accent}1a`, border: `1px solid ${accent}33` }}
      >
        <Icon size={16} style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <p className="text-white font-bold text-lg leading-none">{value}</p>
        <p className="text-gray-500 text-[11px] mt-1 truncate">{label}</p>
      </div>
    </div>
  )
}

export function GlassPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md", className)}>
      {children}
    </div>
  )
}
