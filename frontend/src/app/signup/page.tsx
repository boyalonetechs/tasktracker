"use client";
import { useState, useEffect } from "react";
import { Eye, EyeOff, ChevronDown, Loader } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dept, setDept] = useState("DPHUB");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token =
      typeof window !== "undefined" && localStorage.getItem("auth_token");
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.signup({ name, email, password, dept });
      router.push("/login");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.log(err);
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#E1F5FE] px-4 sm:px-6 lg:px-8 font-sans py-8">
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center  justify-between gap-8 md:gap-16">
        <div className="w-full md:w-1/2 flex-col items-center justify-center text-center max-sm:hidden hidden md:flex">
          <div className="w-64 lg:fixed lg:top-50 h-auto mb-4">
            <Image
              src="/logo.jpg"
              width={1000}
              height={1000}
              alt="Leadpath Consulting Logo"
              className="w-full scale-220 h-auto object-contain"
            />
          </div>
        </div>

        <div className="hidden md:block w-[1px] h-96 bg-[#003A47]/40 self-center"></div>

        <div className="w-full md:w-[480px] bg-white rounded-md shadow-sm p-8 sm:p-10">
          <span className="block text-gray-900 text-lg font-medium mb-6">
            Task Tracker
          </span>

          <h2 className="text-[#003A47] text-xl font-semibold mb-1">
            Create an Account
          </h2>
          <p className="text-gray-500 text-xs mb-6">
            Sign up to continue with the task tracker.
          </p>

          {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Deo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47] text-sm text-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="emailaddress@gmail.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47] text-sm text-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Department
              </label>
              <div className="relative">
                <select
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47] pr-8 cursor-pointer"
                  required
                >
                  <option value="DPHUB">Digital Productivity Hub</option>
                  <option value="Business Department">
                    Business Development
                  </option>
                  <option value="Corporate Engagement">
                    Corporate Engagement
                  </option>
                  <option value="Social Ministry">Social Ministry</option>
                  <option value="Career Education And Counseling Commission">
                    Career Education And Counseling Commission (CECC)
                  </option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47] text-sm text-gray-700 tracking-widest"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="**********"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47] text-sm text-gray-700 tracking-widest"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
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
              className="w-full bg-[#003A47] text-white py-2.5 px-4 rounded-md font-medium text-sm hover:bg-[#002b35] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003A47] pt-3 mt-6 disabled:opacity-50"
            >
              {loading ? (
                <Loader className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="text-xs text-gray-600 text-left mt-4">
            Already has an account?{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-[#003A47] font-semibold hover:underline"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
