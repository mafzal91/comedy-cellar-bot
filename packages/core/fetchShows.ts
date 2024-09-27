import { requester } from "./requester";
import { ApiResponse } from "../types/api";

export const fetchShows = async (
  date: string
): Promise<ApiResponse.GetShowsResponse["data"]["showInfo"]> => {
  let data = JSON.stringify({
    date,
  });

  try {
    const res = await requester.post("/reservations/api/getShows", data);
    const responseData = res.data as ApiResponse.GetShowsResponse;
    return responseData.data.showInfo;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
