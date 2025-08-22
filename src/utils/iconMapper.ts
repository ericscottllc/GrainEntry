import { BarChart3, Brain as Grain, TrendingUp, Workflow, Users, FileText, BookOpen, Settings, Circle, Home, Database, Mail, Calendar, Map, Camera, Heart, Star, Shield, Zap, Globe, Code, Briefcase, Target, Award, Clock, DivideIcon as LucideIcon } from 'lucide-react';

// Map of icon names to Lucide React components
export const iconMap: Record<string, LucideIcon> = {
  BarChart3,
  Grain,
  TrendingUp,
  Workflow,
  Users,
  FileText,
  BookOpen,
  Settings,
  Circle,
  Home,
  Database,
  Mail,
  Calendar,
  Map,
  Camera,
  Heart,
  Star,
  Shield,
  Zap,
  Globe,
  Code,
  Briefcase,
  Target,
  Award,
  Clock
};

// Get icon component by name, fallback to Circle if not found
export const getIconComponent = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Circle;
};