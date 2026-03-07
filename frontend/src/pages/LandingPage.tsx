// @ts-nocheck
import React, { Suspense, useMemo, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

import { TheCore } from '../components/landing/TheCore';
import { DeepSpace } from '../components/landing/DeepSpace';
import { SatelliteNode } from '../components/landing/SatelliteNode';

const FEATURES = [
    {
        id: 'time-machine',
        label: 'Git Time Machine',
        description: 'Travel through the repository history. Watch the architecture evolve, identify technical debt patterns.',
        color: '#ff3333',
        radius: 8,
        speed: 0.18,
        initialAngle: 0,
        planetType: 'mars',
        hasRing: false,
        tilt: 0.05,
    },
    {
        id: 'architecture',
        label: 'Architecture Analyzer',
        description: 'Deep neural scan of codebase structures. Detect anti-patterns and visualize dependency graphs.',
        color: '#aa44ff',
        radius: 14,
        speed: 0.12,
        initialAngle: Math.PI * 0.7,
        planetType: 'crystal',
        hasRing: true,
        tilt: 0.25,
    },
    {
        id: 'impact',
        label: 'Impact Explorer',
        description: 'Simulate changes before making them. Predict regression blast zones across the entire graph.',
        color: '#33cc88',
        radius: 21,
        speed: 0.07,
        initialAngle: Math.PI * 1.5,
        planetType: 'earth',
        hasRing: false,
        tilt: 0.4,
    },
    {
        id: 'execution-flow',
        label: 'Execution Flow',
        description: 'Visualize runtime behavior in real-time. Trace call stacks, observe data flow, identify bottlenecks.',
        color: '#ff8822',
        radius: 28,
        speed: 0.04,
        initialAngle: Math.PI * 0.3,
        planetType: 'volcanic',
        hasRing: false,
        tilt: 0.12,
    },
    {
        id: 'agent',
        label: 'AI Agent',
        description: 'Natural language interface to your codebase. Ask questions, request refactors, debug issues.',
        color: '#3399ff',
        radius: 36,
        speed: 0.025,
        initialAngle: Math.PI * 1.2,
        planetType: 'glass',
        hasRing: true,
        tilt: 0.5,
    },
];

/**
 * Asteroid Belt — instanced mesh for 60fps
 */
const AsteroidBelt: React.FC = () => {
    const meshRef = useRef<THREE.InstancedMesh>(null!);
    const count = 400;
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const asteroids = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = 10 + Math.random() * 3;
            temp.push({ r, y: (Math.random() - 0.5) * 1.0, scale: 0.015 + Math.random() * 0.05, speed: 0.08 + Math.random() * 0.12, offset: angle });
        }
        return temp;
    }, []);

    useFrame((state) => {
        if (!meshRef.current) return;

        const t = state.clock.elapsedTime;
        asteroids.forEach((a, i) => {
            const angle = a.offset + t * a.speed;
            dummy.position.set(Math.cos(angle) * a.r, a.y + Math.sin(t * 0.3 + i) * 0.03, Math.sin(angle) * a.r);
            dummy.rotation.set(t * 0.4 + i, t * 0.2 + i * 0.3, 0);
            dummy.scale.setScalar(a.scale);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#887766" roughness={0.95} metalness={0.05} />
        </instancedMesh>
    );
};

const OuterDebris: React.FC = () => {
    const meshRef = useRef<THREE.InstancedMesh>(null!);
    const count = 200;
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = 40 + Math.random() * 8;
            temp.push({ r, y: (Math.random() - 0.5) * 1.5, scale: 0.01 + Math.random() * 0.03, speed: 0.01 + Math.random() * 0.025, offset: angle });
        }
        return temp;
    }, []);

    useFrame((state) => {
        if (!meshRef.current) return;

        const t = state.clock.elapsedTime;
        particles.forEach((p, i) => {
            const angle = p.offset + t * p.speed;
            dummy.position.set(Math.cos(angle) * p.r, p.y, Math.sin(angle) * p.r);
            dummy.scale.setScalar(p.scale);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#556677" roughness={0.9} metalness={0.1} />
        </instancedMesh>
    );
};

/**
 * Camera Controller — smooth lock-and-zoom to clicked planets
 */
const CameraController: React.FC<{
    target: THREE.Vector3 | null;
    onResetTarget: () => void;
}> = ({ target, onResetTarget }) => {
    const { camera } = useThree();
    const lerpTarget = useRef(new THREE.Vector3(0, 0, 0));
    const lerpPos = useRef(new THREE.Vector3(0, 15, 35));
    const isAnimating = useRef(false);
    const startTime = useRef(0);

    useFrame((state) => {
        if (target) {
            if (!isAnimating.current) {
                isAnimating.current = true;
                startTime.current = state.clock.elapsedTime;
                lerpPos.current.copy(camera.position);
                lerpTarget.current.set(0, 0, 0);
            }

            const elapsed = state.clock.elapsedTime - startTime.current;
            const duration = 2.0;
            // Smooth ease-in-out
            let t = Math.min(elapsed / duration, 1);
            t = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

            const goalPos = target.clone().add(new THREE.Vector3(3, 2, 5));
            camera.position.lerpVectors(lerpPos.current, goalPos, t);
            camera.lookAt(target);

            if (elapsed > duration + 3) {
                isAnimating.current = false;
                onResetTarget();
            }
        }
    });

    return null;
};

export const LandingPage: React.FC = () => {
    const [cameraTarget, setCameraTarget] = useState<THREE.Vector3 | null>(null);

    const handlePlanetClick = useCallback((position: THREE.Vector3) => {
        setCameraTarget(position.clone());
    }, []);

    const handleResetTarget = useCallback(() => {
        setCameraTarget(null);
    }, []);

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            background: '#000',
            overflow: 'hidden',
            position: 'relative',
            fontFamily: "'Inter', sans-serif",
        }}>
            {/* Top-left HUD — holographic style */}
            <div style={{
                position: 'absolute',
                top: 28,
                left: 28,
                zIndex: 10,
                pointerEvents: 'none',
            }}>
                <h1 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 400,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'rgba(255,255,255,0.35)',
                    letterSpacing: '6px',
                    textTransform: 'uppercase',
                }}>
                    ATLAS<span style={{ color: 'rgba(255,180,80,0.4)' }}>.SYS</span>
                </h1>
                <p style={{
                    margin: '4px 0 0',
                    fontSize: '8px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'rgba(255,180,80,0.15)',
                    letterSpacing: '4px',
                    textTransform: 'uppercase',
                }}>
                    {FEATURES.length} ORBITAL BODIES • LIVE
                </p>
            </div>

            {/* Bottom-right HUD */}
            <div style={{
                position: 'absolute',
                bottom: 24,
                right: 24,
                zIndex: 10,
                pointerEvents: 'none',
                textAlign: 'right',
            }}>
                <div style={{
                    fontSize: '7px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'rgba(255,255,255,0.1)',
                    marginBottom: 5,
                    letterSpacing: '2px',
                }}>
                    DRAG • ZOOM • CLICK
                </div>
                <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <div style={{
                        width: 3, height: 3, borderRadius: '50%',
                        background: '#ff8833',
                        boxShadow: '0 0 6px #ff8833',
                        animation: 'pulse 2.5s infinite',
                    }} />
                    <div style={{
                        fontSize: '7px',
                        fontFamily: "'JetBrains Mono', monospace",
                        color: 'rgba(255,180,80,0.3)',
                        letterSpacing: '3px',
                    }}>
                        SYS.ONLINE
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.2; transform: scale(2); }
                }
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateX(12px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes glitch {
                    0%, 100% { transform: translate(0); }
                    20% { transform: translate(-1px, 1px); }
                    40% { transform: translate(1px, -1px); }
                    60% { transform: translate(-1px, 0); }
                    80% { transform: translate(1px, 1px); }
                }
            `}</style>

            {/* 3D Canvas */}
            <Canvas
                camera={{ position: [0, 15, 35], fov: 55 }}
                gl={{
                    antialias: true,
                    alpha: false,
                    powerPreference: 'high-performance',
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.2,
                }}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            >
                <color attach="background" args={['#000002']} />
                <fog attach="fog" args={['#000002', 25, 100]} />

                <Suspense fallback={null}>
                    <DeepSpace />
                    <TheCore />
                    <AsteroidBelt />
                    <OuterDebris />

                    {FEATURES.map((feat) => (
                        <SatelliteNode
                            key={feat.id}
                            {...feat}
                            onPlanetClick={handlePlanetClick}
                        />
                    ))}
                </Suspense>

                <CameraController target={cameraTarget} onResetTarget={handleResetTarget} />

                <OrbitControls
                    enablePan
                    panSpeed={0.4}
                    maxDistance={80}
                    minDistance={6}
                    enableDamping
                    dampingFactor={0.03}
                    autoRotate={!cameraTarget}
                    autoRotateSpeed={0.12}
                    rotateSpeed={0.4}
                />

                {/* Bloom — single pass, minimal config to avoid WebGL crash */}
                <EffectComposer>
                    <Bloom
                        luminanceThreshold={0.6}
                        luminanceSmoothing={0.9}
                        intensity={0.8}
                        mipmapBlur
                    />
                </EffectComposer>
            </Canvas>

            {/* CSS vignette */}
            <div style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                pointerEvents: 'none',
                background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.9) 100%)',
                zIndex: 5,
            }} />

            {/* Chromatic aberration */}
            <div style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                pointerEvents: 'none', zIndex: 6,
                boxShadow: `
                    inset 3px 0 15px rgba(255,0,0,0.04),
                    inset -3px 0 15px rgba(0,0,255,0.04),
                    inset 0 3px 15px rgba(255,0,50,0.03),
                    inset 0 -3px 15px rgba(0,50,255,0.03)
                `,
            }} />
        </div>
    );
};
