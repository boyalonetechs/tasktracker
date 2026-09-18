"use client";
import { useState, useEffect, useMemo } from "react";
import { Camera, Loader } from "lucide-react";
import { api, isAuthError } from "@/lib/api";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import EmployeeShell from "@/components/EmployeeShell";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileDept, setProfileDept] = useState("");
  const [profileRole, setProfileRole] = useState("");
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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const savedName =
          typeof window !== "undefined"
            ? localStorage.getItem("user_name")
            : null;
        if (savedName && !profileName) setProfileName(savedName);
        const res = await api.getProfile();
        setProfileName(res.name || savedName || "");
        setProfileEmail(res.email || "");
        setProfileDept(res.dept || "");
        setProfileRole(res.role || "");
        setPhoto(res.photo || null);
        localStorage.setItem("user_photo", res.photo || "");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (isAuthError(err)) {
          router.push("/login");
        } else {
          setError(err.message || "Failed to load your profile.");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase();
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
        newPhoto = up.photo;
      }
      const res = await api.updateProfile({
        name: profileName,
        email: profileEmail,
        dept: profileDept,
        role: profileRole,
      });
      if (res.photo) newPhoto = res.photo;
      setPhoto(newPhoto);
      setSelectedFile(null);
      if (newPhoto) localStorage.setItem("user_photo", newPhoto);
      if (res.name) {
        setProfileName(res.name);
        localStorage.setItem("user_name", res.name);
      }
      if (res.email) localStorage.setItem("user_email", res.email);
      if (res.dept) localStorage.setItem("user_dept", res.dept);
      if (res.role) localStorage.setItem("user_role", res.role);
      setMessage("Profile saved.");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const displayUrl = previewUrl || photo;

  return (
    <AuthGuard>
      <EmployeeShell
        activeView="settings"
        mainClassName="max-w-[720px]"
        header={
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              Settings
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 max-sm:hidden">
              Manage your profile and profile picture.
            </p>
          </div>
        }
      >
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
            <Loader className="animate-spin mx-auto mb-2" />
          </div>
        ) : (
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 md:px-10 py-10 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="relative shrink-0 self-start">
                  <div className="w-24 h-24 rounded-full bg-[#003A47] flex items-center justify-center text-2xl font-bold text-white uppercase overflow-hidden">
                    {displayUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={displayUrl}
                        alt={profileName || "Profile"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(profileName)
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center cursor-pointer hover:border-[#003A47] hover:text-[#003A47] text-gray-500 transition-colors shadow-sm">
                    <Camera className="w-4 h-4" strokeWidth={1.8} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
                    {profileName || "Your profile"}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedFile
                      ? "New photo selected — click Save Changes to apply it."
                      : "Click the camera to change your profile picture."}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="p-6 md:p-10 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2 flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47] bg-white"
                    required
                  />
                </div>

                <div className="sm:col-span-2 flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47] bg-white"
                  />
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Department
                  </label>
                  <input
                    type="text"
                    value={profileDept}
                    onChange={(e) => setProfileDept(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47] bg-white"
                  />
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Role
                  </label>
                  <input
                    type="text"
                    value={profileRole}
                    onChange={(e) => setProfileRole(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47] bg-white"
                  />
                </div>
              </div>

              {message && (
                <p className="text-xs font-medium text-emerald-700">{message}</p>
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
                  {saving ? <Loader className="animate-spin mx-auto" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </section>
        )}
      </EmployeeShell>
    </AuthGuard>
  );
}