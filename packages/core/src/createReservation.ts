import { requester } from "./requester";
import { ApiRequest, ApiResponse } from "../../types/api";
import { Config } from "sst/node/config";

export const createReservation = async (
  data: ApiRequest.CreateReservationRequest
): Promise<ApiResponse.CreateReservationResponse> => {
  try {
    if (Config.STAGE === "prod") {
      const res = await requester.post(
        "/reservations/api/addReservation",
        data
      );
      return res.data as ApiResponse.CreateReservationResponse;
    }
    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

// mock response data
const response = {
  message: "Ok",
  data: {
    created: true,
    message: "Created",
    resultCode: 0,
    statusCode: "9500.300",
    content: {
      email: {
        success: true,
        message:
          "You will receive email confirmation momentarily at johndoe@gmail.com.",
      },
      message:
        '<div class="template-defaults">\n<p><strong>PLEASE CHECK YOUR SPAM FOLDER&nbsp; if you do not receive an email confirmation within a minute or two.</strong></p>\n\n<p><b>(And if you would mark it as &quot;not spam&quot; it would help us out :))</b></p>\n\n<p><strong>Dinner before or after the show? Join us at The Olive Tree Cafe! Make a reservation here:</strong></p>\n\n<p><script type="text/javascript" src="//www.opentable.com/widget/reservation/loader?rid=443512&domain=com&type=standard&theme=standard&lang=en&overlay=false&iframe=true"></script></p>\n\n<p><img alt="Comedy Cellar" class="template-fullwidth" src="http://www.comedycellar.com/v3/img/tonightlogoemailsm.png" style="height:166px; max-width:432px; width:432px" /></p>\n\n<p>Please check for our follow up email the day after your show.</p>\n\n<h3>Comedy Cellar</h3>\n\n<p>MacDougal Street - 117 MacDougal Street (between West 3rd and Minetta Lane)</p>\n\n<p>Village Underground - 130 W 3rd Street Between 6th and MacDougal</p>\n\n<p>212-254-3480</p>\n\n<div>\n<p>John Doe, Party of 4. Friday April 5, 2024 at 8:00 PM.</p>\n\n<p>You will shortly be receiving this information at your email address.</p>\n\n<p><u><strong><em>THIS IS A PHONE FREE SHOW!&nbsp; We use pouches to secure your phones and smart watches&nbsp;at all shows.&nbsp; We ask all guests to place their smart phones and watches into a pouch that they will then maintain posession of for the duration of the show.&nbsp;</em></strong></u></p>\n\n<p>We have a two item minimum, but you are not required to drink alcohol, you can choose from any items on our menu (from soft drinks to liquor to food to desserts). <a href="#aaaa">See our menu</a>. For directions, go to <a href="http://www.comedycellar.com/contact-us/">our General Page</a></p>\n</div>\n\n<p>Very Important Reminder: Parties larger than 8 are not allowed in the MacDougal Street location- even if split into multiple reservations.</p>\n\n<p>PLEASE NOTE: You must arrive and have checked in with our host no later than the scheduled show time (see below) for your reservations to be honored. Any seats still unclaimed by the scheduled show time will be given up to our stand-by guests.</p>\n</div>\n',
      conversionInfo: {
        cover: 25,
        guestCount: 2,
        guestValue: 35,
        totalValue: 70,
      },
    },
    responseCode: 200,
    reservationId: 8957415,
  },
};
