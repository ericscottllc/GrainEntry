import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain as Grain, Plus, Eye } from 'lucide-react';
import { NewEntriesTab, ViewEntriesTab } from './components';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

const grainTabs = [
  { id: 'new', title: 'New Entries', icon: Plus },
  { id: 'view', title: 'View Entries', icon: Eye }
];

export const GrainEntriesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('new');
  const [toast, setToast] = useState<Toast | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEntriesAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('view'); // Switch to view tab after adding entries
  };

  const ActiveComponent = () => {
    switch (activeTab) {
      case 'new':
        return <NewEntriesTab onShowToast={showToast} onEntriesAdded={handleEntriesAdded} />;
      case 'view':
        return <ViewEntriesTab onShowToast={showToast} refreshTrigger={refreshTrigger} />;
      default:
        return <NewEntriesTab onShowToast={showToast} onEntriesAdded={handleEntriesAdded} />;
    }
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-tg-green rounded-xl flex items-center justify-center">
              <Grain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Grain Entries</h1>
              <p className="text-sm text-gray-500">Manage grain pricing and futures data</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {grainTabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-tg-green shadow-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.title}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <ActiveComponent />
        </motion.div>
      </div>
    </div>
  );
};