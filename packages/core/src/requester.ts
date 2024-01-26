import axios from "axios";
import UserAgent from "user-agents";

const baseURL = "https://www.comedycellar.com";

const axiosInstance = axios.create({
  baseURL,
  maxBodyLength: Infinity,
  headers: {
    "content-type": "application/json",
    "User-Agent": new UserAgent().toString(),
  },
});

export { axiosInstance as requester };
