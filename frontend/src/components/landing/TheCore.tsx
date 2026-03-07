// @ts-nocheck
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';

// ─── Ultra-realistic Sun Shader ────────────────────────────────────
const sunVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const sunFragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  float fbm(vec3 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 8; i++) { v += a * snoise(p); p *= 1.9; a *= 0.5; }
    return v;
  }

  void main() {
    vec3 pos = vPosition * 0.7;
    float t = uTime * 0.08;
    float n1 = fbm(pos + vec3(t, 0.0, t * 0.7));
    float n2 = fbm(pos * 1.5 - vec3(0.0, t * 0.5, t));
    float n3 = fbm(pos * 3.0 + vec3(t * 0.3, t * 0.2, 0.0));
    float sunspots = smoothstep(0.3, 0.35, fbm(pos * 2.0 + t * 0.03));
    float granulation = snoise(pos * 12.0 + t * 0.5) * 0.08;
    vec3 coreWhite = vec3(1.0, 0.98, 0.9);
    vec3 hotYellow = vec3(1.0, 0.88, 0.4);
    vec3 orange = vec3(1.0, 0.55, 0.1);
    vec3 deepRed = vec3(0.85, 0.18, 0.02);
    vec3 spot = vec3(0.3, 0.08, 0.0);
    float plasma = n1 * 0.5 + 0.5 + granulation;
    vec3 color = mix(deepRed, orange, smoothstep(0.15, 0.4, plasma));
    color = mix(color, hotYellow, smoothstep(0.4, 0.65, plasma));
    color = mix(color, coreWhite, smoothstep(0.65, 0.85, plasma));
    color += coreWhite * pow(max(n3, 0.0), 4.0) * 0.6;
    color = mix(color, spot, (1.0 - sunspots) * 0.7);
    float limb = pow(max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 0.4);
    color *= mix(0.3, 1.0, limb);
    float fresnel = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 4.0);
    color += vec3(1.0, 0.4, 0.08) * fresnel * 0.8;
    gl_FragColor = vec4(color, 1.0);
  }
`;

// ─── Accretion Disk — swirling cosmic dust spiral ──────────────────
const AccretionDisk: React.FC = () => {
    const meshRef = useRef<THREE.InstancedMesh>(null!);
    const count = 800;
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const spiralAngle = (i / count) * Math.PI * 6 + Math.random() * 0.5;
            const r = 3.5 + (i / count) * 4 + (Math.random() - 0.5) * 1.5;
            const y = (Math.random() - 0.5) * 0.3 * (1 - i / count); // thinner at edges
            temp.push({
                baseAngle: spiralAngle,
                r,
                y,
                scale: 0.02 + Math.random() * 0.06 * (1 - i / count * 0.5),
                speed: 0.3 / (r * 0.3), // Kepler: inner = faster
            });
        }
        return temp;
    }, []);

    useFrame((state) => {
        if (!meshRef.current) return;

        const t = state.clock.elapsedTime;

        particles.forEach((p, i) => {
            const angle = p.baseAngle + t * p.speed;
            dummy.position.set(
                Math.cos(angle) * p.r,
                p.y + Math.sin(t * 0.5 + i * 0.01) * 0.02,
                Math.sin(angle) * p.r
            );
            dummy.scale.setScalar(p.scale);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <group rotation={[0.15, 0, 0.05]}>
            <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
                <sphereGeometry args={[1, 4, 4]} />
                <meshBasicMaterial
                    color="#ff6622"
                    transparent
                    opacity={0.12}
                    depthWrite={false}
                />
            </instancedMesh>
        </group>
    );
};

// ─── Solar Prominence (curved arc) ─────────────────────────────────
const SolarProminence: React.FC<{ baseAngle: number; arcSize: number; speed: number }> = ({
    baseAngle, arcSize, speed
}) => {
    const ref = useRef<THREE.Mesh>(null!);
    const materialRef = useRef<THREE.MeshBasicMaterial>(null!);

    const geometry = useMemo(() => {
        const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(arcSize * 0.6, arcSize * 1.4, 0),
            new THREE.Vector3(arcSize * 1.2, 0, 0)
        );
        return new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(curve.getPoints(20)),
            20, 0.06, 5, false
        );
    }, [arcSize]);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (ref.current) {
            ref.current.scale.setScalar(1 + Math.sin(t * speed + baseAngle) * 0.35);
        }
        if (materialRef.current) {
            materialRef.current.opacity = 0.15 + Math.sin(t * speed * 1.5 + baseAngle) * 0.1;
        }
    });

    return (
        <mesh
            ref={ref}
            geometry={geometry}
            position={[
                Math.cos(baseAngle) * 3.05,
                Math.sin(baseAngle) * 0.5,
                Math.sin(baseAngle) * 3.05
            ]}
            rotation={[0, baseAngle, baseAngle * 0.3]}
        >
            <meshBasicMaterial
                ref={materialRef}
                color="#ff5511"
                transparent
                opacity={0.15}
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </mesh>
    );
};

export const TheCore: React.FC = () => {
    const shaderRef = useRef<THREE.ShaderMaterial>(null!);
    const groupRef = useRef<THREE.Group>(null!);
    const coronaRefs = [useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!)];

    const sunUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

    const prominences = useMemo(() => {
        const p = [];
        for (let i = 0; i < 14; i++) {
            p.push({
                baseAngle: (i / 14) * Math.PI * 2 + Math.random() * 0.3,
                arcSize: 0.4 + Math.random() * 1.8,
                speed: 0.6 + Math.random() * 1.8,
            });
        }
        return p;
    }, []);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (shaderRef.current) shaderRef.current.uniforms.uTime.value = t;
        if (groupRef.current) groupRef.current.rotation.y += 0.0004;

        coronaRefs.forEach((ref, i) => {
            if (ref.current) {
                const s = 1 + 0.03 * (i + 1) + Math.sin(t * (0.4 + i * 0.15)) * 0.02;
                ref.current.scale.set(s, s, s);
                ref.current.material.opacity = Math.max(0.005, (0.035 - i * 0.007) + Math.sin(t * 0.6 + i) * 0.008);
            }
        });
    });

    return (
        <group ref={groupRef}>
            {/* Main sun */}
            <Sphere args={[3, 128, 128]}>
                <shaderMaterial
                    ref={shaderRef}
                    vertexShader={sunVertexShader}
                    fragmentShader={sunFragmentShader}
                    uniforms={sunUniforms}
                />
            </Sphere>

            {/* 4-layer corona for volumetric glow */}
            {[3.6, 4.5, 6.0, 8.0].map((r, i) => (
                <Sphere key={i} ref={coronaRefs[i]} args={[r, 32, 32]}>
                    <meshBasicMaterial
                        color={i < 2 ? '#ff5500' : '#ff2200'}
                        transparent
                        opacity={0.03 - i * 0.005}
                        side={THREE.BackSide}
                        depthWrite={false}
                    />
                </Sphere>
            ))}

            {/* Accretion disk */}
            <AccretionDisk />

            {/* Solar prominences */}
            {prominences.map((p, i) => (
                <SolarProminence key={i} {...p} />
            ))}

            {/* Volumetric light source — this lights up planet faces */}
            <pointLight position={[0, 0, 0]} intensity={150} color="#ff9944" distance={80} decay={2} />
            <pointLight position={[0, 0, 0]} intensity={50} color="#ffcc88" distance={40} decay={2} />
            <pointLight position={[0, 0, 0]} intensity={20} color="#ff3300" distance={100} decay={2} />

            {/* Title */}
            <Html center position={[0, -6, 0]} distanceFactor={10} zIndexRange={[100, 0]}>
                <div style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '38px',
                    fontWeight: 100,
                    color: '#fff',
                    textShadow: '0 0 60px rgba(255,140,40,0.5), 0 0 120px rgba(255,60,0,0.2)',
                    letterSpacing: '18px',
                    textAlign: 'center',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                }}>
                    Codebase Atlas
                </div>
                <div style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '9px',
                    fontWeight: 300,
                    color: 'rgba(255,200,120,0.2)',
                    letterSpacing: '10px',
                    textAlign: 'center',
                    marginTop: '12px',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    textTransform: 'uppercase',
                }}>
                    Navigate Your Universe
                </div>
            </Html>
        </group>
    );
};
