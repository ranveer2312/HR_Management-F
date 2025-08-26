"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { Mail, Lock, UserCog, Store, Users } from "lucide-react";

// Use NEXT_PUBLIC_API_URL if set, otherwise fallback to Render backend
// const APIURL =
//   process.env.NEXT_PUBLIC_API_URL || "https://hr-management-b.onrender.com";
const APIURL ="https://hr-management-b.onrender.com"
// ✅ Clear localStorage + remove authenticatedFetch
function clearAuthData() {
  localStorage.removeItem("token");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("roles");
  localStorage.removeItem("employeeId");
  localStorage.removeItem("employeeProfile");

  delete (
    window as unknown as {
      authenticatedFetch?: (url: string, options?: RequestInit) => Promise<Response>;
    }
  ).authenticatedFetch;
}

// ✅ Authenticated fetch wrapper
function createAuthenticatedFetch(token: string) {
  return async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(url, { ...options, headers });
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loginAsEmployee, setLoginAsEmployee] = useState(false);

  // ✅ Restore session if token exists
  useEffect(() => {
    const token = localStorage.getItem("token");
    const roles = localStorage.getItem("roles");
    if (token && roles) {
      (window as unknown as { authenticatedFetch?: any }).authenticatedFetch =
        createAuthenticatedFetch(token);
      redirectBasedOnRole(roles, loginAsEmployee);
    }
  }, []);

  // ✅ Role-based redirect
  const redirectBasedOnRole = (roles: string, asEmployee: boolean) => {
    const roleList = roles.split(",");
    if (roleList.includes("ADMIN")) router.replace("/admin");
    else if (roleList.includes("STORE")) router.replace("/store");
    else if (roleList.includes("HR")) router.replace("/hr");
    else if (roleList.includes("USER")) router.replace("/user");
    else if (asEmployee) router.replace("/employee");
    else router.replace("/dashboard");
  };

  // ✅ Validate inputs
  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Enter a valid email";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "At least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Handle login request
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const apiUrl = `${APIURL}${loginAsEmployee ? "/api/employees/login" : "/api/auth/login"}`;
      console.log("Making request to:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (!response.ok) {
        toast.error(data.message || "Login failed. Please check credentials.");
        clearAuthData();
        return;
      }

      // ✅ Employee login
      if (loginAsEmployee) {
        if (!data.id || !data.email) {
          toast.error("Invalid employee data received");
          return;
        }
        localStorage.setItem("token", data.token || "");
        localStorage.setItem("employeeId", data.id.toString());
        localStorage.setItem("userEmail", data.email);
        if (data.profile) {
          localStorage.setItem("employeeProfile", JSON.stringify(data.profile));
        }
        (window as any).authenticatedFetch = createAuthenticatedFetch(data.token || "");
        toast.success("Employee login successful!");
        router.replace("/employee");
        return;
      }

      // ✅ Normal user login
      if (!data.token || !data.roles) {
        toast.error("Invalid response from server");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", data.email);
      localStorage.setItem("roles", data.roles);

      (window as any).authenticatedFetch = createAuthenticatedFetch(data.token);
      toast.success("Login successful!");
      redirectBasedOnRole(data.roles, false);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Toaster position="top-center" />
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <UserCog className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Login to HRMS</h1>
          <p className="text-gray-500">Access your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your email"
              />
            </div>
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your password"
              />
            </div>
            {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
          </div>

          {/* Employee Login Toggle */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="loginAsEmployee"
              checked={loginAsEmployee}
              onChange={(e) => setLoginAsEmployee(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label htmlFor="loginAsEmployee" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span>Login as Employee</span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
// ✅ UI