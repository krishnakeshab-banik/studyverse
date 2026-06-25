"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { Ban, MoreHorizontal, ShieldOff, X } from "lucide-react"

interface BlockUserDialogProps {
  userName: string
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function BlockUserDialog({ userName, open, onClose, onConfirm }: BlockUserDialogProps) {
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Ban size={16} className="text-red-400" />
            </div>
            <h3 className="text-sm font-bold text-white">Block {userName}?</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-gray-400 leading-relaxed">
            They won&apos;t be able to follow you, view your posts, or send messages. You won&apos;t see their content either.
          </p>
          <ul className="text-xs text-gray-500 space-y-1.5">
            <li className="flex items-center gap-2"><ShieldOff size={12} className="text-red-400 shrink-0" /> Removes mutual follow connection</li>
            <li className="flex items-center gap-2"><Ban size={12} className="text-red-400 shrink-0" /> Blocks messages and follow requests</li>
          </ul>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-white/[0.06] bg-white/[0.02]">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-white/10 text-sm font-semibold text-gray-400 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Blocking..." : "Block user"}
          </button>
        </div>
      </div>
    </div>
  )
}

interface ProfileMoreMenuProps {
  onBlock: () => void
}

export function ProfileMoreMenu({ onBlock }: ProfileMoreMenuProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!open || !buttonRef.current) return

    const updatePosition = () => {
      const rect = buttonRef.current!.getBoundingClientRect()
      const menuWidth = 168
      const left = Math.min(
        Math.max(8, rect.right - menuWidth),
        window.innerWidth - menuWidth - 8,
      )
      setMenuPos({ top: rect.bottom + 6, left })
    }

    updatePosition()
    window.addEventListener("scroll", updatePosition, true)
    window.addEventListener("resize", updatePosition)
    return () => {
      window.removeEventListener("scroll", updatePosition, true)
      window.removeEventListener("resize", updatePosition)
    }
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="More options"
        aria-expanded={open}
      >
        <MoreHorizontal size={18} />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} aria-hidden />
          <div
            className="fixed z-[91] min-w-[168px] rounded-xl border border-white/10 bg-[#121212] shadow-xl overflow-hidden py-1"
            style={menuPos ? { top: menuPos.top, left: menuPos.left } : undefined}
          >
            <button
              type="button"
              onClick={() => { setOpen(false); onBlock() }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors whitespace-nowrap"
            >
              <Ban size={14} /> Block user
            </button>
          </div>
        </>,
        document.body,
      )}
    </>
  )
}
