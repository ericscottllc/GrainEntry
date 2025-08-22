import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useNavigation } from './hooks/useNavigation';
import { LoadingSpinner } from './components/Core/LoadingSpinner';
import { LoginPage } from './components/Core/LoginPage';
import { Sidebar } from './components/Core/Sidebar';
import { MainContent } from './components/Core/MainContent';
import { CodeExplorer } from './CodeExplorer';
import { SchemaExplorer } from './SchemaExplorer';
import { GrainEntriesPage } from './pages/grainEntries';
import { NavigationItem } from './types/navigation';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { navigationItems } = useNavigation();
  const [activeItem, setActiveItem] = useState('dashboard');
  const [showCodeExplorer, setShowCodeExplorer] = useState(false);
  const [showSchemaExplorer, setShowSchemaExplorer] = useState(false);

  // Hidden keyboard shortcut to open code explorer
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+C (or Cmd+Shift+C on Mac) to open code explorer
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        setShowCodeExplorer(true);
      }
      // Ctrl+Shift+S (or Cmd+Shift+S on Mac) to open schema explorer
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        setShowSchemaExplorer(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginPage />;
  }

  // Find the active navigation item
  const activeNavItem = navigationItems.find(item => item.id === activeItem) || 
                       navigationItems.find(item => item.title.toLowerCase().replace(/\s+/g, '-') === activeItem) ||
                       navigationItems[0] || null;

  const handleItemClick = (item: NavigationItem) => {
    setActiveItem(item.id);
  };

  const handleNavigate = (subdomain: string, shouldRedirect: boolean) => {
    if (shouldRedirect) {
      // In production, this would redirect to the actual subdomain
      console.log(`Redirecting to: https://${subdomain}`);
      // window.location.href = `https://${subdomain}`;
      
      // For demo purposes, show an alert
      alert(`This would redirect to: https://${subdomain}\n\nIn production, each subdomain would be a separate deployment of this framework with app-specific content.`);
    } else {
      // Show local content - no redirect needed
      console.log(`Showing local content for: ${activeNavItem?.title}`);
    }
  };

  // Render page content based on active item
  const renderPageContent = () => {
    if (!activeNavItem) return null;
    
    // Check if this should show local content
    if (!activeNavItem.redirect_active) {
      switch (activeNavItem.title.toLowerCase().replace(/\s+/g, '-')) {
        case 'grain-entries':
          return <GrainEntriesPage />;
        default:
          return <MainContent activeNavItem={activeNavItem} onNavigate={handleNavigate} />;
      }
    }
    
    return <MainContent activeNavItem={activeNavItem} onNavigate={handleNavigate} />;
  };

  return (
    <>
      <motion.div
        className="flex h-screen bg-gray-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Sidebar activeItem={activeItem} onItemClick={handleItemClick} />
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {renderPageContent()}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showCodeExplorer && (
          <CodeExplorer 
            isOpen={showCodeExplorer} 
            onClose={() => setShowCodeExplorer(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSchemaExplorer && (
          <SchemaExplorer 
            isOpen={showSchemaExplorer} 
            onClose={() => setShowSchemaExplorer(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <AppContent />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;