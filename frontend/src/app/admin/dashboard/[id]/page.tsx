"use client";
import { useState, useEffect, use, useMemo } from "react";
import {
  LogOut,
  ChevronLeft,
  Menu,
  Circle,
  Check,
  CheckCircle2,
  Clock,
  Search,
  X,
  Calendar,
  CalendarCheck,
  Loader,
  Settings,
} from "lucide-react";
import { api, logout, formatDate, isAuthError } from "@/lib/api";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";

interface Staff {
  id: number;
  Name: string;
  Email: string;
  dpt: string;
  role: string;
  photo?: string | null;
  auth_created_at: string | null;
  auth_expire_at: string | null;
}

interface Task {
  id: number;
  task: string;
  description: string;
  date: string;
  status: string;
  completion_date: string | null;
  progress: string | null;
  subtasks?: {
    id: number;
    number: number | null;
    task: string;
    description: string;
    status: string;
    progress: string | null;
    completion_date: string | null;
  }[];
}

export default function StaffProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [displayName, setDisplayName] = useState("Admin");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [adminPhoto, setAdminPhoto] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const savedName = localStorage.getItem("user_name");
        if (savedName) setDisplayName(savedName);
        const data = await api.getStaffDetail(Number(id));
        setStaff(data.staff);
        setTasks(data.tasks || []);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (isAuthError(err)) {
          router.push("/login");
          return;
        }
        setError(err.message || "Failed to load employee profile.");
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    api
      .getAccountSettings()
      .then((res) => {
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

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (t) => t.status === "Completed" || t.status === "completed",
  ).length;
  const inProgressTasks = totalTasks - completedTasks;

  const filteredTasks = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return tasks.filter((t) => {
      const matchesSearch =
        !q ||
        (t.task || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q);
      const matchesDate = !dateFilter || (t.date || "").startsWith(dateFilter);
      return matchesSearch && matchesDate;
    });
  }, [tasks, searchTerm, dateFilter]);

  const taskGroups = useMemo(() => {
    const groups = new Map<string, Task[]>();
    const sorted = [...filteredTasks].sort((a, b) => b.id - a.id);
    for (const t of sorted) {
      const key = t.date || "Unknown date";
      if (!groups.has(key)) groups.set(key, []);
      (groups.get(key) as Task[]).push(t);
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
  }, [filteredTasks]);

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
                onClick={() => {
                  router.push("/admin/dashboard");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all text-gray-500 hover:bg-gray-50`}
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Employees
              </button>
              <button
                onClick={() => {
                  router.push("/admin/attendance");
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all text-gray-500 hover:bg-gray-50"
              >
                <CalendarCheck className="w-4 h-4" />
                Attendance
              </button>
              <button
                onClick={() => {
                  router.push("/admin/settings");
                  setSidebarOpen(false);
                }}
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
              <button
                onClick={() => router.push("/admin/dashboard")}
                className="hidden md:flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-[#003A47] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Employees
              </button>
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

          <main className="p-4 md:p-8 w-full max-w-[1200px] mx-auto space-y-8">
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
                <Loader className="w-5 h-5 mx-auto animate-spin animate-pulse" />
              </div>
            ) : error ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-red-500 text-sm">
                {error}
              </div>
            ) : staff ? (
              <>
                {/* Profile Header */}
                <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 md:px-8 py-8">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                      <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-[#003A47] flex items-center justify-center text-3xl md:text-4xl font-bold text-white uppercase overflow-hidden shrink-0">
                        {staff.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={staff.photo}
                            alt={staff.Name || "Profile"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(staff.Name)
                        )}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                          {staff.Name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-[13px]">
                          {staff.role && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md border border-gray-200 bg-gray-50 font-semibold text-gray-700 capitalize">
                              {staff.role}
                            </span>
                          )}
                          {staff.dpt && (
                            <span className="text-gray-400">{staff.dpt}</span>
                          )}
                          {staff.dpt && staff.Email && (
                            <span className="text-gray-300 hidden">·</span>
                          )}
                          {staff.Email && (
                            <span className="text-gray-400 hidden">
                              {staff.Email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Strip */}
                  <div className="border-t border-gray-200 grid grid-cols-3 divide-x divide-gray-200">
                    <div className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-400 mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider">
                          In Progress
                        </span>
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {inProgressTasks}
                      </div>
                    </div>
                    <div className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-400 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider">
                          Completed
                        </span>
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {completedTasks}
                      </div>
                    </div>
                    <div className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-400 mb-1">
                        <Circle className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider">
                          Total
                        </span>
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {totalTasks}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Tasks Table */}
                <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 md:px-8 py-5 border-b border-gray-200 space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">
                        Task History
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">
                        {totalTasks} task{totalTasks !== 1 && "s"} submitted
                        {filteredTasks.length !== totalTasks &&
                          ` · ${filteredTasks.length} shown`}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1 sm:max-w-[320px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search tasks..."
                          className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47]"
                        />
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type="date"
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value)}
                          className="w-full sm:w-[190px] pl-9 pr-2.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47]"
                        />
                      </div>
                    </div>
                  </div>

                  {tasks.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 text-sm">
                      No tasks submitted yet.
                    </div>
                  ) : filteredTasks.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 text-sm">
                      No tasks match your search or filters.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {taskGroups.map(([day, dayTasks]) => (
                        <div key={day} className="px-6 md:px-8 py-6 space-y-4">
                          <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                            <Calendar className="w-4 h-4 text-[#003A47]" />
                            {day === "Unknown date"
                              ? "No date"
                              : formatDate(day)}
                            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                              {dayTasks.length} task
                              {dayTasks.length !== 1 && "s"}
                            </span>
                          </h4>

                          <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-[#FAFBFB] text-gray-400 text-[11px] font-semibold uppercase tracking-wider border-b border-gray-200">
                                  <th className="py-3 px-6">Task Submitted</th>
                                  <th className="py-3 px-6">Status</th>
                                  <th className="py-3 px-6">Progress</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-600">
                                {dayTasks.map((task) => (
                                  <tr
                                    key={task.id}
                                    onClick={() => setSelectedTask(task)}
                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                  >
                                    <td className="py-3.5 px-6 text-gray-900 font-semibold max-w-[280px] truncate">
                                      {task.task}
                                    </td>
                                    <td className="py-3.5 px-6">
                                      <span className="inline-flex items-center gap-1.5">
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full ${
                                            task.status === "Completed" ||
                                            task.status === "completed"
                                              ? "bg-emerald-500"
                                              : "bg-amber-400"
                                          }`}
                                        />
                                        <span
                                          className={
                                            task.status === "Completed" ||
                                            task.status === "completed"
                                              ? "text-emerald-700 font-semibold"
                                              : "text-amber-700 font-semibold"
                                          }
                                        >
                                          {task.status || "In progress"}
                                        </span>
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-6 text-gray-900 font-semibold">
                                      {task.progress || "-"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="md:hidden divide-y divide-gray-100">
                            {dayTasks.map((task) => (
                              <div
                                key={task.id}
                                onClick={() => setSelectedTask(task)}
                                className="p-4 space-y-2 cursor-pointer active:bg-gray-50"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="text-sm font-semibold text-gray-900 leading-snug min-w-0">
                                    {task.task}
                                  </div>
                                  <span className="inline-flex items-center gap-1.5 shrink-0">
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        task.status === "Completed" ||
                                        task.status === "completed"
                                          ? "bg-emerald-500"
                                          : "bg-amber-400"
                                      }`}
                                    />
                                    <span
                                      className={`text-[11px] font-semibold ${
                                        task.status === "Completed" ||
                                        task.status === "completed"
                                          ? "text-emerald-700"
                                          : "text-amber-700"
                                      }`}
                                    >
                                      {task.status || "In progress"}
                                    </span>
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5 text-xs">
                                  <div>
                                    <span className="text-gray-400">Date: </span>
                                    <span className="text-gray-600 font-medium">
                                      {formatDate(task.date || "-")}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">
                                      Progress:{" "}
                                    </span>
                                    <span className="text-gray-900 font-semibold">
                                      {task.progress || "-"}
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
              </>
            ) : null}
          </main>
        </div>

        {selectedTask && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-30"
              onClick={() => setSelectedTask(null)}
            />
            <div className="fixed inset-0 md:top-0 md:right-0 md:inset-auto h-full w-full md:max-w-[480px] bg-white shadow-xl z-40 overflow-y-auto">
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5 stroke-[1.5]" />
                </button>
                <span className="text-[13px] font-medium text-gray-400">
                  {selectedTask.date
                    ? formatDate(selectedTask.date)
                    : "Task details"}
                </span>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight leading-snug">
                    {selectedTask.task}
                  </h3>
                  <span className="mt-2.5 inline-flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        selectedTask.status === "Completed" ||
                        selectedTask.status === "completed"
                          ? "bg-emerald-500"
                          : "bg-amber-400"
                      }`}
                    />
                    <span
                      className={`text-xs font-semibold ${
                        selectedTask.status === "Completed" ||
                        selectedTask.status === "completed"
                          ? "text-emerald-700"
                          : "text-amber-700"
                      }`}
                    >
                      {selectedTask.status || "In progress"}
                    </span>
                  </span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Task description
                  </h4>
                  <div className="border border-gray-200 rounded-lg p-4 text-sm text-gray-800 leading-relaxed">
                    {selectedTask.description || "No description provided"}
                  </div>
                </div>

                {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Task list
                    </h4>
                    <div className="space-y-2">
                      {selectedTask.subtasks.map((subtask) => (
                        <div
                          key={subtask.id}
                          className="border border-gray-200 rounded-lg p-2 flex items-start gap-3 bg-white"
                        >
                          <span
                            className={`w-4 h-4 shrink-0 mt-0.5 rounded-full border-2 flex items-center justify-center ${
                              subtask.status === "Completed" ||
                              subtask.status === "completed"
                                ? "bg-[#4CAF50] border-[#4CAF50] text-white"
                                : "border-orange-500 bg-orange-500"
                            }`}
                          >
                            {subtask.status === "Completed" ||
                            subtask.status === "completed" ? (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            ) : (
                              <X className="w-3 h-3 text-white stroke-[3]" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <span
                                className={`text-sm font-semibold ${
                                  subtask.status === "Completed" ||
                                  subtask.status === "completed"
                                    ? "text-gray-400"
                                    : "text-gray-900"
                                }`}
                              >
                                {subtask.number != null
                                  ? `${subtask.number}. `
                                  : ""}
                                {subtask.task}
                              </span>
                              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                                {subtask.progress || "In progress"}
                              </span>
                            </div>
                            {subtask.description ? (
                              <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                                {subtask.description}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-gray-400" />
                      <span>Assigned to</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#003A47] flex items-center justify-center text-[10px] font-bold text-white uppercase overflow-hidden">
                        {staff?.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={staff.photo}
                            alt={staff.Name || ""}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(staff?.Name || "")
                        )}
                      </div>
                      <span className="text-xs font-semibold text-gray-800">
                        {staff?.Name || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-gray-400" />
                      <span>Progress</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-800">
                      {selectedTask.progress || "-"}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Date submitted</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-800">
                      {formatDate(selectedTask.date || "-")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AuthGuard>
  );
}
