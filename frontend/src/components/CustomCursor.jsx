import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const CustomCursor = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Update cursor position immediately for responsiveness
      requestAnimationFrame(() => {
        setMousePos({ x: e.clientX, y: e.clientY });
      });
      
      // Check if hovering over clickable element
      const target = e.target;
      const isClickable = (
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.classList.contains('clickable') ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('.clickable')
      );
      setIsPointer(isClickable);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      {/* Main cursor */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-50"
        animate={{
          x: mousePos.x - 8,
          y: mousePos.y - 8,
          scale: isPointer ? 1.2 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 1000,
          damping: 50,
          mass: 0.1,
        }}
      >
        <div className="w-4 h-4 bg-silver-light/80 rounded-full blur-[1px]" />
        <div className="absolute inset-0 w-4 h-4 bg-silver-light/30 rounded-full blur-sm animate-pulse" />
      </motion.div>
      
      {/* Glow effect */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-40"
        animate={{
          x: mousePos.x - 24,
          y: mousePos.y - 24,
          scale: isPointer ? 1.5 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 40,
          mass: 0.2,
        }}
      >
        <div className="w-12 h-12 bg-silver-light/5 rounded-full blur-xl" />
      </motion.div>
    </>
  );
};

export default CustomCursor;
