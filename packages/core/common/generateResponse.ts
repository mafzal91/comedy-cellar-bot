export function generateResponse({
  statusCode,
  headers,
  body,
}: {
  statusCode: number;
  headers?: Record<string, string>;
  body: String | Record<string, any>;
}): {
  statusCode: number;
  headers: Record<string, string>;
  body: String;
} {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  };
}
