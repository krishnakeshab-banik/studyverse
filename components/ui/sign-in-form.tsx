"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Lock } from "lucide-react"

interface SignInFormProps {
  onSwitchMode?: () => void
}

export default function SignInForm({ onSwitchMode }: SignInFormProps) {
  return (
    <Card className="w-full max-w-md rounded-2xl border bg-white/[0.03] backdrop-blur-xl border-white/10 shadow-2xl">
      <CardContent className="p-7 flex flex-col gap-5">
        {/* Email */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-gray-300 text-sm">Email</Label>
          <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-xl px-3 h-12 focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:border-indigo-500/40 transition-all duration-200">
            <Mail className="h-4 w-4 text-gray-500 shrink-0" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-white placeholder:text-gray-600 h-full"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-gray-300 text-sm">Password</Label>
          <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-xl px-3 h-12 focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:border-indigo-500/40 transition-all duration-200">
            <Lock className="h-4 w-4 text-gray-500 shrink-0" />
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-white placeholder:text-gray-600 h-full"
            />
          </div>
        </div>

        {/* Remember me & Forgot */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" className="border-white/20 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600" />
            <Label htmlFor="remember" className="text-sm font-normal text-gray-500 cursor-pointer">
              Remember me
            </Label>
          </div>
          <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            Forgot password?
          </button>
        </div>

        {/* Submit */}
        <Button
          className="w-full h-12 text-base font-semibold rounded-xl text-white border-0"
          style={{
            background: 'linear-gradient(to right, #4f46e5, #7c3aed)',
            boxShadow: '0 0 24px rgba(99,102,241,0.35)',
          }}
        >
          Sign In
        </Button>

        {/* Divider */}
        <div className="relative flex items-center gap-3">
          <div className="flex-1 border-t border-white/10" />
          <span className="text-xs text-gray-600">or continue with</span>
          <div className="flex-1 border-t border-white/10" />
        </div>

        {/* Social Buttons */}
        <div className="flex flex-col gap-3">
          <button className="w-full h-11 rounded-xl flex items-center justify-center gap-3 border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all text-sm font-medium">
            <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" width={18} height={18} />
            Continue with Google
          </button>
          <button className="w-full h-11 rounded-xl flex items-center justify-center gap-3 border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all text-sm font-medium">
            <img src="https://www.svgrepo.com/show/303615/github-icon-1-logo.svg" alt="GitHub" width={18} height={18} className="invert opacity-80" />
            Continue with GitHub
          </button>
        </div>

        {/* Toggle */}
        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <span
            className="text-indigo-400 cursor-pointer hover:text-indigo-300 transition-colors font-medium"
            onClick={onSwitchMode}
          >
            Sign Up
          </span>
        </p>
      </CardContent>
    </Card>
  )
}
