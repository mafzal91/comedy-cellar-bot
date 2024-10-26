import { generateResponse } from "@core/common/generateResponse";
import {
  getComicByExternalId,
  getComics,
  isComicExternalId,
} from "@core/models/comic";
import { clerkClient } from "@core/clerk";
import { verifyToken } from "@clerk/backend";

export async function list() {
  const comics = await getComics();

  return generateResponse({
    statusCode: 200,
    body: { results: comics },
  });
}

export async function get(_evt) {
  const externalId = _evt?.pathParameters?.externalId as string;
  console.log(_evt);

  if (!isComicExternalId(externalId)) {
    return generateResponse({
      statusCode: 400,
      body: { message: "Invalid Comic Id" },
    });
  }

  if (_evt.headers.authorization) {
    const bearerToken = _evt.headers.authorization?.replace("Bearer ", "");

    console.log(_evt.headers.authorization);
    const res = await verifyToken(bearerToken, {});
    console.log(res);
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
