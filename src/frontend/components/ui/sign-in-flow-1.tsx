"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Eye, EyeOff, User, Mail, Lock, type LucideIcon } from "lucide-react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { createUniqueStudyverseId, registerStudyverseId } from "@/backend/social/user-id";
import { getClientAuth, getClientDb } from "@/backend/db/firebase";

/* ─────────────────────── Types ─────────────────────── */

type Uniforms = Record<string, { value: number[] | number[][] | number; type: string }>;
interface ShaderProps { source: string; uniforms: Uniforms; maxFps?: number; }
export interface SignInPageProps { className?: string; }
type Mode = "signin" | "signup";
type Step = "auth" | "success";

/* ─────────────────────── Canvas Shader ─────────────────────── */

export const CanvasRevealEffect = ({
  animationSpeed = 10, opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[0, 255, 255]], containerClassName, dotSize, showGradient = true, reverse = false,
}: { animationSpeed?: number; opacities?: number[]; colors?: number[][]; containerClassName?: string; dotSize?: number; showGradient?: boolean; reverse?: boolean }) => (
  <div className={cn("h-full relative w-full", containerClassName)}>
    <div className="h-full w-full">
      <DotMatrix colors={colors ?? [[0, 255, 255]]} dotSize={dotSize ?? 3}
        opacities={opacities ?? [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1]}
        shader={`${reverse ? "u_reverse_active" : "false"}_;aspd_${animationSpeed.toFixed(1)}_;`} center={["x", "y"]} />
    </div>
    {showGradient && <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />}
  </div>
);

const DotMatrix: React.FC<{ colors?: number[][]; opacities?: number[]; totalSize?: number; dotSize?: number; shader?: string; center?: ("x" | "y")[] }> = ({
  colors = [[0, 0, 0]], opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 20, dotSize = 2, shader = "", center = ["x", "y"],
}) => {
  const uniforms = useMemo(() => {
    let ca = [colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]];
    if (colors.length === 2) ca = [colors[0], colors[0], colors[0], colors[1], colors[1], colors[1]];
    else if (colors.length === 3) ca = [colors[0], colors[0], colors[1], colors[1], colors[2], colors[2]];
    return {
      u_colors: { value: ca.map(c => [c[0] / 255, c[1] / 255, c[2] / 255]), type: "uniform3fv" },
      u_opacities: { value: opacities, type: "uniform1fv" },
      u_total_size: { value: totalSize, type: "uniform1f" },
      u_dot_size: { value: dotSize, type: "uniform1f" },
      u_reverse: { value: shader.includes("u_reverse_active") ? 1 : 0, type: "uniform1i" },
    };
  }, [colors, opacities, totalSize, dotSize, shader]);

  return (
    <Shader source={`
      precision mediump float;
      in vec2 fragCoord;
      uniform float u_time; uniform float u_opacities[10]; uniform vec3 u_colors[6];
      uniform float u_total_size; uniform float u_dot_size; uniform vec2 u_resolution; uniform int u_reverse;
      out vec4 fragColor;
      float PHI=1.61803398874989484820459;
      float random(vec2 xy){return fract(tan(distance(xy*PHI,xy)*0.5)*xy.x);}
      void main(){
        vec2 st=fragCoord.xy;
        ${center.includes("x") ? "st.x-=abs(floor((mod(u_resolution.x,u_total_size)-u_dot_size)*0.5));" : ""}
        ${center.includes("y") ? "st.y-=abs(floor((mod(u_resolution.y,u_total_size)-u_dot_size)*0.5));" : ""}
        float opacity=step(0.0,st.x)*step(0.0,st.y);
        vec2 st2=vec2(int(st.x/u_total_size),int(st.y/u_total_size));
        float soff=random(st2);
        float rand=random(st2*floor((u_time/5.0)+soff+5.0));
        opacity*=u_opacities[int(rand*10.0)];
        opacity*=1.0-step(u_dot_size/u_total_size,fract(st.x/u_total_size));
        opacity*=1.0-step(u_dot_size/u_total_size,fract(st.y/u_total_size));
        vec3 color=u_colors[int(soff*6.0)];
        float aspd=0.5;
        vec2 cg=u_resolution/2.0/u_total_size;
        float dist=distance(cg,st2);
        float ti=dist*0.01+(random(st2)*0.15);
        float mg=distance(cg,vec2(0.0));
        float to=(mg-dist)*0.02+(random(st2+42.0)*0.2);
        if(u_reverse==1){opacity*=1.0-step(to,u_time*aspd);opacity*=clamp(step(to+0.1,u_time*aspd)*1.25,1.0,1.25);}
        else{opacity*=step(ti,u_time*aspd);opacity*=clamp((1.0-step(ti+0.1,u_time*aspd))*1.25,1.0,1.25);}
        fragColor=vec4(color,opacity);fragColor.rgb*=fragColor.a;
      }`} uniforms={uniforms} maxFps={60} />
  );
};

const ShaderMesh = ({ source, uniforms }: { source: string; uniforms: Uniforms }) => {
  const { size } = useThree();
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.ShaderMaterial & { uniforms: Record<string, { value: unknown }> };
    mat.uniforms.u_time.value = clock.getElapsedTime();
  });
  const material = useMemo(() => {
    const p: Record<string, { value: unknown }> = {};
    for (const n in uniforms) {
      const u = uniforms[n];
      if (u.type === "uniform3fv") p[n] = { value: (u.value as number[][]).map(v => new THREE.Vector3().fromArray(v)) };
      else p[n] = { value: u.value };
    }
    p.u_time = { value: 0 };
    p.u_resolution = { value: new THREE.Vector2(size.width * 2, size.height * 2) };
    return new THREE.ShaderMaterial({
      vertexShader: `precision mediump float;uniform vec2 u_resolution;out vec2 fragCoord;void main(){gl_Position=vec4(position.xy,0.0,1.0);fragCoord=(position.xy+vec2(1.0))*0.5*u_resolution;fragCoord.y=u_resolution.y-fragCoord.y;}`,
      fragmentShader: source, uniforms: p, glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneFactor,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, source]);
  return (
    <mesh ref={ref as React.RefObject<THREE.Mesh>}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const Shader: React.FC<ShaderProps> = ({ source, uniforms }) => (
  <Canvas className="absolute inset-0 h-full w-full">
    <ShaderMesh source={source} uniforms={uniforms} />
  </Canvas>
);

/* ─────────────────────── Navbar ─────────────────────── */

function TopNav() {
  const scroll = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] backdrop-blur-xl bg-black/40">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
        </div>
        <span className="text-sm font-bold tracking-tight" style={{ background: "linear-gradient(to right,#fff,#9ca3af)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          StudyVerse
        </span>
      </div>

      <nav className="hidden md:flex items-center gap-6">
        {[["About", "about"], ["Features", "about"], ["Get Started", "signin-section"]].map(([label, id]) => (
          <button key={label} onClick={() => scroll(id)} className="text-xs font-medium text-white/50 hover:text-white/90 transition-colors tracking-wide">
            {label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <button onClick={() => scroll("signin-section")} className="hidden sm:block px-3.5 py-2 text-xs font-semibold text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5">
          Sign In
        </button>
        <button onClick={() => scroll("signin-section")} className="px-3.5 py-2 text-xs font-semibold text-white rounded-lg transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
          Get Started
        </button>
      </div>
    </header>
  );
}

/* ─────────────────────── OAuth Icons ─────────────────────── */

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const GithubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

/* ─────────────────────── Field component ─────────────────────── */

function InputField({
  label, type = "text", placeholder, value, onChange, icon: Icon, rightEl, autoFocus,
}: {
  label: string; type?: string; placeholder: string; value: string;
  onChange: (v: string) => void; icon?: LucideIcon;
  rightEl?: React.ReactNode; autoFocus?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="sv-label">{label}</label>
      <div className="relative flex items-center">
        {Icon && <Icon size={14} className="absolute left-4 text-white/25 pointer-events-none" />}
        <input
          type={type} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          autoFocus={autoFocus}
          className={cn("sv-input", Icon ? "pl-10" : "pl-4", rightEl ? "pr-12" : "")}
        />
        {rightEl && <div className="absolute right-3">{rightEl}</div>}
      </div>
    </div>
  );
}

/* ─────────────────────── Helpers ─────────────────────── */

async function saveNewUserDoc(uid: string, email: string, name: string, photoURL: string) {
  const studyverseId = await createUniqueStudyverseId()
  await setDoc(doc(getClientDb(), "users", uid), {
    name, email, college: "", year: "", major: "", bio: "", phone: "",
    photoURL, emailVerified: false, phoneVerified: false,
    studyverseId, followers: [], following: [],
    createdAt: new Date().toISOString(), profileComplete: false,
  })
  await registerStudyverseId(uid, studyverseId)
}

/* ─────────────────────── Main SignInPage ─────────────────────── */

export const SignInPage = ({ className }: SignInPageProps) => {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signin");
  const [step, setStep] = useState<Step>("auth");

  /* Sign-in fields */
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siShowPwd, setSiShowPwd] = useState(false);

  /* Sign-up fields */
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirm, setSuConfirm] = useState("");
  const [suShowPwd, setSuShowPwd] = useState(false);
  const [suShowConfirm, setSuShowConfirm] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initialCanvas, setInitialCanvas] = useState(true);
  const [reverseCanvas, setReverseCanvas] = useState(false);

  const resetFields = () => {
    setSiEmail(""); setSiPassword(""); setSiShowPwd(false);
    setSuName(""); setSuEmail(""); setSuPassword(""); setSuConfirm("");
    setSuShowPwd(false); setSuShowConfirm(false);
    setError(null);
  };

  const switchMode = (m: Mode) => { setMode(m); resetFields(); };

  const triggerSuccess = (newUser: boolean) => {
    setReverseCanvas(true);
    setTimeout(() => setInitialCanvas(false), 50);
    setTimeout(() => {
      setStep("success");
      setIsLoading(false);
      setTimeout(() => router.push(newUser ? "/setup-profile" : "/library"), 1200);
    }, 2000);
  };

  /* ── Sign In submit ── */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setIsLoading(true);
    try {
      await signInWithEmailAndPassword(getClientAuth(), siEmail, siPassword);
      triggerSuccess(false);
    } catch (err: unknown) {
      const fe = err as { code?: string; message?: string };
      const msg =
        fe.code === "auth/wrong-password" || fe.code === "auth/invalid-credential" ? "Incorrect email or password."
        : fe.code === "auth/user-not-found" ? "No account found with this email."
        : fe.code === "auth/invalid-email" ? "Please enter a valid email."
        : fe.message || "Sign-in failed.";
      setError(msg); setIsLoading(false);
    }
  };

  /* ── Sign Up submit ── */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!suName.trim()) { setError("Full name is required."); return; }
    if (suPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (suPassword !== suConfirm) { setError("Passwords do not match."); return; }
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(getClientAuth(), suEmail, suPassword);
      await updateProfile(cred.user, { displayName: suName.trim() });
      await saveNewUserDoc(cred.user.uid, suEmail, suName.trim(), "");
      triggerSuccess(true);
    } catch (err: unknown) {
      const fe = err as { code?: string; message?: string };
      const msg =
        fe.code === "auth/email-already-in-use" ? "This email is already registered. Try signing in."
        : fe.code === "auth/weak-password" ? "Password is too weak. Use at least 6 characters."
        : fe.code === "auth/invalid-email" ? "Please enter a valid email."
        : fe.message || "Sign-up failed.";
      setError(msg); setIsLoading(false);
    }
  };

  /* ── OAuth ── */
  const handleOAuth = async (type: "google" | "github") => {
    setError(null);
    const provider = type === "google" ? new GoogleAuthProvider() : new GithubAuthProvider();
    try {
      const result = await signInWithPopup(getClientAuth(), provider);
      const snap = await getDoc(doc(getClientDb(), "users", result.user.uid));
      if (!snap.exists()) {
        await saveNewUserDoc(result.user.uid, result.user.email || "", result.user.displayName || "", result.user.photoURL || "");
        triggerSuccess(true);
      } else {
        triggerSuccess(false);
      }
    } catch (err: unknown) {
      const fe = err as { code?: string; message?: string };
      if (fe.code !== "auth/popup-closed-by-user") setError(fe.message || `${type} sign-in failed.`);
    }
  };

  const isSignUp = mode === "signup";

  return (
    <div id="signin-section" className={cn("relative flex flex-col min-h-screen bg-black overflow-hidden", className)}>
      {/* Canvas background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {initialCanvas && (
          <div className="absolute inset-0">
            <CanvasRevealEffect animationSpeed={3} containerClassName="bg-black" colors={[[255, 255, 255], [255, 255, 255]]} dotSize={5} reverse={false} />
          </div>
        )}
        {reverseCanvas && (
          <div className="absolute inset-0">
            <CanvasRevealEffect animationSpeed={4} containerClassName="bg-black" colors={[[255, 255, 255], [255, 255, 255]]} dotSize={5} reverse={true} />
          </div>
        )}
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_60%,rgba(0,0,0,0.92)_0%,transparent_100%)]" />
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* Navbar */}
      <TopNav />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 pt-28 pb-20">
        <AnimatePresence mode="wait">

          {/* ── Auth step ── */}
          {step === "auth" && (
            <motion.div key="auth"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full max-w-[400px]"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/50 text-[11px] font-medium tracking-wide mb-5"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Your learning universe
                </motion.div>
                <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="text-[2.25rem] font-extrabold tracking-tight text-white leading-tight">
                  {isSignUp ? "Create your account" : "Welcome back"}
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  className="text-white/40 text-sm mt-2">
                  {isSignUp ? "Join thousands of students on StudyVerse" : "Sign in to continue your journey"}
                </motion.p>
              </div>

              {/* Card */}
              <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-7 shadow-2xl">

                {/* Mode toggle */}
                <div className="flex bg-white/5 border border-white/8 rounded-xl p-1 mb-6">
                  {(["signin", "signup"] as Mode[]).map(m => (
                    <button key={m} onClick={() => switchMode(m)}
                      className={cn("relative flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200",
                        mode === m ? "text-white" : "text-white/35 hover:text-white/60")}>
                      {mode === m && (
                        <motion.div layoutId="mode-bg" className="absolute inset-0 rounded-lg -z-10 bg-white/10 border border-white/10"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                      )}
                      {m === "signin" ? "Sign In" : "Sign Up"}
                    </button>
                  ))}
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs leading-relaxed">
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {/* ─── Sign In Form ─── */}
                  {mode === "signin" && (
                    <motion.form key="signin-form" onSubmit={handleSignIn}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }} className="space-y-4">
                      <InputField label="Email address" type="email" placeholder="you@university.edu"
                        value={siEmail} onChange={setSiEmail} icon={Mail} />
                      <InputField label="Password" type={siShowPwd ? "text" : "password"} placeholder="Your password"
                        value={siPassword} onChange={setSiPassword} icon={Lock}
                        rightEl={
                          <button type="button" onClick={() => setSiShowPwd(v => !v)}
                            className="text-white/25 hover:text-white/60 transition-colors p-1">
                            {siShowPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        } />
                      <button type="submit" disabled={isLoading} className="sv-btn-primary mt-2">
                        {isLoading ? "Signing in…" : "Sign In"}
                      </button>
                    </motion.form>
                  )}

                  {/* ─── Sign Up Form ─── */}
                  {mode === "signup" && (
                    <motion.form key="signup-form" onSubmit={handleSignUp}
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.25 }} className="space-y-4">
                      <InputField label="Full name" type="text" placeholder="Alex Johnson"
                        value={suName} onChange={setSuName} icon={User} autoFocus />
                      <InputField label="Email address" type="email" placeholder="you@university.edu"
                        value={suEmail} onChange={setSuEmail} icon={Mail} />
                      <InputField label="Password" type={suShowPwd ? "text" : "password"} placeholder="Minimum 6 characters"
                        value={suPassword} onChange={setSuPassword} icon={Lock}
                        rightEl={
                          <button type="button" onClick={() => setSuShowPwd(v => !v)}
                            className="text-white/25 hover:text-white/60 transition-colors p-1">
                            {suShowPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        } />
                      <InputField label="Confirm password" type={suShowConfirm ? "text" : "password"} placeholder="Repeat your password"
                        value={suConfirm} onChange={setSuConfirm} icon={Lock}
                        rightEl={
                          <button type="button" onClick={() => setSuShowConfirm(v => !v)}
                            className="text-white/25 hover:text-white/60 transition-colors p-1">
                            {suShowConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        } />
                      <button type="submit" disabled={isLoading} className="sv-btn-primary mt-2">
                        {isLoading ? "Creating account…" : "Create Account"}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                  <div className="h-px flex-1 bg-white/8" />
                  <span className="text-[11px] text-white/25 font-medium">or continue with</span>
                  <div className="h-px flex-1 bg-white/8" />
                </div>

                {/* OAuth */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button onClick={() => handleOAuth("google")}
                    className="flex items-center justify-center gap-2.5 h-11 rounded-xl bg-white/5 border border-white/8 text-white/70 text-xs font-semibold hover:bg-white/10 hover:text-white hover:border-white/15 transition-all">
                    <GoogleIcon /> Google
                  </button>
                  <button onClick={() => handleOAuth("github")}
                    className="flex items-center justify-center gap-2.5 h-11 rounded-xl bg-white/5 border border-white/8 text-white/70 text-xs font-semibold hover:bg-white/10 hover:text-white hover:border-white/15 transition-all">
                    <GithubIcon /> GitHub
                  </button>
                </div>

                {/* Switch mode */}
                <p className="text-center text-[11px] text-white/25 mt-5">
                  {isSignUp ? "Already have an account? " : "Don't have an account? "}
                  <button onClick={() => switchMode(isSignUp ? "signin" : "signup")}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                    {isSignUp ? "Sign in" : "Sign up free"}
                  </button>
                </p>
              </div>

              {/* Legal */}
              <p className="text-center text-[10px] text-white/20 mt-4 leading-relaxed">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </motion.div>
          )}

          {/* ── Success step ── */}
          {step === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }} className="text-center space-y-6">
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.5 }}
                className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-white to-white/60 flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.2)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-black" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                <h1 className="text-3xl font-bold text-white">You&apos;re in!</h1>
                <p className="text-white/40 text-sm mt-2">Redirecting you now…</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
