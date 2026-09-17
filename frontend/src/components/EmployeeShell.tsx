"use client";
import { useState, useEffect, ReactNode } from "react";
import {
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { api, logout } from "@/lib/api";

interface EmployeeShellProps {
  activeView: string;
  onNavigate?: (view: string) => void;
  header?: ReactNode;
  mainClassName?: string;
  children: ReactNode;
}

const navItems = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { view: "tasks", label: "Tasks", icon: ListTodo },
  { view: "settings", label: "Settings", icon: Settings },
];

export default function EmployeeShell({
  activeView,
  onNavigate,
  header,
  mainClassName = "max-w-[1400px]",
  children,
}: EmployeeShellProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const storedName =
      typeof window !== "undefined" ? localStorage.getItem("user_name") : null;
    const storedPhoto =
      typeof window !== "undefined" ? localStorage.getItem("user_photo") : null;
    Promise.resolve()
      .then(() => {
        if (cancelled) return;
        if (storedName) setUserName(storedName);
        if (storedPhoto) setUserPhoto(storedPhoto);
      })
      .then(() => api.getProfile())
      .then((res) => {
        if (cancelled) return;
        if (res.name) setUserName(res.name);
        if (res.photo) setUserPhoto(res.photo);
        localStorage.setItem("user_name", res.name || userName);
        localStorage.setItem("user_photo", res.photo || "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleNavigate = (view: string) => {
    setSidebarOpen(false);
    if (onNavigate) {
      onNavigate(view);
    } else {
      router.push(view === "settings" ? "/dashboard/settings" : "/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex font-sans antialiased text-gray-800">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`w-64 bg-white border-r border-gray-100 flex flex-col justify-between fixed h-full z-[90] lg:z-20 transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => handleNavigate(item.view)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                  activeView === item.view
                    ? "bg-[#F0F2F5] text-[#003A47]"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-50">
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
        <header className="bg-white h-20 border-b border-gray-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-[40] lg:z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-5 h-5" />
            </button>
            {header}
          </div>

          <button
            onClick={() => router.push("/dashboard/settings")}
            className="flex items-center gap-2.5 pl-2 max-sm:hidden"
          >
            <div className="w-9 h-9 rounded-full bg-[#003A47] flex items-center justify-center text-xs font-bold text-white uppercase overflow-hidden">
              {userPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userPhoto}
                  alt={userName || "Profile"}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(userName)
              )}
            </div>
            <span className="text-sm font-semibold text-gray-800">
              {userName}
            </span>
          </button>
        </header>

        <main
          className={`p-4 md:p-8 space-y-6 w-full mx-auto ${mainClassName}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}