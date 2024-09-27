import axios from "axios";
import UserAgent from "user-agents";

const baseURL = "https://www.comedycellar.com";

const axiosInstance = axios.create({
  baseURL,
  maxBodyLength: Infinity,
  headers: {
    "content-type": "application/json",
    "User-Agent": new UserAgent().toString(),
    "x-code-localize":
      "c52b87a6afa393757ae0b3d7b567123cffbaab341dc28426277eacc7c97c8b4e.MTcyNjE4ODAzNy03MS4xODMuMjQ5LjExMQ==",
    "x-page-creation": +new Date(),
  },
});

export { axiosInstance as requester };
