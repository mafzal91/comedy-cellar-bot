import { ApiRequest, ApiResponse } from "../types/api";

import { createReservationSuccessResponse } from "../__fixtures__/createReservation";
import { requester } from "./requester";

export const createReservation = async (
  data: ApiRequest.CreateReservationRequest
): Promise<ApiResponse.CreateReservationResponse> => {
  try {
    if (process.env.STAGE === "prod") {
      const res = await requester.post(
        "/reservations/api/addReservation",
        data
      );
      return res.data as ApiResponse.CreateReservationResponse;
    }
    return createReservationSuccessResponse;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
