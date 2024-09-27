import { ApiResponse } from "../../types/api";

const COMEDY_CELLAR_URL = "https://www.comedycellar.com";

class LineUp {
  timestamp?: number;
  reservationUrl?: string;
  acts: {
    img?: string;
    name?: string;
    description?: string;
    website?: string;
  }[];

  constructor(data: ApiResponse.LineUp[0]) {
    this.timestamp = data.timestamp;
    this.reservationUrl = `${COMEDY_CELLAR_URL}/${data.reservationUrl}`;
    this.acts = data.acts.map((act) => ({
      ...act,
      img: `${COMEDY_CELLAR_URL}/${act.img}`,
      description: act.description?.toLowerCase() || "",
    }));
  }

  // Serialize the object to JSON
  toJSON() {
    return {
      timestamp: this.timestamp,
      reservationUrl: this.reservationUrl,
      acts: this.acts,
    };
  }
}

export { LineUp };
