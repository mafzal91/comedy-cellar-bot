export type Expand<T> = {} & { [P in keyof T]: T[P] };

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

export type ListApiRes<T> = {
  total: number;
  limit: number;
  offset: number;
  results: T[];
};

export type Comic = {
  id: number;
  externalId: string;
  name: string;
  img: string;
  website?: string;
  description: string;
  createdAt: string;
  showCount?: number;
};

export type ShowDb = {
  id: number;
  externalId: string;
  time: string;
  description: string;
  forwardUrl: string | null;
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
  createdAt: string;
};

export type Room = {
  id: number;
  externalId: string;
  name: string;
  maxReservationSize: number;
  createdAt: string;
};

export type Settings = {
  comicNotifications: ComicNotification[];
  showNotification: {
    enabled?: boolean;
  };
};

export type ComicNotification = {
  comicId: string;
  name: string;
  comic: string;
  enabled: boolean;
};
