import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signInWithEmail } = useAuth();
  const { error: showError } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await signInWithEmail(email, password);
      
      if (error) {
        showError('Sign In Failed', error.message);
        setError(error.message);
      }
    } catch (error) {
      console.error('Auth failed:', error);
      const errorMessage = 'An unexpected error occurred';
      showError('Sign In Failed', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >

        {/* Login Card */}
        <motion.div
          className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8 relative overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Content */}
          <div className="relative z-10">
            {/* Logo */}
            <motion.div
              className="text-center mb-8"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-tg-primary rounded-2xl mb-4 shadow-md">
                <img 
                  src="/Trigger-Grain-Marketing_SQUARE.png" 
                  alt="TriggerGrain Logo" 
                  className="w-12 h-12 object-contain"
                />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">
                TriggerGrain
              </h1>
              <p className="text-gray-600 mt-2">Sign in to view your account</p>
            </motion.div>

            {/* Features */}
            <motion.div
              className="grid grid-cols-1 gap-3 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              {[
                { icon: '👥', title: 'Client Portal', desc: 'One stop shop for your grain management' },
                { icon: '📊', title: 'Analytics Dashboard', desc: 'Get a snapshot of your farm' },
                { icon: '🌾', title: 'Grain Management', desc: 'Review inventory and contracts' },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-200"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                >
                  <span className="text-2xl mr-3">{feature.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">{feature.title}</h3>
                    <p className="text-gray-600 text-xs">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Sign In Form */}
            <motion.form
              onSubmit={handleEmailSignIn}
              className="space-y-4 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.9 }}
            >
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-tg-primary focus:border-transparent transition-all duration-200"
                  disabled={isLoading}
                />
              </div>
              
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-tg-primary focus:border-transparent transition-all duration-200"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full bg-tg-primary text-white py-3 px-6 rounded-xl font-semibold
                           shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                           flex items-center justify-center gap-3 relative overflow-hidden"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  ) : (
                  <LogIn className="w-5 h-5" />
                )}
                <span>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </span>
              </motion.button>
            </motion.form>

            {/* Footer */}
            <motion.p
              className="text-center text-gray-500 text-sm mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              {!import.meta.env.VITE_SUPABASE_URL ? (
                <span className="text-red-500 font-medium">
                  ⚠️ Supabase not configured. Please set up your .env file.
                </span>
              ) : (
                "Your Personal Experienced Grain Marketing Specialist"
              )}
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};