"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen } from "lucide-react"
import SignInForm from "@/components/ui/sign-in-form"
import SignUpForm from "@/components/ui/sign-up-form"

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"signin" | "signup">("signup")

  return (
    <div className="relative min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4 py-12 overflow-hidden">

      {/* Ambient glow top */}
      <div
        style={{
          position: "absolute",
          top: "5%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 320,
          background: "radial-gradient(ellipse at center, rgba(99,102,241,0.13) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Ambient glow bottom-left */}
      <div
        style={{
          position: "absolute",
          bottom: "8%",
          left: "15%",
          width: 340,
          height: 220,
          background: "radial-gradient(ellipse at center, rgba(139,92,246,0.09) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            boxShadow: "0 0 20px rgba(99,102,241,0.45)",
          }}
        >
          <BookOpen size={17} className="text-white" />
        </div>
        <span
          className="text-xl font-bold tracking-tight"
          style={{
            background: "linear-gradient(to right, #ffffff, #9ca3af)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          StudyVerse
        </span>
      </div>

      {/* Heading */}
      <div className="text-center mb-7">
        <h1
          className="text-3xl font-bold mb-2 tracking-tight"
          style={{
            background: "linear-gradient(to bottom, #ffffff, #9ca3af)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {mode === "signin" ? "Welcome back" : "Start learning today"}
        </h1>
        <p className="text-gray-500 text-sm">
          {mode === "signin"
            ? "Sign in to continue your learning journey"
            : "Create your free account and explore StudyVerse"}
        </p>
      </div>

      {/* Mode toggle pill */}
      <div className="flex bg-white/5 border border-white/10 rounded-full p-1 mb-7 gap-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-300"
            style={
              mode === m
                ? {
                    background: "linear-gradient(to right, #4f46e5, #7c3aed)",
                    color: "#fff",
                    boxShadow: "0 2px 12px rgba(99,102,241,0.3)",
                  }
                : { color: "#6b7280" }
            }
          >
            {m === "signin" ? "Sign In" : "Sign Up"}
          </button>
        ))}
      </div>

      {/* Form — animate between modes */}
      <div
        style={{
          width: "100%",
          maxWidth: 448,
          transition: "opacity 0.25s ease, transform 0.25s ease",
        }}
      >
        {mode === "signin" ? (
          <SignInForm onSwitchMode={() => setMode("signup")} />
        ) : (
          <SignUpForm onSwitchMode={() => setMode("signin")} onSuccess={() => router.push("/profile")} />
        )}
      </div>
    </div>
  )
}
