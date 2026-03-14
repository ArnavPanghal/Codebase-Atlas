# Future Works

* UI
* Agent
* Meeting Delegate
* Mapping
* Crash Monkey
* context window is an issue- maybe use the structing and everything wed do for the deligator but still memory would be an issue for inital steps and later on
* VECTOR DB
* **Knowledge Graph** IS main and very much required for deligator context
* Use** ****Mem0**????

**GraphRAG** to index your code repository.?????

* **Material Design:** Give each "planet" a unique physical property.
  * **AI Agent:** Make it a glass-like sphere with a glowing blue core and "data rain" scrolling inside it.
  * **Architecture Analyzer:** Make it look like a floating geometric crystal or a Rubik's cube of translucent purple layers.
  * **Git Time Machine:** Give it a "Saturn ring" made of literal timestamps or code snippets that rotate around it.
* **Fresnel Effect:** Add a "rim light" (a thin glowing edge) to the planets to make them "pop" against the black background.
* 
* 
* graph animation prompt  -

You are given a task to integrate an existing React component in the codebase

The codebase should support:

- shadcn project structure
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles.
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:

```tsx
entropy.tsx
'use client'
import { useEffect, useRef } from 'react'

interface EntropyProps {
  className?: string
  size?: number
}

export function Entropy({ className = "", size = 400 }: EntropyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
  
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 基础设置
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    // 使用黑色主题
    const particleColor = '#ffffff'

    class Particle {
      x: number
      y: number
      size: number
      order: boolean
      velocity: { x: number; y: number }
      originalX: number
      originalY: number
      influence: number
      neighbors: Particle[]

      constructor(x: number, y: number, order: boolean) {
        this.x = x
        this.y = y
        this.originalX = x
        this.originalY = y
        this.size = 2
        this.order = order
        this.velocity = {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2
        }
        this.influence = 0
        this.neighbors = []
      }

      update() {
        if (this.order) {
          // 有序粒子受混沌影响的运动
          const dx = this.originalX - this.x
          const dy = this.originalY - this.y

          // 计算来自混沌粒子的影响
          const chaosInfluence = { x: 0, y: 0 }
          this.neighbors.forEach(neighbor => {
            if (!neighbor.order) {
              const distance = Math.hypot(this.x - neighbor.x, this.y - neighbor.y)
              const strength = Math.max(0, 1 - distance / 100)
              chaosInfluence.x += (neighbor.velocity.x * strength)
              chaosInfluence.y += (neighbor.velocity.y * strength)
              this.influence = Math.max(this.influence, strength)
            }
          })

          // 混合有序运动和混沌影响
          this.x += dx * 0.05 * (1 - this.influence) + chaosInfluence.x * this.influence
          this.y += dy * 0.05 * (1 - this.influence) + chaosInfluence.y * this.influence

          // 影响逐渐减弱
          this.influence *= 0.99
        } else {
          // 混沌运动
          this.velocity.x += (Math.random() - 0.5) * 0.5
          this.velocity.y += (Math.random() - 0.5) * 0.5
          this.velocity.x *= 0.95
          this.velocity.y *= 0.95
          this.x += this.velocity.x
          this.y += this.velocity.y

          // 边界检查
          if (this.x < size / 2 || this.x > size) this.velocity.x *= -1
          if (this.y < 0 || this.y > size) this.velocity.y *= -1
          this.x = Math.max(size / 2, Math.min(size, this.x))
          this.y = Math.max(0, Math.min(size, this.y))
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        const alpha = this.order ?
          0.8 - this.influence * 0.5 :
          0.8
        ctx.fillStyle = `${particleColor}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // 创建粒子网格
    const particles: Particle[] = []
    const gridSize = 25
    const spacing = size / gridSize

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = spacing * i + spacing / 2
        const y = spacing * j + spacing / 2
        const order = x < size / 2
        particles.push(new Particle(x, y, order))
      }
    }

    // 更新邻居关系
    function updateNeighbors() {
      particles.forEach(particle => {
        particle.neighbors = particles.filter(other => {
          if (other === particle) return false
          const distance = Math.hypot(particle.x - other.x, particle.y - other.y)
          return distance < 100
        })
      })
    }

    let time = 0
    let animationId: number
  
    function animate() {
      ctx.clearRect(0, 0, size, size)

      // 更新邻居关系
      if (time % 30 === 0) {
        updateNeighbors()
      }

      // 更新和绘制所有粒子
      particles.forEach(particle => {
        particle.update()
        particle.draw(ctx)

        // 绘制连接线
        particle.neighbors.forEach(neighbor => {
          const distance = Math.hypot(particle.x - neighbor.x, particle.y - neighbor.y)
          if (distance < 50) {
            const alpha = 0.2 * (1 - distance / 50)
            ctx.strokeStyle = `${particleColor}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(neighbor.x, neighbor.y)
            ctx.stroke()
          }
        })
      })

      // 添加分隔线和文字
      ctx.strokeStyle = `${particleColor}4D`
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(size / 2, 0)
      ctx.lineTo(size / 2, size)
      ctx.stroke()

      ctx.font = '12px monospace'
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'

      time++
      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [size])

  return (
    <div className={`relative bg-black ${className}`} style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  )
}

demo.tsx
'use client'

import * as React from "react"
import { Entropy } from "@/components/ui/entropy"

export function EntropyDemo() {
  return (
    <div className="flex flex-col items-center justify-center bg-black text-white min-h-screen w-full p-8">
      <div className="flex flex-col items-center">
        <Entropy className="rounded-lg" />
        <div className="mt-6 text-center">
          <div className="space-y-4 font-mono text-[14px] leading-relaxed">
            <p className="italic text-gray-400/80 tracking-wide">
              “Order and chaos dance —
              <span className="opacity-70">digital poetry in motion.”</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export { EntropyDemo }
```

Extend existing tailwind.config.js with this code:

```js
import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
      },
      fontFamily: {
        sans: ['var(--font-noto)'],
      },
    },
  },
  plugins: [],
} satisfies Config;

```

Extend existing globals.css with this code:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@keyframes bounce-x {
    0%, 100% {
        transform: translateX(-4px);
    }
    50% {
        transform: translateX(0px);
    }
}

@keyframes glow {
    0%, 100% {
        opacity: 0.6;
        filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.3));
    }
    50% {
        opacity: 1;
        filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
    }
}

@keyframes float-up {
    0% {
        opacity: 0;
        transform: translateY(6px);
        filter: blur(2px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
        filter: blur(0);
    }
}

.lighting-button {
    animation: bounce-x 1.5s ease-in-out infinite;
}

.lighting-button:hover {
    animation: none;
    transform: translateX(0);
}

.light-glow {
    animation: glow 2s ease-in-out infinite;
}

.word-float {
    animation: float-up 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
    will-change: transform, opacity, filter;
    transform-style: preserve-3d;
    backface-visibility: hidden;
}

:root {
  --elegant-font: 'Great Vibes';
}

:root[data-theme="dark"] {
  --background: #000000;
  --foreground: #ffffff;
  --text-primary: #ffffff;
  --text-secondary: #888888;
}

:root[data-theme="light"] {
  --background: #ffffff;
  --foreground: #000000;
  --text-primary: #000000;
  --text-secondary: #666666;
}

/* 修复移动设备上的视口高度问题 */
:root {
  --vh: 1vh;
  --app-height: 100%;
}

/* 全局字体设置 */
html {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html,
body {
  position: fixed;
  width: 100%;
  height: 100%;
  height: var(--app-height);
  overflow: hidden;
  overscroll-behavior: none;
  touch-action: none;
}

body {
  color: var(--foreground);
  background: var(--background);
  letter-spacing: -0.025em;
  height: 100vh;
  height: calc(var(--vh) * 100);
  overflow: hidden;
}

::selection {
  background-color: rgba(255, 255, 255, 0.1);
}

/* 只保留opacity的过渡效果，移除颜色相关的过渡 */
* {
  transition-property: opacity;
  transition-duration: 100ms;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 12px;
}

/* 使用固定颜色 #A3A3A3 替代之前的主题相关颜色 */
::-webkit-scrollbar-track {
  background: var(--background);
}

::-webkit-scrollbar-thumb {
  background: #A3A3A3;
  border: 3px solid var(--background);
  border-radius: 6px;
}

::-webkit-scrollbar-thumb:hover {
  background: #8A8A8A;
}

@layer components {
  .footer-link {
    @apply hover: text-primary;
  }

  .footer-dot {
    @apply mx-2 text-[#A3A3A3];
  }
}

@layer utilities {
    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }
    .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
}
```

Implementation Guidelines

1. Analyze the component structure and identify all required dependencies
2. Review the component's argumens and state
3. Identify any required context providers or hooks and install them
4. Questions to Ask

- What data/props will be passed to this component?
- Are there any specific state management requirements?
- Are there any required assets (images, icons, etc.)?
- What is the expected responsive behavior?
- What is the best place to use this component in the app?

Steps to integrate
 0. Copy paste all the code above in the correct directories

1. Install external dependencies
2. Fill image assets with Unsplash stock images you know exist
3. Use lucide-react icons for svgs or logos if component requires them






following storke prompt-

You are given a task to integrate an existing React component in the codebase

The codebase should support:

- shadcn project structure
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles.
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:

```tsx
svg-follow-scroll.tsx
"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import React, { useRef } from "react";

const Skiper19 = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
  });

  return (
    <section
      ref={ref}
      className="mx-auto flex h-[350vh] w-screen flex-col items-center overflow-hidden bg-[#FAFDEE] px-4 text-[#1F3A4B]"
    >
      <div className="mt-42 relative flex w-fit flex-col items-center justify-center gap-5 text-center">
        <h1 className="font-jakarta-sans relative z-10 text-7xl font-medium tracking-[-0.08em] lg:text-9xl">
          The Stroke <br /> That follows the <br />
          Scroll Progress
        </h1>
        <p className="font-jakarta-sans relative z-10 max-w-2xl text-xl font-medium text-[#1F3A4B]">
          Scroll down to see the effect
        </p>

        <LinePath
          className="absolute -right-[40%] top-0 z-0"
          scrollYProgress={scrollYProgress}
        />
      </div>

      <div className="rounded-4xl font-jakarta-sans w-full translate-y-[200vh] bg-[#1F3A4B] pb-10 text-[#FAFDEE]">
        <h1 className="mt-10 text-center text-[15.5vw] font-bold leading-[0.9] tracking-tighter lg:text-[16.6vw]">
          skiperui.com
        </h1>
        <div className="mt-80 flex w-full flex-col items-start gap-5 px-4 font-medium lg:mt-0 lg:flex-row lg:justify-between">
          <div className="flex w-full items-center justify-between gap-12 uppercase lg:w-fit lg:justify-center">
            <p className="w-fit text-sm">
              punjab, india <br />
              and online
            </p>
            <p className="w-fit text-right text-sm lg:text-left">
              sep 1, 2025 <br /> the Moosa pind
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center justify-between gap-12 uppercase lg:w-fit lg:justify-center">
            <p className="w-fit text-sm">
              onilne <br /> free
            </p>
            <p className="w-fit text-right text-sm lg:text-left">
              in person tickets <br /> $600
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Skiper19 };

const LinePath = ({
  className,
  scrollYProgress,
}: {
  className: string;
  scrollYProgress: any;
}) => {
  const pathLength = useTransform(scrollYProgress, [0, 1], [0.5, 1]);

  return (
    <svg
      width="1278"
      height="2319"
      viewBox="0 0 1278 2319"
      fill="none"
      overflow="visible"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <motion.path
        d="M876.605 394.131C788.982 335.917 696.198 358.139 691.836 416.303C685.453 501.424 853.722 498.43 941.95 409.714C1016.1 335.156 1008.64 186.907 906.167 142.846C807.014 100.212 712.699 198.494 789.049 245.127C889.053 306.207 986.062 116.979 840.548 43.3233C743.932 -5.58141 678.027 57.1682 672.279 112.188C666.53 167.208 712.538 172.943 736.353 163.088C760.167 153.234 764.14 120.924 746.651 93.3868C717.461 47.4252 638.894 77.8642 601.018 116.979C568.164 150.908 557 201.079 576.467 246.924C593.342 286.664 630.24 310.55 671.68 302.614C756.114 286.446 729.747 206.546 681.86 186.442C630.54 164.898 492 209.318 495.026 287.644C496.837 334.494 518.402 366.466 582.455 367.287C680.013 368.538 771.538 299.456 898.634 292.434C1007.02 286.446 1192.67 309.384 1242.36 382.258C1266.99 418.39 1273.65 443.108 1247.75 474.477C1217.32 511.33 1149.4 511.259 1096.84 466.093C1044.29 420.928 1029.14 380.576 1033.97 324.172C1038.31 273.428 1069.55 228.986 1117.2 216.384C1152.2 207.128 1188.29 213.629 1194.45 245.127C1201.49 281.062 1132.22 280.104 1100.44 272.673C1065.32 264.464 1044.22 234.837 1032.77 201.413C1019.29 162.061 1029.71 131.126 1056.44 100.965C1086.19 67.4032 1143.96 54.5526 1175.78 86.1513C1207.02 117.17 1186.81 143.379 1156.22 166.691C1112.57 199.959 1052.57 186.238 999.784 155.164C957.312 130.164 899.171 63.7054 931.284 26.3214C952.068 2.12513 996.288 3.87363 1007.22 43.58C1018.15 83.2749 1003.56 122.644 975.969 163.376C948.377 204.107 907.272 255.122 913.558 321.045C919.727 385.734 990.968 497.068 1063.84 503.35C1111.46 507.456 1166.79 511.984 1175.68 464.527C1191.52 379.956 1101.26 334.985 1030.29 377.017C971.109 412.064 956.297 483.647 953.797 561.655C947.587 755.413 1197.56 941.828 936.039 1140.66C745.771 1285.32 321.926 950.737 134.536 1202.19C-6.68295 1391.68 -53.4837 1655.38 131.935 1760.5C478.381 1956.91 1124.19 1515 1201.28 1997.83C1273.66 2451.23 100.805 1864.7 303.794 2668.89"
        stroke="#C2F84F"
        strokeWidth="20"
        style={{
          pathLength,
          strokeDashoffset: useTransform(pathLength, (value) => 1 - value),
        }}
      />
    </svg>
  );
};



demo.tsx
import { Skiper19 } from "@/components/ui/svg-follow-scroll";

export default function DemoOne() {
  return <Skiper19 />;
}

```

Install NPM dependencies:

```bash
framer-motion
```

Implementation Guidelines

1. Analyze the component structure and identify all required dependencies
2. Review the component's argumens and state
3. Identify any required context providers or hooks and install them
4. Questions to Ask

- What data/props will be passed to this component?
- Are there any specific state management requirements?
- Are there any required assets (images, icons, etc.)?
- What is the expected responsive behavior?
- What is the best place to use this component in the app?

Steps to integrate
 0. Copy paste all the code above in the correct directories

1. Install external dependencies
2. Fill image assets with Unsplash stock images you know exist
3. Use lucide-react icons for svgs or logos if component requires them
