'use client'
import React, { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
// @ts-ignore
import NET from 'vanta/dist/vanta.net.min'

export const VantaSwarm: React.FC = () => {
  const [vantaEffect, setVantaEffect] = useState<any>(null)
  const myRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!vantaEffect && myRef.current) {
      setVantaEffect(
        NET({
          el: myRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          color: 0xff8800,
          backgroundColor: 0x000000,
          points: 12.00,
          maxDistance: 22.00,
          spacing: 18.00,
          showDots: true,
        })
      )
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy()
    }
  }, [vantaEffect])

  return (
    <div
      ref={myRef}
      className="w-full h-full absolute inset-0 z-0"
      style={{
        filter: 'brightness(1.5) contrast(1.1) saturate(1.2)'
      }}
    />
  )
}
