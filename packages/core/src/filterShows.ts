import { Show } from "../../types/api";

const isShowAvailable = (show: Show) => {
  return show.totalGuests < show.max;
};
const isShowUnavailable = (show: Show) => {
  return show.totalGuests >= show.max;
};

export const filterShows = (shows: Show[]) => {
  return {
    availableShows: shows.filter(isShowAvailable),
    unavailableUnavailable: shows.filter(isShowUnavailable),
  };
};
