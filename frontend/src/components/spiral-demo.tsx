'use client'

import { SpiralAnimation } from "@/components/ui/spiral-animation"
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Map } from 'lucide-react'

const SpiralDemo = () => {
  const [loadingText, setLoadingText] = useState("MAPPING ATLAS...")
  const [progress, setProgress] = useState(0)
  
  // Simulate processing stages
  useEffect(() => {
    const messages = [
      "MAPPING ATLAS...",
      "ANALYZING ARCHITECTURE...",
      "BUILDING DEPENDENCY GRAPH...",
      "FINALIZING VECTORS..."
    ]
    
    let currentMsg = 0
    const msgInterval = setInterval(() => {
      currentMsg = (currentMsg + 1) % messages.length
      setLoadingText(messages[currentMsg])
    }, 2500)
    
    return () => clearInterval(msgInterval)
  }, [])
  
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-black flex flex-col items-center justify-center">
      {/* Spiral Animation Background */}
      <div className="absolute inset-0 z-0">
        <SpiralAnimation />
      </div>
      
      {/* Overlay UI */}
      <div className="z-10 flex flex-col items-center pointer-events-none mt-10">
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center text-center"
        >
            <h1 className="text-white/80 text-lg font-extralight tracking-[0.5em] uppercase mb-1">
                {loadingText}
            </h1>
            <div className="w-[1px] h-12 bg-gradient-to-b from-blue-400/50 to-transparent mb-6" />
        </motion.div>
        
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center"
        >
            <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden mb-4">
                <motion.div 
                    className="h-full bg-blue-500"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ 
                        duration: 10,
                        ease: "easeInOut",
                        repeat: Infinity 
                    }}
                />
            </div>
            <p className="text-white/30 text-[10px] font-normal tracking-[0.2em] uppercase">
                Synchronizing architectural layers
            </p>
        </motion.div>
      </div>
    </div>
  )
}

export { SpiralDemo }
