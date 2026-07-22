import api from "./api";
import type { AuthUser } from "@/types";

const DEMO_SESSION_KEY = "cinematix_demo_user";

const mapUser = (data: Record<string, unknown>): AuthUser => ({
  id: data._id as string,
  _id: data._id as string,
  email: data.email as string,
  fullName: data.name as string,
  role: (data.role as "user" | "admin") || "user",
});

export const authService = {
  async login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    const user = mapUser(res.data.data);
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
    return user;
  },

  async adminLogin(usernameOrEmail: string, password: string) {
    const res = await api.post("/auth/login", {
      email: usernameOrEmail,
      password,
    });
    const user = mapUser(res.data.data);
    if (user.role !== "admin") {
      throw new Error("Invalid admin credentials");
    }
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
    return user;
  },

  async register(email: string, password: string, fullName: string) {
    const res = await api.post("/auth/register", {
      name: fullName,
      email,
      password,
      confirmPassword: password,
    });
    return res.data; // { success, message, data, devCode? }
  },

  // Verifying the email also logs the user in (backend sets the auth cookies).
  async verifyEmail(email: string, code: string) {
    const res = await api.post("/auth/verify-email", { email, code });
    const user = mapUser(res.data.data);
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
    return user;
  },

  async resendVerification(email: string) {
    const res = await api.post("/auth/resend-verification", { email });
    return res.data; // may include devCode in non-production
  },

  async forgotPassword(email: string) {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data; // may include devCode in non-production
  },

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    const res = await api.post("/auth/reset-password", {
      email,
      code,
      newPassword,
      confirmPassword,
    });
    return res.data;
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem(DEMO_SESSION_KEY);
    }
  },

  async getCurrentUser() {
    try {
      const res = await api.get("/auth/me");
      const user = mapUser(res.data.data);
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
      return user;
    } catch {
      localStorage.removeItem(DEMO_SESSION_KEY);
      return null;
    }
  },

  getStoredUser(): AuthUser | null {
    const storedUser = localStorage.getItem(DEMO_SESSION_KEY);
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser) as AuthUser;
    } catch {
      localStorage.removeItem(DEMO_SESSION_KEY);
      return null;
    }
  },
};
