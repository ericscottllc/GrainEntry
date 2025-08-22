import React from 'react';
import { motion } from 'framer-motion';
import { NavigationItem } from '../../types/navigation';
import { getIconComponent } from '../../utils/iconMapper';

interface MainContentProps {
  activeItem: string;
  activeNavItem: NavigationItem | null;
  onNavigate: (subdomain: string, shouldRedirect: boolean) => void;
}

export const MainContent: React.FC<MainContentProps> = ({ activeNavItem, onNavigate }) => {
  if (!activeNavItem) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">Select an item from the navigation</p>
          <p className="text-gray-400 text-sm">Choose a feature from the sidebar to view its content</p>
        </div>
      </div>
    );
  }

  const IconComponent = getIconComponent(activeNavItem.icon_name);

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="max-w-4xl mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Icon */}
          <div className={`inline-flex items-center justify-center w-20 h-20 ${getBackgroundColor(activeNavItem.color)} rounded-3xl mb-6 shadow-lg`}>
            <div className="text-white">
              <IconComponent className="w-8 h-8" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {activeNavItem.title}
          </h1>

          {/* Description */}
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            This is a placeholder for the {activeNavItem.title} application. Replace this content with your actual {activeNavItem.title} functionality.
          </p>

          {/* Action Button */}
          <motion.button
            onClick={() => onNavigate(activeNavItem.subdomain, activeNavItem.redirect_active)}
            className={`inline-flex items-center gap-3 px-8 py-4 ${getBackgroundColor(activeNavItem.color)} text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200`}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>
              {activeNavItem.redirect_active ? `Launch ${activeNavItem.title}` : `View ${activeNavItem.title}`}
            </span>
          </motion.button>

          {/* Action Info */}
          <div className="text-sm text-gray-500 mt-4">
            {activeNavItem.redirect_active ? (
              <p>
                Will redirect to: <code className="bg-gray-100 px-2 py-1 rounded text-gray-700">{activeNavItem.subdomain}</code>
              </p>
            ) : (
              <p>
                Showing local content for: <code className="bg-gray-100 px-2 py-1 rounded text-gray-700">{activeNavItem.title}</code>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Helper function to get background color class
const getBackgroundColor = (color: string): string => {
  switch (color) {
    case 'tg-primary':
      return 'bg-tg-primary';
    case 'tg-green':
      return 'bg-tg-green';
    case 'tg-coral':
      return 'bg-tg-coral';
    case 'tg-grey':
      return 'bg-tg-grey';
    default:
      return 'bg-tg-primary';
  }
};