"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { PageShell } from "@/components/ui/page-shell"
import { useAuth } from "@/context/AuthContext"
import {
  fetchNotifications, markNotificationRead, markAllNotificationsRead,
} from "@/backend/social/notifications"
import {
  acceptFollowRequest, declineFollowRequest,
} from "@/backend/social/follow-requests"
import type { SVNotification } from "@/backend/social/types"
import { Bell, Check, X, User } from "lucide-react"
import { cn } from "@/lib/utils"

export default function NotificationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<SVNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const items = await fetchNotifications(user.uid)
      setNotifications(items)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  const handleAccept = async (n: SVNotification) => {
    if (!user || !n.followRequestId) return
    setActing(n.id)
    try {
      const ok = await acceptFollowRequest(n.followRequestId, user.uid)
      if (ok) {
        await markNotificationRead(user.uid, n.id)
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
      } else {
        alert("Could not accept request")
      }
    } catch (e) {
      console.error(e)
      alert("Failed to accept request")
    } finally {
      setActing(null)
    }
  }

  const handleDecline = async (n: SVNotification) => {
    if (!user || !n.followRequestId) return
    setActing(n.id)
    try {
      await declineFollowRequest(n.followRequestId, user.uid)
      await markNotificationRead(user.uid, n.id)
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
    } catch (e) {
      console.error(e)
      alert("Failed to decline request")
    } finally {
      setActing(null)
    }
  }

  const handleMarkRead = async (n: SVNotification) => {
    if (!user || n.read) return
    await markNotificationRead(user.uid, n.id)
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
  }

  const openProfile = (n: SVNotification) => {
    if (n.fromStudyverseId) router.push(`/profile/${n.fromStudyverseId}`)
    else if (n.fromUid) router.push(`/profile/${n.fromUid}`)
  }

  if (!user) {
    return (
      <PageShell title="Notifications" subtitle="Sign in to view notifications" icon={Bell} iconAccent="#6366f1">
        <div className="py-16 text-center text-gray-500 text-sm">
          <button onClick={() => router.push("/auth")} className="text-indigo-400 font-semibold hover:text-indigo-300">
            Sign in →
          </button>
        </div>
      </PageShell>
    )
  }

  const unread = notifications.filter(n => !n.read).length

  return (
    <PageShell
      title="Notifications"
      subtitle={unread > 0 ? `${unread} unread` : "You're all caught up"}
      icon={Bell}
      iconAccent="#6366f1"
      action={
        unread > 0 ? (
          <button
            onClick={async () => {
              await markAllNotificationsRead(user.uid)
              setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            }}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-300 border border-white/10 bg-white/5 hover:bg-white/10"
          >
            Mark all read
          </button>
        ) : undefined
      }
    >
      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center text-gray-500 text-sm">No notifications yet.</div>
      ) : (
        <div className="flex flex-col gap-2 max-w-2xl">
          {notifications.map(n => (
            <div
              key={n.id}
              className={cn(
                "rounded-2xl border p-4 flex gap-3 items-start transition-colors",
                n.read ? "border-white/[0.06] bg-white/[0.02]" : "border-indigo-500/20 bg-indigo-500/5",
              )}
            >
              <button onClick={() => { handleMarkRead(n); openProfile(n) }} className="shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden">
                  {n.fromPhoto
                    ? <img src={n.fromPhoto} alt="" className="w-full h-full object-cover" />
                    : <User size={18} className="text-white" />}
                </div>
              </button>
              <div className="flex-1 min-w-0">
                <button onClick={() => { handleMarkRead(n); openProfile(n) }} className="text-left w-full">
                  <p className="text-sm text-white">
                    <span className="font-semibold">{n.fromName || "Someone"}</span>{" "}
                    <span className="text-gray-400">{n.message || notificationLabel(n.type)}</span>
                  </p>
                  <p className="text-[10px] text-gray-600 mt-1">
                    {new Date(n.timestamp).toLocaleString()}
                  </p>
                </button>
                {n.type === "follow_request" && n.followRequestId && !n.read && (
                  <div className="flex gap-2 mt-3">
                    <button
                      disabled={acting === n.id}
                      onClick={() => handleAccept(n)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
                    >
                      <Check size={12} /> Accept
                    </button>
                    <button
                      disabled={acting === n.id}
                      onClick={() => handleDecline(n)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 border border-white/10 hover:bg-white/5 disabled:opacity-50"
                    >
                      <X size={12} /> Decline
                    </button>
                  </div>
                )}
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2" />}
            </div>
          ))}
        </div>
      )}
    </PageShell>
  )
}

function notificationLabel(type: SVNotification["type"]): string {
  switch (type) {
    case "follow_request": return "wants to follow you"
    case "follow_accepted": return "accepted your follow request"
    case "post_like": return "liked your post"
    default: return ""
  }
}
