"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Lock, User } from "lucide-react"
import { auth, db } from "@/backend/db/firebase"
import { doc, setDoc } from "firebase/firestore"
import { 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  signInWithPopup,
  updateProfile
} from "firebase/auth"
import { useRouter } from "next/navigation"

interface SignUpFormProps {
  onSwitchMode?: () => void
  onSuccess?: () => void
}

export default function SignUpForm({ onSwitchMode, onSuccess }: SignUpFormProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update the user's display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: name
        })

        // Save extra data to Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name,
          email,
          college: "",
          year: "",
          major: "",
          bio: "",
          phone: "",
          emailVerified: false,
          phoneVerified: false,
          createdAt: new Date().toISOString()
        })
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/profile")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create an account")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setError(null)
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      if (onSuccess) onSuccess()
      else router.push("/profile")
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Failed to sign up with Google")
      }
    }
  }

  const handleGithubSignUp = async () => {
    setError(null)
    try {
      const provider = new GithubAuthProvider()
      await signInWithPopup(auth, provider)
      if (onSuccess) onSuccess()
      else router.push("/profile")
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Failed to sign up with GitHub")
      }
    }
  }

  return (
    <Card className="w-full max-w-md rounded-2xl border bg-white/[0.03] backdrop-blur-xl border-white/10 shadow-2xl">
      <CardContent className="p-7 flex flex-col gap-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignUp} className="flex flex-col gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="text-gray-300 text-sm">Full Name</Label>
            <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-xl px-3 h-12 focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:border-indigo-500/40 transition-all duration-200">
              <User className="h-4 w-4 text-gray-500 shrink-0" />
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-white placeholder:text-gray-600 h-full w-full outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="signup-email" className="text-gray-300 text-sm">Email</Label>
            <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-xl px-3 h-12 focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:border-indigo-500/40 transition-all duration-200">
              <Mail className="h-4 w-4 text-gray-500 shrink-0" />
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-white placeholder:text-gray-600 h-full w-full outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="signup-password" className="text-gray-300 text-sm">Password</Label>
            <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-xl px-3 h-12 focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:border-indigo-500/40 transition-all duration-200">
              <Lock className="h-4 w-4 text-gray-500 shrink-0" />
              <Input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-white placeholder:text-gray-600 h-full w-full outline-none"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-password" className="text-gray-300 text-sm">Confirm Password</Label>
            <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-xl px-3 h-12 focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:border-indigo-500/40 transition-all duration-200">
              <Lock className="h-4 w-4 text-gray-500 shrink-0" />
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-white placeholder:text-gray-600 h-full w-full outline-none"
              />
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start space-x-2 mt-1">
            <Checkbox
              id="terms"
              required
              className="mt-0.5 border-white/20 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
            />
            <Label htmlFor="terms" className="text-sm font-normal text-gray-500 leading-relaxed cursor-pointer">
              I agree to the{" "}
              <span className="text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors">Terms of Service</span>
              {" "}and{" "}
              <span className="text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors">Privacy Policy</span>
            </Label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 text-base font-semibold rounded-xl text-white border-0 mt-1 disabled:opacity-50"
            style={{
              background: 'linear-gradient(to right, #4f46e5, #7c3aed)',
              boxShadow: '0 0 24px rgba(99,102,241,0.35)',
            }}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center gap-3">
          <div className="flex-1 border-t border-white/10" />
          <span className="text-xs text-gray-600">or continue with</span>
          <div className="flex-1 border-t border-white/10" />
        </div>

        {/* Social Buttons */}
        <div className="flex flex-col gap-3">
          <button 
            type="button"
            onClick={handleGoogleSignUp}
            className="w-full h-11 rounded-xl flex items-center justify-center gap-3 border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all text-sm font-medium"
          >
            <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" width={18} height={18} />
            Continue with Google
          </button>
          <button 
            type="button"
            onClick={handleGithubSignUp}
            className="w-full h-11 rounded-xl flex items-center justify-center gap-3 border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all text-sm font-medium"
          >
            <img src="https://www.svgrepo.com/show/303615/github-icon-1-logo.svg" alt="GitHub" width={18} height={18} className="invert opacity-80" />
            Continue with GitHub
          </button>
        </div>

        {/* Toggle */}
        <p className="text-center text-sm text-gray-600 mt-1">
          Already have an account?{" "}
          <span
            className="text-indigo-400 cursor-pointer hover:text-indigo-300 transition-colors font-medium"
            onClick={onSwitchMode}
          >
            Sign In
          </span>
        </p>
      </CardContent>
    </Card>
  )
}
