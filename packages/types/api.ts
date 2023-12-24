export type Show = {
  id: number;
  time: string;
  description: string;
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

export type ApiResponse = {
  message: string;
  data: {
    showInfo: ShowInfo;
  };
};
