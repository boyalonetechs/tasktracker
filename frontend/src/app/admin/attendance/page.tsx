"use client";
import { useState, useEffect, useMemo } from "react";
import {
  LogOut,
  Menu,
  Users,
  CalendarCheck,
  Clock,
  Loader,
  Calendar,
  CheckCircle2,
  XCircle,
  History,
  Search,
  X,
} from "lucide-react";
import { api, logout, formatDate } from "@/lib/api";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";

export default function AdminAttendance() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("Admin");
  const [attDate, setAttDate] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historySearch, setHistorySearch] = useState("");
  const [historyDate, setHistoryDate] = useState("");
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
        if (data.staff_list) setEmployees(data.staff_list);
        if (data.name) {
          setDisplayName(data.name);
          localStorage.setItem("user_name", data.name);
        }
        if (!attDate && data.date) setAttDate(data.date);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (
          err.message?.includes("Authenticate") ||
          err.message?.includes("credentials")
        ) {
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
    const loadHistory = async () => {
      try {
        const data = await api.getAdminAttendanceHistory();
        if (data.records) setHistory(data.records);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (
          err.message?.includes("Authenticate") ||
          err.message?.includes("credentials")
        ) {
          router.push("/login");
        }
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
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

  const total = employees.length;
  const checkedIn = employees.filter(
    (e) => e.attendance?.time_of_arrival,
  ).length;
  const signedOut = employees.filter(
    (e) => e.attendance?.time_of_leave,
  ).length;
  const absent = employees.filter((e) => !e.attendance).length;

  const filteredHistory = history.filter((r) => {
    const q = historySearch.trim().toLowerCase();
    if (historyDate && (r.date || "") !== historyDate) return false;
    if (!q) return true;
    return (
      (r.Name || "").toLowerCase().includes(q) ||
      (r.day || "").toLowerCase().includes(q) ||
      (r.date || "").includes(q)
    );
  });

  const historyGroups = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groups = new Map<string, any[]>();
    for (const r of filteredHistory) {
      const key = r.date || "Unknown date";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }
    return Array.from(groups.entries()).sort(([a], [b]) =>
      a === "Unknown date"
        ? 1
        : b === "Unknown date"
          ? -1
          : a < b
            ? 1
            : a > b
              ? -1
              : 0,
    );
  }, [filteredHistory]);

  const shownHistory = historyDate || historySearch.trim()
    ? filteredHistory.length
    : history.length;

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
              <span className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all bg-[#F0F2F5] text-[#003A47]">
                <CalendarCheck className="w-4 h-4" />
                Attendance
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
                  Attendance
                </h1>
                <p className="text-xs text-gray-400 mt-0.5 max-sm:hidden">
                  Daily sign-in and sign-out for every employee.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pl-2">
              <div className="w-9 h-9 rounded-full bg-[#003A47] flex items-center justify-center text-xs font-bold text-white uppercase">
                {getInitials(displayName)}
              </div>
              <span className="text-sm font-semibold text-gray-800 max-sm:hidden">
                {displayName}
              </span>
            </div>
          </header>

          <main className="p-4 md:p-8 w-full max-w-[1400px] mx-auto space-y-6">
            <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 flex flex-wrap items-center gap-3 border-b border-gray-200">
                <div className="mr-auto flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#003A47]" />
                  <span className="text-base font-bold text-gray-900">
                    {attDate ? formatDate(attDate) : "-"}
                  </span>
                </div>

                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={attDate}
                    onChange={(e) => setAttDate(e.target.value)}
                    className="w-[155px] pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100 border-b border-gray-200">
                <div className="bg-white p-4 md:p-5">
                  <p className="text-[13px] font-medium text-gray-400">
                    Total Employees
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {total}
                  </p>
                </div>
                <div className="bg-white p-4 md:p-5">
                  <p className="text-[13px] font-medium text-gray-400">
                    Checked In
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {checkedIn}
                  </p>
                </div>
                <div className="bg-white p-4 md:p-5">
                  <p className="text-[13px] font-medium text-gray-400">
                    Signed Out
                  </p>
                  <p className="text-2xl font-bold text-[#003A47] mt-1">
                    {signedOut}
                  </p>
                </div>
                <div className="bg-white p-4 md:p-5">
                  <p className="text-[13px] font-medium text-gray-400">
                    Absent
                  </p>
                  <p className="text-2xl font-bold text-red-500 mt-1">
                    {absent}
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center text-gray-400 text-sm">
                  <Loader className="w-5 h-5 mx-auto animate-spin" />
                </div>
              ) : total === 0 ? (
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
                          <th className="py-3 px-6">Sign-in</th>
                          <th className="py-3 px-6">Sign-out</th>
                          <th className="py-3 px-6">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-600">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {employees.map((emp: any) => (
                          <tr
                            key={emp.id ?? emp.Name}
                            className="hover:bg-gray-50 transition-colors"
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
                                    {emp.dpt || "-"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-6 text-gray-700 font-semibold tabular-nums">
                              {emp.attendance?.time_of_arrival || "—"}
                            </td>
                            <td className="py-3.5 px-6 text-gray-700 font-semibold tabular-nums">
                              {emp.attendance?.time_of_leave || "—"}
                            </td>
                            <td className="py-3.5 px-6">
                              {emp.attendance ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5E9] text-[#4CAF50] text-[11px] font-bold uppercase px-2.5 py-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {emp.attendance.day || "Present"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 text-red-500 text-[11px] font-bold uppercase px-2.5 py-1">
                                  <XCircle className="w-3 h-3" />
                                  Absent
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden divide-y divide-gray-100">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {employees.map((emp: any) => (
                      <div key={emp.id ?? emp.Name} className="p-4 space-y-2">
                        <div className="flex items-center gap-3">
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
                              {emp.dpt || "-"}
                            </div>
                          </div>
                          {emp.attendance ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5E9] text-[#4CAF50] text-[10px] font-bold uppercase px-2 py-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              {emp.attendance.day || "Present"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-500 text-[10px] font-bold uppercase px-2 py-0.5">
                              <XCircle className="w-3 h-3" />
                              Absent
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          <div>
                            <span className="text-gray-400">Sign-in: </span>
                            <span className="text-gray-700 font-semibold">
                              {emp.attendance?.time_of_arrival || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Sign-out: </span>
                            <span className="text-gray-700 font-semibold">
                              {emp.attendance?.time_of_leave || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 flex flex-wrap items-center gap-3 border-b border-gray-200">
                <div className="mr-auto flex items-center gap-2">
                  <History className="w-4 h-4 text-[#003A47]" />
                  <span className="text-base font-bold text-gray-900">
                    Past attendance
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    {shownHistory} record
                    {shownHistory !== 1 && "s"}
                  </span>
                </div>

                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={historyDate}
                    onChange={(e) => setHistoryDate(e.target.value)}
                    className="w-[155px] pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47]"
                  />
                  {historyDate && (
                    <button
                      onClick={() => setHistoryDate("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Clear date"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search name, day..."
                    className="w-56 pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47]"
                  />
                </div>
              </div>

              {historyLoading ? (
                <div className="p-12 text-center text-gray-400 text-sm">
                  <Loader className="w-5 h-5 mx-auto animate-spin" />
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-sm">
                  {history.length === 0
                    ? "No attendance records yet."
                    : "No records match your search."}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {historyGroups.map(([day, dayRecords]) => (
                    <div key={day} className="px-6 md:px-8 py-6 space-y-4">
                      <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                        <Calendar className="w-4 h-4 text-[#003A47]" />
                        {day === "Unknown date" ? "No date" : formatDate(day)}
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          {dayRecords.length} record
                          {dayRecords.length !== 1 && "s"}
                        </span>
                      </h4>

                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-[#FAFBFB] text-gray-400 text-[11px] font-semibold uppercase tracking-wider border-b border-gray-200">
                              <th className="py-3 px-6">Employee</th>
                              <th className="py-3 px-6">Sign-in</th>
                              <th className="py-3 px-6">Sign-out</th>
                              <th className="py-3 px-6">Day</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-600">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {dayRecords.map((rec: any) => (
                              <tr
                                key={rec.id}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="py-3.5 px-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#003A47] flex items-center justify-center text-[11px] font-bold text-white uppercase overflow-hidden shrink-0">
                                      {rec.photo ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={rec.photo}
                                          alt={rec.Name || ""}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        getInitials(rec.Name)
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-gray-900 font-semibold truncate">
                                        {rec.Name}
                                      </div>
                                      <div className="text-gray-400 text-[11px] mt-0.5 truncate">
                                        {rec.dpt || "-"}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-6 text-gray-700 font-semibold tabular-nums">
                                  {rec.time_of_arrival || "—"}
                                </td>
                                <td className="py-3.5 px-6 text-gray-700 font-semibold tabular-nums">
                                  {rec.time_of_leave || "—"}
                                </td>
                                <td className="py-3.5 px-6">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5E9] text-[#4CAF50] text-[11px] font-bold uppercase px-2.5 py-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {rec.day || "Present"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="md:hidden divide-y divide-gray-100 border-t border-gray-100">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {dayRecords.map((rec: any) => (
                          <div key={rec.id} className="p-4 space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#003A47] flex items-center justify-center text-[11px] font-bold text-white uppercase overflow-hidden shrink-0">
                                {rec.photo ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={rec.photo}
                                    alt={rec.Name || ""}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  getInitials(rec.Name)
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-gray-900 truncate">
                                  {rec.Name}
                                </div>
                                <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                                  {rec.day || "-"} · {rec.dpt || "-"}
                                </div>
                              </div>
                              <span className="text-[11px] font-bold text-[#4CAF50] uppercase">
                                Present
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 text-xs">
                              <div>
                                <span className="text-gray-400">Sign-in: </span>
                                <span className="text-gray-700 font-semibold">
                                  {rec.time_of_arrival || "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">Sign-out: </span>
                                <span className="text-gray-700 font-semibold">
                                  {rec.time_of_leave || "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}