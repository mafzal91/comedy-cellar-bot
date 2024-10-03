import { render } from "preact";
import {
  LocationProvider,
  ErrorBoundary,
  lazy,
  Router,
  Route,
} from "preact-iso";
import { QueryClient, QueryClientProvider } from "react-query";
import * as Sentry from "@sentry/browser";

import { Header, Header1 } from "./components/Header";
import { Redirect } from "./components/Redirect";

import "./style.css";

Sentry.init({
  dsn: "https://523bcd0e95c565ef1f4c580690e75a9b@o4506630100090880.ingest.sentry.io/4506630117916672",
  integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
  enabled: import.meta.env.PROD,
});

const queryClient = new QueryClient();

const Home = lazy(() => import("./pages/Home"));
const Reservations = lazy(() => import("./pages/Reservations"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Comics = lazy(() => import("./pages/Comics"));
const Comic = lazy(() => import("./pages/Comic"));

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocationProvider>
        <ErrorBoundary>
          <Header1 />
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="px-4 py-5 sm:p-6">
              <Router>
                <Home path="/" />
                <Reservations path="/reservations/:timestamp" />
                <NotFound path="/404" />
                <Comics path="/comics" />
                <Comic path="/comics/:id" />
                <Route default component={() => <Redirect to="/" />} />
              </Router>
            </div>
          </main>
        </ErrorBoundary>
      </LocationProvider>
    </QueryClientProvider>
  );
}

render(<App />, document.getElementById("app"));
