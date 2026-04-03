"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar"
import {
  BookOpen, Brain, ShoppingBag, CalendarDays, MessageSquare,
  User, LogOut, Camera, CheckCircle2, AlertCircle,
  Eye, EyeOff, Save, Pencil, X, Shield, Mail, Phone, GraduationCap,
  ChevronDown, ChevronUp,
  Activity
} from "lucide-react"

// ─── Sidebar logo ─────────────────────────────────────────────
const Logo = () => (
  <Link href="/" className="flex items-center gap-3 py-1 relative z-20">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 0 16px rgba(99,102,241,0.4)" }}>
      <BookOpen size={20} className="text-white" />
    </div>
    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-white whitespace-pre text-lg tracking-tight">
      StudyVerse
    </motion.span>
  </Link>
)

const LogoIcon = () => (
  <Link href="/" className="flex items-center py-1 relative z-20">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 0 16px rgba(99,102,241,0.4)" }}>
      <BookOpen size={20} className="text-white" />
    </div>
  </Link>
)

// ─── Nav links ──────────────────────────────────────────────
const navLinks = [
  { label: "Library",       href: "/library",     icon: <BookOpen     size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Virtual Study", href: "/study",        icon: <Brain        size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Marketplace",   href: "/marketplace",  icon: <ShoppingBag  size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Calendar",      href: "/calendar",     icon: <CalendarDays size={24} className="text-neutral-400 flex-shrink-0" /> },
  { label: "Post Doubts",   href: "/doubts",       icon: <MessageSquare size={24} className="text-neutral-400 flex-shrink-0" /> },
]

// ─── Types ─────────────────────────────────────────────────
interface ProfileData {
  name: string; college: string
  email: string; emailVerified: boolean
  phone: string; phoneVerified: boolean
  year: string; major: string; bio: string
}

// ─── Small helpers ─────────────────────────────────────────
const VerifyBadge = ({ verified }: { verified: boolean }) =>
  verified ? (
    <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium shrink-0">
      <CheckCircle2 size={12} /> Verified
    </span>
  ) : (
    <button className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors shrink-0">
      <AlertCircle size={12} /> Verify
    </button>
  )

const Field = ({ label, value, editing, onChange, type = "text", placeholder, icon: Icon, suffix }: {
  label: string; value: string; editing: boolean; onChange: (v: string) => void
  type?: string; placeholder?: string; icon?: React.ElementType; suffix?: React.ReactNode
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
    <div className={cn("flex items-center gap-2", editing
      ? "border border-white/10 bg-white/5 rounded-xl px-3 h-11 focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:border-indigo-500/40 transition-all"
      : "py-0.5")}>
      {Icon && <Icon size={15} className="text-gray-500 shrink-0" />}
      {editing
        ? <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-600 outline-none" />
        : <span className="text-white text-sm">{value || <span className="text-gray-600">Not set</span>}</span>}
      {suffix && <div className="ml-auto">{suffix}</div>}
    </div>
  </div>
)

const Section = ({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) => (
  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
    <div className="flex items-center gap-2 mb-5">
      {Icon && <Icon size={15} className="text-indigo-400" />}
      <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
    </div>
    <div className="flex flex-col gap-4">{children}</div>
  </div>
)

// ─── Profile page ──────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [pwdVis, setPwdVis] = useState({ current: false, new: false, confirm: false })
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" })

  const [profile, setProfile] = useState<ProfileData>({
    name: "Alex Johnson", college: "Indian Institute of Technology, Delhi",
    email: "alex.johnson@gmail.com", emailVerified: true,
    phone: "+91 98765 43210", phoneVerified: false,
    year: "3rd Year", major: "Computer Science",
    bio: "Passionate about learning and building. Currently exploring machine learning and full-stack development.",
  })
  const [draft, setDraft] = useState<ProfileData>(profile)

  const initials = profile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

  const handleSave = () => { setProfile(draft); setEditing(false) }
  const handleCancel = () => { setDraft(profile); setEditing(false) }

  return (
    <div className="flex relative h-screen w-full bg-[#080808] overflow-hidden">
      {/* ── Sidebar ── */}
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10" style={{ background: "#0d0d0d", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-0.5">
              {navLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} className="hover:bg-white/5 rounded-lg px-2 transition-colors py-3" />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-0.5 pb-2">
            <div className="border-t border-white/[0.06] mb-2" />
            <SidebarLink
              link={{
                label: profile.name,
                href: "/profile",
                icon: (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                    {initials}
                  </div>
                ),
              }}
              className="bg-white/[0.06] rounded-lg px-2"
            />
            <SidebarLink
              link={{ label: "Logout", href: "/",
                icon: <LogOut size={22} className="text-red-400 flex-shrink-0 ml-0.5" /> }}
              className="hover:bg-red-500/10 rounded-lg px-2 transition-colors"
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-3xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-7">
            <div>
              <h1 className="text-2xl font-bold" style={{ background: "linear-gradient(to right,#fff,#9ca3af)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                My Profile
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">Manage your personal information</p>
            </div>
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <button onClick={handleCancel}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-400 border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                    <X size={13} /> Cancel
                  </button>
                  <button onClick={handleSave}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
                    style={{ background: "linear-gradient(to right,#4f46e5,#7c3aed)", boxShadow: "0 0 16px rgba(99,102,241,0.3)" }}>
                    <Save size={13} /> Save Changes
                  </button>
                </>
              ) : (
                <button onClick={() => { setDraft(profile); setEditing(true) }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-300 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all">
                  <Pencil size={13} /> Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Avatar card */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-4 flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 0 28px rgba(99,102,241,0.35)" }}>
                {initials}
              </div>
              {editing && (
                <button className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-[#0d0d0d]">
                  <Camera size={11} className="text-white" />
                </button>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {editing
                ? <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                    className="text-xl font-bold text-white bg-transparent border-b border-white/20 focus:border-indigo-500 outline-none pb-0.5 w-full max-w-xs transition-colors" />
                : <h2 className="text-xl font-bold text-white">{profile.name}</h2>}
              <p className="text-gray-400 text-sm mt-0.5 truncate">{editing ? draft.college : profile.college}</p>
              <p className="text-gray-600 text-xs mt-1">{profile.year} · {profile.major}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Personal Info */}
            <Section title="Personal Information" icon={User}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full Name" value={editing ? draft.name : profile.name} editing={editing} onChange={v => setDraft(d => ({ ...d, name: v }))} placeholder="Your full name" icon={User} />
                <Field label="University / College" value={editing ? draft.college : profile.college} editing={editing} onChange={v => setDraft(d => ({ ...d, college: v }))} placeholder="Your institution" icon={GraduationCap} />
                <Field label="Year of Study" value={editing ? draft.year : profile.year} editing={editing} onChange={v => setDraft(d => ({ ...d, year: v }))} placeholder="e.g. 3rd Year" />
                <Field label="Field of Study" value={editing ? draft.major : profile.major} editing={editing} onChange={v => setDraft(d => ({ ...d, major: v }))} placeholder="e.g. Computer Science" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Bio</label>
                {editing
                  ? <textarea value={draft.bio} onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))} rows={3} maxLength={200} placeholder="Tell others about yourself..."
                      className="border border-white/10 bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all resize-none" />
                  : <p className="text-white text-sm leading-relaxed">{profile.bio || <span className="text-gray-600">No bio added.</span>}</p>}
              </div>
            </Section>

            {/* Contact */}
            <Section title="Contact & Verification" icon={Mail}>
              <Field label="Email Address" value={editing ? draft.email : profile.email} editing={editing}
                onChange={v => setDraft(d => ({ ...d, email: v }))} placeholder="your@email.com" icon={Mail}
                suffix={<VerifyBadge verified={profile.emailVerified} />} />
              <Field label="Phone Number" value={editing ? draft.phone : profile.phone} editing={editing}
                onChange={v => setDraft(d => ({ ...d, phone: v }))} placeholder="+91 XXXXX XXXXX" icon={Phone}
                suffix={<VerifyBadge verified={profile.phoneVerified} />} />
            </Section>

            {/* Security */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
              <button className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/[0.02] transition-colors"
                onClick={() => setShowPwd(v => !v)}>
                <div className="flex items-center gap-2">
                  <Shield size={15} className="text-indigo-400" />
                  <span className="text-sm font-semibold text-gray-200">Security &amp; Password</span>
                </div>
                {showPwd ? <ChevronUp size={15} className="text-gray-500" /> : <ChevronDown size={15} className="text-gray-500" />}
              </button>
              {showPwd && (
                <div className="px-6 pb-6 flex flex-col gap-4 border-t border-white/[0.06] pt-5">
                  {(["current", "new", "confirm"] as const).map((key) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        {key === "current" ? "Current Password" : key === "new" ? "New Password" : "Confirm New Password"}
                      </label>
                      <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-xl px-3 h-11 focus-within:ring-2 focus-within:ring-indigo-500/40 transition-all">
                        <Shield size={15} className="text-gray-500 shrink-0" />
                        <input type={pwdVis[key] ? "text" : "password"} value={passwords[key]}
                          onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))} placeholder="••••••••"
                          className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-600 outline-none" />
                        <button onClick={() => setPwdVis(v => ({ ...v, [key]: !v[key] }))} className="text-gray-500 hover:text-gray-300 transition-colors">
                          {pwdVis[key] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button className="self-start flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white mt-1"
                    style={{ background: "linear-gradient(to right,#4f46e5,#7c3aed)", boxShadow: "0 0 16px rgba(99,102,241,0.25)" }}>
                    <Shield size={13} /> Update Password
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
