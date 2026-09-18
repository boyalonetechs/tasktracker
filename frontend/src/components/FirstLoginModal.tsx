"use client";
import { useState, useEffect, useMemo } from "react";
import { Camera, Loader, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

type SettingsData = {
  settings_completed: boolean;
  kind: "staff" | "admin";
  name?: string;
  email?: string;
  photo?: string;
};

export default function FirstLoginModal({
  open,
  initial,
  onComplete,
}: {
  open: boolean;
  kind: "staff" | "admin";
  initial?: SettingsData | null;
  onComplete: (data: SettingsData) => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const getInitials = (n?: string) => {
    if (!n) return "?";
    return n
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setError("");
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      let res = await api.getAccountSettings();
      if (selectedFile) {
        const up = await api.uploadProfilePhoto(selectedFile);
        res = {
          ...res,
          photo: up?.photo || res?.photo || initial?.photo || null,
          settings_completed: res?.settings_completed ?? false,
        };
      } else {
        res = {
          ...res,
          photo: res?.photo || initial?.photo || null,
          settings_completed: res?.settings_completed ?? false,
        };
      }
      res = await api.completeSettings({});
      onComplete(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const displayUrl = previewUrl || initial?.photo;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4 sm:px-6 overflow-y-auto py-10">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <div className="flex items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#003A47] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
                Add a profile picture
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                One photo lets your team recognize you.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-7">
          {error && (
            <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-[#003A47] flex items-center justify-center text-3xl font-bold text-white uppercase overflow-hidden">
                {displayUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={displayUrl}
                    alt={initial?.name || "Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(initial?.name)
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
            <p className="text-xs text-gray-400 text-center max-w-[240px]">
              {selectedFile
                ? "New photo selected — Continue to apply it."
                : "Click the camera to upload your profile picture."}
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#003A47] text-white py-3 px-4 rounded-lg font-medium text-sm hover:bg-[#002b35] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003A47] tracking-wide disabled:opacity-50"
          >
            {saving ? (
              <Loader className="w-5 h-5 mx-auto animate-spin" />
            ) : (
              "Continue"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}