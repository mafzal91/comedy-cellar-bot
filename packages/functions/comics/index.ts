import { generateResponse } from "@core/common/generateResponse";
import {
  getComicByExternalId,
  getComics,
  isComicExternalId,
} from "@core/models/comic";

export async function list() {
  const comics = await getComics();
  return generateResponse({
    statusCode: 200,
    body: { results: comics },
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
