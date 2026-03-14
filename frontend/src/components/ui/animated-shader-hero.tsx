"use client"
import React, { useRef, useEffect } from 'react';

// Types for component props
interface HeroProps {
  trustBadge?: {
    text: string;
    icons?: string[];
  };
  headline: {
    line1: string;
    line2: string;
  };
  subtitle: string;
  buttons?: {
    primary?: {
      text: string;
      onClick?: () => void;
    };
    secondary?: {
      text: string;
      onClick?: () => void;
    };
  };
  children?: React.ReactNode;
  className?: string;
}

const defaultShaderSource = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
uniform vec2 move;
uniform vec2 touch;
uniform int pointerCount;
uniform vec2 pointers[10];

#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)

float rnd(vec2 p) {
  p=fract(p*vec2(12.9898,78.233));
  p+=dot(p,p+34.56);
  return fract(p.x*p.y);
}

float noise(in vec2 p) {
  vec2 i=floor(p), f=fract(p), u=f*f*(3.-2.*f);
  float
  a=rnd(i),
  b=rnd(i+vec2(1,0)),
  c=rnd(i+vec2(0,1)),
  d=rnd(i+1.);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}

float fbm(vec2 p) {
  float t=.0, a=1.; mat2 m=mat2(1.,-.5,.2,1.2);
  for (int i=0; i<5; i++) {
    t+=a*noise(p);
    p*=2.*m;
    a*=.5;
  }
  return t;
}

float clouds(vec2 p) {
	float d=1., t=.0;
	for (float i=.0; i<3.; i++) {
		float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);
		t=mix(t,d,a);
		d=a;
		p*=2./(i+1.);
	}
	return t;
}

void main(void) {
	vec2 uv=(FC-.5*R)/MN,st=uv*vec2(2,1);
	vec3 col=vec3(0);
	float bg=clouds(vec2(st.x+T*.5,-st.y));
	uv*=1.-.3*(sin(T*.2)*.5+.5);
	for (float i=1.; i<12.; i++) {
		uv+=.1*cos(i*vec2(.1+.01*i, .8)+i*i+T*.5+.1*uv.x);
		vec2 p=uv;
		float d=length(p);
		col+=.00125/d*(cos(sin(i)*vec3(1,2,3))+1.);
		float b=noise(i+p+bg*1.731);
		col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)));
		col=mix(col,vec3(bg*.25,bg*.137,bg*.05),d);
	}
	O=vec4(col,1);
}`;

const useShaderBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const rendererRef = useRef<any>(null);
  const pointersRef = useRef<any>(null);

  class WebGLRenderer {
    private canvas: HTMLCanvasElement;
    private gl: WebGL2RenderingContext;
    private program: WebGLProgram | null = null;
    private buffer: WebGLBuffer | null = null;
    private scale: number;
    private mouseMove = [0, 0];
    private mouseCoords = [0, 0];
    private pointerCoords: number[] = [];
    private nbrOfPointers = 0;

    constructor(canvas: HTMLCanvasElement, scale: number) {
      this.canvas = canvas;
      this.scale = scale;
      this.gl = canvas.getContext('webgl2')!;
    }

    setup() {
      const gl = this.gl;
      const vs = gl.createShader(gl.VERTEX_SHADER)!;
      const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
      gl.shaderSource(vs, `#version 300 es
        precision highp float;
        in vec4 position;
        void main(){gl_Position=position;}`);
      gl.compileShader(vs);
      gl.shaderSource(fs, defaultShaderSource);
      gl.compileShader(fs);
      this.program = gl.createProgram()!;
      gl.attachShader(this.program, vs);
      gl.attachShader(this.program, fs);
      gl.linkProgram(this.program);
    }

    init() {
      const gl = this.gl;
      this.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(this.program!, 'position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    }

    updateMouse(coords: number[]) { this.mouseCoords = coords; }
    updatePointerCount(nbr: number) { this.nbrOfPointers = nbr; }
    updatePointerCoords(coords: number[]) { this.pointerCoords = coords; }
    updateMove(deltas: number[]) { this.mouseMove = deltas; }

    render(now = 0) {
      const gl = this.gl;
      gl.useProgram(this.program!);
      gl.uniform2f(gl.getUniformLocation(this.program!, 'resolution'), this.canvas.width, this.canvas.height);
      gl.uniform1f(gl.getUniformLocation(this.program!, 'time'), now * 1e-3);
      gl.uniform2f(gl.getUniformLocation(this.program!, 'move'), ...this.mouseMove);
      gl.uniform2f(gl.getUniformLocation(this.program!, 'touch'), ...this.mouseCoords);
      gl.uniform1i(gl.getUniformLocation(this.program!, 'pointerCount'), this.nbrOfPointers);
      gl.uniform2fv(gl.getUniformLocation(this.program!, 'pointers'), new Float32Array(this.pointerCoords.length ? this.pointerCoords : [0,0]));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  class PointerHandler {
    private scale: number;
    private active = false;
    private pointers = new Map<number, number[]>();
    private lastCoords = [0, 0];
    private moves = [0, 0];

    constructor(element: HTMLCanvasElement, scale: number) {
      this.scale = scale;
      const map = (element: HTMLCanvasElement, s: number, x: number, y: number) => 
        [x * s, element.height - y * s];

      element.addEventListener('pointerdown', (e) => {
        this.active = true;
        this.pointers.set(e.pointerId, map(element, this.scale, e.clientX, e.clientY));
      });
      element.addEventListener('pointerup', (e) => {
        if (this.pointers.size === 1) this.lastCoords = this.first;
        this.pointers.delete(e.pointerId);
        this.active = this.pointers.size > 0;
      });
      element.addEventListener('pointermove', (e) => {
        if (!this.active) return;
        this.lastCoords = [e.clientX, e.clientY];
        this.pointers.set(e.pointerId, map(element, this.scale, e.clientX, e.clientY));
        this.moves = [this.moves[0] + e.movementX, this.moves[1] + e.movementY];
      });
    }
    get count() { return this.pointers.size; }
    get move() { return this.moves; }
    get coords() { return this.pointers.size > 0 ? Array.from(this.pointers.values()).flat() : [0, 0]; }
    get first() { return this.pointers.values().next().value || this.lastCoords; }
  }

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dpr = Math.max(1, 0.5 * window.devicePixelRatio);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    
    rendererRef.current = new WebGLRenderer(canvas, dpr);
    pointersRef.current = new PointerHandler(canvas, dpr);
    rendererRef.current.setup();
    rendererRef.current.init();

    const loop = (now: number) => {
      rendererRef.current.updateMouse(pointersRef.current.first);
      rendererRef.current.updatePointerCount(pointersRef.current.count);
      rendererRef.current.updatePointerCoords(pointersRef.current.coords);
      rendererRef.current.updateMove(pointersRef.current.move);
      rendererRef.current.render(now);
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    loop(0);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return canvasRef;
};

const Hero: React.FC<HeroProps> = ({ trustBadge, headline, subtitle, buttons, children, className = "" }) => {
  const canvasRef = useShaderBackground();

  return (
    <div className={`relative w-full h-screen overflow-hidden bg-black ${className}`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <style>{`
        @keyframes fade-in-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-down { animation: fade-in-down 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        .animation-delay-600 { animation-delay: 0.6s; }
        .animation-delay-800 { animation-delay: 0.8s; }
      `}</style>
      
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain touch-none" style={{ background: 'black' }} />
      
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white">
        {trustBadge && (
          <div className="mb-8 animate-fade-in-down">
            <div className="flex items-center gap-2 px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-xs font-medium tracking-widest uppercase">
              <span className="text-white/70">{trustBadge.text}</span>
            </div>
          </div>
        )}

        <div className="text-center space-y-5 max-w-4xl mx-auto px-6">
          <div className="space-y-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent animate-fade-in-up animation-delay-200">
              {headline.line1}
            </h1>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight bg-gradient-to-r from-orange-300 via-orange-400 to-amber-200 bg-clip-text text-transparent animate-fade-in-up animation-delay-400">
              {headline.line2}
            </h1>
          </div>
          
          <div className="max-w-xl mx-auto animate-fade-in-up animation-delay-600 pt-2">
            <p className="text-base md:text-lg text-white/40 font-normal leading-relaxed tracking-normal">
              {subtitle}
            </p>
          </div>
          
          <div className="animate-fade-in-up animation-delay-800">
            {children}
            {buttons && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                    {buttons.primary && (
                        <button onClick={buttons.primary.onClick} className="px-10 py-4 bg-white text-black rounded-full font-semibold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]">
                            {buttons.primary.text}
                        </button>
                    )}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
