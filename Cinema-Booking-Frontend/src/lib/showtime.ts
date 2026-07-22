import type { IMovie, IShowtime } from "@/types";
const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{2}):(\d{2})$/;

const parseDateOnly = (value: string): Date | null => {
  const match = DATE_ONLY_RE.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day, 0, 0, 0, 0);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() + 1 !== month ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
};

export const parseShowtimeLocalDateTime = (
  showDate: string,
  startTime: string,
): Date | null => {
  const rawDate = (showDate || "").trim();
  if (!rawDate) return null;

  let date: Date | null = null;
  if (DATE_ONLY_RE.test(rawDate)) {
    // Date-only values are parsed as local calendar dates to avoid UTC shifting.
    date = parseDateOnly(rawDate);
  } else {
    // Full ISO strings (e.g. "...Z") already encode an instant; keep their local day.
    const parsed = new Date(rawDate);
    if (!Number.isNaN(parsed.getTime())) {
      date = parsed;
    }
  }
  if (!date) return null;

  const timeMatch = TIME_RE.exec(startTime || "");
  if (!timeMatch) return null;

  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  if (hours > 23 || minutes > 59) return null;

  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const isUpcomingShowtime = (
  showDate: string,
  startTime: string,
  now = new Date(),
): boolean => {
  const dt = parseShowtimeLocalDateTime(showDate, startTime);
  return dt ? dt.getTime() > now.getTime() : false;
};

export const getNearestUpcomingShowtimeByMovie = (
  showtimes: IShowtime[],
  now = new Date(),
) => {
  const map = new Map<string, IShowtime>();

  for (const showtime of showtimes) {
    const showtimeDt = parseShowtimeLocalDateTime(
      showtime.show_date,
      showtime.start_time,
    );
    if (!showtimeDt || showtimeDt.getTime() <= now.getTime()) continue;

    const movieId = showtime.movie?._id;
    if (!movieId) continue;

    const current = map.get(movieId);
    if (!current) {
      map.set(movieId, showtime);
      continue;
    }

    const currentDt = parseShowtimeLocalDateTime(
      current.show_date,
      current.start_time,
    );
    if (!currentDt || showtimeDt.getTime() < currentDt.getTime()) {
      map.set(movieId, showtime);
    }
  }

  return map;
};

export const attachNearestShowtime = (
  movies: IMovie[],
  showtimes: IShowtime[],
  now = new Date(),
): IMovie[] => {
  const nearestByMovie = getNearestUpcomingShowtimeByMovie(showtimes, now);
  return movies.map((movie) => {
    const nearest = nearestByMovie.get(movie._id);
    if (!nearest) return { ...movie, nearest_showtime: undefined };
    return {
      ...movie,
      nearest_showtime: {
        showtime_id: nearest._id,
        show_date: nearest.show_date,
        start_time: nearest.start_time,
        cinema_name: nearest.cinema?.name,
        cinema_city: nearest.cinema?.city,
      },
    };
  });
};
