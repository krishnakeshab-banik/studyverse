"use client"

import React, { useState, useEffect } from 'react';
import { BookOpen, Brain, ShoppingBag, CalendarDays, MessageSquare, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const features = [
  {
    title: "Library",
    description: "Store & organize study resources",
    gradient: "linear-gradient(160deg, #0a1628 0%, #0f2247 50%, #0a1628 100%)",
    glow: "rgba(59, 130, 246, 0.35)",
    accentColor: "#3b82f6",
    patternColor: "rgba(59,130,246,0.07)",
    icon: BookOpen,
    fullDescription: "Notes, PDFs, PPTs & websites — all in one organized place with AI assistance.",
  },
  {
    title: "Virtual Study",
    description: "AI-powered learning workspaces",
    gradient: "linear-gradient(160deg, #100820 0%, #1e0f3d 50%, #100820 100%)",
    glow: "rgba(139, 92, 246, 0.35)",
    accentColor: "#8b5cf6",
    patternColor: "rgba(139,92,246,0.07)",
    icon: Brain,
    fullDescription: "Watch YouTube, get AI summaries, take notes and track study time.",
  },
  {
    title: "Marketplace",
    description: "Discover community resources",
    gradient: "linear-gradient(160deg, #071a10 0%, #0d3320 50%, #071a10 100%)",
    glow: "rgba(16, 185, 129, 0.35)",
    accentColor: "#10b981",
    patternColor: "rgba(16,185,129,0.07)",
    icon: ShoppingBag,
    fullDescription: "Browse and add curated resources from the community, sorted by subject.",
  },
  {
    title: "Calendar",
    description: "Plan your study schedule",
    gradient: "linear-gradient(160deg, #1a1000 0%, #3d2600 50%, #1a1000 100%)",
    glow: "rgba(245, 158, 11, 0.35)",
    accentColor: "#f59e0b",
    patternColor: "rgba(245,158,11,0.07)",
    icon: CalendarDays,
    fullDescription: "Set study sessions and get email & push reminders to stay on track.",
  },
  {
    title: "Post Doubts",
    description: "Peer learning & AI help",
    gradient: "linear-gradient(160deg, #1a0510 0%, #3d0f22 50%, #1a0510 100%)",
    glow: "rgba(244, 63, 94, 0.35)",
    accentColor: "#f43f5e",
    patternColor: "rgba(244,63,94,0.07)",
    icon: MessageSquare,
    fullDescription: "Post questions publicly, get peer answers and AI assistance fast.",
  },
];

const InteractiveSelector = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animatedOptions, setAnimatedOptions] = useState<number[]>([]);
  const [visitedIndices, setVisitedIndices] = useState<Set<number>>(new Set([0]));
  const router = useRouter();

  const handleOptionClick = (index: number) => {
    setActiveIndex(index);
    setVisitedIndices((prev) => new Set([...prev, index]));
  };

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    features.forEach((_, i) => {
      const timer = setTimeout(() => {
        setAnimatedOptions((prev) => [...prev, i]);
      }, 180 * i);
      timers.push(timer);
    });
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  const allVisited = visitedIndices.size === features.length;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#080808] font-sans text-white overflow-hidden">

      {/* Subtle top ambient light */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 300,
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div className="w-full max-w-2xl px-6 mt-10 mb-10 text-center z-10">
        <h1
          className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight"
          style={{
            background: 'linear-gradient(to bottom, #ffffff, #9ca3af)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'fadeInFromTop 0.8s ease-in-out 0.3s both',
          }}
        >
          Everything You Need
        </h1>
        <p
          className="text-lg md:text-xl text-gray-500 font-medium max-w-xl mx-auto"
          style={{ animation: 'fadeInFromTop 0.8s ease-in-out 0.6s both', opacity: 0 }}
        >
          Explore all the tools that make <span className="text-gray-300 font-semibold">StudyVerse</span> your ultimate learning companion.
        </p>
      </div>

      {/* Options Container */}
      <div
        className="z-10"
        style={{
          display: 'flex',
          width: '100%',
          maxWidth: 920,
          minWidth: 300,
          height: 420,
          padding: '0 16px',
          boxSizing: 'border-box',
          gap: 4,
        }}
      >
        {features.map((feature, index) => {
          const Icon = feature.icon;
          const isActive = activeIndex === index;
          const isVisited = visitedIndices.has(index);

          return (
            <div
              key={index}
              onClick={() => handleOptionClick(index)}
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 16,
                background: feature.gradient,
                opacity: animatedOptions.includes(index) ? 1 : 0,
                transform: animatedOptions.includes(index) ? 'translateX(0)' : 'translateX(-60px)',
                transition: 'flex 0.65s cubic-bezier(0.4,0,0.2,1), opacity 0.45s ease, transform 0.45s ease, box-shadow 0.4s ease, border-color 0.4s ease',
                flex: isActive ? '7 1 0%' : '1 1 0%',
                minWidth: 56,
                borderWidth: 1.5,
                borderStyle: 'solid',
                borderColor: isActive ? feature.accentColor : isVisited ? 'rgba(255,255,255,0.08)' : '#1f1f1f',
                boxShadow: isActive
                  ? `0 0 40px ${feature.glow}, 0 20px 60px rgba(0,0,0,0.5)`
                  : '0 8px 24px rgba(0,0,0,0.4)',
                cursor: 'pointer',
              }}
            >
              {/* Background pattern dots */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `radial-gradient(circle, ${feature.patternColor} 1.5px, transparent 1.5px)`,
                  backgroundSize: '24px 24px',
                  opacity: isActive ? 1 : 0.4,
                  transition: 'opacity 0.6s ease',
                }}
              />

              {/* Active glow radial */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `radial-gradient(ellipse at 50% 110%, ${feature.glow} 0%, transparent 65%)`,
                  opacity: isActive ? 1 : 0,
                  transition: 'opacity 0.6s ease',
                  pointerEvents: 'none',
                }}
              />

              {/* Top accent line when active */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '20%',
                  right: '20%',
                  height: 2,
                  borderRadius: 99,
                  background: feature.accentColor,
                  opacity: isActive ? 0.8 : 0,
                  transition: 'opacity 0.5s ease',
                }}
              />

              {/* Bottom gradient fade */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: isActive ? 0 : -48,
                  height: 140,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                  transition: 'bottom 0.65s ease',
                  pointerEvents: 'none',
                }}
              />

              {/* Visited checkmark badge */}
              {isVisited && !isActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: feature.accentColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.9,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}

              {/* Label row */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  zIndex: 3,
                  padding: '0 14px',
                  gap: 12,
                }}
              >
                {/* Icon circle */}
                <div
                  style={{
                    minWidth: 42,
                    width: 42,
                    height: 42,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: 'rgba(10,10,10,0.75)',
                    border: `1.5px solid ${isActive ? feature.accentColor : 'rgba(255,255,255,0.12)'}`,
                    backdropFilter: 'blur(12px)',
                    flexShrink: 0,
                    transition: 'border-color 0.4s ease',
                    boxShadow: isActive ? `0 0 12px ${feature.glow}` : 'none',
                  }}
                >
                  <Icon size={20} color={isActive ? feature.accentColor : '#9ca3af'} style={{ transition: 'color 0.4s ease' }} />
                </div>

                {/* Text */}
                <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: '#ffffff',
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? 'translateX(0)' : 'translateX(20px)',
                      transition: 'opacity 0.6s ease, transform 0.6s ease',
                    }}
                  >
                    {feature.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: '#9ca3af',
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? 'translateX(0)' : 'translateX(20px)',
                      transition: 'opacity 0.6s ease 0.06s, transform 0.6s ease 0.06s',
                      marginTop: 2,
                    }}
                  >
                    {feature.fullDescription}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress indicators */}
      <div className="flex gap-2 mt-6 z-10">
        {features.map((f, i) => (
          <div
            key={i}
            onClick={() => handleOptionClick(i)}
            style={{
              width: visitedIndices.has(i) ? 20 : 6,
              height: 6,
              borderRadius: 99,
              background: activeIndex === i ? f.accentColor : visitedIndices.has(i) ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)',
              transition: 'all 0.4s ease',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      {/* Continue button */}
      <div
        style={{
          marginTop: 12,
          opacity: allVisited ? 1 : 0,
          transform: allVisited ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.95)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
          pointerEvents: allVisited ? 'auto' : 'none',
        }}
      >
        <button
          onClick={() => router.push('/auth')}
          className="flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-base text-white"
          style={{
            background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
            boxShadow: '0 0 28px rgba(99,102,241,0.45), 0 4px 20px rgba(0,0,0,0.4)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 40px rgba(99,102,241,0.6), 0 4px 24px rgba(0,0,0,0.5)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 28px rgba(99,102,241,0.45), 0 4px 20px rgba(0,0,0,0.4)';
          }}
        >
          Continue <ChevronRight size={18} />
        </button>
      </div>

      <style>{`
        @keyframes fadeInFromTop {
          from { opacity: 0; transform: translateY(-18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default InteractiveSelector;
