import axios from "axios";
import { ApiResponse } from "../../types/api";
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
    method: "POST",
    maxBodyLength: Infinity,
    url: "https://www.comedycellar.com/lineup/api/",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    data: new URLSearchParams(data),
  };

  try {
    const res = await axios.request(config);
    const responseData = res.data;
    const parsedPayload = parseLineUp({ html: responseData.show.html });
    return parsedPayload;
  } catch (error) {
    console.log(error);
    throw error; // You might want to re-throw the error so that callers can handle it
  }
};
