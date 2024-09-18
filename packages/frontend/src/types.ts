export type LineUp = {
  reservationUrl: string;
  timestamp: number;
  acts: {
    description: string;
    img: string;
    name: string;
    website: string;
  }[];
};

export type Show = {
  id: number;
  time: string;
  showName: string;
  description: string;
  forwardUrl: string | null;
  soldout: boolean;
  occupancyRate: number;
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
  roomName: string;
  reservationUrl: string;
};
