import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Calendar } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to your account overview</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {[
          { icon: BarChart3, title: 'Total Revenue', value: '$124,500', change: '+12%', color: 'bg-tg-primary' },
          { icon: TrendingUp, title: 'Growth Rate', value: '8.2%', change: '+2.1%', color: 'bg-tg-green' },
          { icon: Users, title: 'Active Clients', value: '1,247', change: '+5%', color: 'bg-tg-coral' },
          { icon: Calendar, title: 'This Month', value: '28 Days', change: '3 left', color: 'bg-tg-grey' },
        ].map((stat, index) => (
          <motion.div
            key={index}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm text-green-600 font-medium">{stat.change}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</h3>
            <p className="text-gray-600 text-sm">{stat.title}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Area */}
        <motion.div
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Revenue Trends</h2>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Chart component would go here</p>
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { action: 'New grain entry added', time: '2 hours ago', type: 'success' },
              { action: 'Client report generated', time: '4 hours ago', type: 'info' },
              { action: 'Inventory updated', time: '6 hours ago', type: 'warning' },
              { action: 'System backup completed', time: '1 day ago', type: 'success' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'success' ? 'bg-green-500' :
                  activity.type === 'info' ? 'bg-blue-500' :
                  activity.type === 'warning' ? 'bg-yellow-500' : 'bg-gray-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};