import React, { useState } from 'react';
import Hero from '@/components/ui/animated-shader-hero';
import { useNavigate } from 'react-router-dom';

export const InitializePage: React.FC = () => {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            setIsLoading(true);
            setTimeout(() => {
                navigate('/');
            }, 2000);
        }
    };

    return (
        <Hero
            trustBadge={{
                text: "Trusted by forward-thinking teams.",
            }}
            headline={{
                line1: "Launch Your",
                line2: "Repo Into Orbit"
            }}
            subtitle="Built for the next generation of teams — fast, seamless, and limitless."
        >
            <form onSubmit={handleSubmit} className="relative max-w-lg mx-auto mt-10 mb-16 animate-fade-in-up animation-delay-800">
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://github.com/..."
                        className="w-full sm:w-[320px] bg-white/[0.03] border border-white/10 text-white px-5 py-3.5 rounded-full font-mono text-xs focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all backdrop-blur-3xl placeholder:text-white/10"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!url || isLoading}
                        className="w-full sm:w-auto px-8 py-3.5 bg-white text-black rounded-full font-semibold text-[13px] tracking-wider transition-all hover:bg-neutral-100 active:scale-95 disabled:opacity-20 whitespace-nowrap"
                    >
                        {isLoading ? "ANALYZING" : "INITIALIZE"}
                    </button>
                </div>
            </form>
        </Hero>
    );
};
