import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', hover = true }) => {
  return (
    <motion.div
      whileHover={hover ? { y: -10, scale: 1.02 } : {}}
      transition={{ duration: 0.3 }}
      className={`
        relative overflow-hidden rounded-2xl
        bg-white/5 backdrop-blur-lg
        border border-white/10
        shadow-xl
        before:absolute before:inset-0
        before:bg-gradient-to-r from-transparent via-white/5 to-transparent
        before:translate-x-[-200%]
        hover:before:translate-x-[200%]
        before:transition-transform before:duration-1000
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

export default GlassCard;
