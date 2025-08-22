'use client';
 
import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

// Updated API URL - you can also create a separate constants file
const APIURL = process.env.NEXT_PUBLIC_API_URL || 'https://hr-management-b.onrender.com';

interface FormData {
  email: string;
  password: string;
}
 
interface LoginResponse {
  email: string;
  roles: string[];
  token: string;
  employeeId?: string | null;
  employeeName?: string | null;
  department?: string | null;
  position?: string | null;
  status?: string | null;
  message?: string;
}
 
export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<FormData>>({});
  const [loginAsEmployee, setLoginAsEmployee] = useState(false);
 
  const redirectBasedOnRole = (roles: string[]) => {
    if (roles.includes('ADMIN')) {
      router.replace('/admin');
    } else if (roles.includes('STORE')) {
      router.replace('/store');
    } else if (roles.includes('FINANCE')) {
      router.replace('/finance-manager/dashboard');
    } else if (roles.includes('HR')) {
      router.replace('/hr');
    } else if (roles.includes('DATAMANAGER')) {
      router.replace('/data-manager');
    } else {
      router.replace('/dashboard');
    }
  };

  // Utility function to create authenticated fetch requests
  const createAuthenticatedFetch = (token: string) => {
    return (url: string, options: RequestInit = {}) => {
      return fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });
    };
  };

  // Store token and set up global fetch interceptor
  const storeAuthData = (loginData: LoginResponse) => {
    // Store in localStorage
    localStorage.setItem('token', loginData.token);
    localStorage.setItem('userEmail', loginData.email);
    localStorage.setItem('roles', JSON.stringify(loginData.roles));
    
    // Store employee data if available
    if (loginData.employeeId) {
      localStorage.setItem('employeeId', loginData.employeeId);
      localStorage.setItem('employeeProfile', JSON.stringify(loginData));
    }
    
    // Set token state
    (window as unknown as { authenticatedFetch?: (url: string, options?: RequestInit) => Promise<Response> }).authenticatedFetch = createAuthenticatedFetch(loginData.token);
  };
 
  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {};
   
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      errors.email = 'Invalid email address';
    }
 
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
 
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
 
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setValidationErrors(prev => ({
      ...prev,
      [name]: undefined
    }));
  };
 
  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }
 
    setLoading(true);
 
    try {
      const apiUrl = loginAsEmployee
        ?  APIURL + '/api/employees/login'
        : APIURL + '/api/auth/login';
        
      console.log('Making request to:', apiUrl); // Debug log to verify URL
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
 
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Handle non-JSON response (like HTML error pages)
        if (response.status === 401) {
          toast.error('Invalid email or password. Please check your credentials.');
        } else if (response.status === 404) {
          toast.error('Login service not found. Please contact support.');
        } else if (response.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else {
          toast.error('Login failed. Please check your credentials and try again.');
        }
        return;
      }
 
      const data: LoginResponse = await response.json();
 
      if (response.ok) {
        // Store authentication data and set up authenticated requests
        storeAuthData(data);
       
        // Show success message
        toast.success('Login successful!');
       
        // If employee login and has employee data, redirect to employee page
        if (loginAsEmployee && data.employeeId) {
          console.log('Logged in employeeId:', data.employeeId);
          router.replace('/employee');
          return;
        }
        
        // Redirect based on role
        redirectBasedOnRole(data.roles);
      } else {
        // Handle API error responses
        const errorMessage = data.message || 'Login failed. Please check your credentials.';
        toast.error(errorMessage);
       
        // Clear any existing tokens on failed login
        clearAuthData();
      }
    } catch (e: Error | unknown) {
      // Handle network errors and other exceptions
      console.error('Login error:', e); // Debug log
      
      if (e instanceof TypeError && e.message.includes('fetch')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else if (e instanceof SyntaxError) {
        toast.error('Invalid response from server. Please try again.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
     
      // Clear any existing tokens on error
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('roles');
    localStorage.removeItem('employeeId');
    localStorage.removeItem('employeeProfile');
    delete (window as unknown as { authenticatedFetch?: (url: string, options?: RequestInit) => Promise<Response> }).authenticatedFetch;
  };

  // On mount, check if token exists in localStorage
  React.useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      (window as unknown as { authenticatedFetch?: (url: string, options?: RequestInit) => Promise<Response> }).authenticatedFetch = createAuthenticatedFetch(storedToken);
    }
  }, []);
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-8 left-1/3 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#f9fafb',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f9fafb',
            },
          },
        }}
      />
      
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
        {/* Subtle border glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 blur-sm -z-10"></div>
        
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/25">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
            Welcome Back
          </h1>
          <p className="text-gray-600 font-medium">Sign in to continue to your dashboard</p>
        </div>
 
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Email Address
            </label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full pl-12 pr-4 py-4 bg-gray-50/50 border ${
                  validationErrors.email 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                } rounded-xl focus:ring-4 transition-all duration-200 text-gray-900 placeholder-gray-500 font-medium`}
                placeholder="Enter your email address"
                required
              />
            </div>
            {validationErrors.email && (
              <p className="text-sm text-red-600 font-medium flex items-center gap-1 mt-2">
                <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                {validationErrors.email}
              </p>
            )}
          </div>
 
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full pl-12 pr-12 py-4 bg-gray-50/50 border ${
                  validationErrors.password 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                } rounded-xl focus:ring-4 transition-all duration-200 text-gray-900 placeholder-gray-500 font-medium`}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {validationErrors.password && (
              <p className="text-sm text-red-600 font-medium flex items-center gap-1 mt-2">
                <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                {validationErrors.password}
              </p>
            )}
            {/* Only show Forgot Password link when NOT logging in as employee */}
            {!loginAsEmployee && (
              <div className="flex justify-end mt-3">
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold hover:underline transition-colors duration-200"
                >
                  Forgot Password?
                </Link>
              </div>
            )}
          </div>
 
          {/* Login as Employee Checkbox */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
            <input
              id="loginAsEmployee"
              type="checkbox"
              checked={loginAsEmployee}
              onChange={() => setLoginAsEmployee(v => !v)}
              className="h-5 w-5 text-indigo-600 border-2 border-gray-300 rounded-md focus:ring-indigo-500 focus:ring-2 focus:ring-offset-0"
            />
            <label htmlFor="loginAsEmployee" className="text-sm font-semibold text-gray-700 cursor-pointer">
              Login as Employee
            </label>
          </div>
 
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg transform hover:-translate-y-0.5"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Signing In...</span>
              </div>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </div>
 
        <div className="mt-8 text-center">
          <p className="text-gray-600 font-medium">
            Don&apos;t have an account?{' '}
            <Link 
              href="/register" 
              className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline transition-colors duration-200"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}