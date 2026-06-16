"use client"

import { NavBar } from "@/components/ui/tubelight-navbar"
import {
  BookOpen, Brain, ShoppingBag, CalendarDays,
  MessageSquare, FolderGit2, Activity, User, Compass,
} from "lucide-react"

const navItems = [
  { name: "Library",     url: "/library",     icon: BookOpen     },
  { name: "Study",       url: "/study",        icon: Brain        },
  { name: "Market",      url: "/marketplace",  icon: ShoppingBag  },
  { name: "Calendar",    url: "/calendar",     icon: CalendarDays },
  { name: "Doubts",      url: "/doubts",       icon: MessageSquare},
  { name: "Projects",    url: "/projects",     icon: FolderGit2   },
  { name: "Browse",      url: "/browse",       icon: Compass      },
  { name: "Analytics",   url: "/analytics",    icon: Activity     },
  { name: "Profile",     url: "/profile",      icon: User         },
]

export function AppNav() {
  return <NavBar items={navItems} />
}
