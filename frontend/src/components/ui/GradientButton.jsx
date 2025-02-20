import { motion } from 'framer-motion';

const GradientButton = ({ children, onClick, className = '', variant = 'primary' }) => {
  const getGradient = () => {
    switch (variant) {
      case 'primary':
        return 'from-primary-dark via-primary to-primary-light';
      case 'secondary':
        return 'from-secondary-dark via-secondary to-secondary-light';
      default:
        return 'from-primary-dark via-primary to-primary-light';
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative overflow-hidden rounded-full px-8 py-4
        text-lg font-semibold text-background
        transition-all duration-300
        before:absolute before:inset-0
        before:bg-gradient-to-r ${getGradient()}
        before:transition-all before:duration-500
        hover:before:scale-110 hover:before:rotate-180
        ${className}
      `}
      onClick={onClick}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-black/10 opacity-0 transition-opacity duration-300 hover:opacity-100" />
    </motion.button>
  );
};

export default GradientButton;
