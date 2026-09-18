const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = token;
  }

  const res = await fetch(`${API_BASE}/api${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any = {};

  if (res.headers.get("content-type")?.includes("application/json")) {
    data = await res.json();
  } else {
    const rawText = await res.text();
    console.error("BACKEND SYSTEM ERROR (Received non-JSON content):", rawText);
    throw new Error(
      `Server Error (${res.status}): Expected JSON but received HTML or plain text.`,
    );
  }

  if (!res.ok) {
    const isAuth =
      typeof data.info === "string" &&
      /Authenticate|credentials|expired|login again|no admin found/i.test(
        data.info,
      );
    if (isAuth && typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
    const err = new Error(
      typeof data.info === "string"
        ? data.info
        : `Request failed with status ${res.status}`,
    ) as Error & { auth?: boolean };
    err.auth = isAuth;
    throw err;
  }

  const authHeader = res.headers.get("Authorization");
  if (authHeader && typeof window !== "undefined") {
    localStorage.setItem("auth_token", authHeader);
  }

  return data;
}

export const api = {
  signup: (body: {
    name: string;
    email: string;
    password: string;
    dept: string;
    role?: string;
  }) =>
    request("/auth/signup/", { method: "POST", body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<{ info: string; role?: string; dpt?: string }>("/auth/login/", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getStaffEmails: () =>
    request<string[]>("/auth/login/emails/", { method: "GET" }),

  getHistory: (params?: { filter?: string; q?: string }) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return request<{ info: any[]; staff_name: string }>("/history/" + query, {
      method: "GET",
    });
  },

  createTask: (body: {
    task: string;
    number?: number;
    description?: string;
    status?: string;
    progress?: string;
    completion_date?: string;
  }) => request("/task/", { method: "POST", body: JSON.stringify(body) }),

  createTaskBatch: (body: {
    task: string;
    description?: string;
    status?: string;
    progress?: string;
    completion_date?: string;
    list: { task: string; number: number; description?: string }[];
  }) => request<{ info: string; id: number }>("/task/", {
    method: "POST",
    body: JSON.stringify(body),
  }),

  updateTask: (
    id: number,
    body: {
      task?: string;
      number?: number;
      description?: string;
      status?: string;
      progress?: string;
      completion_date?: string;
    },
  ) => request(`/task/${id}/`, { method: "PUT", body: JSON.stringify(body) }),

  moveTask: (id: number) =>
    request<{ info: string; id: number }>(`/task/${id}/move/`, {
      method: "POST",
    }),

  getAttendance: () =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request<any>("/attendance/", { method: "GET" }),

  checkIn: () =>
    request<{ info: string }>("/attendance/checkin/", { method: "POST" }),

  checkOut: () =>
    request<{ info: string }>("/attendance/checkout/", { method: "POST" }),

  getAdminAttendanceHistory: () =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request<any>("/admin/attendance/", { method: "GET" }),

  adminLogin: (body: { email: string; password: string }) =>
    request<{ info: string }>("/admin/login/", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAdminDashboard: () => request<any>("/admin/dashboard/", { method: "GET" }),

  getStaffList: (params?: { date?: string }) => {
    const query = params?.date ? "?date=" + params.date : "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return request<any>("/admin/staff/" + query, { method: "GET" });
  },

  getStaffDetail: (id: number) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request<any>(`/admin/staff/${id}/`, { method: "GET" }),

  createDirectorTask: (body: { task: string; status?: string }) =>
    request("/director/task/", { method: "POST", body: JSON.stringify(body) }),

  getDirectorHistory: () =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request<any>("/director/history/", { method: "GET" }),

  getAllStaffTasks: (params?: {
    filter?: string;
    q?: string;
    month?: string;
    day?: string;
    date?: string;
  }) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return request<any>("/director/tasks/" + query, { method: "GET" });
  },

  updateProfile: (body: {
    name?: string;
    email?: string;
    dept?: string;
    role?: string;
  }) =>
    request("/auth/profile/", { method: "PUT", body: JSON.stringify(body) }),

  getProfile: () =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request<any>("/auth/profile/", { method: "GET" }),

  uploadProfilePhoto: (file: File) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const form = new FormData();
    form.append("photo", file);
    return fetch(`${API_BASE}/api/auth/profile/photo/`, {
      method: "POST",
      headers: token ? { Authorization: token } : {},
      credentials: "include",
      body: form,
    }).then(async (res) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok) {
        throw new Error(data.info || `Upload failed with status ${res.status}`);
      }
      if (typeof window !== "undefined") {
        const authHeader = res.headers.get("Authorization");
        if (authHeader) localStorage.setItem("auth_token", authHeader);
      }
      return data;
    });
  },

  forgotPassword: (email: string) =>
    request<{ info: string }>("/auth/forgot-password/", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyOTP: (email: string, otp: string) =>
    request<{ info: string; token: string }>("/auth/verify-otp/", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  resetPassword: (email: string, token: string, password: string) =>
    request<{ info: string }>("/auth/reset-password/", {
      method: "POST",
      body: JSON.stringify({ email, token, password }),
    }),

  getAccountSettings: () =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request<any>("/account/settings/", { method: "GET" }),

  completeSettings: (body: {
    name?: string;
    email?: string;
    dept?: string;
    role?: string;
    photo?: string;
    password?: string;
  }) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request<any>("/account/settings/", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function ordinal(n: number): string {
  if (n > 3 && n < 21) return n + "th";
  switch (n % 10) {
    case 1:
      return n + "st";
    case 2:
      return n + "nd";
    case 3:
      return n + "rd";
    default:
      return n + "th";
  }
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return "-";
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return "-";
  if (month < 1 || month > 12) return "-";
  return `${ordinal(day)} ${MONTHS[month - 1]} ${year}`;
}

export function isAuthError(err: unknown): boolean {
  if (err && typeof err === "object" && "auth" in err && (err as { auth?: boolean }).auth) {
    return true;
  }
  if (err instanceof Error) {
    return /Authenticate|credentials|expired|login again|no admin found/i.test(
      err.message,
    );
  }
  return false;
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_dept");
    localStorage.removeItem("user_is_admin");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_photo");
  }
}
