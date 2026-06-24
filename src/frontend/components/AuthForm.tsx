"use client";

import React, { useState } from "react";
import { getClientAuth } from "@/backend/db/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { useAuth } from "@/context/AuthContext";

export function AuthForm() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(getClientAuth(), email, password);
      } else {
        await createUserWithEmailAndPassword(getClientAuth(), email, password);
      }
    } catch (err: any) {
      setError(err.message || "Failed to authenticate");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(getClientAuth());
    } catch (err: any) {
      console.error("Failed to log out", err);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(getClientAuth(), provider);
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
    }
  };

  const handleGithubSignIn = async () => {
    setError(null);
    try {
      const provider = new GithubAuthProvider();
      await signInWithPopup(getClientAuth(), provider);
    } catch (err: any) {
      setError(err.message || "Failed to sign in with GitHub");
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading authentication...</div>;
  }

  if (user) {
    return (
      <div className="p-6 bg-zinc-900 rounded-lg shadow-lg max-w-md mx-auto text-white border border-zinc-800">
        <h2 className="text-xl font-semibold mb-4">Welcome back!</h2>
        <p className="mb-4 text-zinc-400">Signed in as {user.email}</p>
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-zinc-900 rounded-lg shadow-lg max-w-md mx-auto text-white border border-zinc-800">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isLogin ? "Sign In" : "Create Account"}
      </h2>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50"
        >
          {isLoading ? "Processing..." : isLogin ? "Sign In" : "Sign Up"}
        </button>
      </form>

      <div className="my-5 flex items-center justify-center">
        <div className="h-px w-full bg-zinc-800"></div>
        <span className="px-4 text-xs font-semibold text-zinc-500 tracking-wider">OR</span>
        <div className="h-px w-full bg-zinc-800"></div>
      </div>

      <div className="flex flex-col space-y-3">
        <button
          onClick={handleGoogleSignIn}
          type="button"
          className="w-full flex items-center justify-center gap-2 bg-white text-black font-medium py-2 px-4 rounded transition-colors hover:bg-gray-100"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
        
        <button
          onClick={handleGithubSignIn}
          type="button"
          className="w-full flex items-center justify-center gap-2 bg-[#24292F] text-white font-medium py-2 px-4 rounded transition-colors hover:bg-[#24292F]/90"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          Continue with GitHub
        </button>
      </div>

      <div className="mt-6 text-center text-sm text-zinc-400">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="text-blue-500 hover:underline"
        >
          {isLogin ? "Sign up" : "Sign in"}
        </button>
      </div>
    </div>
  );
}
