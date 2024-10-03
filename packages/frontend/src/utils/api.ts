import { ListApiRes, ShowDb } from "../types";
import qs from "qs";

const { VITE_API_URL } = import.meta.env;

const withFetchErrorHandling = (fetchFunction) => {
  return async (...args) => {
    try {
      const response = await fetchFunction(...args);
      const data = await response.json();
      if (!response.ok) {
        if (response.status >= 500) {
          throw new Error(data.message);
        }
        if (response.status >= 400) {
          throw data;
        }
      }
      return data;
    } catch (error) {
      console.error("Error in fetch operation:", error);
      throw error;
    }
  };
};

const customFetch = withFetchErrorHandling(fetch);

export const fetchShows = async ({ date }: { date: string }) => {
  const res = await customFetch(`${VITE_API_URL}/api/shows?date=${date}`);

  return res;
};

export const fetchLineUp = async ({ date }: { date: string }) => {
  try {
    const res = await customFetch(`${VITE_API_URL}/api/line-up?date=${date}`);

    return res;
  } catch (error) {
    return {
      date: "",
      lineUps: [],
    };
  }
};

export const fetchShowByTimestamp = async ({
  timestamp,
}: {
  timestamp: string;
}) => {
  const res = await customFetch(`${VITE_API_URL}/api/shows/${timestamp}`);

  return res;
};

export const createReservation = async ({
  guest: { email, firstName, lastName, size, phone, howHeard, smsOk },
  showId,
  timestamp,
}) => {
  const res = await customFetch(
    `${VITE_API_URL}/api/reservation/${timestamp}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        guest: {
          email,
          firstName,
          lastName,
          size,
          phone,
          howHeard,
          smsOk,
        },
        showId,
      }),
    }
  );
  return res;
};

export const fetchComics = async ({
  name,
  skip = 0,
  limit = 10,
}: {
  name?: string;
  skip?: number;
  limit?: number;
} = {}) => {
  const res = await customFetch(`${VITE_API_URL}/api/comics`);

  return res;
};

export const fetchComicById = async ({
  externalId,
}: {
  externalId: string;
}) => {
  const res = await customFetch(`${VITE_API_URL}/api/comics/${externalId}`);

  return res;
};

export const fetchShowsNew = async (filters: {
  comicId?: string;
  roomId?: string;
  date?: {
    start?: number;
    end?: number;
  };
  offset: number;
  limit: number;
}): Promise<ListApiRes<ShowDb>> => {
  const queryString = qs.stringify({ ...filters, sort: "timestamp" });
  const res = await customFetch(`${VITE_API_URL}/api/shows/new?${queryString}`);

  return res;
};
