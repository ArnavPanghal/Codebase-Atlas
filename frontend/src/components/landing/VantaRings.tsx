'use client'
import React, { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
// @ts-ignore
import RINGS from 'vanta/dist/vanta.rings.min'

export const VantaRings: React.FC = () => {
  const [vantaEffect, setVantaEffect] = useState<any>(null)
  const myRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!vantaEffect && myRef.current) {
      setVantaEffect(
        RINGS({
          el: myRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: true,
          minHeight: 200.00,
          minWidth: 200.00,
          backgroundColor: 0x000000,
          color: 0xffa500, // Vibrant Amber/Orange
          backgroundAlpha: 1.0,
          scale: 1.60, // Massive presence
          scaleMobile: 1.00,
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
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 0,
        filter: `
          drop-shadow(0 0 30px rgba(255, 165, 0, 0.8))
          drop-shadow(0 0 60px rgba(255, 120, 0, 0.4))
          drop-shadow(0 0 90px rgba(255, 100, 0, 0.2))
          brightness(2.2)
          contrast(1.4)
          saturate(1.8)
        `
      }}
    />
  )
}
