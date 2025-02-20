import { motion } from 'framer-motion';

const TextGradient = ({ children, className = '', animate = true }) => {
  return (
    <motion.span
      className={`
        bg-clip-text text-transparent
        bg-gradient-to-r from-primary-dark via-primary to-primary-light
        animate-gradient bg-[length:200%_auto]
        ${animate ? 'animate-text-gradient' : ''}
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.span>
  );
};

export default TextGradient;

// Add this to your globals.css
/*
@keyframes text-gradient {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.animate-text-gradient {
  animation: text-gradient 8s linear infinite;
}
*/
