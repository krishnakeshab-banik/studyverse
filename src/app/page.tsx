"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { SignInPage } from "@/components/ui/sign-in-flow-1"
import InteractiveSelector from "@/components/ui/interactive-selector"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.push("/library")
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    )
  }

  if (user) return null

  return (
    <main className="bg-black">
      {/* Hero — full screen sign-in with canvas animation */}
      <SignInPage />

      {/* Subtle section divider */}
      <div className="relative h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* About & Features */}
      <InteractiveSelector />
    </main>
  )
}
