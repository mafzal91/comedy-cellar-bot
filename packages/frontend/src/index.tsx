import { render } from "preact";
import {
  LocationProvider,
  ErrorBoundary,
  lazy,
  Router,
  Route,
} from "preact-iso";
import { QueryClient, QueryClientProvider } from "react-query";

// import * as Sentry from "@sentry/browser";

import { Header } from "./components/Header";
import { Redirect } from "./components/Redirect";
import { getToday } from "./utils/date";

import "./style.css";
import { BuyMeCoffeeButton } from "./components/BuyMeCoffee";
import { Link } from "./components/Link";
import clsx from "clsx";

// Sentry.init({
//   dsn: "https://523bcd0e95c565ef1f4c580690e75a9b@o4506630100090880.ingest.sentry.io/4506630117916672",
//   integrations: [Sentry.browserTracingIntegration()],
//   enabled: import.meta.env.PROD,
// });

const queryClient = new QueryClient();

const Home = lazy(() => import("./pages/Home"));
const Reservations = lazy(() => import("./pages/Reservations"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Comics = lazy(() => import("./pages/Comics"));
const Comic = lazy(() => import("./pages/Comic"));
const SignUp = lazy(() => import("./pages/Auth/SignUp"));
const SignIn = lazy(() => import("./pages/Auth/SignIn"));
const SignOut = lazy(() => import("./pages/Auth/SignOut"));
const Profile = lazy(() => import("./pages/Profile"));
const Terms = lazy(() => import("./pages/Terms"));

const onRouteChange = (url: string) => {
  console.log("root", url);
};

export function App() {
  return (
    <LocationProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary
          onError={(error) => {
            // Sentry.captureException(error);
            return <div>An error occurred</div>;
          }}
        >
          <Header />
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="px-4 py-4 sm:p-6">
              <Router onRouteChange={onRouteChange}>
                <Home path="/" />
                <Reservations path="/reservations/:timestamp" />
                <NotFound path="/404" />
                <Comics path="/comics" />
                <Comic path="/comics/:id" />
                <Terms path="/terms-privacy" />
                <Profile path="/profile" />
                <SignUp path="/sign-up" />
                <SignIn path="/sign-in" />
                <SignOut path="/sign-out" />
                <Route
                  default
                  component={() => (
                    <Redirect to={`/?date=${getToday()}`} replace />
                  )}
                />
              </Router>
            </div>
          </main>
          <footer
            className={clsx(
              ...[
                "flex items-center justify-center",
                "py-4 px-4 sm:px-6 lg:px-8 gap-2",

                // Desktop positioning
                "lg:fixed lg:bottom-0 lg:left-0 lg:right-0 lg:justify-start",
                "lg:mx-auto lg:max-w-7xl",
              ]
            )}
          >
            <div className="flex items-center justify-between py-4 px-4 sm:px-6 lg:px-8 gap-2">
              <Link
                href="/terms-privacy"
                className="p-2.5 rounded-lg text-xs bg-primary text-slate-950 text-center"
              >
                Terms & Privacy
              </Link>
              <BuyMeCoffeeButton />
            </div>
          </footer>
        </ErrorBoundary>
      </QueryClientProvider>
    </LocationProvider>
  );
}

render(<App />, document.getElementById("app"));
