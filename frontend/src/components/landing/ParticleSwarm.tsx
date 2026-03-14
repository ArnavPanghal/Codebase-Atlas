'use client'
import React, { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, Engine, ISourceOptions } from "@tsparticles/engine";

export const ParticleSwarm: React.FC = () => {
    const [init, setInit] = useState(false);

    // this should be run only once per application lifetime
    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesLoaded = async (container?: Container): Promise<void> => {
        console.log("Particles loaded", container);
    };

    const options: ISourceOptions = {
        background: {
            color: {
                value: "transparent",
            },
        },
        fpsLimit: 120,
        particles: {
            number: {
                value: 200,
                density: {
                    enable: false,
                },
            },
            color: {
                value: ["#ff8800", "#ff4400", "#ffffff"],
            },
            shape: {
                type: "star",
            },
            opacity: {
                value: { min: 0.3, max: 0.8 },
                animation: {
                    enable: true,
                    speed: 1,
                    sync: false,
                }
            },
            size: {
                value: { min: 1, max: 5 },
            },
            move: {
                enable: true,
                speed: 12,
                direction: "left",
                random: false,
                straight: true,
                outModes: {
                    default: "out",
                },
            },
            links: {
                enable: false,
            },
            shadow: {
                enable: true,
                color: "#ffaa00",
                blur: 10,
            }
        },
        interactivity: {
            events: {
                onHover: {
                    enable: true,
                    mode: "repulse",
                },
                onClick: {
                    enable: true,
                    mode: "push",
                },
            },
            modes: {
                repulse: {
                    distance: 100,
                    duration: 0.4,
                },
                push: {
                    quantity: 4,
                },
            },
        },
        detectRetina: true,
    };

    if (init) {
        return (
            <div className="absolute inset-0 w-full h-full z-0 overflow-hidden"
                 style={{
                    backgroundColor: "#000000",
                    backgroundImage: 'url("https://vincentgarreau.com/particles.js/assets/img/kbLd9vb_new.gif")',
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "25% auto",
                    backgroundPosition: "-5% 40%",
                    imageRendering: "pixelated",
                 }}
            >
                <Particles
                    id="tsparticles"
                    particlesLoaded={particlesLoaded}
                    options={options}
                    className="w-full h-full"
                />
            </div>
        );
    }

    return null;
};
