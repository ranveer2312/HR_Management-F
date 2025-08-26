'use client';

import React, { useState, useEffect } from 'react';
import { 
  Download, FileText, Presentation, Users, Building, Database, Store, UserCheck, DollarSign,
  ArrowRight, Menu, X, Phone, Mail, MapPin, Award, Target, TrendingUp, Shield, CheckCircle, Star,
  Globe, Zap, Play, Clock, Sparkles, Rocket, Heart, ChevronRight, Check,
  Cpu, BarChart, RefreshCw
} from 'lucide-react';
import { APIURL } from '@/constants/api';
import toast, { Toaster } from 'react-hot-toast';

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [scrollY, setScrollY] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  interface StatItem {
    number: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }

  const [stats, setStats] = useState<StatItem[]>([
    { number: '0', label: 'Total Employees', icon: Building, color: 'from-blue-600 to-indigo-700' },
    { number: '0', label: 'Active Today', icon: Shield, color: 'from-emerald-600 to-teal-700' },
    { number: '0', label: 'Departments', icon: Globe, color: 'from-violet-600 to-purple-700' },
    { number: '0', label: 'Avg Work Hours', icon: Clock, color: 'from-amber-600 to-orange-700' }
  ]);
  const [loading, setLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch employees
      const employeesResponse = await fetch(`${APIURL}/api/employees`);
      if (!employeesResponse.ok) {
        throw new Error('Failed to fetch employees');
      }
      interface Employee {
        department: string;
        [key: string]: unknown;
      }

      interface Attendance {
        date: string;
        workHours?: number;
        [key: string]: unknown;
      }

      const employees: Employee[] = await employeesResponse.json();
      
      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0];
      const attendanceResponse = await fetch(`${APIURL}/api/attendance`);
      if (!attendanceResponse.ok) {
        throw new Error('Failed to fetch attendance');
      }
      const allAttendance: Attendance[] = await attendanceResponse.json();
      const todayAttendance = allAttendance.filter((att) => att.date === today);
      
      // Calculate department stats
      const departments = [...new Set(employees.map((emp) => emp.department))];
      
      // Calculate average work hours
      const totalWorkHours = allAttendance.reduce((sum: number, att) => {
        return sum + (att.workHours || 0);
      }, 0);
      const avgWorkHours = allAttendance.length > 0 ? (totalWorkHours / allAttendance.length).toFixed(1) : '0';
      
      // Update stats
      setStats([
        { number: employees.length.toString(), label: 'Total Employees', icon: Building, color: 'from-blue-600 to-indigo-700' },
        { number: todayAttendance.length.toString(), label: 'Active Today', icon: Shield, color: 'from-emerald-600 to-teal-700' },
        { number: departments.length.toString(), label: 'Departments', icon: Globe, color: 'from-violet-600 to-purple-700' },
        { number: avgWorkHours, label: 'Avg Work Hours', icon: Clock, color: 'from-amber-600 to-orange-700' }
      ]);
      
      toast.success('Dashboard statistics updated!');
      setBackendConnected(true);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics. Please check if the backend is running.');
      setBackendConnected(false);
      
      // Set default stats when backend is not available
      setStats([
        { number: '0', label: 'Total Employees', icon: Building, color: 'from-blue-600 to-indigo-700' },
        { number: '0', label: 'Active Today', icon: Shield, color: 'from-emerald-600 to-teal-700' },
        { number: '0', label: 'Departments', icon: Globe, color: 'from-violet-600 to-purple-700' },
        { number: '0', label: 'Avg Work Hours', icon: Clock, color: 'from-amber-600 to-orange-700' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'HR Director',
      company: 'TechCorp India',
      content: 'Tiranga IDMS transformed our HR operations completely. The automation features saved us 15+ hours weekly!',
      rating: 5
    },
    {
      name: 'Rajesh Kumar',
      role: 'CEO',
      company: 'InnovateHub',
      content: 'Best investment we made for our growing team. The analytics insights are game-changing.',
      rating: 5
    },
    {
      name: 'Priya Sharma',
      role: 'Operations Manager',
      company: 'GrowthCo',
      content: 'User-friendly interface and powerful features. Our employees adapted quickly and love using it.',
      rating: 5
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleRoleLogin = (role: string) => {
    console.log(`Selected role: ${role}`);
    // Store the selected role in localStorage for the login page
    localStorage.setItem('selectedRole', role);
    // Navigate to login page
    window.location.href = '/login';
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const features = [
    {
      icon: Cpu,
      title: 'AI-Powered Intelligence',
      description: 'Advanced machine learning algorithms for predictive analytics and smart automation',
      gradient: 'from-blue-600 to-indigo-700',
      delay: '0ms'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'SOC 2 Type II certified with end-to-end encryption and zero-trust architecture',
      gradient: 'from-emerald-600 to-teal-700',
      delay: '100ms'
    },
    {
      icon: Globe,
      title: 'Global Infrastructure',
      description: 'Multi-region deployment with 99.99% uptime SLA and disaster recovery',
      gradient: 'from-violet-600 to-purple-700',
      delay: '200ms'
    },
    {
      icon: Users,
      title: 'User Experience First',
      description: 'Intuitive design with accessibility compliance and mobile-first approach',
      gradient: 'from-rose-600 to-pink-700',
      delay: '300ms'
    },
    {
      icon: BarChart,
      title: 'Real-Time Analytics',
      description: 'Live dashboards with customizable reports and actionable insights',
      gradient: 'from-amber-600 to-orange-700',
      delay: '400ms'
    },
    {
      icon: Clock,
      title: '24/7 Expert Support',
      description: 'Dedicated success managers with average response time under 2 minutes',
      gradient: 'from-slate-600 to-gray-700',
      delay: '500ms'
    }
  ];



  return (     
    <div className="min-h-screen font-sans text-gray-900 bg-gradient-to-br from-slate-50 via-white to-slate-50 transition-all duration-300 overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrollY > 50 ? 'bg-white/95 backdrop-blur-lg shadow-xl border-b border-slate-200' : 'bg-white/90 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center cursor-pointer group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
            </div>
            <div className="ml-3">
              <div className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent">
                Tiranga IDMS
              </div>
              <div className="text-xs text-slate-500 -mt-1">Enterprise Platform</div>
            </div>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 items-center">
            {['home', 'about', 'services', 'resources', 'contact'].map((section) => (
              <button
                key={section}
                onClick={() => scrollToSection(section)}
                className={`relative text-base font-medium transition-all duration-200 px-3 py-2 rounded-lg ${
                  activeSection === section 
                    ? 'text-slate-800 bg-slate-100' 
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
                {activeSection === section && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-slate-800 to-slate-900 rounded-full"></div>
                )}
              </button>
            ))}
            <button
              onClick={() => scrollToSection('login')}
              className="ml-6 px-8 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl font-semibold hover:from-slate-900 hover:to-black transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Get Started
            </button>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 text-gray-700 hover:text-indigo-600 transition-colors bg-white rounded-xl shadow-lg"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-lg shadow-xl border-t border-gray-100">
            <div className="flex flex-col space-y-2 px-6 py-6">
              {['home', 'about', 'services', 'resources', 'contact'].map((section) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className="text-gray-700 hover:text-indigo-600 text-base font-medium py-3 text-left transition-colors px-4 rounded-lg hover:bg-indigo-50"
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </button>
              ))}
              <button
                onClick={() => scrollToSection('login')}
                className="mt-4 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Light Background */}
      <section
        id="home"
        className="relative flex items-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden pt-20 pb-16"
      >
        {/* Subtle Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-gradient-to-r from-violet-500/5 to-purple-500/5 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse delay-500"></div>
          
          {/* Floating geometric shapes */}
          <div className="absolute top-32 right-1/4 w-6 h-6 bg-blue-400/20 rotate-45 animate-bounce delay-1000"></div>
          <div className="absolute bottom-32 left-1/4 w-4 h-4 bg-purple-400/20 rounded-full animate-bounce delay-2000"></div>
          <div className="absolute top-1/2 right-20 w-8 h-8 bg-emerald-400/20 rotate-12 animate-pulse"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center z-20">
          {/* Left Content */}
          <div className="text-slate-900">
            {/* Badge */}
            <div className="flex items-center gap-4 mb-8">
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-100 border border-blue-200 text-blue-700 rounded-full font-medium text-sm shadow-lg animate-fade-in hover:scale-105 transition-transform duration-300">
                <Star className="w-4 h-4 mr-2 text-amber-500" /> 
                <span>Trusted by 15,000+ Enterprise Organizations</span>
              </div>
              <div className={`inline-flex items-center px-4 py-2 rounded-full font-medium text-sm shadow-lg transition-all duration-300 ${
                backendConnected 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${backendConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{backendConnected ? 'Backend Connected' : 'Backend Offline'}</span>
              </div>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent animate-slide-up">
                Enterprise
              </span>
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent animate-slide-up delay-200">
                HR Management
              </span>
              <span className="block text-3xl md:text-4xl font-semibold text-slate-600 mt-4 animate-slide-up delay-400">
                Reimagined
              </span>
            </h1>
            
            {/* Subtext */}
            <p className="max-w-xl mb-10 text-xl md:text-2xl text-slate-600 leading-relaxed animate-slide-up delay-600">
              Next-generation HRMS platform with 
              <span className="font-semibold text-slate-800"> AI-powered automation</span>, 
              <span className="font-semibold text-slate-800"> real-time analytics</span>, and 
              <span className="font-semibold text-slate-800"> enterprise-grade security</span> for modern organizations.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 items-start animate-slide-up delay-800">
              <button
                onClick={() => scrollToSection('login')}
                className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 text-lg flex items-center transform hover:scale-105 hover:-translate-y-1"
              >
                <Play className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform duration-300" />
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="px-10 py-5 border-2 border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-400 transition-all duration-300 text-lg backdrop-blur-sm group"
              >
                <span className="mr-3">Watch Demo</span>
                <Play className="w-5 h-5 inline group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between mt-16 animate-slide-up delay-1000">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group cursor-pointer">
                  <div className="flex items-center justify-center mb-3">
                    <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300`}>
                    {loading ? '...' : stat.number}
                  </div>
                  <div className="text-slate-500 text-sm font-medium mt-1">{stat.label}</div>
                </div>
              ))}
              </div>
              <button
                onClick={fetchDashboardStats}
                disabled={loading}
                className="ml-4 p-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl hover:from-slate-900 hover:to-black transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh Statistics"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Right Content - Hero Illustration */}
          <div className="relative animate-fade-in-right">
            <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl p-8 border border-slate-200/50 shadow-2xl hover:shadow-3xl transition-all duration-500">
              {/* Mock Dashboard Preview */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-inner">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse delay-200"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse delay-400"></div>
                  </div>
                  <div className="text-slate-400 text-sm font-medium">Tiranga IDMS Dashboard</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-4 text-white hover:scale-105 transition-transform duration-300">
                    <Users className="w-6 h-6 mb-2" />
                    <div className="text-2xl font-bold">{loading ? '...' : stats[0].number}</div>
                    <div className="text-sm opacity-80">Total Employees</div>
                  </div>
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl p-4 text-white hover:scale-105 transition-transform duration-300">
                    <TrendingUp className="w-6 h-6 mb-2" />
                    <div className="text-2xl font-bold">{loading ? '...' : stats[1].number}</div>
                    <div className="text-sm opacity-80">Active Today</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {[
                    { label: 'Employee Onboarding', progress: loading ? 0 : Math.min(100, Math.round(parseFloat(stats[0].number) * 10)), color: 'bg-blue-600' },
                    { label: 'Attendance Rate', progress: loading ? 0 : stats[0].number !== '0' ? Math.round((parseInt(stats[1].number) / parseInt(stats[0].number)) * 100) : 0, color: 'bg-emerald-600' },
                    { label: 'System Utilization', progress: loading ? 0 : Math.min(100, Math.round(parseFloat(stats[3].number) * 10)), color: 'bg-violet-600' }
                  ].map((item, index) => (
                    <div key={index} className="bg-slate-800/50 rounded-lg p-3 hover:bg-slate-700/50 transition-colors duration-300">
                      <div className="flex justify-between text-sm text-slate-300 mb-2">
                        <span>{item.label}</span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className={`${item.color} h-2 rounded-full transition-all duration-1000 hover:shadow-lg`} style={{width: `${item.progress}%`}}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl animate-bounce hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center shadow-2xl animate-pulse hover:scale-110 transition-transform duration-300">
              <Rocket className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full mb-6 font-semibold text-sm">
              <Award className="w-4 h-4 mr-2" /> Why Choose Tiranga IDMS
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
              Built for the Future of Work
            </h2>
            <p className="text-xl max-w-4xl mx-auto text-gray-600 leading-relaxed">
              We&apos;re not just another HR platform. We&apos;re your strategic partner in digital transformation, 
              building the future of work with cutting-edge technology and human-centric design.
            </p>
          </div>
          
          {/* Enhanced Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-slate-100 h-full flex flex-col relative overflow-hidden hover:transform hover:scale-105"
                style={{ animationDelay: feature.delay }}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                
                <div className={`relative w-16 h-16 mx-auto mb-6 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="relative text-xl font-bold mb-4 text-slate-900 text-center group-hover:text-slate-800">
                  {feature.title}
                </h3>
                <p className="relative text-slate-600 leading-relaxed text-center flex-grow">
                  {feature.description}
                </p>
                
                {/* Hover Arrow */}
                <div className="relative flex justify-center mt-6 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <ChevronRight className="w-6 h-6 text-slate-700" />
                </div>
              </div>
            ))}
          </div>
          
          {/* Company Values */}
          <div className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-3xl p-12 shadow-inner">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Target,
                  title: 'Our Mission',
                  desc: 'Democratize enterprise-grade HR tools for organizations of all sizes, making world-class technology accessible to everyone.',
                  gradient: 'from-red-500 to-pink-500'
                },
                {
                  icon: Award,
                  title: 'Our Vision',
                  desc: 'Create a world where every team has the tools and insights to unlock their full potential and drive meaningful impact.',
                  gradient: 'from-yellow-500 to-orange-500'
                },
                {
                  icon: TrendingUp,
                  title: 'Our Values',
                  desc: 'Innovation-first mindset, radical transparency, customer obsession, and sustainable growth through continuous learning.',
                  gradient: 'from-green-500 to-teal-500'
                },
              ].map((item, index) => (
                <div key={index} className="text-center group">
                  <div className={`w-16 h-16 mx-auto mb-6 bg-gradient-to-r ${item.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold mb-4 text-gray-900">{item.title}</h4>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full mb-6 font-semibold text-sm shadow-lg">
              <Database className="w-4 h-4 mr-2" /> Our Solutions
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-indigo-900 to-purple-900 bg-clip-text text-transparent">
              Tiranga IDMS
            </h2>
            <p className="text-2xl md:text-3xl font-semibold mb-8 text-gray-700">
              Internal Data Management System
            </p>
            <p className="text-xl max-w-4xl mx-auto text-gray-600 leading-relaxed">
              Complete ecosystem of integrated solutions designed to streamline your operations, 
              boost productivity, and drive growth through intelligent automation.
            </p>
          </div>
          
          {/* Enhanced Solution Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Users, 
                title: 'Employee Lifecycle Management', 
                desc: 'End-to-end employee journey from onboarding to offboarding with AI-powered insights and automation.',
                gradient: 'from-blue-500 to-indigo-600',
                features: ['Smart Onboarding', 'Performance Tracking', 'Career Development']
              },
              { 
                icon: Database, 
                title: 'Advanced Data Analytics', 
                desc: 'Transform raw data into actionable insights with real-time dashboards and predictive analytics.',
                gradient: 'from-green-500 to-teal-600',
                features: ['Real-time Dashboards', 'Predictive Analytics', 'Custom Reports']
              },
              { 
                icon: Store, 
                title: 'Operations Excellence Hub', 
                desc: 'Streamline inventory management, performance monitoring, and operational workflows seamlessly.',
                gradient: 'from-purple-500 to-pink-600',
                features: ['Inventory Control', 'Workflow Automation', 'Quality Management']
              },
              { 
                icon: UserCheck, 
                title: 'Next-Gen HR Suite', 
                desc: 'Revolutionary HR tools covering recruitment, engagement, learning, and talent development.',
                gradient: 'from-orange-500 to-red-600',
                features: ['Smart Recruitment', 'Employee Engagement', 'Learning Management']
              },
              { 
                icon: DollarSign, 
                title: 'Financial Command Center', 
                desc: 'Comprehensive budgeting, expense tracking, payroll management with automated compliance.',
                gradient: 'from-yellow-500 to-orange-600',
                features: ['Automated Payroll', 'Expense Management', 'Budget Planning']
              },
              { 
                icon: Shield, 
                title: 'Security & Compliance Shield', 
                desc: 'Enterprise-grade security framework with automated compliance monitoring and reporting.',
                gradient: 'from-indigo-500 to-purple-600',
                features: ['Data Protection', 'Compliance Monitoring', 'Audit Trails']
              },
            ].map((service, index) => (
              <div
                key={index}
                className="group bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/50 h-full flex flex-col relative overflow-hidden"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                
                <div className={`relative w-20 h-20 mx-auto mb-6 bg-gradient-to-br ${service.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                  <service.icon className="w-10 h-10 text-white" />
                </div>
                
                <h3 className="relative text-xl font-bold mb-4 text-gray-900 text-center">{service.title}</h3>
                <p className="relative text-gray-600 mb-6 leading-relaxed text-center flex-grow">{service.desc}</p>
                
                {/* Feature List */}
                <div className="relative space-y-2 mb-6">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <button className={`relative w-full py-3 bg-gradient-to-r ${service.gradient} text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 group-hover:scale-105`}>
                  Explore Solution
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text text-transparent">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600">Join thousands of satisfied customers who trust Tiranga IDMS</p>
          </div>
          
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-12 text-center shadow-lg">
              <div className="flex justify-center mb-6">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                ))}
              </div>
              
              <blockquote className="text-2xl font-medium text-gray-900 mb-8 italic">
                &ldquo;{testimonials[currentTestimonial].content}&rdquo;
              </blockquote>
              
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-xl">
                    {testimonials[currentTestimonial].name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonials[currentTestimonial].name}</div>
                  <div className="text-gray-600">{testimonials[currentTestimonial].role}, {testimonials[currentTestimonial].company}</div>
                </div>
              </div>
            </div>
            
            {/* Testimonial Indicators */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial 
                      ? 'bg-indigo-600 w-8' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section id="resources" className="py-24 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-full mb-6 font-semibold text-sm shadow-lg">
              <Download className="w-4 h-4 mr-2" /> Resources
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text text-transparent">
              Resource Center
            </h2>
            <p className="text-xl max-w-3xl mx-auto text-gray-600 leading-relaxed">
              Download our comprehensive guides, case studies, and presentations to accelerate your digital transformation journey.
            </p>
          </div>
          
          {/* Enhanced Download Cards */}
          <div className="grid md:grid-cols-2 gap-12">
            {/* PDF Card */}
            <div className="group bg-white/90 backdrop-blur-sm p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <FileText className="w-12 h-12 text-white" />
              </div>
              
              <h3 className="relative text-3xl font-bold mb-6 text-gray-900 text-center">Company Profile</h3>
              <div className="relative space-y-4 mb-8">
                <div className="flex items-center text-gray-600">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Complete company overview and capabilities</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Success stories and case studies</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Technical specifications and features</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Implementation roadmap and timeline</span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  // Download company profile PDF
                  const link = document.createElement('a');
                  link.href = '/downloads/company-profile.pdf';
                  link.download = 'Tiranga-IDMS-Company-Profile.pdf';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success('Download started!');
                }}
                className="relative w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl group-hover:scale-105 flex items-center justify-center"
              >
                <Download className="w-6 h-6 mr-3" /> 
                Download PDF
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            {/* PPT Card */}
            <div className="group bg-white/90 backdrop-blur-sm p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <Presentation className="w-12 h-12 text-white" />
              </div>
              
              <h3 className="relative text-3xl font-bold mb-6 text-gray-900 text-center">Executive Presentation</h3>
              <div className="relative space-y-4 mb-8">
                <div className="flex items-center text-gray-600">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Executive-level solution overview</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>ROI analysis and business benefits</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Strategic advantages and differentiators</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Implementation strategy and support</span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  // Download executive presentation
                  const link = document.createElement('a');
                  link.href = '/downloads/executive-presentation.pptx';
                  link.download = 'Tiranga-IDMS-Executive-Presentation.pptx';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success('Download started!');
                }}
                className="relative w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl font-bold text-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl group-hover:scale-105 flex items-center justify-center"
              >
                <Download className="w-6 h-6 mr-3" /> 
                Download PPT
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Role-based Dashboard */}
      <section id="login" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full mb-6 font-semibold text-sm shadow-lg">
              <UserCheck className="w-4 h-4 mr-2" /> Choose Your Portal
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-indigo-900 to-purple-900 bg-clip-text text-transparent">
              Access Your Dashboard
            </h2>
            <p className="text-xl max-w-4xl mx-auto text-gray-600 leading-relaxed">
              Experience role-specific tools, insights, and workflows designed precisely for your responsibilities 
              and organizational needs.
            </p>
          </div>
          
          {/* Enhanced Role Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Users, 
                role: 'System Admin', 
                desc: 'Complete system control with advanced configuration options',
                gradient: 'from-red-500 to-pink-600',
                features: ['User Management', 'System Config', 'Security Settings'],
                popular: false
              },
              { 
                icon: UserCheck, 
                role: 'Employee', 
                desc: 'Self-service portal with personal dashboard and tools',
                gradient: 'from-blue-500 to-indigo-600',
                features: ['Personal Dashboard', 'Leave Management', 'Performance Tracking'],
                popular: true
              },
              { 
                icon: Database, 
                role: 'Data Manager', 
                desc: 'Advanced analytics, reporting, and business intelligence',
                gradient: 'from-green-500 to-teal-600',
                features: ['Analytics Dashboard', 'Custom Reports', 'Data Insights'],
                popular: false
              },
              { 
                icon: Store, 
                role: 'Store Manager', 
                desc: 'Inventory control and operational excellence tools',
                gradient: 'from-orange-500 to-red-600',
                features: ['Inventory Control', 'Order Management', 'Stock Analytics'],
                popular: false
              },
              { 
                icon: UserCheck, 
                role: 'HR Manager', 
                desc: 'Comprehensive HR suite for talent management',
                gradient: 'from-purple-500 to-pink-600',
                features: ['Recruitment Tools', 'Employee Engagement', 'Performance Reviews'],
                popular: false
              },
              { 
                icon: DollarSign, 
                role: 'Finance Manager', 
                desc: 'Financial oversight with automated compliance tracking',
                gradient: 'from-yellow-500 to-orange-600',
                features: ['Budget Management', 'Expense Tracking', 'Financial Reports'],
                popular: false
              },
            ].map((role, index) => (
              <div
                key={index}
                className={`group relative bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border-2 h-full flex flex-col ${
                  role.popular 
                    ? 'border-indigo-200 ring-2 ring-indigo-100' 
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                {/* Popular Badge */}
                {role.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-sm font-bold shadow-lg">
                    Most Popular
                  </div>
                )}
                
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl`}></div>
                
                <div className={`relative w-20 h-20 mx-auto mb-6 bg-gradient-to-br ${role.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                  <role.icon className="w-10 h-10 text-white" />
                </div>
                
                <h3 className="relative text-2xl font-bold mb-4 text-gray-900 text-center">{role.role}</h3>
                <p className="relative text-gray-600 mb-6 leading-relaxed text-center flex-grow">{role.desc}</p>
                
                {/* Feature List */}
                <div className="relative space-y-3 mb-8">
                  {role.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => handleRoleLogin(role.role.toLowerCase().replace(' ', '-'))}
                  className={`relative w-full px-6 py-4 bg-gradient-to-r ${role.gradient} text-white rounded-2xl font-bold text-lg hover:shadow-lg transition-all duration-300 group-hover:scale-105 flex items-center justify-center`}
                >
                  Access {role.role.split(' ')[0]} Portal
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Professional Contact Section */}
      <section id="contact" className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white relative overflow-hidden">
        {/* Subtle Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse delay-500"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full mb-6 font-semibold text-sm border border-white/20">
              <Phone className="w-4 h-4 mr-2" /> Get In Touch
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-8">
              <span className="bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                Transform Your
              </span>
              <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Workplace Today
              </span>
            </h2>
            <p className="text-xl max-w-3xl mx-auto text-slate-300 leading-relaxed">
              Ready to revolutionize your HR operations? Our expert team is here to guide you through 
              every step of your digital transformation journey.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div className="space-y-8">
              <h3 className="text-3xl font-bold mb-8 text-white">Connect With Our Experts</h3>
              
              {/* Phone */}
              <div className="flex items-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center rounded-2xl mr-6 shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="font-bold text-xl text-white">Call Us Directly</div>
                  <div className="text-slate-300 text-lg font-semibold">+91 80489 05416</div>
                  <div className="text-sm text-slate-400">Available 9 AM - 6 PM IST</div>
                </div>
              </div>
              
              {/* Email */}
              <div className="flex items-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center rounded-2xl mr-6 shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="font-bold text-xl text-white">Email Support</div>
                  <div className="text-slate-300 text-lg">support@tirangaaerospace.com</div>
                  <div className="text-sm text-slate-400">Response within 2 hours</div>
                </div>
              </div>
              
              {/* Address */}
              <div className="flex items-start group hover:transform hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center rounded-2xl mr-6 shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="font-bold text-xl text-white">Visit Our Office</div>
                  <div className="text-slate-300 text-lg leading-relaxed">
                    1st Floor Hillside Meadows Layout,<br />
                    Adityanagar, Vidyaranyapura,<br />
                    Bengaluru - 560097
                  </div>
                  <div className="text-sm text-slate-400">Open Monday - Saturday</div>
                </div>
              </div>
            </div>
            
            {/* Professional Info Card */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 shadow-2xl hover:transform hover:scale-105 transition-all duration-500">
              <h3 className="text-3xl font-bold mb-8 text-center text-white">Why Choose Us?</h3>
              
              <div className="space-y-6 mb-8">
                {[
                  { icon: Clock, title: '24/7 Emergency Support', desc: 'Critical issues resolved immediately', color: 'from-blue-500 to-indigo-600' },
                  { icon: Shield, title: 'Data Security Guarantee', desc: 'Bank-grade security protocols', color: 'from-emerald-500 to-teal-600' },
                  { icon: Users, title: 'Dedicated Success Manager', desc: 'Personal guidance throughout', color: 'from-violet-500 to-purple-600' },
                  { icon: Award, title: '99.9% Uptime SLA', desc: 'Reliable service you can trust', color: 'from-amber-500 to-orange-600' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center group hover:transform hover:scale-105 transition-all duration-300">
                    <div className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{item.title}</div>
                      <div className="text-slate-300 text-sm">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-gradient-to-r from-blue-500/20 to-indigo-600/20 rounded-2xl p-6 border border-blue-400/30 hover:border-blue-300/50 transition-all duration-300">
                <div className="flex items-center mb-3">
                  <Sparkles className="w-6 h-6 text-blue-400 mr-3" />
                  <span className="font-bold text-blue-400 text-lg">Free 30-Day Trial</span>
                </div>
                <p className="text-slate-200 leading-relaxed mb-6">
                  Start your transformation journey with zero risk. Full access to all features 
                  with dedicated onboarding support.
                </p>
                
                <button
                  onClick={() => scrollToSection('login')}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center group"
                >
                  <Rocket className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                  Start Free Trial Now
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-900/20 to-purple-900/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 space-y-12">
          {/* Footer Top */}
          <div className="grid md:grid-cols-5 gap-12">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Tiranga IDMS
                  </div>
                  <div className="text-sm text-gray-400">Enterprise Solutions</div>
                </div>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Empowering organizations worldwide with cutting-edge HR technology and innovative 
                workplace management solutions for sustainable growth and success.
              </p>
              <div className="flex space-x-4">
                {[
                  { icon: Globe, link: 'https://tirangaaerospace.com', gradient: 'from-blue-500 to-indigo-600' },
                  { icon: Mail, link: 'mailto:support@tirangaaerospace.com', gradient: 'from-green-500 to-teal-600' },
                  { icon: Phone, link: 'tel:+918048905416', gradient: 'from-purple-500 to-pink-600' }
                ].map((social, index) => (
                  <a
                    key={index}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-12 h-12 bg-gradient-to-r ${social.gradient} rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-lg hover:shadow-xl`}
                  >
                    <social.icon className="w-5 h-5 text-white" />
                  </a>
                ))}
              </div>
            </div>
            
            {/* Solutions */}
            <div>
              <h4 className="text-xl font-bold mb-6 text-white flex items-center">
                <Zap className="w-5 h-5 mr-2 text-indigo-400" /> Solutions
              </h4>
              <ul className="space-y-4">
                {['Employee Management', 'Data Analytics', 'Operations Hub', 'HR Excellence', 'Finance Control', 'Security Suite'].map((item, index) => (
                  <li key={index} className="group cursor-pointer">
                    <div className="flex items-center text-gray-400 group-hover:text-white transition-colors duration-200">
                      <ChevronRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 group-hover:text-indigo-400 transition-all duration-200" />
                      <span>{item}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Company */}
            <div>
              <h4 className="text-xl font-bold mb-6 text-white flex items-center">
                <Building className="w-5 h-5 mr-2 text-purple-400" /> Company
              </h4>
              <ul className="space-y-4">
                {['About Us', 'Leadership Team', 'Careers', 'News & Events', 'Partner Program', 'Success Stories'].map((item, index) => (
                  <li key={index} className="group cursor-pointer">
                    <div className="flex items-center text-gray-400 group-hover:text-white transition-colors duration-200">
                      <ChevronRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 group-hover:text-purple-400 transition-all duration-200" />
                      <span>{item}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Support */}
            <div>
              <h4 className="text-xl font-bold mb-6 text-white flex items-center">
                <Shield className="w-5 h-5 mr-2 text-green-400" /> Support
              </h4>
              <ul className="space-y-4">
                {['Help Center', 'Documentation', 'API Reference', 'System Status', 'Training Hub', 'Community Forum'].map((item, index) => (
                  <li key={index} className="group cursor-pointer">
                    <div className="flex items-center text-gray-400 group-hover:text-white transition-colors duration-200">
                      <ChevronRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 group-hover:text-green-400 transition-all duration-200" />
                      <span>{item}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Footer Bottom */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-8">
                <p className="text-gray-400">© 2025 Tiranga IDMS. All rights reserved.</p>
                <div className="hidden md:flex items-center space-x-2 text-gray-500">
                  <Heart className="w-4 h-4 text-red-400" />
                  <span className="text-sm">Made with passion in India</span>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-end space-x-8 text-sm text-gray-400">
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR Compliance'].map((item, index) => (
                  <a key={index} href="#" className="hover:text-white transition-colors duration-200 hover:underline">
                    {item}
                  </a>
                ))}
              </div>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-8 pt-8 border-t border-gray-800/50">
              <div className="flex flex-wrap justify-center items-center space-x-12 text-gray-500">
                <div className="flex items-center space-x-2 hover:scale-105 transition-transform duration-300">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium">ISO 27001 Certified</span>
                </div>
                <div className="flex items-center space-x-2 hover:scale-105 transition-transform duration-300">
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium">GDPR Compliant</span>
                </div>
                <div className="flex items-center space-x-2 hover:scale-105 transition-transform duration-300">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-medium">SOC 2 Type II</span>
                </div>
                <div className="flex items-center space-x-2 hover:scale-105 transition-transform duration-300">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm font-medium">Global Infrastructure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Toast Notifications */}
      <Toaster position="top-right" />

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-right {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        
        .animate-fade-in-right {
          animation: fade-in-right 1s ease-out 0.3s forwards;
          opacity: 0;
        }
        
        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
        }
        
        .animate-slide-up.delay-200 {
          animation: slide-up 0.8s ease-out 0.2s forwards;
          opacity: 0;
        }
        
        .animate-slide-up.delay-400 {
          animation: slide-up 0.8s ease-out 0.4s forwards;
          opacity: 0;
        }
        
        .animate-slide-up.delay-600 {
          animation: slide-up 0.8s ease-out 0.6s forwards;
          opacity: 0;
        }
        
        .animate-slide-up.delay-800 {
          animation: slide-up 0.8s ease-out 0.8s forwards;
          opacity: 0;
        }
        
        .animate-slide-up.delay-1000 {
          animation: slide-up 0.8s ease-out 1s forwards;
          opacity: 0;
        }
        
        /* Smooth scroll behavior */
        html {
          scroll-behavior: smooth;
        }
        
        /* Custom gradient text animation */
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}