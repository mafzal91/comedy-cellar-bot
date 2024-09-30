import { Resource } from "sst";
import { isPast } from "date-fns";
import { Reservation } from "../core/models/reservation";
import { handleReservation } from "../core/handleReservation";
import { handleShowDetails } from "../core/handleShowDetails";
import { sendEmail } from "@core/email";

const createErrorResponse = (statusCode: number, message: any) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ error: message }),
});

const validateTimestamp = (timestamp: string) => {
  if (!timestamp || timestampRegex.test(timestamp) === false) {
    return false;
  }
  return true;
};

const timestampRegex = /\b\d{10}\b/;

export const create = async (_evt) => {
  const FromEmail = Resource.FromEmail.value;
  const FromEmailPw = Resource.FromEmailPw.value;
  const timestamp = _evt?.pathParameters?.timestamp;

  const json = JSON.parse(_evt.body);

  // If the timetamp is not valid then we can return early
  if (validateTimestamp(timestamp) === false) {
    return createErrorResponse(400, "Invalid show timestamp");
  }
  if (isPast(+timestamp * 1000)) {
    return createErrorResponse(400, "This show has already passed");
  }

  // Validate the request payload
  const reservationDetails = new Reservation({
    ...json,
    timestamp: +timestamp,
  });
  const validatedRequest = reservationDetails.validate();

  if (!validatedRequest.success) {
    console.log(validatedRequest.error);
    const fieldErrors = validatedRequest.error.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return createErrorResponse(400, { fieldErrors });
  }

  const { showId, date, settime } = reservationDetails;

  console.log({
    timestamp,
    showId,
    settime,
    date: reservationDetails.date,
  });

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

    await sendEmail(
      {
        subject: "Comedy Cellar: new reservation!",
        message: JSON.stringify(reservationDetails, null, 2),
      },
      {
        FromEmail,
        FromEmailPw,
      }
    ).catch((e) => console.error(e)); //swallow error

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createdReservation),
    };
  } catch (error) {
    console.error({ error });
    return createErrorResponse(500, "Internal Server Error");
  }
};
