import { requester } from "./requester";
import { ApiResponse } from "../types/api";
import { parseLineUp } from "./parseLineUp";

export const fetchLineUp = async (
  date: string
): Promise<ApiResponse.LineUp> => {
  const data = {
    action: "cc_get_shows",
    json: JSON.stringify({
      date,
      venue: "newyork",
      type: "lineup",
    }),
  };

  const config = {
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  };

  try {
    const res = await requester.post(
      "/lineup/api/",
      new URLSearchParams(data),
      config
    );

    const responseData = res.data;
    const parsedPayload = parseLineUp({ html: responseData.show.html });
    return parsedPayload;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
