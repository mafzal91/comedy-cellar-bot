import * as z from "zod";
import qs from "qs";
import { parseTimestampString } from "@core/utils";
import { handleShowDetails } from "@core/handleShowDetails";
import { handleLineUp } from "@core/handleLineUp";
import { handleShowList } from "@core/handleShowList";
import { isRoomExternalId } from "@core/models/room";
import { isComicExternalId } from "@core/models/comic";
import { UnixDateRange } from "@core/common/schema";
import { generateResponse } from "@core/common/generateResponse";
import { getShows, getShowsCount } from "@core/models/show";
import { show } from "@core/sql/show.sql";
import { mapSortString } from "@core/common/mapSortString";

// Deprecated. Will use listShowsLocal and remove this when syncing shows is polished
export const listShows = async (_evt) => {
  const date = _evt?.queryStringParameters?.date; // yyyy-mm-dd
  const comicId = _evt?.queryStringParameters?.date;
  if (!date) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Invalid date/Date Required in format yyyy-mm-dd",
      }),
    };
  }

  const response = await handleShowDetails({ date });
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(response),
  };
};

export const getShow = async (_evt) => {
  const timestamp = _evt?.pathParameters?.timestamp;

  if (!timestamp) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Invalid timestamp",
      }),
    };
  }

  const { date, unixTimestamp } = parseTimestampString({ timestamp });

  const [showRes, lineUpRes] = await Promise.all([
    handleShowDetails({ date }),
    handleLineUp({ date }),
  ]);
  const { shows } = showRes;
  const { lineUps } = lineUpRes;

  // Line Ups may not be available for all shows. Especially for speciality shows
  const lineUp = lineUps.find((l) => l.timestamp === unixTimestamp);
  const show = shows.find((s) => s.timestamp === unixTimestamp);

  if (!show) {
    return {
      statusCode: 404,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Show not found",
      }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ show, lineUp }),
  };
};

export const scanShows = async (_evt) => {
  const days = parseInt(_evt?.queryStringParameters?.days || "1", 10);

  const response = await handleShowList({ days });
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(response),
  };
};

// Unlike listShows, This function will fetch from the db as I phase out fetching directly from the comedy cellar. THis will allow for richer searches
export const listShowsLocal = async (_evt) => {
  const queryStringParameters = qs.parse(_evt.rawQueryString);

  const sortFieldSchema = z.enum([
    show.timestamp.name,
    `-${show.timestamp.name}`,
  ]);

  const queryValidationSchema = z
    .object({
      comicId: z
        .string()
        .refine(isComicExternalId, {
          message: "Invalid Id: Comic Ids start with comic_",
        })
        .optional(),
      date: UnixDateRange.optional(),
      roomId: z
        .string()
        .refine(isRoomExternalId, {
          message: "Invalid Id: Room Ids start with room_",
        })
        .optional(),
      offset: z.coerce.number().min(0).default(0),
      limit: z.coerce.number().min(1).max(100).default(20),
      sort: sortFieldSchema.optional().transform(mapSortString),
    })
    .default({
      offset: 0,
      limit: 20,
    });

  const query = queryValidationSchema.safeParse(queryStringParameters);

  if (!query.success) {
    const error = query.error.format();
    return generateResponse({
      statusCode: 400,
      body: error,
    });
  }

  const { comicId, date, roomId, offset, limit, sort } = query.data;

  const filters: {
    comicId?: string;
    date?: { start: number; end: number };
    roomId?: string;
  } = {};

  if (comicId) filters.comicId = comicId;
  if (roomId) filters.roomId = roomId;
  if (date) {
    filters.date = { start: date.start, end: date.end };
  }

  const [shows, count] = await Promise.all([
    getShows({
      ...filters,
      order: sort,
      offset,
      limit,
    }),
    getShowsCount(filters),
  ]);

  return generateResponse({
    statusCode: 200,
    body: {
      results: shows,
      offset,
      limit,
      total: count,
    },
  });
};
