"use client"
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { VantaRings } from '@/components/landing/VantaRings';
import { ParticleSwarm } from '@/components/landing/ParticleSwarm';
import { Typewriter } from '@/components/ui/typewriter-text';
import Preloader from '@/components/ui/preloader';

export const LandingPage: React.FC = () => {
    const [showPreloader, setShowPreloader] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    const handlePreloaderComplete = React.useCallback(() => {
        setShowPreloader(false);
    }, []);

    // Maintain scroll tracking for the parallax effect if user still wants it
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Parallax effect for the Vanta header
    const vantaY = useTransform(scrollYProgress, [0, 0.3], ["0%", "50%"]);
    const vantaOpacity = useTransform(scrollYProgress, [0.2, 0.4], [1, 0]);

    return (
        <>
            <AnimatePresence>
                {showPreloader && (
                    <Preloader onComplete={handlePreloaderComplete} />
                )}
            </AnimatePresence>

            <main 
                ref={containerRef} 
                className="relative min-h-[500vh] bg-black overflow-x-hidden" 
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
            >
                {/* Parallax Vanta Header Section */}
                <section className="relative h-screen w-full overflow-hidden z-0">
                    <motion.div 
                        style={{ y: vantaY, opacity: vantaOpacity }}
                        className="absolute inset-0"
                    >
                        <VantaRings />
                    </motion.div>
                    
                    {/* Hero Narrative Overlay */}
                    <div className="absolute top-20 left-12 md:left-20 z-[60] text-left pointer-events-none max-w-2xl">
                        <Typewriter 
                            text={[
                                "Welcome to Atlas.",
                                "Meet your meeting delegate.",
                                "Map your codebase architecture.",
                                "Visualize complex repo data flows.",
                                "Ask questions to your own repo agent"
                            ]}
                            speed={100}
                            deleteSpeed={60}
                            delay={3000}
                            loop={true}
                            className="text-white text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight leading-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                        />
                    </div>
                </section>

                {/* Particle Swarm Section (Simple Version) */}
                <section className="relative h-screen w-full overflow-hidden z-20">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0"
                    >
                        <ParticleSwarm />
                    </motion.div>
                    
                    {/* Text Removed at User Request */}
                </section>

                <section className="h-screen w-full flex items-center justify-center relative z-20">
                     <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.5 }}
                        className="relative group cursor-crosshair"
                    >
                        <div className="text-white/10 text-[15vw] font-bold leading-none select-none group-hover:text-orange-500/10 transition-colors duration-700">
                            ENTROPY
                        </div>
                    </motion.div>
                </section>

                <section className="h-[200vh] w-full flex items-start justify-center pt-[50vh] relative z-20">
                    <div className="text-center">
                        <p className="text-white/20 text-sm font-mono tracking-widest uppercase">
                            Architecture • Intelligence • Mapping
                        </p>
                    </div>
                </section>

                {/* Subtle Technical Noise Texture Overlay (Global) */}
                <div className="fixed inset-0 z-[5] pointer-events-none opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] contrast-200 brightness-150" />
            </main>
        </>
    );
};
