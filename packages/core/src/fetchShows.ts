import axios from "axios";
import { ApiResponse } from "../../types/api";

export const fetchShows = async (
  date: string
): Promise<ApiResponse.GetShowsResponse["data"]["showInfo"]> => {
  let data = JSON.stringify({
    date,
  });

  let config = {
    method: "POST",
    maxBodyLength: Infinity,
    url: "https://www.comedycellar.com/reservations/api/getShows",
    data,
  };

  try {
    const res = await axios.request(config);
    const responseData = res.data as ApiResponse.GetShowsResponse;
    return responseData.data.showInfo;
  } catch (error) {
    console.log(error);
    throw error; // You might want to re-throw the error so that callers can handle it
  }
};
