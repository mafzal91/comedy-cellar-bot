import "./style.css";

import {
  ErrorBoundary,
  LocationProvider,
  Route,
  Router,
  lazy,
} from "preact-iso";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { BuyMeCoffeeButton } from "./components/BuyMeCoffee";
import { Header } from "./components/Header";
import { Link } from "./components/Link";
import { Redirect } from "./components/Redirect";
import { ThemeToggle } from "./components/ThemeToggle";
import { getToday } from "./utils/date";
import { render } from "preact";

// import * as Sentry from "@sentry/browser";

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
const Updates = lazy(() => import("./pages/Updates"));
const Gallery = lazy(() => import("./pages/Gallery"));

const onRouteChange = (url: string) => {
  console.log("root", url);
};

export function App() {
  return (
    <LocationProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary
          onError={() => {
            // Sentry.captureException(error);
            return <div>An error occurred</div>;
          }}
        >
          <div className="flex min-h-screen flex-col bg-bg text-text">
            <Header />
            <main className="w-full flex-1 px-4 pt-[34px] pb-[60px]">
              <Router onRouteChange={onRouteChange}>
                <Route path="/" component={Home} />
                <Route
                  path="/reservations/:timestamp"
                  component={Reservations}
                />
                <Route path="/404" component={NotFound} />
                <Route path="/comics" component={Comics} />
                <Route path="/comics/:id" component={Comic} />
                <Route path="/terms-privacy" component={Terms} />
                <Route path="/updates" component={Updates} />
                <Route path="/gallery" component={Gallery} />
                <Route path="/profile" component={Profile} />
                <Route path="/sign-up" component={SignUp} />
                <Route path="/sign-in" component={SignIn} />
                <Route path="/sign-out" component={SignOut} />
                <Route
                  default
                  component={() => (
                    <Redirect to={`/?date=${getToday()}`} replace />
                  )}
                />
              </Router>
            </main>
            <footer className="border-t-2 border-line bg-surface">
              <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4 px-10 py-6">
                <Link
                  href="/terms-privacy"
                  variant="plain"
                  className="font-mono text-meta uppercase tracking-wider text-muted no-underline hover:text-text"
                >
                  Terms &amp; Privacy
                </Link>
                <BuyMeCoffeeButton />
              </div>
            </footer>
          </div>
          <ThemeToggle />
        </ErrorBoundary>
      </QueryClientProvider>
    </LocationProvider>
  );
}

render(<App />, document.getElementById("app"));
