import { useEffect, useState } from "preact/hooks";
import { useQuery, useMutation } from "react-query";
import { isPast } from "date-fns";
import { useLocation, useRoute } from "preact-iso";
import { fetchShowByTimestamp, createReservation } from "../../utils/api";

import { Link } from "../../components/Link";
import { Button } from "../../components/Button";
import { Disclaimer } from "../../components/Disclaimer";
import { Spinner } from "../../components/Spinner";
import { Input } from "../../components/Input";

import { Section, Field, FieldWrapper } from "./Helpers";
import { ShowDetails } from "./ShowDetails";
import { PageLoader } from "./PageLoader";
import { PageError } from "./PageError";
import { FormError } from "./FormError";
import { NetworkError } from "./NetworkError";
import { FormSuccess } from "./FormSuccess";
import { LineUp, Show } from "../../types";

const howHeardOptions = [
  "Other",
  "Been There",
  "Citysearch.com",
  "Comedian",
  "Conan O'Brien",
  "E-mail",
  "Family/Friends",
  "Guide Book",
  "Host Brought Me In",
  "Hotel",
  "Howard Stern",
  "Internet",
  "Live In The Area",
  "Magazine",
  "New York Magazine",
  "Newspaper",
  "NYU",
  "Olive Tree",
  "Passed By",
  "Phone Book",
  "Radio Show",
  "Time Out",
  "TV Show",
  "Village Voice",
  "Word of Mouth",
  "Zagat",
];

const timestampRegex = /\b\d{10}\b/;

export default function Reservation() {
  const [errors, setErrors] = useState([]);
  const {
    params: { timestamp },
  } = useRoute();
  const location = useLocation();

  if (
    !timestamp ||
    timestampRegex.test(timestamp) === false ||
    isPast(+timestamp * 1000)
  ) {
    location.route("/404");
  }

  const showData = useQuery<{ show?: Show; lineUp?: LineUp; error?: string }>(
    ["timestamp", timestamp],
    async () => {
      const showData = await fetchShowByTimestamp({ timestamp });

      return showData;
    }
  );

  const reservationMutation = useMutation(createReservation);

  const handleSubmit = (event: Event) => {
    event.preventDefault();
    setErrors([]);

    const formData = new FormData(event.target as HTMLFormElement);

    const formValues = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      emailConfirm: formData.get("emailConfirm") as string,
      phone: formData.get("phone") as string,
      size: parseInt(formData.get("size") as string, 10), // Cast to number
      smsOk: formData.get("smsOk") === "on", // Cast to boolean
      howHeard: formData.get("howHeard") as string,
    };

    if (formValues.email !== formValues.emailConfirm) {
      setErrors((prevError) => [
        ...prevError,
        { field: "email", message: "Emails do not match" },
      ]);
      return;
    }

    reservationMutation.mutate({
      guest: {
        ...formValues,
      },
      showId: showData.data.show.id,
      timestamp,
    });
  };

  if (showData.isLoading) {
    return <PageLoader />;
  }

  if (!showData.data || showData.error?.error === "Show not found") {
    location.route("/404");
  }

  if (showData.isError) {
    return <PageError />;
  }

  useEffect(() => {
    if (reservationMutation.error?.error?.fieldErrors) {
      setErrors((prevErrors) => [
        ...prevErrors,
        ...reservationMutation.error.error.fieldErrors,
      ]);
    }
  }, [reservationMutation.error]);

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="px-4 py-5 sm:p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-x-5">
            <div className="sm:hidden mb-5">
              <ShowDetails
                show={showData.data.show}
                lineUp={showData.data.lineUp}
              />
              <hr className="mt-5" />
            </div>
            <div className="col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-4">
              <Section title="Reservation Information" description="">
                <input
                  disabled
                  type="hidden"
                  name="showId"
                  value={showData.data.show.id}
                />

                <input type="hidden" name="timestamp" value={timestamp} />

                <FieldWrapper>
                  <Field label="firstName" labelText={"First Name"}>
                    <Input
                      type="text"
                      name="firstName"
                      id="firstName"
                      required
                      autoComplete="given-name"
                    />
                  </Field>

                  <Field label="lastName" labelText={"Last Name"}>
                    <Input
                      type="text"
                      name="lastName"
                      id="lastName"
                      required
                      autoComplete="family-name"
                    />
                  </Field>

                  <Field label="size" labelText="Party Size (max 4)">
                    <Input
                      required
                      type="number"
                      name="size"
                      id="size"
                      max={4}
                      min={1}
                    />
                  </Field>
                </FieldWrapper>
              </Section>

              <Section
                title="Contact Information"
                description="You'll receive your reservation confirmation here"
              >
                <FieldWrapper>
                  <Field label="email" labelText={"Email Address"}>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                    />
                  </Field>

                  <Field
                    label="emailConfirm"
                    labelText={"Confirm Email Address"}
                  >
                    <Input
                      id="emailConfirm"
                      name="emailConfirm"
                      type="email"
                      required
                      autoComplete="email"
                    />
                  </Field>

                  <Field label="phone" labelText="Phone Number">
                    <Input
                      type="tel"
                      name="phone"
                      id="phone"
                      pattern="[0-9][0-9]{9}"
                      placeholder={"9876543210"}
                      required
                    />
                  </Field>
                </FieldWrapper>
              </Section>

              <Section title="Misc">
                <FieldWrapper>
                  <Field
                    label="howHeard"
                    labelText="How did you hear about us?
"
                  >
                    <select
                      id="howHeard"
                      name="howHeard"
                      required
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
                    >
                      {howHeardOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </Field>

                  <div className="space-y-5">
                    <div className="relative flex items-start">
                      <div className="flex h-6 items-center">
                        <input
                          id="smsOk"
                          aria-describedby="smsOk-description"
                          name="smsOk"
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </div>
                      <div className="ml-3 text-sm leading-6">
                        <label
                          htmlFor="smsOk"
                          className="font-medium text-gray-900"
                        >
                          One time SMS feedback
                        </label>
                        <p id="comments-description" className="text-gray-500">
                          After the show, can the cellar text you a request for
                          your comments? The number will never be used again
                          after.
                        </p>
                      </div>
                    </div>
                  </div>
                </FieldWrapper>

                <FormStatus
                  formErrors={errors}
                  mutation={reservationMutation}
                />
              </Section>
            </div>
            <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-2 space-y-5">
              <div className="hidden sm:block">
                <ShowDetails
                  show={showData.data.show}
                  lineUp={showData.data.lineUp}
                />
              </div>
              <hr />
              <Disclaimer />
            </div>
          </div>
          {reservationMutation.isSuccess ? (
            <>
              <div className="py-6">
                <FormSuccess
                  message={reservationMutation.data.content.message}
                />
              </div>
              <Link href={"/"}>Return home</Link>
            </>
          ) : (
            <div className="mt-6 flex items-center justify-between gap-x-6">
              <Button
                type="submit"
                className="bg-primary"
                disabled={
                  showData.data.show.soldout || reservationMutation.isLoading
                }
              >
                {reservationMutation.isLoading ? (
                  <Spinner size={5} />
                ) : (
                  "Submit"
                )}
              </Button>
              <Link
                target="_blank"
                rel="noopener noreferrer"
                href={showData.data.show.reservationUrl}
                title={"We won't be offended"}
              >
                Reserve on comedycellar.com
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

const FormStatus = ({ formErrors, mutation }) => {
  if (formErrors.length !== 0) {
    return (
      <div className="py-6">
        <FormError errors={formErrors} />
      </div>
    );
  }

  if (mutation.isError) {
    return <NetworkError message={mutation.error.toString()} />;
  }
  return null;
};
