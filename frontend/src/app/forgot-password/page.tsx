"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Loader } from "lucide-react";

export default function ForgotPassword() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setMessage("OTP sent to your email");
      setStep(2);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await api.verifyOTP(email, otp);
      setToken(res.token);
      setMessage("OTP verified");
      setStep(3);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await api.resetPassword(email, token, newPassword);
      setMessage("Password reset successfully");
      setTimeout(() => router.push("/login"), 1500);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#E1F5FE] px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
        <div className="w-full md:w-1/2 flex-col items-center justify-center text-center max-sm:hidden hidden md:flex">
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
            {step === 1 && "Forgot Password"}
            {step === 2 && "Verify OTP"}
            {step === 3 && "Reset Password"}
          </h2>
          <p className="text-gray-500 text-xs mb-6">
            {step === 1 && "Enter your email to receive a password reset code."}
            {step === 2 && "Enter the 6-digit code sent to your email."}
            {step === 3 && "Enter your new password."}
          </p>

          {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
          {message && <p className="text-green-600 text-xs mb-4">{message}</p>}

          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-4">
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
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#003A47] text-white py-3 px-4 rounded-md font-medium text-sm hover:bg-[#002b35] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003A47] mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  "Send OTP"
                )}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  OTP Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47] text-sm text-gray-700 text-center tracking-[8px]"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#003A47] text-white py-3 px-4 rounded-md font-medium text-sm hover:bg-[#002b35] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003A47] mt-2 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47] text-sm text-gray-700"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#003A47] text-white py-3 px-4 rounded-md font-medium text-sm hover:bg-[#002b35] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003A47] mt-2 disabled:opacity-50"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          <div className="text-xs text-gray-600 text-left mt-5">
            <a
              href="/login"
              className="text-[#003A47] font-semibold hover:underline"
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
