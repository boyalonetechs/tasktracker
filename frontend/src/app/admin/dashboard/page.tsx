"use client";
import { useState, useEffect } from "react";
import {
  Users,
  LogOut,
  ChevronRight,
  Menu,
  Search,
  Loader,
  Calendar,
  CalendarCheck,
  Settings,
} from "lucide-react";
import { api, logout, isAuthError } from "@/lib/api";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import FirstLoginModal from "@/components/FirstLoginModal";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("Admin");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [adminPhoto, setAdminPhoto] = useState<string | null>(null);
  const [attDate, setAttDate] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [accountSettings, setAccountSettings] = useState<any>(null);
  const [showFirstLogin, setShowFirstLogin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const savedName = localStorage.getItem("user_name");
        if (savedName) setDisplayName(savedName);
        const data = await api.getStaffList(
          attDate ? { date: attDate } : undefined,
        );
        if (data.staff_list) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sorted = [...data.staff_list].sort((a: any, b: any) => {
            const an = (a.Name || "").trim();
            const bn = (b.Name || "").trim();
            if (!an) return 1;
            if (!bn) return -1;
            return an.localeCompare(bn, undefined, { sensitivity: "base" });
          });
          setEmployees(sorted);
        }
        if (data.name) {
          setDisplayName(data.name);
          localStorage.setItem("user_name", data.name);
        }
        if (!attDate && data.date) setAttDate(data.date);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (isAuthError(err)) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attDate]);

  useEffect(() => {
    api
      .getAccountSettings()
      .then((res) => {
        setAccountSettings(res);
        if (res && res.settings_completed === false) {
          setShowFirstLogin(true);
        }
        if (res?.name) {
          setDisplayName(res.name);
          localStorage.setItem("user_name", res.name);
        }
        if (res?.photo) {
          setAdminPhoto(res.photo);
          localStorage.setItem("user_photo", res.photo);
        }
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .catch((err: any) => {
        if (isAuthError(err)) {
          router.push("/login");
        }
      });
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

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const filtered = employees.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (emp: any) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        (emp.Name || "").toLowerCase().includes(q) ||
        (emp.Email || "").toLowerCase().includes(q) ||
        (emp.dpt || "").toLowerCase().includes(q) ||
        (emp.role || "").toLowerCase().includes(q)
      );
    },
  );

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
              <span
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all bg-[#F0F2F5] text-[#003A47]`}
              >
                <Users className="w-4 h-4" />
                Employees
              </span>
              <button
                onClick={() => router.push("/admin/attendance")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all text-gray-500 hover:bg-gray-50"
              >
                <CalendarCheck className="w-4 h-4" />
                Attendance
              </button>
              <button
                onClick={() => router.push("/admin/settings")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all text-gray-500 hover:bg-gray-50"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
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
                  Employees
                </h1>
                <p className="text-xs text-gray-400 mt-0.5 max-sm:hidden">
                  Select an employee to view their task history.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pl-2">
              <div className="w-9 h-9 rounded-full bg-[#003A47] flex items-center justify-center text-xs font-bold text-white uppercase overflow-hidden">
                {adminPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={adminPhoto}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(displayName)
                )}
              </div>
              <span className="text-sm font-semibold text-gray-800 max-sm:hidden">
                {displayName}
              </span>
            </div>
          </header>

          <main className="p-4 md:p-8 w-full max-w-[1400px] mx-auto">
            <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 flex flex-wrap items-center gap-3 border-b border-gray-200">
                <div className="mr-auto">
                  <span className="text-base font-bold text-gray-900">
                    All Employees
                  </span>
                </div>
                <span className="mr-6 text-sm  font-semibold text-gray-500">
                  Total: {filtered.length}
                  {search.trim() && ` / ${employees.length}`}
                </span>

                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={attDate}
                    onChange={(e) => setAttDate(e.target.value)}
                    className="w-[155px] pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47]"
                  />
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, dept, role..."
                    className="w-56 pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47]"
                  />
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center text-gray-400 text-sm">
                  <Loader className="w-5 h-5 mx-auto animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-sm">
                  No employees found.
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#FAFBFB] text-gray-400 text-[11px] font-semibold uppercase tracking-wider border-b border-gray-200">
                          <th className="py-3 px-6">Employee</th>
                          <th className="py-3 px-6">Role</th>
                          <th className="py-3 px-6">Department</th>
                          <th className="py-3 px-6">
                            {" "}
                            <span className="hidden 2xl:inline">Check-</span> in
                          </th>
                          <th className="py-3 px-6">
                            <span className="hidden 2xl:inline">Check-</span>out
                          </th>
                          <th className="py-3 px-6 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-600">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {filtered.map((emp: any) => (
                          <tr
                            key={emp.id ?? emp.Name}
                            onClick={() =>
                              router.push(`/admin/dashboard/${emp.id}`)
                            }
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <td className="py-3.5 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#003A47] flex items-center justify-center text-[11px] font-bold text-white uppercase overflow-hidden shrink-0">
                                  {emp.photo ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={emp.photo}
                                      alt={emp.Name || ""}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    getInitials(emp.Name)
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-gray-900 font-semibold truncate">
                                    {emp.Name}
                                  </div>
                                  <div className="text-gray-400 text-[11px] mt-0.5 truncate">
                                    {emp.Email || "-"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-6 text-gray-500 capitalize">
                              {emp.role || "-"}
                            </td>
                            <td className="py-3.5 px-6 text-gray-500">
                              {emp.dpt || "-"}
                            </td>
                            <td className="py-3.5 px-6 text-gray-600 font-medium tabular-nums">
                              {emp.attendance?.time_of_arrival || "—"}
                            </td>
                            <td className="py-3.5 px-6 text-gray-600 font-medium tabular-nums">
                              {emp.attendance?.time_of_leave || "—"}
                            </td>
                            <td className="py-3.5 px-4 text-gray-300">
                              <ChevronRight className="w-4 h-4" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden divide-y divide-gray-100">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {filtered.map((emp: any) => (
                      <div
                        key={emp.id ?? emp.Name}
                        onClick={() =>
                          router.push(`/admin/dashboard/${emp.id}`)
                        }
                        className="p-4 flex items-center gap-3 cursor-pointer active:bg-gray-50"
                      >
                        <div className="w-9 h-9 rounded-full bg-[#003A47] flex items-center justify-center text-[11px] font-bold text-white uppercase overflow-hidden shrink-0">
                          {emp.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={emp.photo}
                              alt={emp.Name || ""}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getInitials(emp.Name)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {emp.Name}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                            {emp.role || "-"} · {emp.dpt || "-"}
                          </div>
                          {emp.attendance && (
                            <div className="text-[11px] text-gray-500 font-medium mt-1">
                              In {emp.attendance.time_of_arrival || "—"} · Out{" "}
                              {emp.attendance.time_of_leave || "—"}
                            </div>
                          )}
                        </div>
                        View{" "}
                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          </main>
        </div>
      </div>

      <FirstLoginModal
        open={showFirstLogin}
        kind="admin"
        initial={accountSettings}
        onComplete={(data) => {
          setShowFirstLogin(false);
          if (data.name) {
            setDisplayName(data.name);
            localStorage.setItem("user_name", data.name);
          }
          if (data.photo) {
            setAdminPhoto(data.photo);
            localStorage.setItem("user_photo", data.photo);
          }
        }}
      />
    </AuthGuard>
  );
}
