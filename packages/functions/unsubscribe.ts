import qs from "qs";

import { applyUnsubscribe, parseUnsubscribeToken } from "@core/unsubscribe";

// One-click email unsubscribe endpoint.
//
//   GET  /api/unsubscribe?token=...  -> renders a confirmation page. Mutates
//        NOTHING, so link scanners / prefetchers that follow the visible link
//        can't unsubscribe anyone.
//   POST /api/unsubscribe?token=...  -> actually turns the channel off. Hit by
//        the confirmation page's button and by mail clients honoring the RFC
//        8058 List-Unsubscribe-Post header (body `List-Unsubscribe=One-Click`).

function tokenFromEvent(evt: any): string | undefined {
  const query = qs.parse(evt.rawQueryString ?? "");
  const fromQuery = query.token;
  if (typeof fromQuery === "string" && fromQuery) return fromQuery;

  // Fall back to a form-encoded body (browser form post without a query string)
  if (evt.body) {
    const body = qs.parse(
      evt.isBase64Encoded
        ? Buffer.from(evt.body, "base64").toString("utf8")
        : evt.body
    );
    if (typeof body.token === "string" && body.token) return body.token;
  }

  return undefined;
}

function htmlResponse(statusCode: number, body: string) {
  return {
    statusCode,
    headers: { "content-type": "text/html; charset=utf-8" },
    body,
  };
}

function page({ title, message }: { title: string; message: string }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>${title} · Comedy Cellar Calendar</title>
    <style>
      body { margin: 0; background: #FBF6EC; color: #1A1714;
             font-family: Arial, Helvetica, sans-serif;
             display: flex; min-height: 100vh; align-items: center;
             justify-content: center; }
      .card { max-width: 440px; margin: 24px; padding: 32px;
              background: #FFFFFF; border: 2px solid #1A1714; text-align: center; }
      h1 { font-family: Georgia, 'Times New Roman', serif; font-size: 22px; margin: 0 0 12px; }
      p { color: #857B6D; line-height: 1.6; font-size: 15px; margin: 0 0 20px; }
      button { font: inherit; cursor: pointer; border: 2px solid #1A1714;
               background: #F3C44C; color: #1A1714; padding: 12px 20px; font-weight: bold; }
      a { color: #857B6D; }
    </style>
  </head>
  <body>
    <div class="card">${message}</div>
  </body>
</html>`;
}

// GET: confirmation page (safe / non-mutating)
export async function get(evt: any) {
  const token = tokenFromEvent(evt);
  const parsed = parseUnsubscribeToken(token);

  if (!parsed) {
    return htmlResponse(
      400,
      page({
        title: "Invalid link",
        message: `<h1>Link expired or invalid</h1>
          <p>We couldn't read that unsubscribe link. You can manage your
          notifications from your profile instead.</p>
          <a href="https://comedycellar.mafz.al/profile">Manage settings</a>`,
      })
    );
  }

  const label =
    parsed.channel === "NEW_SHOWS" ? "new-show" : "new-comic";

  // The button posts back to this same endpoint with the token preserved.
  const action = `/api/unsubscribe?token=${encodeURIComponent(token as string)}`;

  return htmlResponse(
    200,
    page({
      title: "Unsubscribe",
      message: `<h1>Unsubscribe from ${label} emails?</h1>
        <p>You'll stop receiving ${label} notifications at this address. You can
        turn them back on any time from your profile.</p>
        <form method="POST" action="${action}">
          <button type="submit">Unsubscribe</button>
        </form>`,
    })
  );
}

// POST: perform the opt-out (idempotent)
export async function post(evt: any) {
  const token = tokenFromEvent(evt);
  const ok = await applyUnsubscribe(token ?? "");

  if (!ok) {
    return htmlResponse(
      400,
      page({
        title: "Invalid link",
        message: `<h1>Link expired or invalid</h1>
          <p>We couldn't process that unsubscribe request. You can manage your
          notifications from your profile instead.</p>
          <a href="https://comedycellar.mafz.al/profile">Manage settings</a>`,
      })
    );
  }

  return htmlResponse(
    200,
    page({
      title: "Unsubscribed",
      message: `<h1>You're unsubscribed</h1>
        <p>You won't receive these emails anymore. Changed your mind?</p>
        <a href="https://comedycellar.mafz.al/profile">Manage settings</a>`,
    })
  );
}
