// @ts-nocheck
import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 3-Layer Parallax Starfield — each layer moves at different speed
 * relative to camera movement for an "infinite depth" feel
 */
const ParallaxStarLayer: React.FC<{
    count: number;
    size: number;
    depth: number;
    speed: number;
    color: string;
    opacity: number;
}> = ({ count, size, depth, speed, color, opacity }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null!);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const stars = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            temp.push({
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * depth * 2,
                    (Math.random() - 0.5) * depth,
                    (Math.random() - 0.5) * depth * 2
                ),
                scale: size * (0.3 + Math.random() * 0.7),
            });
        }
        return temp;
    }, [count, size, depth]);

    useFrame((state) => {
        if (!meshRef.current) return;

        const cam = state.camera.position;

        stars.forEach((s, i) => {
            // Parallax: offset by camera position * speed factor
            dummy.position.set(
                s.position.x + cam.x * speed * 0.3,
                s.position.y + cam.y * speed * 0.15,
                s.position.z + cam.z * speed * 0.3
            );
            dummy.scale.setScalar(s.scale);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <sphereGeometry args={[0.05, 4, 4]} />
            <meshBasicMaterial
                color={color}
                transparent
                opacity={opacity}
                depthWrite={false}
            />
        </instancedMesh>
    );
};

/**
 * Faint nebula dust patches — very subtle color splotches
 */
const NebulaRegion: React.FC<{
    position: [number, number, number];
    color: string;
    scale: number;
    opacity: number;
}> = ({ position, color, scale, opacity }) => {
    const ref = useRef<THREE.Mesh>(null!);

    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y = state.clock.elapsedTime * 0.003;
            ref.current.rotation.x = state.clock.elapsedTime * 0.002;
            const breathe = 1 + Math.sin(state.clock.elapsedTime * 0.1) * 0.02;
            ref.current.scale.setScalar(scale * breathe);
        }
    });

    return (
        <mesh ref={ref} position={position}>
            <icosahedronGeometry args={[1, 2]} />
            <meshBasicMaterial
                color={color}
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </mesh>
    );
};

/**
 * Subtle neural constellation threads
 */
const ConstellationWeb: React.FC = () => {
    const ref = useRef<THREE.LineSegments>(null!);

    const geometry = useMemo(() => {
        const pts: number[] = [];
        const nodes: THREE.Vector3[] = [];
        for (let i = 0; i < 60; i++) {
            nodes.push(new THREE.Vector3(
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 200
            ));
        }
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                if (nodes[i].distanceTo(nodes[j]) < 40) {
                    pts.push(
                        nodes[i].x, nodes[i].y, nodes[i].z,
                        nodes[j].x, nodes[j].y, nodes[j].z
                    );
                }
            }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        return geo;
    }, []);

    useFrame((state) => {
        if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.003;
    });

    return (
        <lineSegments ref={ref} geometry={geometry}>
            <lineBasicMaterial color="#060820" transparent opacity={0.06} depthWrite={false} />
        </lineSegments>
    );
};

export const DeepSpace: React.FC = () => {
    return (
        <group>
            {/* Layer 1: Distant background stars (slowest parallax) */}
            <ParallaxStarLayer
                count={4000}
                size={0.08}
                depth={200}
                speed={0.02}
                color="#aaaacc"
                opacity={0.25}
            />

            {/* Layer 2: Mid-distance stars */}
            <ParallaxStarLayer
                count={2000}
                size={0.12}
                depth={120}
                speed={0.08}
                color="#8888aa"
                opacity={0.35}
            />

            {/* Layer 3: Near stars (fastest parallax) */}
            <ParallaxStarLayer
                count={500}
                size={0.2}
                depth={60}
                speed={0.2}
                color="#ccccee"
                opacity={0.5}
            />

            {/* Faint, distant nebula dust regions */}
            <NebulaRegion position={[-80, 20, -120]} color="#0a0318" scale={40} opacity={0.03} />
            <NebulaRegion position={[90, -15, -100]} color="#060a25" scale={35} opacity={0.025} />
            <NebulaRegion position={[50, 35, -150]} color="#100818" scale={30} opacity={0.02} />
            <NebulaRegion position={[-60, -30, -80]} color="#050c18" scale={45} opacity={0.015} />
            <NebulaRegion position={[120, 5, -130]} color="#0a0520" scale={25} opacity={0.02} />
            <NebulaRegion position={[-40, 40, -170]} color="#080415" scale={50} opacity={0.012} />
            <NebulaRegion position={[30, -40, -90]} color="#0c0a1a" scale={28} opacity={0.018} />

            {/* Constellation web */}
            <ConstellationWeb />

            {/* Extremely dim ambient — pitch black space */}
            <ambientLight intensity={0.015} color="#050510" />
        </group>
    );
};
