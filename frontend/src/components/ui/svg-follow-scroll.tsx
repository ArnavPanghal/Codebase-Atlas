"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import React, { useRef } from "react";

const NeuralPath = ({
  d,
  className,
  scrollYProgress,
  index,
}: {
  d: string;
  className: string;
  scrollYProgress: any;
  index: number;
}) => {
  // Each path has a slightly different reveal speed for "artistic" offset
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const opacity = useTransform(
    scrollYProgress, 
    [0, 0.05 + index * 0.02, 0.95 - index * 0.02, 1], 
    [0.1, 0.7, 0.7, 0]
  );

  return (
    <motion.path
      d={d}
      stroke="#ff8800"
      strokeWidth={18 - index * 3}
      strokeLinecap="round"
      fill="none"
      style={{
        pathLength,
        opacity,
        filter: `drop-shadow(0 0 ${15 + index * 10}px rgba(255, 136, 0, 0.8))`,
      }}
      className={className}
    />
  );
};

export const SVGFollowScroll = ({ scrollYProgress }: { scrollYProgress: any }) => {
  // Multiple intertwined paths for an "artistic neural" feel
  const paths = [
    "M 60 100 Q 150 500 700 900 T 300 1600 T 700 2800",
    "M 60 100 C 300 300 50 700 600 1200 S 200 1800 800 3000",
    "M 60 100 Q 0 400 400 1000 T 100 1800 T 500 2400"
  ];

  const sparkOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.2]);
  const sparkScale = useTransform(scrollYProgress, [0, 0.1], [1, 1.5]);

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1000 2000"
        fill="none"
        overflow="visible"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full mix-blend-screen"
      >
        {/* Creative Origin Spark */}
        <motion.circle
          cx="60"
          cy="100"
          r="8"
          fill="#ffaa00"
          style={{ 
            opacity: sparkOpacity, 
            scale: sparkScale,
            filter: "drop-shadow(0 0 15px rgba(255, 170, 0, 1))" 
          }}
        />

        {paths.map((d, i) => (
          <NeuralPath 
            key={i} 
            d={d} 
            index={i} 
            scrollYProgress={scrollYProgress} 
            className="opacity-40"
          />
        ))}
      </svg>
    </div>
  );
};
