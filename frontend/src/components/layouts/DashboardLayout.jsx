import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  CreditCard, 
  Gift, 
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  History,
  HelpCircle,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard'
  },
  {
    title: 'Analytics',
    icon: BarChart2,
    path: '/analytics'
  },
  {
    title: 'Credit Cards',
    icon: CreditCard,
    path: '/credit-cards'
  },
  {
    title: 'Transactions',
    icon: History,
    path: '/transactions'
  },
  {
    title: 'Rewards',
    icon: Gift,
    path: '/rewards'
  },
  {
    title: 'Profile',
    icon: User,
    path: '/profile'
  },
  {
    title: 'Settings',
    icon: Settings,
    path: '/settings'
  },
  {
    title: 'Support',
    icon: HelpCircle,
    path: '/support'
  }
];

export default function DashboardLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? '80px' : '280px' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-screen bg-surface border-r border-white/10 z-30"
      >
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-white/10">
          <Link to="/" className="text-2xl font-bold text-white">CRED</Link>
        </div>

        {/* Menu Items */}
        <nav className="h-[calc(100vh-5rem)] flex flex-col">
          <div className="flex-1 py-6 px-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-300 group
                        ${isActive 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-silver-light/60 hover:bg-white/5 hover:text-silver-light'
                        }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-silver-light/60 group-hover:text-silver-light'}`} />
                      {!isCollapsed && (
                        <span className="ml-3 text-sm font-medium">{item.title}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* User Profile */}
          {!isCollapsed && (
            <div className="p-4 border-t border-white/10">
              <Link 
                to="/profile"
                className="flex items-center space-x-3 hover:bg-white/5 p-2 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                  <p className="text-xs text-silver-light/60">{user?.email || 'user@example.com'}</p>
                </div>
              </Link>
            </div>
          )}

          {/* Collapse Button */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full flex items-center justify-center p-2 text-silver-light/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-[80px]' : 'ml-[280px]'}`}>
        {/* Header */}
        <header className="h-20 bg-surface border-b border-white/10 flex items-center px-8">
          <h1 className="text-2xl font-bold text-white">
            {menuItems.find(item => item.path === location.pathname)?.title || 'Dashboard'}
          </h1>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
