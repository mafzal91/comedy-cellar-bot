import { createReservation } from "./createReservation";
import { ApiRequest } from "../../types/api";

export const handleReservation = async (
  data: ApiRequest.CreateReservationRequest
) => {
  const reservation = await createReservation(data);

  return reservation;
};
