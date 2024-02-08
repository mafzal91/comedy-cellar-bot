export namespace ApiResponse {
  export type LineUp = {
    reservationUrl?: string;
    timestamp?: number;
    acts: {
      img?: string;
      name?: string;
      description?: string;
      website?: string;
    }[];
  }[];
  export type Show = {
    id: number;
    time: string;
    description: string;
    forwardUrl: string;
    soldout: boolean;
    max: number;
    special: boolean;
    roomId: number;
    cover: number;
    note: string | null;
    mint: boolean;
    weekday: number;
    totalGuests: number;
    venueMin: number;
    venueMax: number;
    available: number;
    timestamp: number;
  };

  export type AbbreviatedDate = {
    day: string;
    month: string;
    date: string;
    pretty: string;
  };

  export type Age = {
    seconds: number;
    time: number;
  };

  export type ShowInfo = {
    date: string;
    prettyDate: string;
    abbr: AbbreviatedDate;
    shows: Show[];
    age: Age;
  };

  export type GetShowsResponse = {
    message: string;
    data: {
      showInfo: ShowInfo;
    };
  };

  export type CreateReservationResponse = {
    message: string;
    data: {
      created: boolean;
      message: string;
      resultCode: number;
      statusCode: string;
      content: {
        email: {
          success: boolean;
          message: string;
        };
        message: string;
        conversionInfo: {
          cover: number;
          guestCount: number;
          guestValue: number;
          totalValue: number;
        };
      };
      responseCode: number;
      reservationId: number;
    };
  };
}

export namespace ApiRequest {
  export type CreateReservationRequest = {
    guest: {
      email: string;
      firstName: string;
      lastName: string;
      size: number;
      phone: string;
      howHeard:
        | "Other"
        | "Been There"
        | "Citysearch.com"
        | "Comedian"
        | "Conan O'Brien"
        | "E-mail"
        | "Family/Friends"
        | "Guide Book"
        | "Host Brought Me In"
        | "Hotel"
        | "Howard Stern"
        | "Internet"
        | "Live In The Area"
        | "Magazine"
        | "New York Magazine"
        | "Newspaper"
        | "NYU"
        | "Olive Tree"
        | "Passed By"
        | "Phone Book"
        | "Radio Show"
        | "Time Out"
        | "TV Show"
        | "Village Voice"
        | "Word of Mouth"
        | "Zagat";
      smsOk: "Yes" | "No";
    };
    showId: number;
    date: string;
    settime: string;
  };
}
