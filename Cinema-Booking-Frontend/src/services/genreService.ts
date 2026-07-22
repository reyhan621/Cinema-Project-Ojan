import api from './api';

interface Genre {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

interface GenreResponse {
  success: boolean;
  data: Genre[];
}

interface SingleGenreResponse {
  success: boolean;
  data: Genre;
}

export const genreService = {
  async getGenres(): Promise<Genre[]> {
    const { data } = await api.get<GenreResponse>('/genres');
    return data.data || [];
  },

  async createGenre(name: string): Promise<Genre> {
    const { data } = await api.post<SingleGenreResponse>('/genres', { name });
    return data.data;
  },
};
