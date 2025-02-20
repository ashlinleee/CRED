import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  CreditCard,
  Gift,
  BarChart2,
  Settings,
  HelpCircle,
  LogOut,
  User,
  Menu,
  X,
  LayoutDashboard,
  FileText
} from 'lucide-react';
import { useAuth } from '../App';
import { toast } from 'react-hot-toast';
import CustomToast from './CustomToast';

const menuItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/cards", icon: CreditCard, label: "Credit Cards" },
  { path: "/rewards", icon: Gift, label: "Rewards" },
  { path: "/transactions", icon: FileText, label: "Transactions" },
  { path: "/analytics", icon: BarChart2, label: "Analytics" },
  { path: "/profile", icon: User, label: "Profile" },
  { path: "/settings", icon: Settings, label: "Settings" },
  { path: "/support", icon: HelpCircle, label: "Support" },
];

export default function Layout({ children }) {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    try {
      toast.custom((t) => (
        <CustomToast
          type="info"
          message="Logging you out..."
        />
      ));
      setTimeout(() => {
        logout();
      }, 500);
    } catch (error) {
      console.error('Logout error:', error);
      toast.custom((t) => (
        <CustomToast
          type="error"
          title="Error"
          message="Failed to log out. Please try again."
        />
      ));
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card/30 backdrop-blur-lg border-r border-silver-light/10">
        <div className="p-6 flex items-center">
          <Link to="/" className="text-2xl font-bold text-silver-light hover:text-white transition-colors">
            CRED
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-silver-light/70 hover:bg-silver-light/10'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-silver-light/10">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-card/30 backdrop-blur-lg rounded-lg border border-silver-light/10"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-silver-light" />
        ) : (
          <Menu className="w-6 h-6 text-silver-light" />
        )}
      </button>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          className="fixed inset-0 z-40 md:hidden"
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <nav className="absolute right-0 top-0 bottom-0 w-64 bg-card/30 backdrop-blur-lg border-l border-silver-light/10">
            <div className="p-6">
              <X 
                className="w-6 h-6 text-silver-light cursor-pointer" 
                onClick={() => setIsMobileMenuOpen(false)}
              />
            </div>

            <div className="px-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-silver-light/70 hover:bg-silver-light/10'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center w-full px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors mt-4"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Log Out
              </button>
            </div>
          </nav>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
