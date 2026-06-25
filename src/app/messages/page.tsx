"use client"

import { useState, useEffect, useCallback, useRef, Suspense, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { AppNav } from "@/components/ui/app-nav"
import { useAuth } from "@/context/AuthContext"
import {
  fetchConversations, fetchMessages, sendMessage, deleteMessage, canMessage,
} from "@/backend/social/messages"
import { blockUser } from "@/backend/social/blocks"
import { BlockUserDialog } from "@/components/social/block-user-dialog"
import { doc, getDoc } from "firebase/firestore"
import { getClientDb } from "@/backend/db/firebase"
import type { Conversation, Message } from "@/backend/social/types"
import { MessageSquare, Send, ChevronLeft, Search, User, Edit } from "lucide-react"
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
  const [search, setSearch] = useState("")
  const [showBlockDialog, setShowBlockDialog] = useState(false)
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

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations
    const q = search.toLowerCase()
    return conversations.filter(conv => {
      const otherUid = conv.participants.find(p => p !== user?.uid) || ""
      const info = chatUsers[otherUid]
      return info?.name.toLowerCase().includes(q) || info?.studyverseId.toLowerCase().includes(q)
    })
  }, [conversations, search, chatUsers, user?.uid])

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

  const handleBlock = async () => {
    if (!user || !otherUser) return
    await blockUser(user.uid, otherUser.uid)
    setActiveConv(null)
    setOtherUser(null)
    setMessages([])
    await loadConversations()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-4">
        <MessageSquare size={40} className="text-gray-700" />
        <p className="text-gray-500 text-sm">Sign in to view messages</p>
        <Link href="/" className="text-indigo-400 font-semibold text-sm hover:text-indigo-300">Sign in →</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      <AppNav />
      <main className="pt-20 pb-24 md:pb-6 px-4 sm:px-6 sm:pr-24 max-w-6xl mx-auto">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden min-h-[75vh] flex flex-col md:flex-row shadow-2xl">
          {/* Inbox — Instagram-style */}
          <div className={cn(
            "w-full md:w-[340px] lg:w-[360px] border-b md:border-b-0 md:border-r border-white/[0.08] flex flex-col bg-[#0a0a0a]",
            activeConv && "hidden md:flex",
          )}>
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
              <h1 className="text-lg font-bold text-white">{user.displayName?.split(" ")[0] || "You"}</h1>
              <Edit size={20} className="text-gray-400" />
            </div>
            <div className="px-4 py-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search"
                  className="w-full bg-white/[0.06] border border-white/[0.06] rounded-xl pl-9 pr-3 h-9 text-sm text-white placeholder:text-gray-600 outline-none"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="py-12 flex justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-12 px-4">No conversations yet. Message someone from their profile!</p>
              ) : (
                filteredConversations.map(conv => {
                  const otherUid = conv.participants.find(p => p !== user.uid) || ""
                  const info = chatUsers[otherUid]
                  const isActive = activeConv?.id === conv.id
                  return (
                    <button
                      key={conv.id}
                      onClick={() => openConversation(conv, otherUid)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left",
                        isActive && "bg-white/[0.05]",
                      )}
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-offset-2 ring-offset-[#0a0a0a] ring-transparent">
                        {info?.photoURL
                          ? <img src={info.photoURL} alt="" className="w-full h-full object-cover" />
                          : <User size={18} className="text-white" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{info?.name || "Loading..."}</p>
                        <p className={cn("text-xs truncate mt-0.5", conv.lastSenderUid === user.uid ? "text-gray-500" : "text-white font-medium")}>
                          {conv.lastSenderUid === user.uid && conv.lastMessage ? "You: " : ""}{conv.lastMessage || "Say hi 👋"}
                        </p>
                      </div>
                      {isActive && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Chat thread */}
          <div className={cn("flex-1 flex flex-col bg-[#080808]", !activeConv && "hidden md:flex")}>
            {activeConv && otherUser ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08] bg-[#0a0a0a]">
                  <button onClick={() => { setActiveConv(null); setOtherUser(null) }} className="md:hidden text-gray-400 hover:text-white p-1">
                    <ChevronLeft size={22} />
                  </button>
                  <button onClick={() => router.push(`/profile/${otherUser.studyverseId}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 shrink-0">
                      {otherUser.photoURL
                        ? <img src={otherUser.photoURL} alt="" className="w-full h-full object-cover" />
                        : <User size={16} className="text-white m-auto mt-3" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{otherUser.name}</p>
                      <p className="text-[10px] text-gray-500">{otherUser.studyverseId}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setShowBlockDialog(true)}
                    className="text-xs font-semibold text-red-400 hover:text-red-300 px-2 py-1"
                  >
                    Block
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
                  {messages.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                      <div className="w-16 h-16 rounded-full overflow-hidden mb-3 ring-2 ring-indigo-500/30">
                        {otherUser.photoURL
                          ? <img src={otherUser.photoURL} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-indigo-600 flex items-center justify-center"><User size={24} className="text-white" /></div>}
                      </div>
                      <p className="text-white font-semibold text-sm">{otherUser.name}</p>
                      <p className="text-gray-500 text-xs mt-1">Start a conversation</p>
                    </div>
                  )}
                  {messages.map(msg => {
                    const isMine = msg.senderUid === user.uid
                    return (
                      <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[70%] px-4 py-2.5 text-sm leading-relaxed",
                          isMine
                            ? "bg-indigo-600 text-white rounded-[20px] rounded-br-md"
                            : "bg-white/[0.08] text-gray-100 rounded-[20px] rounded-bl-md border border-white/[0.06]",
                          msg.deleted && "italic text-gray-500 bg-transparent border-none",
                        )}>
                          {msg.deleted ? "Message unsent" : msg.text}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>

                <div className="p-4 border-t border-white/[0.08] bg-[#0a0a0a]">
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1">
                    <input
                      value={text}
                      onChange={e => setText(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                      placeholder="Message..."
                      className="flex-1 bg-transparent h-10 text-sm text-white placeholder:text-gray-600 outline-none"
                    />
                    <button
                      onClick={handleSend}
                      disabled={sending || !text.trim()}
                      className={cn(
                        "text-sm font-bold transition-colors",
                        text.trim() ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-400/30",
                      )}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center mb-4">
                  <Send size={28} className="text-gray-600" />
                </div>
                <p className="text-white font-semibold">Your messages</p>
                <p className="text-gray-500 text-sm mt-1 max-w-xs">Send private messages to people you follow.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {otherUser && (
        <BlockUserDialog
          userName={otherUser.name}
          open={showBlockDialog}
          onClose={() => setShowBlockDialog(false)}
          onConfirm={handleBlock}
        />
      )}
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}
