import { NetworkError, ReservationError } from "./errors";

import { ApiRequest } from "../types/api";
import { createReservation } from "./createReservation";
import sanitizeHtml from "sanitize-html";

export const handleReservation = async (
  data: ApiRequest.CreateReservationRequest
) => {
  try {
    const reservation = await createReservation(data);

    if (reservation.data.responseCode !== 200) {
      throw new ReservationError(reservation.data.message);
    }

    const htmlContent = reservation.data.content.message;
    const sanitizeHtmlContent = sanitizeHtml(
      htmlContent.replace("\n", "<br/>")
    );

    const response = {
      ...reservation.data,
      content: {
        ...reservation.data.content,
        message: sanitizeHtmlContent,
      },
    };

    return response;
  } catch (error) {
    if (error instanceof ReservationError) {
      console.error("handleReservation error:", error);
      throw error;
    } else {
      console.error("Unexpected error in handleReservation:", error);
      throw new NetworkError(
        "Failed to create reservation. Please try again later."
      );
    }
  }
};
