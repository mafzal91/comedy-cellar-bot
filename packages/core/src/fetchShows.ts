import axios from "axios";
import { ApiResponse } from "../../types/api";

export const fetchShows = async (
  date: string
): Promise<ApiResponse.Response> => {
  let data = JSON.stringify({
    date,
  });

  let config = {
    method: "POST",
    maxBodyLength: Infinity,
    url: "https://www.comedycellar.com/reservations/api/getShows",
    headers: {
      "content-type": "application/json",
      cookie:
        "PHPSESSID=cjch1k1udiqo803fvq1mop0oug; AWSALB=gjBJGzutQSbLJMeRShuzj4zSdZ2+hsM8I5OigrlF1CCVxC4EkkBUK/LSi5V2u0/3orWKngEqB3rRV50g/XnezAaM1J9aOhtq6uCohNi4ipF2SIavBUyRswvlbWUB; AWSALBCORS=gjBJGzutQSbLJMeRShuzj4zSdZ2+hsM8I5OigrlF1CCVxC4EkkBUK/LSi5V2u0/3orWKngEqB3rRV50g/XnezAaM1J9aOhtq6uCohNi4ipF2SIavBUyRswvlbWUB; AWSALB=A56MAYrI7tymVL+2alKd53frzh71OJ753v6cpvK9qN5y+q62wddXsgQcDUfvO1m+WqzvkCxQMSTB0nYplvnapF4c+RPsS6Nh2uAkAjBhM0kPaeT54lus69SGwAwV; AWSALBCORS=A56MAYrI7tymVL+2alKd53frzh71OJ753v6cpvK9qN5y+q62wddXsgQcDUfvO1m+WqzvkCxQMSTB0nYplvnapF4c+RPsS6Nh2uAkAjBhM0kPaeT54lus69SGwAwV",
      origin: "https://www.comedycellar.com",
      referer: "https://www.comedycellar.com/reservations-newyork/",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    },
    data,
  };

  try {
    const res = await axios.request(config);
    const responseData = res.data;
    return responseData.data as ApiResponse.Response;
  } catch (error) {
    console.log(error);
    throw error; // You might want to re-throw the error so that callers can handle it
  }
};
