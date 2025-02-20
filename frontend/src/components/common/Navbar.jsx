import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const getNavItems = (isAuthenticated) => {
  if (isAuthenticated) {
    return [
      { title: 'Home', path: '/' },
      { title: 'Dashboard', path: '/dashboard' },
      { title: 'Credit Cards', path: '/credit-cards' },
      { title: 'Rewards', path: '/rewards' }
    ];
  }
  return [
    { title: 'Home', path: '/' },
    { title: 'Credit Cards', path: '/credit-cards' },
    { title: 'Rewards', path: '/rewards' }
  ];
};

const navVariants = {
  hidden: { y: -100, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20
    }
  }
};

const menuItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20
    }
  }
};

const mobileMenuVariants = {
  closed: {
    opacity: 0,
    height: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 40
    }
  },
  open: {
    opacity: 1,
    height: "auto",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 40,
      mass: 0.8
    }
  }
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = getNavItems(isAuthenticated);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    toast.success('Signed out successfully');
    navigate('/login');
  };

  const handleNavigation = (path) => {
    if (!isAuthenticated && path !== '/') {
      toast.error('Please sign in to access this feature');
      navigate('/login');
      return;
    }
    navigate(path);
    setIsOpen(false);
  };

  return (
    <motion.header
      variants={navVariants}
      initial="hidden"
      animate="visible"
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5"
    >
      <nav className="w-[92%] max-w-[2000px] mx-auto">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Link 
              to="/" 
              className="flex items-center py-4"
              onClick={() => setIsOpen(false)}
            >
              <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                CRED
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item, index) => (
              <motion.div
                key={item.path}
                variants={menuItemVariants}
                initial="hidden"
                animate="visible"
                custom={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`relative text-sm font-medium transition-colors duration-300 ${
                    location.pathname === item.path 
                      ? 'text-white' 
                      : 'text-silver-light/60 hover:text-white'
                  }`}
                >
                  {item.title}
                  <span className={`absolute -bottom-1 left-0 w-0 h-[2px] bg-gradient-to-r from-primary to-primary/50 transition-all duration-300 group-hover:w-full ${
                    location.pathname === item.path ? 'w-full' : 'w-0'
                  }`} />
                </button>
              </motion.div>
            ))}
            <motion.div
              variants={menuItemVariants}
              initial="hidden"
              animate="visible"
              custom={navItems.length}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="relative overflow-hidden px-6 py-2 text-sm font-medium text-white group"
                >
                  <span className="absolute inset-0 w-full h-full transition-all duration-300 
                    bg-gradient-to-r from-primary to-primary/80 group-hover:opacity-90" />
                  <span className="relative">Sign Out</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="relative overflow-hidden px-6 py-2 text-sm font-medium text-white group"
                >
                  <span className="absolute inset-0 w-full h-full transition-all duration-300 
                    bg-gradient-to-r from-primary to-primary/80 group-hover:opacity-90" />
                  <span className="relative">Sign In</span>
                </Link>
              )}
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 md:hidden text-silver-light/60 hover:text-white transition-colors"
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90 }}
                  animate={{ rotate: 0 }}
                  exit={{ rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90 }}
                  animate={{ rotate: 0 }}
                  exit={{ rotate: -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={mobileMenuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 space-y-4">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.path}
                    variants={menuItemVariants}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                  >
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                        location.pathname === item.path 
                          ? 'text-white' 
                          : 'text-silver-light/60 hover:text-white'
                      }`}
                    >
                      {item.title}
                    </button>
                  </motion.div>
                ))}
                <motion.div
                  variants={menuItemVariants}
                  initial="hidden"
                  animate="visible"
                  custom={navItems.length}
                >
                  {isAuthenticated ? (
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-opacity"
                    >
                      Sign Out
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="block w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-opacity"
                    >
                      Sign In
                    </Link>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
}
