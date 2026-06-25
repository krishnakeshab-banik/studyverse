"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { NavBar } from "@/components/ui/tubelight-navbar"
import {
  BookOpen, Brain, CalendarDays,
  MessageSquare, FolderGit2, User, Compass, Bell,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { getUnreadCount } from "@/backend/social/notifications"

const navItems = [
  { name: "Library",     url: "/library",     icon: BookOpen     },
  { name: "Study",       url: "/study",        icon: Brain        },
  { name: "Calendar",    url: "/calendar",     icon: CalendarDays },
  { name: "Doubts",      url: "/doubts",       icon: MessageSquare},
  { name: "Projects",    url: "/projects",     icon: FolderGit2   },
  { name: "Browse",      url: "/browse",       icon: Compass      },
  { name: "Profile",     url: "/profile",      icon: User         },
]

export function AppNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) {
      setUnread(0)
      return
    }
    let cancelled = false
    const poll = async () => {
      try {
        const count = await getUnreadCount(user.uid)
        if (!cancelled) setUnread(count)
      } catch {
        // ignore
      }
    }
    poll()
    const interval = setInterval(poll, 30000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [user])

  return (
    <>
      <div className="fixed top-4 right-4 sm:right-6 z-[60] flex items-center gap-2">
        <Link
          href="/messages"
          className={`relative w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur-xl transition-colors ${
            pathname.startsWith("/messages")
              ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
              : "bg-black/40 border-white/10 text-white/70 hover:text-white"
          }`}
          title="Messages"
        >
          <MessageSquare size={18} />
        </Link>
        <Link
          href="/notifications"
          className={`relative w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur-xl transition-colors ${
            pathname.startsWith("/notifications")
              ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
              : "bg-black/40 border-white/10 text-white/70 hover:text-white"
          }`}
          title="Notifications"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Link>
      </div>
      <NavBar items={navItems} />
    </>
  )
}
