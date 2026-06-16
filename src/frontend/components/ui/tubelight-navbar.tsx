"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

export function NavBar({ items, className }: NavBarProps) {
  const pathname = usePathname()
  const activeItem = items.find(i => pathname.startsWith(i.url)) ?? items[0]
  const [activeTab, setActiveTab] = useState(activeItem.name)

  useEffect(() => {
    const match = items.find(i => pathname.startsWith(i.url))
    if (match) setActiveTab(match.name)
  }, [pathname, items])

  return (
    <div className={cn("fixed bottom-0 sm:top-0 left-1/2 -translate-x-1/2 z-50 mb-6 sm:pt-6", className)}>
      <div className="flex items-center gap-1 bg-black/40 border border-white/10 backdrop-blur-xl py-1 px-1 rounded-full shadow-2xl shadow-black/50">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name
          return (
            <Link
              key={item.name}
              href={item.url}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "relative cursor-pointer text-xs font-semibold px-4 py-2 rounded-full transition-colors duration-200",
                isActive ? "text-white" : "text-white/50 hover:text-white/80",
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full rounded-full -z-10"
                  style={{ background: "linear-gradient(135deg,rgba(79,70,229,0.5),rgba(124,58,237,0.5))" }}
                  initial={false}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-400 rounded-t-full">
                    <div className="absolute w-12 h-6 bg-indigo-500/30 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-indigo-500/20 rounded-full blur-md -top-1" />
                  </div>
                </motion.div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
