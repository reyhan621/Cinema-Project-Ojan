import api from "./api";
import type { ICinema } from "@/types";

const getBackendError = (error: unknown): string => {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object' &&
    'message' in error.response.data
  ) {
    return String((error.response as { data: { message: string } }).data.message);
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
};

export const cinemaService = {
  async getCinemas(): Promise<ICinema[]> {
    const res = await api.get("/cinemas");
    return (res.data.data || []).map((c: ICinema) => ({
      _id: c._id,
      name: c.name,
      city: c.city,
      createdAt: c.createdAt || "",
      updatedAt: c.updatedAt || "",
    }));
  },

  async getCinemaById(id: string): Promise<ICinema> {
    const res = await api.get(`/cinemas/${id}`);
    return res.data.data;
  },

  async createCinema(data: { name: string; city: string }): Promise<ICinema> {
    const res = await api.post("/cinemas", data);
    return res.data.data;
  },

  async updateCinema(id: string, data: { name: string; city: string }): Promise<ICinema> {
    const res = await api.put(`/cinemas/${id}`, data);
    return res.data.data;
  },

  async deleteCinema(id: string): Promise<void> {
    await api.delete(`/cinemas/${id}`);
  },

  getBackendError,
};
