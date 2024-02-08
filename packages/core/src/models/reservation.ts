import { z } from "zod";
import { ApiRequest } from "../../../types/api";

const guestSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  size: z.number().min(1).max(4),
  phone: z.string().length(10),
  howHeard: z.enum([
    "Other",
    "Been There",
    "Citysearch.com",
    "Comedian",
    "Conan O'Brien",
    "E-mail",
    "Family/Friends",
    "Guide Book",
    "Host Brought Me In",
    "Hotel",
    "Howard Stern",
    "Internet",
    "Live In The Area",
    "Magazine",
    "New York Magazine",
    "Newspaper",
    "NYU",
    "Olive Tree",
    "Passed By",
    "Phone Book",
    "Radio Show",
    "Time Out",
    "TV Show",
    "Village Voice",
    "Word of Mouth",
    "Zagat",
  ]),
  smsOk: z.enum(["Yes", "No"]),
});

const schema = z.object({
  guest: guestSchema,
  showId: z.number(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Validates date in 'YYYY-MM-DD' format
  settime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/), // Validates time in 'HH:MM:SS' format
});

class Reservation {
  guest: ApiRequest.CreateReservationRequest["guest"];
  showId: ApiRequest.CreateReservationRequest["showId"];
  date: ApiRequest.CreateReservationRequest["date"];
  settime: ApiRequest.CreateReservationRequest["settime"];

  constructor(data: ApiRequest.CreateReservationRequest) {
    this.guest = {
      email: data.guest.email,
      firstName: data.guest.firstName,
      lastName: data.guest.lastName,
      size: data.guest.size,
      phone: data.guest.phone,
      howHeard: data.guest.howHeard,
      smsOk: data.guest.smsOk,
    };
    this.showId = data.showId;
    this.date = data.date;
    this.settime = data.settime;
  }

  static validate(data: ApiRequest.CreateReservationRequest) {
    return schema.safeParse(data);
  }

  toJSON() {
    return {
      guest: {
        email: this.guest.email,
        firstName: this.guest.firstName,
        lastName: this.guest.lastName,
        size: this.guest.size,
        phone: this.guest.phone,
        howHeard: this.guest.howHeard,
        smsOk: this.guest.smsOk,
      },
      showId: this.showId,
      date: this.date,
      settime: this.settime,
    };
  }
}

export { Reservation };
