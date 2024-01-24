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
}
