// @ts-nocheck
import React, { useRef, useState, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sphere, Ring } from '@react-three/drei';
import * as THREE from 'three';

// ─── Shared noise GLSL (compact) ──────────────────────────────────
const noiseGLSL = `
  vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
    vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;
    vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
    m=m*m;return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
  float fbm(vec3 p){float v=0.;float a=.5;for(int i=0;i<5;i++){v+=a*snoise(p);p*=2.;a*=.5;}return v;}
`;

const planetVert = `
  varying vec2 vUv;varying vec3 vNormal;varying vec3 vPosition;varying vec3 vWorldPosition;
  void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);vPosition=position;
  vWorldPosition=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
`;

// ─── Planet Fragment Shaders ──────────────────────────────────────
const marsFragment = `
  uniform float uTime;varying vec3 vPosition;varying vec3 vNormal;varying vec3 vWorldPosition;
  ${noiseGLSL}
  void main(){
    float n=fbm(vPosition*3.+uTime*.02);float cr=pow(abs(snoise(vPosition*8.)),2.);
    vec3 c=mix(vec3(.7,.25,.1),vec3(.4,.12,.05),smoothstep(0.,.5,n));
    c=mix(c,vec3(.9,.5,.25),smoothstep(-.2,.3,cr)*.4);
    vec3 sd=normalize(-vWorldPosition);float sl=max(dot(vNormal,sd),0.);
    c*=mix(.06,1.,sl);
    float fr=pow(1.-max(dot(vNormal,vec3(0,0,1)),0.),3.);c+=vec3(1.,.3,.1)*fr*.2*sl;
    gl_FragColor=vec4(c,1.);}
`;

const earthFragment = `
  uniform float uTime;varying vec3 vPosition;varying vec3 vNormal;varying vec3 vWorldPosition;
  ${noiseGLSL}
  void main(){
    float n=fbm(vPosition*2.5+uTime*.01);float n2=fbm(vPosition*5.+10.);
    vec3 c=vec3(.03,.12,.4);float cont=smoothstep(.05,.15,n);
    c=mix(c,vec3(.06,.25,.5),smoothstep(-.1,.05,n)*.6);
    c=mix(c,vec3(.12,.4,.12),cont);c=mix(c,vec3(.55,.45,.25),smoothstep(.3,.5,n2)*cont*.5);
    c=mix(c,vec3(.85,.9,.95),smoothstep(.7,.9,abs(vPosition.y)));
    float cl=smoothstep(.1,.4,fbm(vPosition*4.+uTime*.05));c=mix(c,vec3(.95),cl*.2);
    vec3 sd=normalize(-vWorldPosition);float sl=max(dot(vNormal,sd),0.);c*=mix(.03,1.,sl);
    float ds=1.-sl;float cities=pow(abs(snoise(vPosition*20.)),8.)*cont;
    c+=vec3(1.,.85,.4)*cities*ds*.3;
    float fr=pow(1.-max(dot(vNormal,vec3(0,0,1)),0.),3.);c+=vec3(.2,.4,1.)*fr*.2;
    gl_FragColor=vec4(c,1.);}
`;

const volcanicFragment = `
  uniform float uTime;varying vec3 vPosition;varying vec3 vNormal;varying vec3 vWorldPosition;
  ${noiseGLSL}
  void main(){
    float n=fbm(vPosition*3.+uTime*.04);float cr=pow(abs(snoise(vPosition*10.)),.5);
    vec3 c=vec3(.08,.05,.04);
    float la=smoothstep(.4,.6,cr)*smoothstep(-.1,.3,n);
    c=mix(c,vec3(1.,.4,0.),la);c=mix(c,vec3(1.,.7,.1),la*smoothstep(.5,.8,n));
    vec3 sd=normalize(-vWorldPosition);float sl=max(dot(vNormal,sd),0.);
    vec3 lit=c*mix(.1,1.,sl);lit+=vec3(1.,.4,0.)*la*(1.-sl)*.5;
    float fr=pow(1.-max(dot(vNormal,vec3(0,0,1)),0.),2.);lit+=vec3(1.,.3,0.)*fr*.15;
    gl_FragColor=vec4(lit,1.);}
`;

// ─── Glass shader (AI Agent) — translucent with inner glow ────────
const glassFragment = `
  uniform float uTime;varying vec3 vPosition;varying vec3 vNormal;varying vec3 vWorldPosition;
  ${noiseGLSL}
  void main(){
    vec3 sd=normalize(-vWorldPosition);float sl=max(dot(vNormal,sd),0.);
    // Fresnel for glass edge glow
    float fr=pow(1.-max(dot(vNormal,normalize(cameraPosition-vWorldPosition)),0.),3.);
    // Inner glow pulsing
    float innerPulse=.5+.3*sin(uTime*2.+snoise(vPosition*3.)*.8);
    vec3 glowColor=vec3(.2,.6,1.)*innerPulse;
    // Glass base — very dim, almost transparent feel
    vec3 c=vec3(.02,.05,.12)*mix(.2,1.,sl);
    // Add strong fresnel rim
    c+=vec3(.3,.7,1.)*fr*.8;
    // Inner glow showing through
    c+=glowColor*(1.-fr)*.3;
    // Specular
    float spec=pow(max(dot(reflect(-sd,vNormal),normalize(cameraPosition-vWorldPosition)),0.),64.);
    c+=vec3(.5,.8,1.)*spec*sl;
    gl_FragColor=vec4(c,1.);}
`;

// ─── Crystal shader (Architecture Analyzer) — refracted facets ────
const crystalFragment = `
  uniform float uTime;varying vec3 vPosition;varying vec3 vNormal;varying vec3 vWorldPosition;
  ${noiseGLSL}
  void main(){
    vec3 sd=normalize(-vWorldPosition);float sl=max(dot(vNormal,sd),0.);
    float fr=pow(1.-max(dot(vNormal,normalize(cameraPosition-vWorldPosition)),0.),2.5);
    // Crystal facet pattern
    float facets=abs(snoise(vPosition*15.));
    float sharpFacets=step(.5,facets);
    // Base crystal color with facet variation
    vec3 c1=vec3(.25,.1,.45);vec3 c2=vec3(.5,.2,.7);vec3 c3=vec3(.8,.4,1.);
    vec3 c=mix(c1,c2,sharpFacets);
    // Rainbow refraction on facet edges
    float edge=smoothstep(.48,.52,facets);
    c+=vec3(sin(uTime+vPosition.x*5.)*.2+.3,sin(uTime*1.3+vPosition.y*5.)*.2+.2,sin(uTime*.7+vPosition.z*5.)*.2+.4)*edge*.5;
    c*=mix(.08,1.,sl);
    c+=c3*fr*.6;
    // Internal sparkles
    float sparkle=pow(abs(snoise(vPosition*30.+uTime*.5)),12.);
    c+=vec3(1.,.8,1.)*sparkle*2.;
    float spec=pow(max(dot(reflect(-sd,vNormal),normalize(cameraPosition-vWorldPosition)),0.),32.);
    c+=vec3(.7,.5,1.)*spec*sl*.6;
    gl_FragColor=vec4(c,1.);}
`;

const PLANET_SHADERS: Record<string, string> = {
    'mars': marsFragment,
    'earth': earthFragment,
    'volcanic': volcanicFragment,
    'glass': glassFragment,
    'crystal': crystalFragment,
};

interface SatelliteNodeProps {
    radius: number;
    speed: number;
    color: string;
    label: string;
    description: string;
    initialAngle?: number;
    planetType?: string;
    hasRing?: boolean;
    tilt?: number;
    onPlanetClick?: (pos: THREE.Vector3) => void;
}

// ─── Instanced dot orbit ──────────────────────────────────────────
const PulsingOrbit: React.FC<{ radius: number; color: string; eccentricity: number; speed: number }> = ({
    radius, color, eccentricity, speed
}) => {
    const meshRef = useRef<THREE.InstancedMesh>(null!);
    const dotCount = 120;
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);

    const dots = useMemo(() => {
        const temp = [];
        for (let i = 0; i < dotCount; i++) {
            const angle = (i / dotCount) * Math.PI * 2;
            temp.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius * eccentricity));
        }
        return temp;
    }, [radius, eccentricity]);

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.elapsedTime;
        dots.forEach((pos, i) => {
            dummy.position.copy(pos);
            dummy.scale.setScalar(0.04);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
            const wave = Math.sin(t * speed * 8 + (i / dotCount) * Math.PI * 2);
            tempColor.set(color).multiplyScalar(0.15 + wave * 0.12);
            meshRef.current.setColorAt(i, tempColor);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, dotCount]}>
            <sphereGeometry args={[1, 4, 4]} />
            <meshBasicMaterial transparent opacity={0.5} depthWrite={false} vertexColors />
        </instancedMesh>
    );
};

// ─── Comet Trail ──────────────────────────────────────────────────
const CometTrail: React.FC<{ groupRef: React.RefObject<THREE.Group>; color: string }> = ({ groupRef, color }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null!);
    const count = 25;
    const trail = useRef<THREE.Vector3[]>(Array.from({ length: count }, () => new THREE.Vector3()));
    const frame = useRef(0);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);

    useFrame(() => {
        if (!meshRef.current || !groupRef.current) return;
        frame.current++;
        if (frame.current % 2 === 0) {
            for (let i = count - 1; i > 0; i--) trail.current[i].copy(trail.current[i - 1]);
            trail.current[0].copy(groupRef.current.position);
        }
        trail.current.forEach((pos, i) => {
            const fade = 1 - i / count;
            dummy.position.copy(pos);
            dummy.scale.setScalar(0.025 * fade);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
            tempColor.set(color).multiplyScalar(fade * 0.4);
            meshRef.current.setColorAt(i, tempColor);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <sphereGeometry args={[1, 4, 4]} />
            <meshBasicMaterial transparent opacity={0.5} depthWrite={false} vertexColors />
        </instancedMesh>
    );
};

export const SatelliteNode: React.FC<SatelliteNodeProps> = ({
    radius, speed, color, label, description,
    initialAngle = 0, planetType = 'earth',
    hasRing = false, tilt = 0, onPlanetClick,
}) => {
    const groupRef = useRef<THREE.Group>(null!);
    const planetRef = useRef<THREE.Mesh>(null!);
    const shaderRef = useRef<THREE.ShaderMaterial>(null!);
    const atmosphereRef = useRef<THREE.Mesh>(null!);
    const [hovered, setHovered] = useState(false);
    const timeRef = useRef(initialAngle);

    const planetSize = 0.4 + (radius / 36) * 0.6;
    const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
    const fragmentShader = PLANET_SHADERS[planetType] || earthFragment;
    const eccentricity = 0.92 + (initialAngle % 0.16);
    const orbitalInclination = tilt * 0.3;

    const handleClick = useCallback(() => {
        if (onPlanetClick && groupRef.current) {
            onPlanetClick(groupRef.current.position);
        }
    }, [onPlanetClick]);

    useFrame((state, delta) => {
        if (!hovered) timeRef.current += delta * speed;
        const angle = timeRef.current;
        groupRef.current.position.x = Math.cos(angle) * radius;
        groupRef.current.position.z = Math.sin(angle) * radius * eccentricity;
        groupRef.current.position.y =
            Math.sin(angle) * radius * orbitalInclination * 0.05 +
            Math.sin(state.clock.elapsedTime * 0.3 + initialAngle) * 0.15;
        if (planetRef.current) planetRef.current.rotation.y += delta * 0.3;
        if (shaderRef.current) shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        if (atmosphereRef.current) {
            const b = 1 + Math.sin(state.clock.elapsedTime * 2 + initialAngle) * 0.04;
            atmosphereRef.current.scale.set(b, b, b);
            atmosphereRef.current.material.opacity = hovered ? 0.12 : 0.04;
        }
    });

    return (
        <>
            <PulsingOrbit radius={radius} color={color} eccentricity={eccentricity} speed={speed} />
            <CometTrail groupRef={groupRef} color={color} />

            <group ref={groupRef}>
                <group rotation={[tilt, 0, 0]}>
                    <Sphere
                        ref={planetRef}
                        args={[planetSize, 48, 48]}
                        onPointerOver={() => setHovered(true)}
                        onPointerOut={() => setHovered(false)}
                        onClick={handleClick}
                    >
                        <shaderMaterial
                            ref={shaderRef}
                            vertexShader={planetVert}
                            fragmentShader={fragmentShader}
                            uniforms={uniforms}
                            transparent={planetType === 'glass'}
                        />
                    </Sphere>

                    <Sphere ref={atmosphereRef} args={[planetSize * 1.5, 24, 24]}>
                        <meshBasicMaterial color={color} transparent opacity={0.04} side={THREE.BackSide} depthWrite={false} />
                    </Sphere>

                    {hasRing && (
                        <Ring args={[planetSize * 1.4, planetSize * 2.2, 64]} rotation={[Math.PI / 2.2, 0.15, 0]}>
                            <meshBasicMaterial color={color} transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
                        </Ring>
                    )}
                </group>

                <pointLight intensity={hovered ? 8 : 1.5} color={color} distance={5} decay={2} />

                {/* Leader line — thin vertical line from planet to label */}
                <Html center position={[0, -(planetSize + 0.5), 0]} zIndexRange={[50, 0]} style={{ pointerEvents: 'none' }}>
                    <div style={{
                        width: '1px',
                        height: '18px',
                        background: `linear-gradient(to bottom, ${color}44, transparent)`,
                        margin: '0 auto 4px',
                    }} />
                    <div style={{
                        fontSize: '8px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 400,
                        color: color,
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        textShadow: `0 0 8px ${color}33`,
                        pointerEvents: 'none',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                        opacity: hovered ? 1 : 0.5,
                        transition: 'opacity 0.3s',
                        animation: hovered ? 'glitch 0.3s ease-in-out' : 'none',
                    }}>
                        {label}
                    </div>
                </Html>

                {hovered && (
                    <Html center position={[3.5, 2.5, 0]} zIndexRange={[200, 0]}>
                        <div style={{
                            width: '260px',
                            padding: '16px 18px',
                            borderRadius: '12px',
                            background: 'linear-gradient(145deg, rgba(4,4,12,0.97) 0%, rgba(6,6,20,0.99) 100%)',
                            boxShadow: `0 0 30px ${color}10, 0 6px 24px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.02)`,
                            border: `1px solid ${color}15`,
                            backdropFilter: 'blur(16px)',
                            animation: 'fadeSlideIn 0.2s ease-out',
                            pointerEvents: 'none',
                        }}>
                            <div style={{ width: '24px', height: '1px', background: `linear-gradient(90deg, ${color}, transparent)`, marginBottom: '10px' }} />
                            <h3 style={{
                                margin: 0, fontSize: '11px',
                                fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
                                color: '#fff', letterSpacing: '2px', textTransform: 'uppercase',
                            }}>{label}</h3>
                            <p style={{
                                margin: '8px 0 0', fontSize: '10px',
                                fontFamily: "'Inter', sans-serif", fontWeight: 300,
                                color: 'rgba(180,185,200,0.6)', lineHeight: 1.6,
                            }}>{description}</p>
                            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: 3, height: 3, borderRadius: '50%', background: color, boxShadow: `0 0 4px ${color}` }} />
                                <span style={{
                                    fontSize: '7px', fontFamily: "'JetBrains Mono', monospace",
                                    fontWeight: 400, color, letterSpacing: '2px',
                                    textTransform: 'uppercase', opacity: 0.4,
                                }}>CLICK TO LOCK</span>
                            </div>
                        </div>
                    </Html>
                )}
            </group>
        </>
    );
};
