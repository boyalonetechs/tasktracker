"use client";
import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Loader } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' && localStorage.getItem('auth_token');
    if (token) {
      const isAdmin = localStorage.getItem('user_is_admin');
      router.replace(isAdmin === 'true' ? '/admin/dashboard' : '/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.adminLogin({ email, password });
      localStorage.setItem("user_role", "admin");
      localStorage.setItem("user_is_admin", "true");
      router.push("/admin/dashboard");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (adminErr: any) {
      if (adminErr.message && adminErr.message.toLowerCase().includes('no admin')) {
        try {
          const res = await api.login({ email, password });
          if (res.role) localStorage.setItem('user_role', res.role);
          if (res.dpt) localStorage.setItem('user_dept', res.dpt);
          localStorage.setItem('user_is_admin', 'false');
          router.push('/dashboard');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (staffErr: any) {
          setError(staffErr.message || "Login failed");
        }
      } else {
        setError(adminErr.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#E1F5FE] px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center text-center">
          <div className="w-64 h-auto mb-4">
            <Image
              src="/logo.jpg"
              width={1000}
              height={1000}
              alt="Leadpath Consulting Logo"
              className="w-full scale-180 h-auto object-contain"
            />
          </div>
        </div>

        <div className="hidden md:block w-[1px] h-64 bg-[#003A47]/40 self-center"></div>

        <div className="w-full md:w-[460px] bg-white rounded-md shadow-sm p-8 sm:p-10">
          <span className="block text-gray-900 text-lg font-medium mb-6">
            Task Tracker
          </span>

          <h2 className="text-[#003A47] text-xl font-semibold mb-1">
            Welcome Admin
          </h2>
          <p className="text-gray-500 text-xs mb-6">
            Monitor all task from one sign in.
          </p>

          {error && (
            <p className="text-red-500 text-xs mb-4">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="emailaddress@gmail.com"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47] text-sm text-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="**********"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47] text-sm text-gray-700 tracking-widest"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 stroke-[1.5]" />
                  ) : (
                    <Eye className="h-4 w-4 stroke-[1.5]" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#003A47] text-white py-3 px-4 rounded-md font-medium text-sm hover:bg-[#002b35] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003A47] mt-8 disabled:opacity-50"
            >
              {loading ? <Loader className="w-5 h-5 mx-auto animate-spin" /> : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
