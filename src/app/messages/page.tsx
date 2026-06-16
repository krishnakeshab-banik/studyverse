"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageShell } from "@/components/ui/page-shell"
import { useAuth } from "@/context/AuthContext"
import {
  fetchConversations, fetchMessages, sendMessage, deleteMessage, canMessage,
} from "@/backend/social/messages"
import { blockUser } from "@/backend/social/blocks"
import { doc, getDoc } from "firebase/firestore"
import { getClientDb } from "@/backend/db/firebase"
import type { Conversation, Message } from "@/backend/social/types"
import { MessageSquare, Send, Trash2, Ban, User, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatUser {
  uid: string
  name: string
  studyverseId: string
  photoURL?: string
}

function MessagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [chatUsers, setChatUsers] = useState<Record<string, ChatUser>>({})
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadUserInfo = useCallback(async (uid: string): Promise<ChatUser> => {
    const snap = await getDoc(doc(getClientDb(), "users", uid))
    const d = snap.exists() ? snap.data() : {}
    const info: ChatUser = {
      uid,
      name: (d.name as string) || "User",
      studyverseId: (d.studyverseId as string) || uid.slice(0, 8),
      photoURL: d.photoURL as string | undefined,
    }
    setChatUsers(prev => prev[uid] ? prev : { ...prev, [uid]: info })
    return info
  }, [])

  const loadConversations = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const convs = await fetchConversations(user.uid)
      setConversations(convs)
      for (const c of convs) {
        const other = c.participants.find(p => p !== user.uid)
        if (other) await loadUserInfo(other)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user, loadUserInfo])

  const openConversation = useCallback(async (conv: Conversation, otherUid: string) => {
    setActiveConv(conv)
    const info = await loadUserInfo(otherUid)
    setOtherUser(info)
    try {
      const msgs = await fetchMessages(conv.id)
      setMessages(msgs)
    } catch (e) {
      console.error(e)
      setMessages([])
    }
  }, [loadUserInfo])

  useEffect(() => { loadConversations() }, [loadConversations])

  useEffect(() => {
    if (!user || loading) return
    const targetUid = searchParams.get("uid")
    if (!targetUid || targetUid === user.uid) return

    ;(async () => {
      const allowed = await canMessage(user.uid, targetUid)
      if (!allowed) return

      const convId = [user.uid, targetUid].sort().join("_")
      let conv = conversations.find(c => c.id === convId)
      if (!conv) {
        conv = {
          id: convId,
          participants: [user.uid, targetUid].sort() as [string, string],
          updatedAt: Date.now(),
        }
      }
      await openConversation(conv, targetUid)
    })()
  }, [user, loading, searchParams, conversations, openConversation])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!user || !otherUser || !text.trim() || sending) return
    setSending(true)
    try {
      const msg = await sendMessage(user.uid, otherUser.uid, text.trim())
      if (!msg) {
        alert("Cannot send message to this user")
        return
      }
      setText("")
      setMessages(prev => [...prev, msg])
      if (activeConv) {
        setConversations(prev => {
          const updated = { ...activeConv, updatedAt: Date.now(), lastMessage: msg.text, lastSenderUid: user.uid }
          const rest = prev.filter(c => c.id !== activeConv.id)
          return [updated, ...rest]
        })
      }
    } catch (e) {
      console.error(e)
      alert("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (msg: Message) => {
    if (!user || !activeConv || msg.senderUid !== user.uid) return
    if (!confirm("Delete this message?")) return
    try {
      await deleteMessage(activeConv.id, msg.id, user.uid)
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, deleted: true, text: "" } : m))
    } catch (e) {
      console.error(e)
      alert("Failed to delete message")
    }
  }

  const handleBlock = async () => {
    if (!user || !otherUser) return
    if (!confirm(`Block ${otherUser.name}?`)) return
    try {
      await blockUser(user.uid, otherUser.uid)
      setActiveConv(null)
      setOtherUser(null)
      setMessages([])
      await loadConversations()
    } catch (e) {
      console.error(e)
      alert("Failed to block user")
    }
  }

  if (!user) {
    return (
      <PageShell title="Messages" subtitle="Sign in to message" icon={MessageSquare} iconAccent="#6366f1">
        <div className="py-16 text-center">
          <button onClick={() => router.push("/auth")} className="text-indigo-400 font-semibold hover:text-indigo-300 text-sm">
            Sign in →
          </button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Messages"
      subtitle="Chat with your connections"
      icon={MessageSquare}
      iconAccent="#6366f1"
      noPadding
      contentClassName="p-0"
    >
      <div className="flex flex-col md:flex-row min-h-[60vh]">
        {/* Conversation list */}
        <div className={cn(
          "w-full md:w-80 border-b md:border-b-0 md:border-r border-white/[0.08] flex flex-col",
          activeConv && "hidden md:flex",
        )}>
          <div className="p-4 border-b border-white/[0.06]">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-12 px-4">No conversations yet. Message someone you follow!</p>
            ) : (
              conversations.map(conv => {
                const otherUid = conv.participants.find(p => p !== user.uid) || ""
                const info = chatUsers[otherUid]
                return (
                  <button
                    key={conv.id}
                    onClick={() => openConversation(conv, otherUid)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left border-b border-white/[0.04]",
                      activeConv?.id === conv.id && "bg-indigo-500/10",
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 overflow-hidden">
                      {info?.photoURL
                        ? <img src={info.photoURL} alt="" className="w-full h-full object-cover" />
                        : <User size={16} className="text-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{info?.name || "Loading..."}</p>
                      <p className="text-xs text-gray-500 truncate">{conv.lastMessage || "No messages yet"}</p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Chat thread */}
        <div className={cn("flex-1 flex flex-col", !activeConv && "hidden md:flex")}>
          {activeConv && otherUser ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08]">
                <button onClick={() => { setActiveConv(null); setOtherUser(null) }} className="md:hidden text-gray-400 hover:text-white">
                  <ArrowLeft size={18} />
                </button>
                <button onClick={() => router.push(`/profile/${otherUser.studyverseId}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 overflow-hidden">
                    {otherUser.photoURL
                      ? <img src={otherUser.photoURL} alt="" className="w-full h-full object-cover" />
                      : <User size={14} className="text-white" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{otherUser.name}</p>
                    <p className="text-[10px] text-indigo-400 font-bold">{otherUser.studyverseId}</p>
                  </div>
                </button>
                <button onClick={handleBlock} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10" title="Block user">
                  <Ban size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {messages.map(msg => {
                  const isMine = msg.senderUid === user.uid
                  return (
                    <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm relative group",
                        isMine ? "bg-indigo-600 text-white" : "bg-white/[0.06] text-gray-200",
                        msg.deleted && "italic text-gray-500",
                      )}>
                        {msg.deleted ? "Message deleted" : msg.text}
                        {isMine && !msg.deleted && (
                          <button
                            onClick={() => handleDelete(msg)}
                            className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              <div className="p-4 border-t border-white/[0.08] flex gap-2">
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 h-11 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/40"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !text.trim()}
                  className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center hover:bg-indigo-500 disabled:opacity-50"
                >
                  <Send size={16} className="text-white" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <PageShell title="Messages" icon={MessageSquare} iconAccent="#6366f1">
        <div className="py-16 flex justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        </div>
      </PageShell>
    }>
      <MessagesContent />
    </Suspense>
  )
}
