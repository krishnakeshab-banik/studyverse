"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, User, GraduationCap, Phone, BookOpen, ChevronRight, Check, Pencil, type LucideIcon } from "lucide-react"
import { auth, db, storage } from "@/backend/db/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { updateProfile } from "firebase/auth"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { useAuth } from "@/context/AuthContext"

const STEPS = [
  { key: "photo",    label: "Photo",    emoji: "📸" },
  { key: "basic",    label: "Details",  emoji: "👤" },
  { key: "academic", label: "Academic", emoji: "🎓" },
  { key: "bio",      label: "About",    emoji: "✍️" },
] as const
type StepKey = typeof STEPS[number]["key"]

export default function SetupProfilePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    name: "", phone: "", college: "", year: "", major: "", bio: "",
  })

  /* Pre-fill name from Firebase Auth (set during sign-up) */
  useEffect(() => {
    if (!loading && !user) { router.push("/"); return; }
    if (user) {
      if (user.displayName) setForm(f => ({ ...f, name: user.displayName || "" }))
      if (user.photoURL) setPhotoPreview(user.photoURL)
    }
  }, [user, loading, router])

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleNext = () => setCurrentStep(s => Math.min(s + 1, STEPS.length - 1))
  const handleBack = () => setCurrentStep(s => Math.max(s - 1, 0))

  const handleSave = async () => {
    if (!user) return
    setSaving(true); setError(null)
    try {
      let photoURL = user.photoURL || ""
      if (photoFile) {
        const ref = storageRef(storage, `avatars/${user.uid}`)
        await uploadBytes(ref, photoFile)
        photoURL = await getDownloadURL(ref)
      }
      await updateProfile(user, { displayName: form.name || user.displayName, photoURL: photoURL || user.photoURL || "" })
      await updateDoc(doc(db, "users", user.uid), {
        name: form.name, phone: form.phone, college: form.college,
        year: form.year, major: form.major, bio: form.bio,
        photoURL, profileComplete: true, updatedAt: new Date().toISOString(),
      })
      router.push("/library")
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || "Failed to save. Please try again.")
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    )
  }

  const InputRow = ({ label, icon: Icon, type = "text", placeholder, value, onChange }: {
    label: string; icon?: LucideIcon; type?: string;
    placeholder: string; value: string; onChange: (v: string) => void;
  }) => (
    <div className="flex flex-col gap-1.5">
      <label className="sv-label">{label}</label>
      <div className="relative">
        {Icon && <Icon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />}
        <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
          className={`sv-input ${Icon ? "pl-10" : ""}`} />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black flex flex-col items-center px-4 py-12">

      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 70%)" }} />

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10 mt-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 0 20px rgba(99,102,241,0.45)" }}>
          <BookOpen size={15} className="text-white" />
        </div>
        <span className="text-base font-bold tracking-tight"
          style={{ background: "linear-gradient(to right,#fff,#9ca3af)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          StudyVerse
        </span>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Set up your profile</h1>
        <p className="text-white/35 text-sm mt-1.5">Just a few details to personalise your experience</p>
      </div>

      {/* Progress stepper */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1">
            <div className={`flex items-center justify-center transition-all duration-300 rounded-full font-bold text-[11px]
              ${i < currentStep  ? "w-7 h-7 bg-indigo-600 text-white" :
                i === currentStep ? "w-7 h-7 border-2 border-indigo-500 text-indigo-400 bg-indigo-500/10" :
                                    "w-7 h-7 border border-white/15 text-white/25 bg-transparent"}`}>
              {i < currentStep ? <Check size={12} /> : <span>{i + 1}</span>}
            </div>
            <span className={`text-[11px] font-medium hidden sm:block mr-1 transition-colors ${i === currentStep ? "text-white/80" : "text-white/20"}`}>{s.label}</span>
            {i < STEPS.length - 1 && <div className={`w-6 h-px transition-colors duration-300 ${i < currentStep ? "bg-indigo-500" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-8">
          <AnimatePresence mode="wait">

            {/* Step 0 — Photo */}
            {currentStep === 0 && (
              <motion.div key="photo" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.28 }}
                className="flex flex-col items-center gap-7">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-white mb-1">Add a profile photo</h2>
                  <p className="text-white/35 text-sm">Help your peers recognise you</p>
                </div>

                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center ring-2 ring-white/10 ring-offset-2 ring-offset-black transition-all group-hover:ring-indigo-500/50"
                    style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                    {photoPreview
                      ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      : <User size={36} className="text-white/60" />}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-indigo-600 border-2 border-black flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                    <Pencil size={12} className="text-white" />
                  </div>
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

                <div className="flex flex-col items-center gap-3 w-full">
                  <button onClick={() => fileInputRef.current?.click()}
                    className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm font-medium flex items-center justify-center gap-2">
                    <Camera size={14} /> {photoPreview ? "Change photo" : "Upload photo"}
                  </button>
                  <button onClick={handleNext} className="text-white/25 hover:text-white/50 text-xs transition-colors">
                    Skip for now →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 1 — Basic */}
            {currentStep === 1 && (
              <motion.div key="basic" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.28 }}
                className="flex flex-col gap-5">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Your details</h2>
                  <p className="text-white/35 text-sm">Let others know who you are</p>
                </div>
                <InputRow label="Full Name *" icon={User} placeholder="Alex Johnson" value={form.name} onChange={set("name")} />
                <InputRow label="Phone Number" icon={Phone} type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={set("phone")} />
              </motion.div>
            )}

            {/* Step 2 — Academic */}
            {currentStep === 2 && (
              <motion.div key="academic" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.28 }}
                className="flex flex-col gap-5">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Academic details</h2>
                  <p className="text-white/35 text-sm">Help us personalise your experience</p>
                </div>
                <InputRow label="University / College *" icon={GraduationCap} placeholder="e.g. IIT Bombay" value={form.college} onChange={set("college")} />
                <InputRow label="Year of Study *" icon={BookOpen} placeholder="e.g. 2nd Year" value={form.year} onChange={set("year")} />
                <InputRow label="Field of Study *" icon={BookOpen} placeholder="e.g. Computer Science" value={form.major} onChange={set("major")} />
              </motion.div>
            )}

            {/* Step 3 — Bio */}
            {currentStep === 3 && (
              <motion.div key="bio" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.28 }}
                className="flex flex-col gap-5">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">About you</h2>
                  <p className="text-white/35 text-sm">Tell the community a bit about yourself</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="sv-label">Bio</label>
                  <textarea rows={5} maxLength={250} placeholder="What are you studying? What are your interests? What do you want to achieve?"
                    value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    className="sv-input h-auto py-3.5 resize-none" />
                  <span className="text-[10px] text-white/20 text-right">{form.bio.length}/250</span>
                </div>
                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs">{error}</div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Navigation footer */}
        <div className="flex gap-2.5 px-8 pb-8">
          {currentStep > 0 && (
            <button onClick={handleBack}
              className="flex-1 h-11 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:bg-white/8 hover:text-white/90 transition-all text-sm font-medium">
              ← Back
            </button>
          )}
          {currentStep < STEPS.length - 1 ? (
            <button onClick={handleNext} disabled={currentStep === 1 && !form.name.trim()}
              className="flex-1 sv-btn-primary h-11 flex items-center justify-center gap-2 disabled:opacity-40">
              Continue <ChevronRight size={14} />
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="flex-1 sv-btn-primary h-11 flex items-center justify-center gap-2">
              {saving ? "Saving…" : <><Check size={14} /> Complete Setup</>}
            </button>
          )}
        </div>
      </div>

      <p className="text-white/15 text-[11px] mt-6 text-center">
        You can update this anytime from your profile settings.
      </p>
    </div>
  )
}
