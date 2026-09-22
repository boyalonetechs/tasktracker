"use client";
import { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  ListTodo,
  ChevronDown,
  Plus,
  X,
  Circle,
  Calendar,
  Check,
  Pencil,
  Search,
  ChevronLeft,
  ListOrdered,
  Loader,
  CalendarClock,
  Repeat,
  Clock,
  LogIn,
  LogOut,
  Trash2,
} from "lucide-react";
import { api, formatDate, isAuthError } from "@/lib/api";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import EmployeeShell from "@/components/EmployeeShell";
import FirstLoginModal from "@/components/FirstLoginModal";

export default function EmployeeDashboard() {
  const [activeView, setActiveView] = useState("dashboard");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskSubmitted, setTaskSubmitted] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingTask, setEditingTask] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskTitle, setTaskTitle] = useState("");
  const [extraTasks, setExtraTasks] = useState<{ title: string }[]>([]);
  const [taskDescription, setTaskDescription] = useState("");
  const [taskProgress, setTaskProgress] = useState("10%");
  const [submitting, setSubmitting] = useState(false);
  const [displayName, setDisplayName] = useState("User");
  const [photoUrl, setPhotoUrl] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [confirmMove, setConfirmMove] = useState(false);
  const [movingTask, setMovingTask] = useState(false);
  const [moveError, setMoveError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attendance, setAttendance] = useState<any>(null);
  const [attLoading, setAttLoading] = useState(true);
  const [attBusy, setAttBusy] = useState(false);
  const [attError, setAttError] = useState("");
  const [attSuccess, setAttSuccess] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [accountSettings, setAccountSettings] = useState<any>(null);
  const [showFirstLogin, setShowFirstLogin] = useState(false);
  const router = useRouter();

  const loadTasks = async (filter?: string, q?: string) => {
    try {
      const params: Record<string, string> = {};
      if (filter) params.filter = filter;
      if (q) params.q = q;
      const res = await api.getHistory(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.keys(params).length ? (params as any) : undefined,
      );
      setTasks((res.info || []).reverse());
      if (res.staff_name) {
        setDisplayName(res.staff_name);
        localStorage.setItem("user_name", res.staff_name);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (isAuthError(err)) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    try {
      const res = await api.getAttendance();
      setAttendance(res.attendance);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (isAuthError(err)) {
        router.push("/login");
      }
    } finally {
      setAttLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setAttBusy(true);
    setAttError("");
    setAttSuccess("");
    try {
      await api.checkIn();
      await loadAttendance();
      setAttSuccess("Signed in. Have a great day!");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setAttError(err.message || "Failed to sign in");
    } finally {
      setAttBusy(false);
    }
  };

  const handleCheckOut = async () => {
    setAttBusy(true);
    setAttError("");
    setAttSuccess("");
    try {
      await api.checkOut();
      await loadAttendance();
      setAttSuccess("Signed out. See you tomorrow!");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setAttError(err.message || "Failed to sign out");
    } finally {
      setAttBusy(false);
    }
  };

  useEffect(() => {
    const savedName =
      typeof window !== "undefined" ? localStorage.getItem("user_name") : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedName) setDisplayName(savedName);
    loadTasks();
    loadAttendance();
    api
      .getAccountSettings()
      .then((res) => {
        setAccountSettings(res);
        if (res && res.settings_completed === false) {
          setShowFirstLogin(true);
        }
        if (res) {
          if (res.name) localStorage.setItem("user_name", res.name);
          if (res.email) localStorage.setItem("user_email", res.email);
          if (res.dept) localStorage.setItem("user_dept", res.dept);
          if (res.role) localStorage.setItem("user_role", res.role);
          if (res.photo) {
            localStorage.setItem("user_photo", res.photo);
            setPhotoUrl(res.photo);
          }
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
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const totalTasks = tasks.length;

  const filteredTasks = useMemo(() => {
    const q = taskSearch.trim().toLowerCase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return tasks.filter((t: any) => {
      const matchesSearch =
        !q ||
        (t.task || t.title || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q);
      const matchesDate =
        !dateFilter ||
        (t.date || t.date_submitted || "").startsWith(dateFilter);
      return matchesSearch && matchesDate;
    });
  }, [tasks, taskSearch, dateFilter]);

  const taskGroups = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groups = new Map<string, any[]>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sorted = [...filteredTasks].sort((a: any, b: any) => b.id - a.id);
    for (const t of sorted) {
      const key = t.date || t.date_submitted || "Unknown date";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
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

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const computedStatus =
        taskProgress === "100%" ? "Completed" : "In Progress";
      const isEdit = !!editingTask;
      const body = {
        task: taskTitle,
        description: taskDescription || undefined,
        status: computedStatus,
        progress: taskProgress,
      };
      if (isEdit) {
        await api.updateTask(editingTask.id, body);
      } else {
        const list = extraTasks
          .map((row, idx) => ({
            task: row.title.trim(),
            number: idx + 1,
          }))
          .filter((row) => row.task);
        if (list.length > 0) {
          await api.createTaskBatch({ ...body, list });
        } else {
          await api.createTask(body);
        }
      }
      setEditingTask(null);
      setShowAddTask(false);
      setTaskSubmitted(true);
      setTaskTitle("");
      setTaskDescription("");
      setExtraTasks([]);
      setTaskProgress("10%");
      loadTasks();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      if (isAuthError(err)) {
        router.push("/login");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setTaskTitle(task.task || task.title || "");
    setTaskDescription(task.description || "");
    setTaskProgress(task.progress || "10%");
    setSelectedTask(null);
    setShowAddTask(true);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfirmMove(false);
    setMoveError("");
    setConfirmDeleteId(null);
  }, [selectedTask]);

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canMoveTask = (task: any) => {
    if (!task) return false;
    const isToday = (task.date || task.date_submitted || "").startsWith(
      getTodayStr(),
    );
    const isCompleted =
      task.status === "Completed" || task.status === "completed";
    return !isToday && !isCompleted;
  };

  const handleMoveTask = async () => {
    if (!selectedTask) return;
    if (!canMoveTask(selectedTask)) return;
    if (!confirmMove) {
      setConfirmMove(true);
      setMoveError("");
      return;
    }
    setMovingTask(true);
    try {
      await api.moveTask(selectedTask.id);
      setSelectedTask(null);
      setConfirmMove(false);
      setMoveError("");
      loadTasks();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setMoveError(err.message || "Failed to move task");
      setConfirmMove(false);
    } finally {
      setMovingTask(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDeleteTask = async (task: any) => {
    if (confirmDeleteId !== task.id) {
      setConfirmDeleteId(task.id);
      return;
    }
    setDeletingId(task.id);
    try {
      await api.deleteTask(task.id);
      if (selectedTask?.id === task.id) setSelectedTask(null);
      setConfirmDeleteId(null);
      loadTasks();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const addExtraTask = () => {
    setExtraTasks((rows) => [...rows, { title: "" }]);
  };

  const updateExtraTask = (idx: number, title: string) => {
    setExtraTasks((rows) => rows.map((r, i) => (i === idx ? { title } : r)));
  };

  const removeExtraTask = (idx: number) => {
    setExtraTasks((rows) => rows.filter((_, i) => i !== idx));
  };

  const toggleSubtask = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subtask: any,
  ) => {
    const isCompleted =
      subtask.status === "Completed" || subtask.status === "completed";
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const newStatus = isCompleted ? "In Progress" : "Completed";
    const newProgress = isCompleted ? "10%" : "100%";
    const prevTask = selectedTask;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setSelectedTask((current: any) => {
      const nextSubtasks = (current.subtasks || []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (s: any) =>
          s.id === subtask.id
            ? {
                ...s,
                status: newStatus,
                progress: newProgress,
                completion_date: isCompleted ? null : today,
              }
            : s,
      );
      const allDone = nextSubtasks.every(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (s: any) => s.status === "Completed" || s.status === "completed",
      );
      return {
        ...current,
        subtasks: nextSubtasks,
        ...(allDone ? { progress: "100%", status: "Completed" } : {}),
      };
    });
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: any = {
        status: newStatus,
        progress: newProgress,
      };
      if (!isCompleted) body.completion_date = today;
      else body.completion_date = null;
      await api.updateTask(subtask.id, body);
      const siblings = (selectedTask?.subtasks || []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (s: any) =>
          s.id === subtask.id ? { ...s, status: newStatus } : s,
      );
      const allDone = siblings.every(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (s: any) => s.status === "Completed" || s.status === "completed",
      );
      if (allDone && selectedTask?.id) {
        await api.updateTask(selectedTask.id, {
          progress: "100%",
          status: "Completed",
        });
        loadTasks();
      }
    } catch (err) {
      console.error(err);
      if (prevTask) setSelectedTask(prevTask);
    }
  };

  return (
    <AuthGuard>
      <EmployeeShell
        activeView={activeView}
        onNavigate={(view) => setActiveView(view)}
        header={
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              Welcome {displayName.split(" ")[0]}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 max-sm:hidden">
              Track your progress with task tracker.{" "}
              <span className="text-gray-900 font-medium ml-1">
                {new Date().toDateString()}
              </span>
            </p>
          </div>
        }
      >
        {activeView === "dashboard" && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddTask(true)}
              className="flex items-center cursor-pointer gap-2 bg-[#003A47] w-full lg:w-max text-white px-5 py-2.5 rounded-md font-medium text-sm hover:bg-[#002b35] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Today&apos;s Task
            </button>
          </div>
        )}

        {activeView === "dashboard" && (
          <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#003A47]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Attendance
                  </h2>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                    {new Date().toDateString()}
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-auto">
                {attLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader className="w-4 h-4 animate-spin" />
                    Loading...
                  </div>
                ) : attendance?.time_of_arrival &&
                  attendance?.time_of_leave ? (
                  <div className="flex items-center gap-3 text-sm font-semibold text-gray-800">
                    <span>
                      In {attendance.time_of_arrival} · Out{" "}
                      {attendance.time_of_leave}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5E9] text-[#4CAF50] text-[11px] font-bold uppercase px-3 py-1">
                      <Check className="w-3 h-3" /> Done
                    </span>
                  </div>
                ) : attendance?.time_of_arrival ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-semibold text-gray-800">
                      Signed in at {attendance.time_of_arrival}
                    </span>
                    <button
                      onClick={handleCheckOut}
                      disabled={attBusy}
                      className="inline-flex items-center gap-1.5 bg-[#003A47] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#002b35] transition-colors disabled:opacity-50"
                    >
                      {attBusy ? (
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <LogOut className="w-3.5 h-3.5" />
                      )}
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleCheckIn}
                    disabled={attBusy}
                    className="inline-flex items-center gap-1.5 bg-[#003A47] text-white text-xs font-semibold px-5 py-2.5 rounded-lg hover:bg-[#002b35] transition-colors disabled:opacity-50"
                  >
                    {attBusy ? (
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <LogIn className="w-3.5 h-3.5" />
                    )}
                    Sign In
                  </button>
                )}
              </div>
            </div>

            {attError && (
              <p className="text-xs font-medium text-red-600">{attError}</p>
            )}
            {attSuccess && (
              <p className="text-xs font-medium text-emerald-600">
                {attSuccess}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-3">
              Sign in when you arrive in the morning and sign out before you
              leave for the day.
            </p>
          </section>
        )}

        {activeView === "dashboard" && (
          <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">
                Dashboard Overview
              </h2>
              <button className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-300 transition-colors">
                Days
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#F4F8FC] p-4 rounded-lg border border-blue-50/50">
                <p className="text-[13px] font-medium text-gray-400">
                  Total Tasks
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {tasks.length}
                </p>
              </div>

              <div className="bg-[#F2FBF4] p-4 rounded-lg border border-green-50/50">
                <p className="text-[13px] truncate w-24 sm:w-28 font-medium text-gray-400">
                  Today Submitted
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {(() => {
                    const today = new Date();
                    const ds = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                    return tasks.filter((t) => (t.date || "").startsWith(ds))
                      .length;
                  })()}
                </p>
              </div>

              <div className="bg-[#FFF8F8] p-4 rounded-lg border border-red-50/50">
                <p className="text-[13px] font-medium text-gray-400">
                  Pending Tasks
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {
                    tasks.filter(
                      (t) =>
                        t.status !== "Completed" && t.status !== "completed",
                    ).length
                  }
                </p>
              </div>

              <div className="bg-[#FFFBF4] p-4 rounded-lg border border-amber-50/50">
                <p className="text-[13px] font-medium text-gray-400">
                  Completed Tasks
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {
                    tasks.filter(
                      (t) =>
                        t.status === "Completed" || t.status === "completed",
                    ).length
                  }
                </p>
              </div>
            </div>
          </section>
        )}

        {(activeView === "dashboard" || activeView === "tasks") && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 md:px-8 py-5 border-b border-gray-200 space-y-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    All Tasks
                  </h2>
                  <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">
                    {totalTasks} task{totalTasks !== 1 && "s"} submitted
                    {filteredTasks.length !== totalTasks &&
                      ` · ${filteredTasks.length} shown`}
                  </p>
                </div>
                <button
                  onClick={() => setActiveView("tasks")}
                  className="text-xs font-semibold text-[#003A47] hover:underline"
                >
                  See all
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 sm:max-w-[320px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    placeholder="Search tasks..."
                    className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47]"
                  />
                  {taskSearch && (
                    <button
                      onClick={() => setTaskSearch("")}
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

            {loading ? (
              <div className="p-12 text-center text-gray-400 text-sm">
                <Loader className="h-5 w-5 animate-spin mx-auto mb-2" />
              </div>
            ) : tasks.length === 0 ? (
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
                      {day === "Unknown date" ? "No date" : formatDate(day)}
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
                            <th className="py-3 px-6"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-600">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {dayTasks.map((item: any) => (
                            <tr
                              key={item.id}
                              onClick={() => setSelectedTask(item)}
                              className="hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <td className="py-3.5 px-6 text-gray-900 font-semibold max-w-[280px] truncate">
                                {item.number != null ? `${item.number}. ` : ""}
                                {item.task || item.title}
                              </td>
                              <td className="py-3.5 px-6">
                                <span className="inline-flex items-center gap-1.5">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      item.status === "Completed" ||
                                      item.status === "completed"
                                        ? "bg-emerald-500"
                                        : "bg-amber-400"
                                    }`}
                                  />
                                  <span
                                    className={
                                      item.status === "Completed" ||
                                      item.status === "completed"
                                        ? "text-emerald-700 font-semibold"
                                        : "text-amber-700 font-semibold"
                                    }
                                  >
                                    {item.status || "In progress"}
                                  </span>
                                </span>
                              </td>
                              <td className="py-3.5 px-6 text-gray-900 font-semibold">
                                {item.progress || "-"}
                              </td>
                              <td className="py-3.5 px-6 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTask(item);
                                  }}
                                  className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                                    confirmDeleteId === item.id
                                      ? "text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg"
                                      : "text-red-500 hover:text-red-700"
                                  }`}
                                  disabled={deletingId === item.id}
                                >
                                  {deletingId === item.id ? (
                                    <Loader className="w-3.5 h-3.5 animate-spin" />
                                  ) : confirmDeleteId === item.id ? (
                                    "Confirm?"
                                  ) : (
                                    <Trash2 className="w-4 h-4 stroke-[1.5]" />
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="md:hidden divide-y divide-gray-100">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {dayTasks.map((item: any) => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedTask(item)}
                          className="p-4 space-y-2 cursor-pointer active:bg-gray-50"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-sm font-semibold text-gray-900 leading-snug min-w-0">
                              {item.number != null ? `#${item.number} ` : ""}
                              {item.task || item.title}
                            </div>
                            <span className="inline-flex items-center gap-1.5 shrink-0">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  item.status === "Completed" ||
                                  item.status === "completed"
                                    ? "bg-emerald-500"
                                    : "bg-amber-400"
                                }`}
                              />
                              <span
                                className={`text-[11px] font-semibold ${
                                  item.status === "Completed" ||
                                  item.status === "completed"
                                    ? "text-emerald-700"
                                    : "text-amber-700"
                                }`}
                              >
                                {item.status || "In progress"}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(item);
                              }}
                              className={`shrink-0 text-xs font-semibold transition-colors ${
                                confirmDeleteId === item.id
                                  ? "text-white bg-red-600 hover:bg-red-700 px-2.5 py-1 rounded-lg"
                                  : "text-red-500 hover:text-red-700"
                              }`}
                              disabled={deletingId === item.id}
                            >
                              {deletingId === item.id ? (
                                <Loader className="w-3.5 h-3.5 animate-spin" />
                              ) : confirmDeleteId === item.id ? (
                                "Confirm?"
                              ) : (
                                <Trash2 className="w-4 h-4 stroke-[1.5]" />
                              )}
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 text-xs">
                            <div>
                              <span className="text-gray-400">Date: </span>
                              <span className="text-gray-600 font-medium">
                                {formatDate(item.date || item.date_submitted)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Progress: </span>
                              <span className="text-gray-900 font-semibold">
                                {item.progress || "-"}
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
        )}

        {selectedTask && (
          <>
            <div
              className="fixed inset-0 h-screen bg-black/40 z-20"
              onClick={() => setSelectedTask(null)}
            />
            <div className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-white shadow-xl z-40 overflow-y-auto">
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center gap-3 text-gray-400 text-xs font-medium z-10">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="hover:text-gray-600 transition-colors"
                >
                  <X className="w-3 h-3 stroke-[1.5]" />
                </button>
                <span>
                  Submitted on{" "}
                  {formatDate(selectedTask.date || selectedTask.date_submitted)}
                  .{" "}
                </span>
                <div className="ml-auto flex items-center gap-3">
                  <button
                    onClick={() => handleEditTask(selectedTask)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#003A47] hover:text-[#002b35] transition-colors"
                  >
                    <Pencil className="w-3 h-3 stroke-[1.5]" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTask(selectedTask)}
                    disabled={deletingId === selectedTask.id}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                      confirmDeleteId === selectedTask.id
                        ? "bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700"
                        : "text-red-500 hover:text-red-700"
                    }`}
                  >
                    {deletingId === selectedTask.id ? (
                      <Loader className="w-3 h-3 animate-spin" />
                    ) : confirmDeleteId === selectedTask.id ? (
                      "Confirm? "
                    ) : (
                      <Trash2 className="w-3 h-3 stroke-[1.5]" />
                    )}
                    Delete
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 bg-white">
                    <ListTodo className="w-3 h-3 text-gray-400" />
                    <span className="font-medium">
                      {selectedTask.number != null
                        ? `#${selectedTask.number} `
                        : ""}
                      {selectedTask.task || selectedTask.title}
                    </span>
                  </div>
                  <div className="border border-[#4CAF50] bg-[#E8F5E9]/30 text-[#4CAF50] rounded-lg px-3 py-1 text-xs font-semibold">
                    {selectedTask.progress || selectedTask.progress_tab || "-"}{" "}
                    Progress
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-gray-900">
                    Task description
                  </h3>
                  <div className="w-full min-h-[90px] border border-gray-200 rounded-xl p-4 text-sm text-gray-800 bg-white leading-relaxed">
                    {selectedTask.description || "No description provided"}
                  </div>
                </div>

                {selectedTask.subtasks?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <ListTodo className="w-4 h-4 text-[#003A47] stroke-[1.5]" />
                      Task list
                    </h3>
                    <div className="space-y-2.5">
                      {selectedTask.subtasks.map(
                        (subtask: {
                          id: number;
                          number: number | null;
                          task: string;
                          description: string;
                          status: string;
                          progress: string | null;
                          completion_date: string | null;
                        }) => (
                          <div
                            key={subtask.id}
                            className="border border-gray-200 rounded-lg p-2  flex items-start gap-3 bg-white"
                          >
                            <button
                              type="button"
                              onClick={() => toggleSubtask(subtask)}
                              aria-label={
                                subtask.status === "Completed" ||
                                subtask.status === "completed"
                                  ? "Mark as not done"
                                  : "Mark as done"
                              }
                              className={`w-4 h-4 shrink-0 mt-0.5 rounded border-2 flex items-center justify-center transition-colors ${
                                subtask.status === "Completed" ||
                                subtask.status === "completed"
                                  ? "bg-[#4CAF50] border-[#4CAF50] rounded-full text-white"
                                  : "border-gray-300 bg-white hover:border-[#003A47]"
                              }`}
                            >
                              {subtask.status === "Completed" ||
                              subtask.status === "completed" ? (
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              ) : null}
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-semibold text-gray-900">
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
                              {selectedTask.moved_from &&
                              (subtask.status === "Completed" ||
                                subtask.status === "completed") &&
                              subtask.completion_date ? (
                                <p className="mt-1 text-[11px] font-medium text-emerald-600">
                                  Completed on{" "}
                                  {formatDate(subtask.completion_date)}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4 max-w-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                      <LayoutDashboard className="w-4 h-4 text-gray-400" />
                      <span>Assigned to</span>
                    </div>
                    <div className="w-48 flex items-center gap-2.5 border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
                      <div className="w-6 h-6 rounded-full bg-[#003A47] flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-wider overflow-hidden">
                        {photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photoUrl}
                            alt="me"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(displayName)
                        )}
                      </div>
                      <span className="text-xs font-semibold text-gray-800">
                        {displayName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                      <Circle className="w-4 h-4 text-gray-400" />
                      <span>Status</span>
                    </div>
                    <div className="w-48">
                      <div
                        className={`inline-block font-semibold text-xs px-2 py-1 rounded-lg border ${
                          selectedTask.status === "Completed" ||
                          selectedTask.status === "completed"
                            ? "border-[#4CAF50] bg-[#E8F5E9] text-[#4CAF50]"
                            : "border-[#FFD54F] bg-[#FFFDE7] text-[#D4AF37]"
                        }`}
                      >
                        {selectedTask.status}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                      <ListTodo className="w-4 h-4 text-gray-400" />
                      <span>Project name</span>
                    </div>
                    <div className="w-48 text-sm font-semibold text-gray-800">
                      {selectedTask.project || "Task Tracker Project"}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Date</span>
                    </div>
                    <div className="w-48 text-sm font-semibold text-gray-800">
                      {formatDate(
                        selectedTask.date || selectedTask.date_submitted,
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-2">
                  {moveError && (
                    <p className="text-xs font-medium text-red-600">
                      {moveError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleMoveTask}
                    disabled={!canMoveTask(selectedTask) || movingTask}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      confirmMove
                        ? "bg-amber-500 border-amber-500 text-white hover:bg-amber-600"
                        : "border-[#003A47] text-[#003A47] hover:bg-[#003A47] hover:text-white"
                    }`}
                  >
                    {movingTask ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Moving...
                      </>
                    ) : confirmMove ? (
                      <>
                        <Repeat className="w-4 h-4" />
                        Confirm move to today?
                      </>
                    ) : (
                      <>
                        <CalendarClock className="w-4 h-4" />
                        {(() => {
                          const isCompleted =
                            selectedTask.status === "Completed" ||
                            selectedTask.status === "completed";
                          const isToday = (
                            selectedTask.date || selectedTask.date_submitted
                          ).startsWith(getTodayStr());
                          if (isCompleted) return "Task completed";
                          if (selectedTask.moved_from)
                            return "Already moved to today";
                          if (isToday) return "Task already today";
                          return "Move to today";
                        })()}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {showAddTask && (
          <>
            <div
              className="fixed inset-0 h-screen bg-black/40 z-20 "
              onClick={() => {
                setShowAddTask(false);
                setEditingTask(null);
              }}
            />
            <div className="fixed inset-0 md:top-0 md:right-0 md:inset-auto h-full w-full md:max-w-[500px] bg-white shadow-xl z-40 overflow-y-auto">
              <div className="p-6 sm:p-8">
                <div className="flex justify-end mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTask(false);
                      setEditingTask(null);
                    }}
                    className="text-gray-900 hover:text-gray-600 transition-colors p-1"
                  >
                    <X className="w-5 h-5 stroke-[1.5]" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTask(false);
                      setEditingTask(null);
                    }}
                    className="text-gray-900 hover:text-gray-600 transition-colors p-0.5"
                  >
                    <ChevronLeft className="w-6 h-6 stroke-[2]" />
                  </button>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                    {editingTask ? "Edit Task" : "Add Today's Task"}
                  </h1>
                </div>

                <p className="text-sm text-gray-500 font-normal mb-8 leading-relaxed">
                  {editingTask
                    ? "Update your task details."
                    : "Log on your task for today and track your progress."}
                </p>

                <form onSubmit={handleSubmitTask} className="space-y-6">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      Task title
                    </label>
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Landing Page design"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47] bg-white transition-all"
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      Task description
                    </label>
                    <textarea
                      rows={4}
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      placeholder="Create a sign up page for the task tracker project."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47] bg-white transition-all resize-none leading-relaxed"
                    />
                  </div>

                  {!editingTask && (
                    <div className="flex flex-col space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <ListOrdered className="w-4 h-4 text-gray-400" />
                        Task list
                      </label>
                      {extraTasks.length > 0 && (
                        <div className="space-y-2">
                          {extraTasks.map((row, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="w-7 text-right text-xs font-semibold text-[#003A47]">
                                {idx + 1}.
                              </span>
                              <input
                                type="text"
                                value={row.title}
                                onChange={(e) =>
                                  updateExtraTask(idx, e.target.value)
                                }
                                placeholder={`Task ${idx + 1} title`}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47] bg-white transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => removeExtraTask(idx)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <X className="w-4 h-4 stroke-[1.5]" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={addExtraTask}
                        className="self-start flex items-center gap-2 text-sm font-medium text-[#003A47] hover:text-[#002b35] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add task
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      Progress
                    </label>
                    <div className="relative">
                      <select
                        value={taskProgress}
                        onChange={(e) => setTaskProgress(e.target.value)}
                        className="w-full appearance-none px-4 py-3 border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-[#003A47] focus:border-[#003A47] bg-white pr-10 cursor-pointer"
                      >
                        <option value="10%">10%</option>
                        <option value="25%">25%</option>
                        <option value="50%">50%</option>
                        <option value="75%">75%</option>
                        <option value="100%">100%</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                        <ChevronDown className="h-4 w-4 stroke-[1.5]" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-[#003A47] text-white py-3.5 px-4 rounded-lg font-medium text-sm hover:bg-[#002b35] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003A47] tracking-wide disabled:opacity-50"
                    >
                      {submitting
                        ? <Loader className="animate-spin mx-auto" /> :
                         editingTask
                          ? "Update Task"
                          : "Submit Task"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {taskSubmitted && (
          <div className="fixed inset-0 z-50 flex h-screen items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl p-8 mx-4 w-full max-w-md flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-[#003A47] flex items-center justify-center mb-8 shadow-sm">
                <Check className="w-12 h-12 text-white stroke-[3]" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">
                Success!
              </h1>
              <p className="text-base text-gray-500 font-normal mb-10">
                Your task has been successfully uploaded.
              </p>
              <button
                onClick={() => setTaskSubmitted(false)}
                className="w-full sm:w-56 bg-[#003A47] text-white py-3.5 px-6 rounded-lg font-medium text-base hover:bg-[#002b35] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003A47] tracking-wide"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </EmployeeShell>

      <FirstLoginModal
        open={showFirstLogin}
        kind="staff"
        initial={accountSettings}
        onComplete={(data) => {
          setShowFirstLogin(false);
          if (data.name) localStorage.setItem("user_name", data.name);
          if (data.email) localStorage.setItem("user_email", data.email);
          if (data.photo) {
            localStorage.setItem("user_photo", data.photo);
            setPhotoUrl(data.photo);
          }
          loadTasks();
        }}
      />
    </AuthGuard>
  );
}
