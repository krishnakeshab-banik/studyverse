"use client"

import React, { useRef } from "react"
import { motion, useInView } from "framer-motion"
import {
  BookOpen, Brain, ShoppingBag, CalendarDays, MessageSquare, FolderGit2,
  ChevronRight, Users, Zap, Shield, Sparkles, ArrowUpRight,
} from "lucide-react"

const features = [
  {
    icon: BookOpen,
    title: "Smart Library",
    tag: "Organise",
    description: "Centralise notes, PDFs, PPTs, websites and videos. AI summaries on demand.",
    color: "#6366f1",
    span: "md:col-span-2 md:row-span-2",
    large: true,
  },
  {
    icon: Brain,
    title: "Virtual Study",
    tag: "Focus",
    description: "Distraction-free workspaces with YouTube, AI notes, flashcards and timers.",
    color: "#8b5cf6",
    span: "",
    large: false,
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    tag: "Discover",
    description: "Curated study packs from peers. Filter by subject or rating.",
    color: "#06b6d4",
    span: "",
    large: false,
  },
  {
    icon: CalendarDays,
    title: "Study Calendar",
    tag: "Plan",
    description: "Schedule sessions and get smart reminders before every deadline.",
    color: "#10b981",
    span: "",
    large: false,
  },
  {
    icon: MessageSquare,
    title: "Doubt Forum",
    tag: "Ask",
    description: "Post questions, get peer answers and AI help in seconds.",
    color: "#f43f5e",
    span: "",
    large: false,
  },
  {
    icon: FolderGit2,
    title: "Projects Hub",
    tag: "Build",
    description: "Manage academic projects with boards, files and collaboration.",
    color: "#f59e0b",
    span: "md:col-span-2",
    large: false,
  },
]

const pillars = [
  { icon: Zap, label: "AI-Powered", desc: "Summaries, Q&A and recommendations built in." },
  { icon: Users, label: "Community", desc: "Learn together with classmates worldwide." },
  { icon: Shield, label: "Private", desc: "Your data stays yours. No ads, ever." },
]

const stats = [
  { value: "50K+", label: "Students" },
  { value: "200K+", label: "Resources" },
  { value: "6", label: "Tools" },
  { value: "24/7", label: "AI help" },
]

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

function FeatureCard({ f, index }: { f: typeof features[0]; index: number }) {
  const Icon = f.icon
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md transition-all duration-500 hover:border-white/[0.14] hover:bg-white/[0.05] ${f.span} ${f.large ? "p-8 min-h-[280px]" : "p-6"}`}
    >
      {/* Corner gradient wash */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `${f.color}22` }}
      />
      {/* Top accent line */}
      <div
        className="absolute top-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${f.color}88, transparent)` }}
      />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            style={{ background: `${f.color}18`, border: `1px solid ${f.color}35`, boxShadow: `0 0 24px ${f.color}15` }}
          >
            <Icon size={20} style={{ color: f.color }} />
          </div>
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border"
            style={{ color: f.color, borderColor: `${f.color}30`, background: `${f.color}10` }}
          >
            {f.tag}
          </span>
        </div>

        <h3 className={`font-bold text-white mb-2 ${f.large ? "text-2xl" : "text-base"}`}>{f.title}</h3>
        <p className={`text-white/40 leading-relaxed flex-1 ${f.large ? "text-sm max-w-sm" : "text-[13px]"}`}>
          {f.description}
        </p>

        {f.large && (
          <div className="mt-6 flex items-center gap-2 text-xs font-medium text-white/30 group-hover:text-white/60 transition-colors">
            <Sparkles size={13} style={{ color: f.color }} />
            <span>Included free with every account</span>
            <ArrowUpRight size={13} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>
    </motion.div>
  )
}

const InteractiveSelector = () => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const scrollToSignIn = () =>
    document.getElementById("signin-section")?.scrollIntoView({ behavior: "smooth" })

  return (
    <section id="about" ref={ref} className="relative bg-black text-white overflow-hidden">

      {/* Dot grid — echoes sign-in canvas */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 20%, transparent 80%)",
        }}
      />

      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)" }} />

      {/* Seam from sign-in section above */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-white/50 text-[11px] font-semibold tracking-wide mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Why StudyVerse
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-[3.25rem] font-extrabold tracking-tight leading-[1.1] mb-5">
            <span className="text-white">Everything you need</span>
            <br />
            <span style={{
              background: "linear-gradient(135deg, #ffffff 0%, #a5b4fc 50%, #818cf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              to study smarter
            </span>
          </h2>

          <p className="text-white/40 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            One platform that replaces six apps — built for students who want real results, not more noise.
          </p>
        </motion.div>

        {/* Bento feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-16 sm:mb-20 auto-rows-fr">
          {features.map((f, i) => (
            <FeatureCard key={f.title} f={f} index={i} />
          ))}
        </div>

        {/* Pillars — horizontal glass strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-px rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.04] backdrop-blur-md mb-16 sm:mb-20"
        >
          {pillars.map((p) => {
            const Icon = p.icon
            return (
              <div key={p.label} className="flex flex-col items-center text-center p-6 sm:p-8 bg-black/40 hover:bg-white/[0.03] transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))", border: "1px solid rgba(99,102,241,0.25)" }}>
                  <Icon size={18} className="text-indigo-400" />
                </div>
                <h3 className="text-sm font-bold text-white/90 mb-1.5">{p.label}</h3>
                <p className="text-white/35 text-xs leading-relaxed max-w-[200px]">{p.desc}</p>
              </div>
            )
          })}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16 sm:mb-20"
        >
          {stats.map(({ value, label }) => (
            <div key={label}
              className="flex flex-col items-center py-6 sm:py-8 rounded-2xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300">
              <span className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
                {value}
              </span>
              <span className="text-white/30 text-[11px] font-medium mt-1.5 uppercase tracking-wider">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA — matches sign-in card button */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-center"
        >
          <div className="inline-flex flex-col items-center p-8 sm:p-10 rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md max-w-md mx-auto">
            <p className="text-white/50 text-sm mb-1">Ready to transform how you study?</p>
            <p className="text-white/25 text-xs mb-6">Join free — no credit card required</p>
            <button
              onClick={scrollToSignIn}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 h-12 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] sv-btn-primary"
            >
              Get Started Free <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default InteractiveSelector
