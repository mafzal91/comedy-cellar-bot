import { ApiHandler } from "sst/node/api";
import { useJsonBody } from "sst/node/api";
import { Reservation } from "../../../core/src/models/reservation";
import { handleReservation } from "../../../core/src/handleReservation";
import { handleShowDetails } from "../../../core/src/handleShowDetails";

const createErrorResponse = (statusCode: number, message: any) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ error: message }),
});

export const create = ApiHandler(async (_evt) => {
  const json = useJsonBody();
  const validatedRequest = Reservation.validate(json);

  if (!validatedRequest.success) {
    const fieldErrors = validatedRequest.error.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return createErrorResponse(400, { fieldErrors });
  }

  const reservationDetails = new Reservation(json);
  const { showId, settime } = reservationDetails;

  try {
    const showsForDate = await handleShowDetails({
      date: reservationDetails.date,
    });
    const show = showsForDate?.shows.find((s) => s.id === showId);

    if (!show) {
      return createErrorResponse(400, "Cannot find Show");
    }

    if (show.soldout) {
      return createErrorResponse(400, "Show is sold out");
    }

    if (settime !== show.time) {
      return createErrorResponse(400, "Invalid show time");
    }

    const createdReservation = await handleReservation(reservationDetails);

    // Success Response
    // Return a success response here as needed
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createdReservation),
    };
  } catch (error) {
    console.error(error);
    return createErrorResponse(500, "Internal Server Error");
  }
});
