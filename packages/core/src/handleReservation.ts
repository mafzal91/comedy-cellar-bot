import { sendEmail } from "./email";
import { createReservation } from "./createReservation";
import { ApiRequest } from "../../types/api";
import sanitizeHtml from "sanitize-html";

export const handleReservation = async (
  data: ApiRequest.CreateReservationRequest
) => {
  const reservation = await createReservation(data);

  const htmlContent = reservation.data.content.message;
  const sanitizeHtmlContent = sanitizeHtml(htmlContent.replace("\n", "<br/>"));

  const response = {
    ...reservation.data,
    content: {
      ...reservation.data.content,
      message: sanitizeHtmlContent,
    },
  };

  await sendEmail(JSON.stringify(data, null, 2));

  return response;
};
