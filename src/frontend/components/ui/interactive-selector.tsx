"use client"

import React, { useRef, useState } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import {
  BookOpen, Brain, CalendarDays, MessageSquare, FolderGit2, Compass,
  ChevronRight, Users, Zap, Shield, Sparkles, GraduationCap, Target, Heart,
  FileText, Timer, Bell, GitBranch, Code2, UserPlus, Lock, Wand2,
  type LucideIcon,
} from "lucide-react"

/* ─── About ─── */

const aboutPoints = [
  {
    icon: GraduationCap,
    title: "Built for real student workflows",
    desc: "Lectures, labs, deadlines, and group projects — not generic productivity templates.",
  },
  {
    icon: Target,
    title: "One hub instead of five apps",
    desc: "Replace scattered Drive folders, Discord threads, Notion pages, and calendar apps with StudyVerse.",
  },
  {
    icon: Heart,
    title: "Learn with people, not alone",
    desc: "Follow classmates, share projects, ask doubts, and message peers without leaving the platform.",
  },
]

const pillars = [
  { icon: Zap, label: "AI built-in", desc: "Summaries, doubt help, and project matching — not bolted on." },
  { icon: Users, label: "Social by design", desc: "Profiles, posts, follows, and DMs for your cohort." },
  { icon: Shield, label: "You own your data", desc: "Private accounts, no ads, export-friendly library." },
]

/* ─── Features ─── */

type FeatureCategory = "learn" | "plan" | "connect" | "build"

interface FeatureItem {
  icon: LucideIcon
  title: string
  headline: string
  description: string
  bullets: string[]
  color: string
  preview: React.ReactNode
}

const categories: { id: FeatureCategory; label: string; icon: LucideIcon }[] = [
  { id: "learn", label: "Learn & Focus", icon: Brain },
  { id: "plan", label: "Plan & Track", icon: CalendarDays },
  { id: "connect", label: "Connect", icon: Users },
  { id: "build", label: "Build & Share", icon: FolderGit2 },
]

function LibraryPreview() {
  return (
    <div className="space-y-2 font-mono text-[10px]">
      {[
        { tag: "PDF", name: "Data Structures — Ch. 4", subj: "CS201" },
        { tag: "Notes", name: "Organic Chem reaction map", subj: "CHEM102" },
        { tag: "Link", name: "3Blue1Brown — Linear Algebra", subj: "MATH" },
      ].map(row => (
        <div key={row.name} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.06] border border-white/[0.06]">
          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-500/20 text-indigo-300">{row.tag}</span>
          <div className="min-w-0 flex-1">
            <p className="text-white/70 truncate">{row.name}</p>
            <p className="text-white/25">{row.subj}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function StudyPreview() {
  return (
    <div className="rounded-lg border border-white/[0.08] overflow-hidden">
      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/[0.04] border-b border-white/[0.06]">
        <Timer size={10} className="text-violet-400" />
        <span className="text-[10px] text-white/50">Pomodoro · 24:18</span>
      </div>
      <div className="p-2.5 space-y-1.5">
        <div className="h-1.5 w-full rounded-full bg-white/10"><div className="h-full w-3/5 rounded-full bg-violet-500" /></div>
        <p className="text-[10px] text-white/40">Flashcard deck: 12/30 reviewed</p>
      </div>
    </div>
  )
}

function CalendarPreview() {
  return (
    <div className="grid grid-cols-7 gap-1 text-center text-[8px] text-white/30">
      {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
        <span key={`${d}-${i}`}>{d}</span>
      ))}
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className={`py-1 rounded ${i === 9 ? "bg-emerald-500/30 text-emerald-300 font-bold" : ""}`}
        >
          {i + 1}
        </span>
      ))}
    </div>
  )
}

function SocialPreview() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-[9px] font-bold flex items-center justify-center">SK</div>
        <div>
          <p className="text-[10px] text-white/70 font-semibold">Sarah K. · U-555</p>
          <p className="text-[9px] text-white/30">CS · 3rd year</p>
        </div>
        <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">Follow</span>
      </div>
      <p className="text-[10px] text-white/40 leading-relaxed">Just shipped my React portfolio — feedback welcome!</p>
    </div>
  )
}

function ProjectPreview() {
  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-2.5">
      <p className="text-[10px] font-bold text-white/80">NextJS Analytics Hub</p>
      <p className="text-[9px] text-white/35 mt-0.5">Live demo · GitHub linked</p>
      <div className="flex gap-3 mt-2 text-[9px] text-white/40">
        <span>♥ 215</span>
        <span>★ 56</span>
      </div>
    </div>
  )
}

const featuresByCategory: Record<FeatureCategory, FeatureItem[]> = {
  learn: [
    {
      icon: BookOpen,
      title: "Smart Library",
      headline: "Every resource, one searchable home",
      description: "Upload PDFs, paste links, save notes and slides — tagged by subject so nothing gets lost in Downloads again.",
      bullets: [
        "Organise by subject, type, and custom tags",
        "Preview PDFs and websites without leaving StudyVerse",
        "AI summaries for long readings on demand",
      ],
      color: "#6366f1",
      preview: <LibraryPreview />,
    },
    {
      icon: Brain,
      title: "Virtual Study Room",
      headline: "Deep work without tab overload",
      description: "A focused workspace with embedded video, flashcards, notes, and a built-in timer — designed for 2-hour study blocks.",
      bullets: [
        "Pomodoro timer with session history",
        "Side-by-side notes while watching lectures",
        "Flashcard mode for quick revision sprints",
      ],
      color: "#8b5cf6",
      preview: <StudyPreview />,
    },
    {
      icon: MessageSquare,
      title: "Doubt Forum",
      headline: "Ask fast, get answers faster",
      description: "Post a question with context, get replies from classmates who took the same course — plus AI assistance when you're stuck at 2 AM.",
      bullets: [
        "Subject-tagged threads visible to your cohort",
        "Upvote helpful answers to the top",
        "Attach screenshots or code snippets",
      ],
      color: "#f43f5e",
      preview: (
        <div className="text-[10px] space-y-1.5">
          <p className="text-white/60 font-semibold">How do I prove this DP recurrence?</p>
          <p className="text-white/35 pl-2 border-l border-rose-500/40">Try breaking into subproblems at index i…</p>
        </div>
      ),
    },
  ],
  plan: [
    {
      icon: CalendarDays,
      title: "Study Calendar",
      headline: "Sessions that actually happen",
      description: "Block time for each subject, set reminders before exams, and optionally sync events straight to Google Calendar.",
      bullets: [
        "Schedule sessions with subject, topic, and duration",
        "Email reminders before each block starts",
        "Google Calendar two-way sync when connected",
      ],
      color: "#10b981",
      preview: <CalendarPreview />,
    },
    {
      icon: Bell,
      title: "Smart Reminders",
      headline: "Never walk into a deadline blind",
      description: "Automatic nudges before scheduled study blocks and configurable lead times so you can prep, not panic.",
      bullets: [
        "Custom reminder minutes per session",
        "Cron-powered delivery on schedule",
        "See upcoming blocks on your dashboard",
      ],
      color: "#14b8a6",
      preview: (
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Bell size={12} className="text-emerald-400 shrink-0" />
          <p className="text-[10px] text-white/50">OS revision starts in 30 min</p>
        </div>
      ),
    },
  ],
  connect: [
    {
      icon: Compass,
      title: "Browse & Discover",
      headline: "Find creators in your field",
      description: "Explore a feed of classmates and builders — search by name, filter by privacy, and discover projects worth studying.",
      bullets: [
        "Creator story row and grid/feed toggle",
        "Search profiles by StudyVerse ID or name",
        "Respect private accounts until approved",
      ],
      color: "#06b6d4",
      preview: <SocialPreview />,
    },
    {
      icon: UserPlus,
      title: "Profiles & Follow",
      headline: "Build your academic identity",
      description: "Public profile with posts, projects, GitHub stats, and LeetCode progress — follow peers and control who sees your work.",
      bullets: [
        "Photo, bio, Instagram & LinkedIn links",
        "Private account mode with follow requests",
        "Block and unblock from profile settings",
      ],
      color: "#3b82f6",
      preview: (
        <div className="flex gap-2 flex-wrap text-[9px]">
          {["Posts", "Projects", "GitHub", "LeetCode"].map(t => (
            <span key={t} className="px-2 py-1 rounded-md bg-white/[0.06] text-white/45 border border-white/[0.06]">{t}</span>
          ))}
        </div>
      ),
    },
    {
      icon: MessageSquare,
      title: "Direct Messages",
      headline: "Instagram-style DMs for study groups",
      description: "Message classmates you follow — clean thread UI, real-time updates, no mixing with doubt forum posts.",
      bullets: [
        "Only message mutual connections",
        "Dedicated messages layout, not buried in nav",
        "Quick jump from any profile",
      ],
      color: "#ec4899",
      preview: (
        <div className="space-y-1.5">
          <div className="self-end ml-auto max-w-[85%] px-2 py-1 rounded-lg bg-indigo-600/40 text-[10px] text-white/70">Send me your notes?</div>
          <div className="max-w-[85%] px-2 py-1 rounded-lg bg-white/[0.06] text-[10px] text-white/50">Sure — uploading now</div>
        </div>
      ),
    },
  ],
  build: [
    {
      icon: FolderGit2,
      title: "Projects Hub",
      headline: "Showcase what you've built",
      description: "Publish live demos with descriptions and GitHub links — get likes, stars, and comments from other students.",
      bullets: [
        "Embed live preview in project cards",
        "Like, star, and comment on builds",
        "AI Project Finder matches you to ideas",
      ],
      color: "#f59e0b",
      preview: <ProjectPreview />,
    },
    {
      icon: GitBranch,
      title: "GitHub & LeetCode Sync",
      headline: "Your grind, visible on profile",
      description: "Connect accounts once — repo stats and problem-solving streaks appear on your public profile automatically.",
      bullets: [
        "Public repo count and contribution stats",
        "LeetCode problems solved and recent activity",
        "Synced from Settings in one click",
      ],
      color: "#a855f7",
      preview: (
        <div className="grid grid-cols-2 gap-2 text-[9px]">
          <div className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.06] text-center">
            <p className="text-lg font-bold text-white">24</p>
            <p className="text-white/30">repos</p>
          </div>
          <div className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.06] text-center">
            <p className="text-lg font-bold text-white">142</p>
            <p className="text-white/30">solved</p>
          </div>
        </div>
      ),
    },
    {
      icon: Wand2,
      title: "AI Project Matcher",
      headline: "Stuck on what to build next?",
      description: "Tell StudyVerse your skills and interests — get ranked project ideas with difficulty, stack, and why they fit you.",
      bullets: [
        "Matches based on your profile & GitHub",
        "Difficulty and time estimates included",
        "Jump straight to Projects to start building",
      ],
      color: "#eab308",
      preview: (
        <div className="text-[10px] text-white/45 italic">&ldquo;Full-stack habit tracker with React + Firebase…&rdquo;</div>
      ),
    },
  ],
}

const workflowSteps = [
  { step: "01", title: "Collect", desc: "Drop readings into Library" },
  { step: "02", title: "Plan", desc: "Block time on Calendar" },
  { step: "03", title: "Focus", desc: "Study with timers & cards" },
  { step: "04", title: "Share", desc: "Post projects & get feedback" },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

function FeatureDetailCard({ f, index }: { f: FeatureItem; index: number }) {
  const Icon = f.icon
  return (
    <motion.article
      custom={index}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
      className="group relative flex flex-col lg:flex-row gap-6 p-6 sm:p-8 rounded-2xl border border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.04] hover:border-white/[0.14] transition-all duration-400"
    >
      <div
        className="absolute top-0 left-8 right-8 h-px opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${f.color}66, transparent)` }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${f.color}18`, border: `1px solid ${f.color}40`, boxShadow: `0 0 32px ${f.color}15` }}
          >
            <Icon size={22} style={{ color: f.color }} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: f.color }}>{f.title}</p>
            <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">{f.headline}</h3>
          </div>
        </div>

        <p className="text-white/45 text-sm leading-relaxed mb-5 max-w-xl">{f.description}</p>

        <ul className="space-y-2.5">
          {f.bullets.map(b => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-white/55">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: f.color }} />
              {b}
            </li>
          ))}
        </ul>
      </div>

      <div className="lg:w-72 shrink-0">
        <div
          className="rounded-xl border p-4 h-full min-h-[140px] flex flex-col justify-center"
          style={{ borderColor: `${f.color}25`, background: `linear-gradient(145deg, ${f.color}08, transparent)` }}
        >
          <p className="text-[9px] font-bold uppercase tracking-wider text-white/25 mb-3">Preview</p>
          {f.preview}
        </div>
      </div>
    </motion.article>
  )
}

const InteractiveSelector = () => {
  const aboutRef = useRef(null)
  const featuresRef = useRef(null)
  const aboutInView = useInView(aboutRef, { once: true, margin: "-60px" })
  const [activeCategory, setActiveCategory] = useState<FeatureCategory>("learn")

  const scrollToSignIn = () =>
    document.getElementById("signin-section")?.scrollIntoView({ behavior: "smooth" })

  return (
    <>
      {/* ── About ── */}
      <section id="about" ref={aboutRef} className="relative bg-black text-white overflow-hidden border-t border-white/[0.06]">
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={aboutInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.55 }}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/50 text-[11px] font-semibold mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                About StudyVerse
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-5 leading-tight">
                Stop juggling apps. <span className="text-indigo-400">Start finishing.</span>
              </h2>
              <p className="text-white/45 text-sm sm:text-base leading-relaxed mb-4">
                StudyVerse is an all-in-one workspace for students who need to read, plan, focus, collaborate, and ship projects — without losing context every time they switch tabs.
              </p>
              <p className="text-white/35 text-sm leading-relaxed">
                From first-year notes to final-year portfolios, everything lives in one place with AI assistance and a social layer built for classmates, not influencers.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={aboutInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="space-y-3"
            >
              {aboutPoints.map(point => {
                const Icon = point.icon
                return (
                  <div
                    key={point.title}
                    className="flex gap-4 p-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:border-white/[0.12] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-500/15 border border-indigo-500/25">
                      <Icon size={18} className="text-indigo-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white mb-1">{point.title}</h3>
                      <p className="text-white/40 text-xs leading-relaxed">{point.desc}</p>
                    </div>
                  </div>
                )
              })}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-px mt-16 rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.04]"
          >
            {pillars.map(p => {
              const Icon = p.icon
              return (
                <div key={p.label} className="flex flex-col items-center text-center p-6 sm:p-8 bg-black/50">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-indigo-500/15 border border-indigo-500/25">
                    <Icon size={18} className="text-indigo-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{p.label}</h3>
                  <p className="text-white/35 text-xs leading-relaxed max-w-[220px]">{p.desc}</p>
                </div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" ref={featuresRef} className="relative bg-black text-white overflow-hidden border-t border-white/[0.06]">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 65%)" }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/50 text-[11px] font-semibold mb-6">
              <Sparkles size={12} className="text-violet-400" />
              Platform features
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight leading-tight mb-4">
              <span className="text-white">Tools that cover </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-violet-400">your whole semester</span>
            </h2>
            <p className="text-white/40 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Not vague promises — each feature maps to a real page in StudyVerse. Pick a category to see exactly what you get.
            </p>
          </motion.div>

          {/* Workflow strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12"
          >
            {workflowSteps.map(({ step, title, desc }) => (
              <div key={step} className="relative p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] text-center">
                <span className="text-[10px] font-bold text-indigo-400/80">{step}</span>
                <p className="text-sm font-bold text-white mt-1">{title}</p>
                <p className="text-[11px] text-white/35 mt-0.5">{desc}</p>
              </div>
            ))}
          </motion.div>

          {/* Category tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10 p-1.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] max-w-3xl mx-auto">
            {categories.map(cat => {
              const Icon = cat.icon
              const active = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    active
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                      : "text-white/45 hover:text-white/80 hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon size={16} />
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Feature list for active category */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-4 sm:space-y-5"
            >
              {featuresByCategory[activeCategory].map((f, i) => (
                <FeatureDetailCard key={f.title} f={f} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Capability chips */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-14 flex flex-wrap justify-center gap-2"
          >
            {[
              { icon: FileText, label: "AI summaries" },
              { icon: Lock, label: "Private profiles" },
              { icon: Code2, label: "GitHub sync" },
              { icon: CalendarDays, label: "Google Calendar" },
              { icon: MessageSquare, label: "DMs" },
              { icon: Wand2, label: "Project matcher" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-white/45 border border-white/[0.08] bg-white/[0.03]"
              >
                <Icon size={12} className="text-indigo-400/80" />
                {label}
              </span>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-16 sm:mt-20"
          >
            <div className="inline-flex flex-col items-center p-8 sm:p-10 rounded-3xl border border-white/[0.1] bg-gradient-to-b from-white/[0.06] to-transparent max-w-lg mx-auto">
              <p className="text-white font-semibold text-base mb-1">Ready to replace the tab chaos?</p>
              <p className="text-white/35 text-sm mb-6">Create a free account and set up your profile in under two minutes.</p>
              <button
                type="button"
                onClick={scrollToSignIn}
                className="inline-flex items-center justify-center gap-2 px-8 h-12 rounded-xl text-sm font-semibold text-white sv-btn-primary hover:scale-[1.02] transition-transform"
              >
                Get Started Free <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        </div>

        <footer className="border-t border-white/[0.06] py-8 text-center">
          <p className="text-white/20 text-xs">© {new Date().getFullYear()} StudyVerse · Built for students everywhere</p>
        </footer>
      </section>
    </>
  )
}

export default InteractiveSelector
