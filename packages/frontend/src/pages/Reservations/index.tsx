import { Field, FieldWrapper, Section } from "./Helpers";
import { LineUp, Room, Show } from "../../types";
import { createReservation, fetchShowByTimestamp } from "../../utils/api";
import { useEffect, useState } from "preact/hooks";
import { useLocation, useRoute } from "preact-iso";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import { Disclaimer } from "../../components/Disclaimer";
import { FormError } from "./FormError";
import { FormSuccess } from "./FormSuccess";
import { Input } from "../../components/Input";
import { Link } from "../../components/Link";
import { NetworkError } from "./NetworkError";
import { PageError } from "./PageError";
import { PageHeader } from "../../components/ui/PageHeader";
import { PageLoader } from "../../components/PageLoader";
import { ShowDetails } from "./ShowDetails";
import { Spinner } from "../../components/Spinner";
import { TicketStub } from "../../components/ui/TicketStub";
import { isPast } from "date-fns";

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

// customFetch (utils/api.ts) throws the raw API body on 4xx, so the query/
// mutation error is the API error shape, not a plain Error.
type ShowQueryError = { error?: string };
type ReservationFieldError = { field: string; message: string };
type ReservationMutationError = {
  error?: { fieldErrors?: ReservationFieldError[]; message?: string };
  message?: string;
};

export default function Reservation() {
  const [errors, setErrors] = useState([]);
  const {
    params: { timestamp },
  } = useRoute();
  const location = useLocation();

  // Invalid or past timestamps can't be reserved — computed up front so the
  // query never fires for them and the guard below can bail before render.
  const invalidTimestamp =
    !timestamp ||
    timestampRegex.test(timestamp) === false ||
    isPast(+timestamp * 1000);

  const showData = useQuery<
    {
      show?: Show;
      lineUp?: LineUp;
      room?: Room;
      error?: string;
    },
    ShowQueryError
  >({
    queryKey: ["timestamp", timestamp],
    queryFn: async () => {
      const showData = await fetchShowByTimestamp({ timestamp });

      return showData;
    },
    enabled: !invalidTimestamp,
  });

  const reservationMutation = useMutation<
    Awaited<ReturnType<typeof createReservation>>,
    ReservationMutationError,
    Parameters<typeof createReservation>[0]
  >({
    mutationFn: createReservation,
  });

  useEffect(() => {
    if (reservationMutation.error?.error?.fieldErrors) {
      setErrors((prevErrors) => [
        ...prevErrors,
        ...(reservationMutation.error?.error?.fieldErrors ?? []),
      ]);
    }
  }, [reservationMutation.error]);

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

  // All hooks are above — safe to bail out of render entirely from here on.
  if (invalidTimestamp) {
    location.route("/404");
    return null;
  }

  if (showData.isLoading) {
    return <PageLoader />;
  }

  if (showData.error?.error === "Show not found") {
    location.route("/404");
    return null;
  }

  if (showData.isError) {
    return <PageError />;
  }

  if (!showData.data?.show) {
    location.route("/404");
    return null;
  }

  const maxReservationSize = showData?.data?.room?.maxReservationSize ?? 4;

  return (
    <div className="mx-auto max-w-[1080px] pb-10">
      <a
        href="/"
        className="mb-4 inline-block font-mono text-meta uppercase tracking-wider text-muted no-underline hover:text-text"
      >
        ‹ Back to shows
      </a>

      <PageHeader
        eyebrow="You're almost in"
        title="Reserve Your Seats"
        className="mb-6"
      />

      <form onSubmit={handleSubmit}>
        <div className="grid overflow-hidden rounded-2xl border-hair border-line bg-surface shadow-block-lg md:grid-cols-[1.45fr_1fr]">
          {/* LEFT: reservation form */}
          <div className="px-8 py-7">
            <input
              disabled
              type="hidden"
              name="showId"
              value={showData.data.show.id}
            />

            <input type="hidden" name="timestamp" value={timestamp} />

            <Section title="Reservation Information" description="">
              <FieldWrapper>
                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <Field
                  label="size"
                  labelText={`Party Size (max ${maxReservationSize})`}
                >
                  <Input
                    required
                    type="number"
                    name="size"
                    id="size"
                    max={maxReservationSize}
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

                <Field label="emailConfirm" labelText={"Confirm Email Address"}>
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
                <Field label="howHeard" labelText="How did you hear about us?">
                  <select
                    id="howHeard"
                    name="howHeard"
                    required
                    className="block w-full rounded-field border-hair border-line bg-surface px-3.5 py-3 font-sans text-body text-text outline-none focus:shadow-[3px_3px_0_var(--color-brand)]"
                  >
                    {howHeardOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </Field>

                <Checkbox
                  label="smsOk"
                  displayLabel="One time SMS feedback"
                  description="After the show, can the cellar text you a request for your comments? The number will never be used again after."
                />
              </FieldWrapper>
            </Section>

            <FormStatus formErrors={errors} mutation={reservationMutation} />

            <div className="mt-6">
              {reservationMutation.isSuccess ? (
                <div className="flex flex-col gap-4">
                  <FormSuccess
                    message={reservationMutation.data.content.message}
                  />
                  <Link href="/" className="font-bold text-gold!">
                    Return home
                  </Link>
                </div>
              ) : (
                <Button
                  type="submit"
                  variant="solid"
                  className="w-full py-[15px]! text-body! font-extrabold!"
                  disabled={
                    showData.data.show.soldout ||
                    reservationMutation.status === "pending"
                  }
                >
                  {reservationMutation.status === "pending" ? (
                    <Spinner size={5} className="text-solid-fg!" />
                  ) : (
                    "Reserve My Seats →"
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* RIGHT: ticket stub */}
          <TicketStub>
            <ShowDetails
              show={showData.data.show}
              lineUp={showData.data.lineUp}
            />

            <div className="my-5 border-t-2 border-dashed border-line" />

            <Disclaimer />

            <Link
              target="_blank"
              rel="noopener noreferrer"
              href={showData.data.show.reservationUrl}
              title={"We won't be offended"}
              className="mt-2.5 inline-block font-bold text-caption text-gold!"
            >
              Reserve on comedycellar.com ↗
            </Link>
          </TicketStub>
        </div>
      </form>
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
    const errorMessage =
      mutation.error.error ?? mutation.error.message ?? "Unknown error";

    return <NetworkError message={errorMessage} />;
  }
  return null;
};
