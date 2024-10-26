import * as z from "zod";
import qs from "qs";

import { generateResponse } from "@core/common/generateResponse";
import { isComicExternalId } from "@core/models/comic";

export async function list(_evt) {
  const queryStringParameters = qs.parse(_evt.rawQueryString);

  const queryValidationSchema = z
    .object({
      comicId: z
        .string()
        .refine(isComicExternalId, {
          message: "Invalid Id: Comic Ids start with comic_",
        })
        .optional(),
      offset: z.coerce.number().min(0).default(0),
      limit: z.coerce.number().min(1).max(100).default(20),
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

  return generateResponse({
    statusCode: 200,
    body: "ok",
  });
}
