"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Users,
  LogOut,
  Menu,
  Loader,
  CalendarCheck,
  Settings,
  Camera,
} from "lucide-react";
import { api, logout, isAuthError } from "@/lib/api";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";

export default function AdminSettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  );
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const getInitials = (n?: string) => {
    if (!n) return "?";
    return n
      .split(" ")
      .map((p: string) => p[0])
      .join("")
      .toUpperCase();
  };

  useEffect(() => {
    api
      .getAccountSettings()
      .then((res) => {
        if (res?.name) {
          setName(res.name);
          localStorage.setItem("user_name", res.name);
        }
        if (res?.email) setEmail(res.email);
        if (res?.photo) setPhoto(res.photo);
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .catch((err: any) => {
        if (isAuthError(err)) {
          router.push("/login");
        } else {
          setError(err.message || "Failed to load your settings.");
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setMessage("");
    setError("");
    e.target.value = "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      let newPhoto = photo;
      if (selectedFile) {
        const up = await api.uploadProfilePhoto(selectedFile);
        newPhoto = up.photo || newPhoto;
      }
      const body: { name: string; email: string; password?: string } = {
        name,
        email,
      };
      if (password) body.password = password;
      const res = await api.completeSettings(body);
      if (res?.name) {
        setName(res.name);
        localStorage.setItem("user_name", res.name);
      }
      if (newPhoto) {
        setPhoto(newPhoto);
        localStorage.setItem("user_photo", newPhoto);
      }
      setSelectedFile(null);
      setPassword("");
      setMessage("Settings saved.");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F8F9FA] flex font-sans antialiased text-gray-800">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`w-64 bg-white border-r border-gray-200 flex flex-col justify-between fixed h-full z-[90] lg:z-20 transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0`}
        >
          <div>
            <div className="p-6 flex items-center gap-3 border-b border-gray-200">
              <img
                src="/logo.jpg"
                alt="Leadpath"
                className="w-8 h-8 object-contain rounded"
              />
              <div className="flex flex-col">
                <span className="text-[#003A47] font-bold text-sm tracking-wider leading-tight">
                  Leadpath
                </span>
                <span className="text-gray-400 text-[11px] font-medium tracking-tight">
                  Task Tracker
                </span>
              </div>
            </div>

            <nav className="p-4 space-y-1.5">
              <button
                onClick={() => router.push("/admin/dashboard")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all text-gray-500 hover:bg-gray-50"
              >
                <Users className="w-4 h-4" />
                Employees
              </button>
              <button
                onClick={() => router.push("/admin/attendance")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all text-gray-500 hover:bg-gray-50"
              >
                <CalendarCheck className="w-4 h-4" />
                Attendance
              </button>
              <span className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all bg-[#F0F2F5] text-[#003A47]">
                <Settings className="w-4 h-4" />
                Settings
              </span>
            </nav>
          </div>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-600 rounded-lg font-medium text-sm transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </aside>

        <div className="flex-1 md:pl-64 flex flex-col">
          <header className="bg-white h-20 border-b border-gray-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-[100] lg:z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">
                  Settings
                </h1>
                <p className="text-xs text-gray-400 mt-0.5 max-sm:hidden">
                  Manage your admin profile, email and password.
                </p>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-8">
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
                <Loader className="animate-spin mx-auto mb-2" />
              </div>
            ) : (
              <section className="max-w-xl bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 md:px-10 py-8 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="relative shrink-0 self-start">
                      <div className="w-20 h-20 rounded-full bg-[#003A47] flex items-center justify-center text-xl font-bold text-white uppercase overflow-hidden">
                        {previewUrl || photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewUrl || photo || ""}
                            alt={name || "Profile"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(name)
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center cursor-pointer hover:border-[#003A47] hover:text-[#003A47] text-gray-500 transition-colors shadow-sm">
                        <Camera className="w-3.5 h-3.5" strokeWidth={1.8} />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-gray-900 tracking-tight leading-tight">
                        {name || "Admin profile"}
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {selectedFile
                          ? "New photo selected — click Save Changes to apply it."
                          : "Click the camera to change your profile picture."}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSave} className="p-6 md:p-10 space-y-5">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47] bg-white"
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47] bg-white"
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      New password{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave empty to keep your current password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47] bg-white"
                    />
                  </div>

                  {message && (
                    <p className="text-xs font-medium text-emerald-700">
                      {message}
                    </p>
                  )}
                  {error && (
                    <p className="text-xs font-medium text-red-600">{error}</p>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-[#003A47] text-white py-3 px-6 rounded-lg font-medium text-sm hover:bg-[#002b35] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003A47] disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader className="animate-spin mx-auto" />
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </form>
              </section>
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
