import {
  getComicByExternalId,
  getComics,
  getComicsCount,
  isComicExternalId,
} from "@core/models/comic";

import { comic } from "@core/sql/comic.sql";
import { generateResponse } from "@core/common/generateResponse";
import { mapSortString } from "@core/common/mapSortString";
import qs from "qs";
import { z } from "zod";

export async function list(_evt: any) {
  const queryStringParameters = qs.parse(_evt.rawQueryString);

  const sortFieldSchema = z.enum(["", comic.name.name, `-${comic.name.name}`]);

  const queryValidationSchema = z
    .object({
      name: z.string().min(1, "Name must be at least 1 character").optional(),
      offset: z.coerce.number().min(0).default(0),
      limit: z.coerce.number().min(1).max(100).default(20),
      sort: sortFieldSchema.optional().transform(mapSortString).default(""),
    })
    .default({
      offset: 0,
      limit: 20,
      sort: "",
    });

  const query = queryValidationSchema.safeParse(queryStringParameters);

  if (!query.success) {
    const error = query.error.format();
    return generateResponse({
      statusCode: 400,
      body: error,
    });
  }

  const { name, offset, limit, sort } = query.data;

  const filters: {
    name?: string;
  } = {};

  if (name) filters.name = name;

  const [comics, count] = await Promise.all([
    getComics({
      ...filters,
      offset,
      limit,
      order: sort,
    }),
    getComicsCount(filters),
  ]);

  return generateResponse({
    statusCode: 200,
    body: {
      results: comics,
      offset,
      limit,
      total: count,
    },
  });
}

export async function get(_evt) {
  const externalId = _evt?.pathParameters?.externalId as string;

  if (!isComicExternalId(externalId)) {
    return generateResponse({
      statusCode: 400,
      body: { message: "Invalid Comic Id" },
    });
  }

  const comic = await getComicByExternalId(externalId);

  if (!comic.length) {
    return generateResponse({
      statusCode: 404,
      body: { message: "Comic Not found" },
    });
  }

  return generateResponse({
    statusCode: 200,
    body: comic?.[0],
  });
}
