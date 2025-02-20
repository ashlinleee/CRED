import React from 'react';
import { motion } from 'framer-motion';

export default function HeroVideo() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative w-full max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-2xl"
    >
      <img
        src="/hero-video.gif"
        alt="CRED Features Animation"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
      
      {/* Text Overlay */}
      <motion.div 
        className="absolute inset-0 flex flex-col items-center justify-start px-4 pt-24 md:pt-32"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 text-white drop-shadow-lg">
          crafted for
          <br />
          <span className="bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
            the creditworthy
          </span>
        </h1>
      </motion.div>
    </motion.div>
  );
}
