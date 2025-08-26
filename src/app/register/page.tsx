'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { APIURL } from '@/constants/api';


interface RegisterFormData {
  username: string;
  password: string;
  fullName: string;
  email: string;
  roles: string[];
}


export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    password: '',
    fullName: '',
    email: '',
    roles: [] // Remove default role
  });
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<RegisterFormData & { password: string; username: string; fullName: string; email: string }>>({});


  const availableRoles = [
    'ADMIN',
    'STORE',
    'FINANCE',
    'HR',
    'DATA_MANAGER',
   
  ];


  const handleRoleChange = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role]
    }));
  };


  // Username validation
  function validateUsername(username: string): string | undefined {
    if (username.length < 3) return 'Username must be at least 3 characters.';
    if (username.length > 30) return 'Username must be at most 30 characters.';
    if (!/^[a-zA-Z]+$/.test(username)) return 'Username can only contain letters (no numbers or special characters).';
    return undefined;
  }


  // Full Name validation
  function validateFullName(fullName: string): string | undefined {
    if (fullName.length < 3) return 'Full Name must be at least 3 characters.';
    if (fullName.length > 30) return 'Full Name must be at most 30 characters.';
    if (!/^[a-zA-Z ]+$/.test(fullName)) return 'Full Name can only contain letters and spaces.';
    return undefined;
  }


  // Email validation
  function validateEmail(email: string): string | undefined {
    if (email.length < 6) return 'Email must be at least 6 characters.';
    if (email.length > 100) return 'Email must be at most 100 characters.';
    // Optionally, add a regex for email format
    return undefined;
  }


  // Password validation (at least 8 chars, with upper, lower, number, special)
  function validatePassword(password: string): string | undefined {
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character.';
    return undefined;
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormErrors({});


    // Validate all fields
    const usernameError = validateUsername(formData.username);
    const fullNameError = validateFullName(formData.fullName);
    const emailError = validateEmail(formData.email);
    const pwdError = validatePassword(formData.password);


    const errors: Partial<RegisterFormData & { password: string; username: string; fullName: string; email: string }> = {};
    if (usernameError) errors.username = usernameError;
    if (fullNameError) errors.fullName = fullNameError;
    if (emailError) errors.email = emailError;
    if (pwdError) errors.password = pwdError;


    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setLoading(false);
      toast.error(Object.values(errors)[0] as string);
      return;
    }


    // Validate that at least one role is selected
    if (formData.roles.length === 0) {
      toast.error('Please select at least one role');
      setLoading(false);
      return;
    }


    try {
      const response = await fetch(APIURL +'/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });


      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (response.status === 400) {
          toast.error('Invalid registration data. Please check your information.');
        } else if (response.status === 409) {
          toast.error('Username or email already exists. Please use a different username or email.');
          setFormErrors((prev) => ({ ...prev, username: 'Username or email already exists.' }));
        } else if (response.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else {
          toast.error('Registration failed. Please try again.');
        }
        setLoading(false);
        return;
      }


      const data = await response.json();


      if (response.ok) {
        toast.success('Account created successfully! Please log in.');
        router.push('/login');
      } else {
        const errorMessage = data.message || 'Registration failed. Please try again.';
        toast.error(errorMessage);
        if (errorMessage.toLowerCase().includes('username')) {
          setFormErrors((prev) => ({ ...prev, username: errorMessage }));
        }
        if (errorMessage.toLowerCase().includes('email')) {
          setFormErrors((prev) => ({ ...prev, email: errorMessage }));
        }
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else if (err instanceof SyntaxError) {
        toast.error('Invalid response from server. Please try again.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/login" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Login
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
      </div>


      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Username"
              required
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z]+"
              value={formData.username}
              onChange={(e) => {
                setFormData({ ...formData, username: e.target.value });
                const error = validateUsername(e.target.value);
                setFormErrors((prev) => ({ ...prev, username: error }));
              }}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {formErrors.username && (
              <p className="text-red-600 text-xs mt-1">{formErrors.username}</p>
            )}


            <input
              type="text"
              placeholder="Full Name"
              required
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z ]+"
              value={formData.fullName}
              onChange={(e) => {
                setFormData({ ...formData, fullName: e.target.value });
                const error = validateFullName(e.target.value);
                setFormErrors((prev) => ({ ...prev, fullName: error }));
              }}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {formErrors.fullName && (
              <p className="text-red-600 text-xs mt-1">{formErrors.fullName}</p>
            )}


            <input
              type="email"
              placeholder="Email"
              required
              minLength={6}
              maxLength={100}
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                const error = validateEmail(e.target.value);
                setFormErrors((prev) => ({ ...prev, email: error }));
              }}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {formErrors.email && (
              <p className="text-red-600 text-xs mt-1">{formErrors.email}</p>
            )}


            <input
              type="password"
              placeholder="Password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                const pwdErr = validatePassword(e.target.value);
                setPasswordError(pwdErr === undefined ? null : pwdErr);
                const error = validatePassword(e.target.value);
                setFormErrors((prev) => ({ ...prev, password: error }));
              }}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {(formErrors.password || passwordError) && (
              <p className="text-red-600 text-xs mt-1">{formErrors.password || passwordError}</p>
            )}


            <fieldset>
              <legend className="text-sm font-medium text-gray-700 mb-2">Select Roles</legend>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {availableRoles.map((role) => (
                  <label key={role} className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      value={role}
                      checked={formData.roles.includes(role)}
                      onChange={() => handleRoleChange(role)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{role.replace('ROLE_', '')}</span>
                  </label>
                ))}
              </div>
            </fieldset>


            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account? {' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}




