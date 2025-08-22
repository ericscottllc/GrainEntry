import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ChevronLeft, ChevronRight, Brain as Grain } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../hooks/useNavigation';
import { NavigationItem } from '../../types/navigation';
import { getIconComponent } from '../../utils/iconMapper';

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: NavigationItem) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeItem, onItemClick }) => {
  const { user, signOut } = useAuth();
  const { navigationItems, loading, error } = useNavigation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleItemClick = (item: NavigationItem) => {
    if (item.redirect_active) {
      // Redirect to the subdomain URL
      window.location.href = `https://${item.subdomain}`;
    } else {
      // Show local content
      onItemClick(item);
    }
  };

  return (
    <motion.div
      className={`h-screen bg-white border-r border-gray-200 shadow-lg relative overflow-hidden ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
      initial={false}
      animate={{ width: isCollapsed ? 80 : 288 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >

      {/* Header */}
      <div className="p-6 border-b border-gray-200 relative z-10">
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center p-1">
                  <img 
                    src="/Trigger-Grain-Marketing_SQUARE.png" 
                    alt="TriggerGrain Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">
                    TriggerGrain
                  </h1>
                  <p className="text-xs text-gray-500">Account Management</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 space-y-2 relative z-10">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-tg-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            Failed to load navigation. Using fallback items.
          </div>
        )}
        
        {navigationItems.map((item, index) => {
          const IconComponent = getIconComponent(item.icon_name);
          const isActive = activeItem === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => handleItemClick(item)}
              onHoverStart={() => setHoveredItem(item.id)}
              onHoverEnd={() => setHoveredItem(null)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
                isActive
                  ? getActiveStyles(item.color)
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Hover Effect */}
              {hoveredItem === item.id && !isActive && (
                <div className={`absolute inset-0 ${getHoverStyles(item.color)} rounded-xl`} />
              )}

              {/* Active Indicator */}
              {activeItem === item.id && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-white/80 rounded-r-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              {/* Icon */}
              <div className={`flex-shrink-0 p-1 rounded-lg ${
                isActive ? 'bg-white/20' : ''
              }`}>
                <IconComponent className="w-5 h-5" />
              </div>

              {/* Label */}
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 text-left"
                  >
                    <span className="font-medium">{item.title}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* User Profile & Logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-tg-primary rounded-full flex items-center justify-center text-white font-semibold">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-gray-800 truncate">
                  {user?.user_metadata?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <motion.button
          onClick={signOut}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-5 h-5" />
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-medium"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
};

// Helper functions for styling based on color
const getActiveStyles = (color: string): string => {
  switch (color) {
    case 'tg-primary':
      return 'bg-tg-primary text-white shadow-md';
    case 'tg-green':
      return 'bg-tg-green text-white shadow-md';
    case 'tg-coral':
      return 'bg-tg-coral text-white shadow-md';
    case 'tg-grey':
      return 'bg-tg-grey text-gray-800 shadow-md';
    default:
      return 'bg-tg-primary text-white shadow-md';
  }
};

const getHoverStyles = (color: string): string => {
  switch (color) {
    case 'tg-primary':
      return 'bg-tg-primary/10';
    case 'tg-green':
      return 'bg-tg-green/10';
    case 'tg-coral':
      return 'bg-tg-coral/10';
    case 'tg-grey':
      return 'bg-tg-grey/10';
    default:
      return 'bg-tg-primary/10';
  }
};