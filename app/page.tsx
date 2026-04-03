"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BackgroundCircles, COLOR_VARIANTS } from "@/components/ui/background-circles";
import { HoverButton } from "@/components/ui/hover-button";

const variants = Object.keys(COLOR_VARIANTS) as (keyof typeof COLOR_VARIANTS)[];

export default function HomePage() {
    const router = useRouter();
    const [currentVariant, setCurrentVariant] =
        useState<keyof typeof COLOR_VARIANTS>("octonary");

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentVariant((prev) => {
                const currentIndex = variants.indexOf(prev);
                return variants[(currentIndex + 1) % variants.length];
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <main className="relative min-h-screen">
            <BackgroundCircles variant={currentVariant} />

            {/* CTA button centered below the hero text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="mt-64 pointer-events-auto">
                    <HoverButton onClick={() => router.push('/onboarding')}>Get Started</HoverButton>
                </div>
            </div>
        </main>
    );
}
